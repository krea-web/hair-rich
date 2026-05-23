-- Hair Rich · Chat 3 · Reviews Harvester (#62)
--
-- Anti-spam multi-livello per evitare richieste di recensione duplicate:
--   L1 click-through tracking (routed_to_google_at)
--   L2 self-report (confirmed_left_review_at)
--   L3 one-shot per appointment (UNIQUE constraint)
--   L4 cooldown 90gg per cliente (fn_review_cooldown_ok)
--   L5 verifica fuzzy-match Google Places API (cron weekly, popola confirmed_left_review_at)
--
-- Token-based: la pagina cuscinetto /recensione/[token] decide routing 😊→Google / 😞→admin.

CREATE TABLE IF NOT EXISTS review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),

  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_via text NOT NULL DEFAULT 'email'
    CHECK (sent_via IN ('email','telegram','push','sms','whatsapp')),

  opened_at timestamptz,
  rating_selected smallint CHECK (rating_selected BETWEEN 1 AND 5),
  rating_selected_at timestamptz,

  routed_to text CHECK (routed_to IN ('google','internal','dismissed')),
  routed_to_google_at timestamptz,
  internal_feedback text,
  internal_feedback_at timestamptz,

  confirmed_left_review_at timestamptz,
  confirmation_method text CHECK (confirmation_method IN ('self_report','places_api','admin_manual')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_requests_customer_idx
  ON review_requests (customer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS review_requests_pending_verification_idx
  ON review_requests (routed_to_google_at)
  WHERE routed_to_google_at IS NOT NULL AND confirmed_left_review_at IS NULL;

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all review_requests" ON review_requests;
CREATE POLICY "admin all review_requests" ON review_requests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "anon read by token" ON review_requests;
CREATE POLICY "anon read by token" ON review_requests
  FOR SELECT USING (true);

DROP TRIGGER IF EXISTS trg_review_requests_updated ON review_requests;
CREATE TRIGGER trg_review_requests_updated
  BEFORE UPDATE ON review_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Google Place ID + review URL on salon_settings ──────────────
ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS google_review_url text,
  ADD COLUMN IF NOT EXISTS reviews_cooldown_days int NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS reviews_request_delay_min int NOT NULL DEFAULT 120;

COMMENT ON COLUMN salon_settings.google_place_id IS
  'Google Place ID for the salon (used by reviews-google-verify cron to fuzzy-match new reviews).';
COMMENT ON COLUMN salon_settings.google_review_url IS
  'Deep link customers tap on 😊 to leave a review on Google. Typically https://search.google.com/local/writereview?placeid=...';
COMMENT ON COLUMN salon_settings.reviews_cooldown_days IS
  'Minimum days between two review requests sent to the same customer.';
COMMENT ON COLUMN salon_settings.reviews_request_delay_min IS
  'Minutes after appointment completion before the request is sent.';

-- ────────── Cooldown helper ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_review_cooldown_ok(p_customer_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cooldown_days int;
  v_last_sent timestamptz;
BEGIN
  SELECT reviews_cooldown_days INTO v_cooldown_days FROM salon_settings WHERE is_singleton;
  SELECT max(sent_at) INTO v_last_sent FROM review_requests WHERE customer_id = p_customer_id;
  RETURN (v_last_sent IS NULL OR v_last_sent < now() - make_interval(days => v_cooldown_days));
END $$;

GRANT EXECUTE ON FUNCTION fn_review_cooldown_ok(uuid) TO service_role;

-- ────────── Token resolve (used by /recensione/[token] page) ───────────
CREATE OR REPLACE FUNCTION fn_review_request_by_token(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rr review_requests;
  v_first_name text;
  v_google_review_url text;
BEGIN
  SELECT * INTO v_rr FROM review_requests WHERE token = p_token;
  IF v_rr.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT first_name INTO v_first_name FROM customers WHERE id = v_rr.customer_id;
  SELECT google_review_url INTO v_google_review_url FROM salon_settings WHERE is_singleton;

  IF v_rr.opened_at IS NULL THEN
    UPDATE review_requests SET opened_at = now() WHERE id = v_rr.id;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'request_id', v_rr.id,
    'first_name', v_first_name,
    'already_rated', v_rr.rating_selected IS NOT NULL,
    'rating_selected', v_rr.rating_selected,
    'routed_to', v_rr.routed_to,
    'google_review_url', v_google_review_url
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_review_request_by_token(text) TO anon, authenticated;

-- ────────── Submit rating from cuscinetto page ──────────────────────────
CREATE OR REPLACE FUNCTION fn_review_request_submit(
  p_token text,
  p_rating smallint,
  p_internal_feedback text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rr review_requests;
  v_route text;
  v_google_review_url text;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'invalid_rating' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_rr FROM review_requests WHERE token = p_token;
  IF v_rr.id IS NULL THEN
    RAISE EXCEPTION 'token_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_route := CASE WHEN p_rating >= 4 THEN 'google' ELSE 'internal' END;
  SELECT google_review_url INTO v_google_review_url FROM salon_settings WHERE is_singleton;

  UPDATE review_requests
     SET rating_selected = p_rating,
         rating_selected_at = now(),
         routed_to = v_route,
         routed_to_google_at = CASE WHEN v_route = 'google' THEN now() ELSE routed_to_google_at END,
         internal_feedback = COALESCE(NULLIF(p_internal_feedback,''), internal_feedback),
         internal_feedback_at = CASE WHEN p_internal_feedback IS NOT NULL THEN now() ELSE internal_feedback_at END
   WHERE id = v_rr.id;

  IF v_route = 'internal' THEN
    INSERT INTO admin_inbox_items (event_type, category, priority, title, body, icon, payload, related_type, related_id, source_skill)
    VALUES (
      'review_negative_internal',
      'marketing',
      'high',
      'Feedback negativo (' || p_rating || '/5)',
      COALESCE(p_internal_feedback, '(nessun testo)'),
      '😞',
      jsonb_build_object('review_request_id', v_rr.id, 'rating', p_rating),
      'review',
      v_rr.id,
      'reviews_harvester'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'routed_to', v_route,
    'google_review_url', CASE WHEN v_route = 'google' THEN v_google_review_url END
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_review_request_submit(text, smallint, text) TO anon, authenticated;
