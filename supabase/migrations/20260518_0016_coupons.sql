-- Hair Rich · Coupons
-- Discount codes the salon can hand out for birthdays, referrals, win-back
-- campaigns. Redemption tracking is via a separate join table so a single
-- coupon can be reused (within max_redemptions).

CREATE TYPE coupon_kind AS ENUM ('percent', 'amount', 'free_service');

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  kind coupon_kind NOT NULL DEFAULT 'percent',
  value_percent int CHECK (value_percent BETWEEN 1 AND 100),
  value_cents int CHECK (value_cents > 0),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  max_redemptions int NOT NULL DEFAULT 1,
  redeemed_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'percent' AND value_percent IS NOT NULL) OR
    (kind = 'amount' AND value_cents IS NOT NULL) OR
    (kind = 'free_service')
  ),
  CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons (is_active) WHERE is_active;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, appointment_id)
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all coupons" ON coupons;
CREATE POLICY "admin all coupons" ON coupons
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public read active coupons by code" ON coupons;
CREATE POLICY "public read active coupons by code" ON coupons
  FOR SELECT USING (is_active);

DROP POLICY IF EXISTS "admin all coupon_redemptions" ON coupon_redemptions;
CREATE POLICY "admin all coupon_redemptions" ON coupon_redemptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_coupons_updated ON coupons;
CREATE TRIGGER trg_coupons_updated
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
