-- Hair Rich · Chat 3 · Coupons ecosystem
--
-- Extends the existing coupons table (migration 0016) with the metadata the
-- marketing engine needs: campaign origin (birthday/referral/winback/manual),
-- per-customer constraints (single_use_per_customer), QR batches for
-- printable promos (#88), and a referral link join (#65 ↔ #45).
--
-- Plus: validation RPC that the BookingDrawer "Hai un codice?" field calls.

-- ────────── Extend coupons with marketing metadata ──────────────────────
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual','birthday','reactivation','referral','winback','qr_batch','last_minute')),
  ADD COLUMN IF NOT EXISTS single_use_per_customer boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_purchase_cents int,
  ADD COLUMN IF NOT EXISTS issued_to_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qr_batch_id uuid,
  ADD COLUMN IF NOT EXISTS referral_id uuid,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE INDEX IF NOT EXISTS coupons_origin_idx ON coupons (origin);
CREATE INDEX IF NOT EXISTS coupons_issued_to_idx ON coupons (issued_to_customer_id) WHERE issued_to_customer_id IS NOT NULL;

-- ────────── Extend coupon_redemptions with audit trail ─────────────────
ALTER TABLE coupon_redemptions
  ADD COLUMN IF NOT EXISTS discount_cents int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'booking'
    CHECK (source IN ('booking','admin','qr_scan'));

CREATE INDEX IF NOT EXISTS coupon_redemptions_customer_idx
  ON coupon_redemptions (customer_id, redeemed_at DESC) WHERE customer_id IS NOT NULL;

-- ────────── QR batches (#88 promozioni cartacee tracciate) ──────────────
CREATE TABLE IF NOT EXISTS coupon_qr_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  channel text,
  utm_source text,
  utm_medium text DEFAULT 'qr',
  utm_campaign text,
  prefix text NOT NULL,
  codes_count int NOT NULL DEFAULT 0,
  printed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_qr_batch_fk;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_qr_batch_fk
    FOREIGN KEY (qr_batch_id) REFERENCES coupon_qr_batches(id) ON DELETE SET NULL;

ALTER TABLE coupon_qr_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all qr_batches" ON coupon_qr_batches;
CREATE POLICY "admin all qr_batches" ON coupon_qr_batches
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ────────── Referrals: customer → friend (#65) ──────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  invited_email text,
  invited_phone text,
  invited_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  referrer_coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  invitee_coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','signed_up','first_visit_completed','rewarded','expired')),
  credit_cents int NOT NULL DEFAULT 500,
  signed_up_at timestamptz,
  first_visit_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_customer_id, status);
CREATE INDEX IF NOT EXISTS referrals_invited_customer_idx ON referrals (invited_customer_id);

ALTER TABLE coupons
  DROP CONSTRAINT IF EXISTS coupons_referral_fk;
ALTER TABLE coupons
  ADD CONSTRAINT coupons_referral_fk
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL;

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all referrals" ON referrals;
CREATE POLICY "admin all referrals" ON referrals
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customer read own referrals" ON referrals;
CREATE POLICY "customer read own referrals" ON referrals
  FOR SELECT USING (
    referrer_customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_referrals_updated ON referrals;
CREATE TRIGGER trg_referrals_updated
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Coupon validation RPC (used by BookingDrawer) ───────────────
CREATE OR REPLACE FUNCTION fn_validate_coupon(
  p_code text,
  p_customer_id uuid DEFAULT NULL,
  p_subtotal_cents int DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coupon record;
  v_discount_cents int := 0;
  v_already_used int := 0;
  v_flag_enabled boolean;
BEGIN
  SELECT enabled INTO v_flag_enabled FROM skills_config WHERE skill_key = 'coupons';
  IF NOT COALESCE(v_flag_enabled, false) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'feature_disabled');
  END IF;

  SELECT * INTO v_coupon FROM coupons WHERE code = upper(trim(p_code)) AND is_active;
  IF v_coupon.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_coupon.valid_from > CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_started');
  END IF;
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < CURRENT_DATE THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  IF v_coupon.redeemed_count >= v_coupon.max_redemptions THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'exhausted');
  END IF;
  IF v_coupon.min_purchase_cents IS NOT NULL AND p_subtotal_cents < v_coupon.min_purchase_cents THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'min_purchase_not_met',
      'min_cents', v_coupon.min_purchase_cents);
  END IF;
  IF v_coupon.issued_to_customer_id IS NOT NULL
     AND (p_customer_id IS NULL OR v_coupon.issued_to_customer_id <> p_customer_id) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'wrong_customer');
  END IF;
  IF v_coupon.single_use_per_customer AND p_customer_id IS NOT NULL THEN
    SELECT count(*) INTO v_already_used
      FROM coupon_redemptions
     WHERE coupon_id = v_coupon.id AND customer_id = p_customer_id;
    IF v_already_used > 0 THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'already_used');
    END IF;
  END IF;

  v_discount_cents := CASE v_coupon.kind
    WHEN 'percent' THEN (p_subtotal_cents * v_coupon.value_percent / 100)::int
    WHEN 'amount'  THEN LEAST(v_coupon.value_cents, p_subtotal_cents)
    WHEN 'free_service' THEN p_subtotal_cents
  END;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'kind', v_coupon.kind,
    'discount_cents', v_discount_cents,
    'description', v_coupon.description
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_validate_coupon(text, uuid, int) TO anon, authenticated;

-- ────────── Coupon redemption RPC (called on appointment confirm) ───────
CREATE OR REPLACE FUNCTION fn_redeem_coupon(
  p_coupon_id uuid,
  p_appointment_id uuid,
  p_customer_id uuid,
  p_discount_cents int,
  p_source text DEFAULT 'booking'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_redemption_id uuid;
BEGIN
  INSERT INTO coupon_redemptions (coupon_id, customer_id, appointment_id, discount_cents, source)
  VALUES (p_coupon_id, p_customer_id, p_appointment_id, p_discount_cents, p_source)
  RETURNING id INTO v_redemption_id;

  UPDATE coupons
     SET redeemed_count = redeemed_count + 1,
         updated_at = now()
   WHERE id = p_coupon_id;

  RETURN v_redemption_id;
END $$;

GRANT EXECUTE ON FUNCTION fn_redeem_coupon(uuid, uuid, uuid, int, text) TO authenticated;
