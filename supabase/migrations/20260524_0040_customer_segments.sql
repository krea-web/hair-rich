-- Hair Rich · Chat 3 · Customer segments (#50)
--
-- Auto + manual customer labels. Auto-segments are recomputed daily by the
-- classifier cron (segments-classifier Edge Function) from appointment
-- history. Manual segments are admin-only free labels (max 5/customer).
--
-- Powers targeted campaigns (#4 birthday, #5 reactivation, #6 last-minute):
-- a campaign reads `customers_in_segment('a_rischio')` instead of blasting
-- everyone.

CREATE TABLE IF NOT EXISTS customer_segments_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton boolean NOT NULL DEFAULT true,

  nuovo_days_since_first_visit int NOT NULL DEFAULT 30,
  abituale_min_visits int NOT NULL DEFAULT 3,
  abituale_within_days int NOT NULL DEFAULT 180,
  vip_min_visits int NOT NULL DEFAULT 12,
  vip_min_spend_cents int NOT NULL DEFAULT 30000,
  a_rischio_days int NOT NULL DEFAULT 90,
  a_rischio_min_past_visits int NOT NULL DEFAULT 2,
  perso_days int NOT NULL DEFAULT 180,
  noshow_min_count int NOT NULL DEFAULT 2,

  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT segments_config_singleton CHECK (is_singleton)
);

CREATE UNIQUE INDEX IF NOT EXISTS segments_config_singleton_uniq
  ON customer_segments_config ((is_singleton)) WHERE is_singleton;

INSERT INTO customer_segments_config (is_singleton)
SELECT true WHERE NOT EXISTS (SELECT 1 FROM customer_segments_config);

ALTER TABLE customer_segments_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all segments_config" ON customer_segments_config;
CREATE POLICY "admin all segments_config" ON customer_segments_config
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_segments_config_updated ON customer_segments_config;
CREATE TRIGGER trg_segments_config_updated
  BEFORE UPDATE ON customer_segments_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Segment assignments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  segment_key text NOT NULL,
  segment_label text NOT NULL,
  source text NOT NULL DEFAULT 'auto'
    CHECK (source IN ('auto','manual')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, segment_key)
);

CREATE INDEX IF NOT EXISTS customer_segments_customer_idx
  ON customer_segments (customer_id);
CREATE INDEX IF NOT EXISTS customer_segments_key_idx
  ON customer_segments (segment_key, source);

ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all customer_segments" ON customer_segments;
CREATE POLICY "admin all customer_segments" ON customer_segments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ────────── Manual segment limit (max 5 per customer) ───────────────────
CREATE OR REPLACE FUNCTION fn_check_manual_segments_limit() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_count int;
BEGIN
  IF NEW.source = 'manual' THEN
    SELECT count(*) INTO v_count
      FROM customer_segments
     WHERE customer_id = NEW.customer_id AND source = 'manual';
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'max_5_manual_segments_per_customer' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_customer_segments_limit ON customer_segments;
CREATE TRIGGER trg_customer_segments_limit
  BEFORE INSERT ON customer_segments
  FOR EACH ROW EXECUTE FUNCTION fn_check_manual_segments_limit();

