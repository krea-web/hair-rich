-- Hair Rich · Chat 3 · Loyalty engine (#42)
--
-- A single configurable loyalty program. The owner picks the model
-- (a-stamp / a-punti / cashback), the reward type (free service /
-- fixed discount / percent discount), the threshold, validity, and
-- anti-gaming rules. Everything is in `loyalty_config` so changes
-- happen from /admin/gamification without code deploys.
--
-- `loyalty_transactions` is an append-only ledger: every stamp /
-- earn / redeem operation gets a row. The current balance is a
-- materialized sum (cheap on per-customer queries).

-- ────────── Single config row ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton boolean NOT NULL DEFAULT true,

  model text NOT NULL DEFAULT 'stamp'
    CHECK (model IN ('stamp','points','cashback')),

  earn_per_visit int NOT NULL DEFAULT 1,
  earn_per_euro_spent int NOT NULL DEFAULT 0,
  reward_threshold int NOT NULL DEFAULT 10,

  reward_kind text NOT NULL DEFAULT 'free_service'
    CHECK (reward_kind IN ('free_service','fixed_discount','percent_discount')),
  reward_value_cents int,
  reward_value_percent int CHECK (reward_value_percent BETWEEN 1 AND 100),
  reward_service_id uuid REFERENCES services(id) ON DELETE SET NULL,

  signup_bonus int NOT NULL DEFAULT 0,
  birthday_bonus int NOT NULL DEFAULT 0,

  min_days_between_earns int NOT NULL DEFAULT 0,
  max_earns_per_month int,
  earn_requires_completed_status boolean NOT NULL DEFAULT true,
  reward_validity_days int NOT NULL DEFAULT 365,

  display_name text NOT NULL DEFAULT 'Hair Rich Club',
  display_description text,
  display_unit_singular text NOT NULL DEFAULT 'timbro',
  display_unit_plural text NOT NULL DEFAULT 'timbri',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_config_singleton CHECK (is_singleton)
);

CREATE UNIQUE INDEX IF NOT EXISTS loyalty_config_singleton_uniq
  ON loyalty_config ((is_singleton)) WHERE is_singleton;

ALTER TABLE loyalty_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read loyalty_config" ON loyalty_config;
CREATE POLICY "public read loyalty_config" ON loyalty_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin write loyalty_config" ON loyalty_config;
CREATE POLICY "admin write loyalty_config" ON loyalty_config
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO loyalty_config (model, reward_threshold)
SELECT 'stamp', 10
WHERE NOT EXISTS (SELECT 1 FROM loyalty_config);