-- ────────── Classifier RPC (called by daily cron) ───────────────────────
CREATE OR REPLACE FUNCTION fn_recompute_customer_segments(p_customer_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cfg customer_segments_config;
  v_processed int := 0;
  v_assignments int := 0;
BEGIN
  IF NOT is_admin() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = 'P0003';
  END IF;

  SELECT * INTO v_cfg FROM customer_segments_config WHERE is_singleton;

  DELETE FROM customer_segments
   WHERE source = 'auto'
     AND (p_customer_id IS NULL OR customer_id = p_customer_id);

  WITH stats AS (
    SELECT
      c.id AS customer_id,
      c.created_at,
      c.birthdate,
      count(a.id) FILTER (WHERE a.status = 'completed') AS visits_total,
      count(a.id) FILTER (
        WHERE a.status = 'completed'
          AND a.start_at > now() - make_interval(days => v_cfg.abituale_within_days)
      ) AS visits_recent,
      count(a.id) FILTER (WHERE a.status = 'no_show') AS noshow_count,
      max(a.start_at) FILTER (WHERE a.status = 'completed') AS last_visit_at,
      min(a.start_at) FILTER (WHERE a.status = 'completed') AS first_visit_at,
      coalesce(sum(a.total_cents) FILTER (WHERE a.status = 'completed'), 0) AS spend_total
    FROM customers c
    LEFT JOIN appointments a ON a.customer_id = c.id
    WHERE (p_customer_id IS NULL OR c.id = p_customer_id)
    GROUP BY c.id, c.created_at, c.birthdate
  ),
  classified AS (
    SELECT customer_id, segment_key, segment_label FROM (
      SELECT customer_id,
        CASE
          WHEN visits_total >= v_cfg.vip_min_visits
               AND spend_total >= v_cfg.vip_min_spend_cents THEN 'vip'
          WHEN visits_total = 0 OR first_visit_at IS NULL THEN
            CASE WHEN created_at > now() - make_interval(days => v_cfg.nuovo_days_since_first_visit)
                 THEN 'nuovo' ELSE NULL END
          WHEN first_visit_at > now() - make_interval(days => v_cfg.nuovo_days_since_first_visit) THEN 'nuovo'
          WHEN last_visit_at < now() - make_interval(days => v_cfg.perso_days) THEN 'perso'
          WHEN last_visit_at < now() - make_interval(days => v_cfg.a_rischio_days)
               AND visits_total >= v_cfg.a_rischio_min_past_visits THEN 'a_rischio'
          WHEN visits_recent >= v_cfg.abituale_min_visits THEN 'abituale'
          ELSE NULL
        END AS segment_key,
        CASE
          WHEN visits_total >= v_cfg.vip_min_visits
               AND spend_total >= v_cfg.vip_min_spend_cents THEN '💎 VIP'
          WHEN visits_total = 0 OR first_visit_at IS NULL THEN
            CASE WHEN created_at > now() - make_interval(days => v_cfg.nuovo_days_since_first_visit)
                 THEN '🆕 Nuovo' END
          WHEN first_visit_at > now() - make_interval(days => v_cfg.nuovo_days_since_first_visit) THEN '🆕 Nuovo'
          WHEN last_visit_at < now() - make_interval(days => v_cfg.perso_days) THEN '🚪 Perso'
          WHEN last_visit_at < now() - make_interval(days => v_cfg.a_rischio_days)
               AND visits_total >= v_cfg.a_rischio_min_past_visits THEN '😴 A rischio'
          WHEN visits_recent >= v_cfg.abituale_min_visits THEN '🔁 Abituale'
        END AS segment_label
      FROM stats
    ) z WHERE segment_key IS NOT NULL

    UNION ALL
    SELECT customer_id, 'noshow_recidivo', '⚠️ No-show'
      FROM stats WHERE noshow_count >= v_cfg.noshow_min_count

    UNION ALL
    SELECT customer_id, 'compleanno_mese', '🎂 Compleanno mese'
      FROM stats WHERE birthdate IS NOT NULL
        AND extract(month from birthdate) = extract(month from CURRENT_DATE)
  )
  INSERT INTO customer_segments (customer_id, segment_key, segment_label, source)
  SELECT customer_id, segment_key, segment_label, 'auto' FROM classified
  ON CONFLICT (customer_id, segment_key) DO NOTHING;

  GET DIAGNOSTICS v_assignments = ROW_COUNT;
  SELECT count(DISTINCT customer_id) INTO v_processed
    FROM customer_segments WHERE source = 'auto';

  RETURN jsonb_build_object(
    'processed_customers', v_processed,
    'assignments_created', v_assignments
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_recompute_customer_segments(uuid) TO authenticated, service_role;

-- ────────── Convenience view: customers with their segments ─────────────
CREATE OR REPLACE VIEW v_customers_segmented AS
SELECT
  c.id AS customer_id,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  array_agg(cs.segment_key ORDER BY cs.source DESC, cs.segment_key)
    FILTER (WHERE cs.segment_key IS NOT NULL) AS segment_keys,
  array_agg(cs.segment_label ORDER BY cs.source DESC, cs.segment_key)
    FILTER (WHERE cs.segment_key IS NOT NULL) AS segment_labels
FROM customers c
LEFT JOIN customer_segments cs ON cs.customer_id = c.id
GROUP BY c.id;