DROP TRIGGER IF EXISTS trg_loyalty_config_updated ON loyalty_config;
CREATE TRIGGER trg_loyalty_config_updated
  BEFORE UPDATE ON loyalty_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── Append-only ledger ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  delta int NOT NULL,
  reason text NOT NULL
    CHECK (reason IN ('earn_visit','earn_spend','signup_bonus','birthday_bonus',
                      'redeem_reward','manual_adjust','expire')),
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loyalty_tx_customer_idx
  ON loyalty_transactions (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS loyalty_tx_appointment_idx
  ON loyalty_transactions (appointment_id) WHERE appointment_id IS NOT NULL;

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all loyalty_tx" ON loyalty_transactions;
CREATE POLICY "admin all loyalty_tx" ON loyalty_transactions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customer read own loyalty_tx" ON loyalty_transactions;
CREATE POLICY "customer read own loyalty_tx" ON loyalty_transactions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- ────────── Balance RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_loyalty_balance(p_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance int;
  v_threshold int;
  v_unit_plural text;
  v_progress int;
BEGIN
  SELECT COALESCE(SUM(delta), 0) INTO v_balance
    FROM loyalty_transactions
   WHERE customer_id = p_customer_id;

  SELECT reward_threshold, display_unit_plural
    INTO v_threshold, v_unit_plural
    FROM loyalty_config WHERE is_singleton;

  v_progress := GREATEST(0, v_balance);

  RETURN jsonb_build_object(
    'balance', v_balance,
    'threshold', v_threshold,
    'unit_plural', v_unit_plural,
    'progress', v_progress,
    'reward_available', (v_balance >= v_threshold)
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_loyalty_balance(uuid) TO authenticated;

-- ────────── Auto-earn trigger on appointment completion ─────────────────
CREATE OR REPLACE FUNCTION fn_loyalty_auto_earn() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cfg loyalty_config;
  v_enabled boolean;
  v_already int;
  v_last_earn timestamptz;
  v_month_count int;
  v_earn_delta int;
BEGIN
  SELECT enabled INTO v_enabled FROM skills_config WHERE skill_key = 'loyalty';
  IF NOT COALESCE(v_enabled, false) THEN RETURN NEW; END IF;

  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;

  SELECT * INTO v_cfg FROM loyalty_config WHERE is_singleton;
  IF v_cfg.id IS NULL THEN RETURN NEW; END IF;

  IF v_cfg.earn_requires_completed_status AND NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_already
    FROM loyalty_transactions
   WHERE appointment_id = NEW.id AND reason IN ('earn_visit','earn_spend');
  IF v_already > 0 THEN RETURN NEW; END IF;

  IF v_cfg.min_days_between_earns > 0 THEN
    SELECT max(created_at) INTO v_last_earn
      FROM loyalty_transactions
     WHERE customer_id = NEW.customer_id AND reason IN ('earn_visit','earn_spend');
    IF v_last_earn IS NOT NULL
       AND v_last_earn > now() - make_interval(days => v_cfg.min_days_between_earns) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF v_cfg.max_earns_per_month IS NOT NULL THEN
    SELECT count(*) INTO v_month_count
      FROM loyalty_transactions
     WHERE customer_id = NEW.customer_id
       AND reason IN ('earn_visit','earn_spend')
       AND created_at > now() - interval '30 days';
    IF v_month_count >= v_cfg.max_earns_per_month THEN RETURN NEW; END IF;
  END IF;

  v_earn_delta := v_cfg.earn_per_visit;
  IF v_cfg.earn_per_euro_spent > 0 AND NEW.total_cents > 0 THEN
    v_earn_delta := v_earn_delta + (NEW.total_cents / 100 * v_cfg.earn_per_euro_spent);
  END IF;

  IF v_earn_delta > 0 THEN
    INSERT INTO loyalty_transactions (customer_id, delta, reason, appointment_id)
    VALUES (NEW.customer_id, v_earn_delta, 'earn_visit', NEW.id);
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_loyalty_auto_earn ON appointments;
CREATE TRIGGER trg_loyalty_auto_earn
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW EXECUTE FUNCTION fn_loyalty_auto_earn();

-- ────────── Redeem RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_loyalty_redeem(p_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cfg loyalty_config;
  v_balance int;
  v_coupon_id uuid;
  v_code text;
BEGIN
  IF NOT (is_admin() OR EXISTS (
    SELECT 1 FROM customers WHERE id = p_customer_id AND user_id = auth.uid()
  )) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = 'P0003';
  END IF;

  SELECT * INTO v_cfg FROM loyalty_config WHERE is_singleton;
  SELECT COALESCE(SUM(delta), 0) INTO v_balance
    FROM loyalty_transactions WHERE customer_id = p_customer_id;

  IF v_balance < v_cfg.reward_threshold THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_balance',
      'balance', v_balance, 'threshold', v_cfg.reward_threshold);
  END IF;

  v_code := 'LOYAL-' || upper(substr(gen_random_uuid()::text, 1, 8));

  INSERT INTO coupons (code, description, kind, value_percent, value_cents,
                       valid_until, max_redemptions, origin,
                       single_use_per_customer, issued_to_customer_id)
  VALUES (
    v_code,
    v_cfg.display_name || ' · premio fedeltà',
    CASE v_cfg.reward_kind
      WHEN 'free_service'     THEN 'free_service'::coupon_kind
      WHEN 'fixed_discount'   THEN 'amount'::coupon_kind
      WHEN 'percent_discount' THEN 'percent'::coupon_kind
    END,
    CASE WHEN v_cfg.reward_kind = 'percent_discount' THEN v_cfg.reward_value_percent END,
    CASE WHEN v_cfg.reward_kind = 'fixed_discount'   THEN v_cfg.reward_value_cents   END,
    CURRENT_DATE + v_cfg.reward_validity_days,
    1,
    'manual',
    true,
    p_customer_id
  )
  RETURNING id INTO v_coupon_id;

  INSERT INTO loyalty_transactions (customer_id, delta, reason, coupon_id)
  VALUES (p_customer_id, -v_cfg.reward_threshold, 'redeem_reward', v_coupon_id);

  RETURN jsonb_build_object('ok', true, 'coupon_id', v_coupon_id, 'code', v_code);
END $$;

GRANT EXECUTE ON FUNCTION fn_loyalty_redeem(uuid) TO authenticated;
