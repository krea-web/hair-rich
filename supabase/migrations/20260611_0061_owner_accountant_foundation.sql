-- ============================================================================
-- Parte C · Fase C1 — Fondazione "AI Accountant / Brief giornaliero"
-- ----------------------------------------------------------------------------
-- Tutto ciò che serve perché il bot Telegram diventi un contabile reale:
--  · spese per categoria (incl. spese straordinarie)
--  · consumo prodotti (uso interno = spesa, non vendita) con ledger
--  · pagamento/prezzo reale/sconto per appuntamento (POS vs contanti)
--  · brief di chiusura giornaliero (presenze, ore, stock usato, incassi)
--  · auto-timbratura mattutina (kind='in', source='auto')
--  · stato conversazionale del bot (telegram_sessions)
--  · RPC di supporto + seed skills_config
-- Le Edge Function + cron + UI admin sono nelle fasi C2–C4.
-- ============================================================================

-- ─────────────────── 1. Spese attività (incl. straordinarie) ────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_on   date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Rome')::date,
  amount_cents  int  NOT NULL CHECK (amount_cents >= 0),
  category      text NOT NULL CHECK (category IN (
                  'attrezzatura', 'pulizia_detergenti', 'merce_rivendita',
                  'abbigliamento_personalizzato', 'stipendio_dipendente',
                  'utenze', 'affitto', 'marketing', 'straordinaria', 'altro')),
  description   text,
  payment_method text CHECK (payment_method IN ('cash','pos','bonifico','altro')),
  supplier_id   uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  is_extraordinary boolean NOT NULL DEFAULT false,
  recorded_by   uuid,                      -- auth.uid() o NULL (bot)
  source        text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin','telegram')),
  receipt_path  text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (occurred_on DESC);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manages expenses" ON expenses;
CREATE POLICY "admin manages expenses" ON expenses FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────── 2. Ledger movimenti stock (consumo) ────────────────────
-- reason='internal_use' → prodotto usato in salone (spesa/COGS, NIENTE incasso)
-- reason='sale'         → venduto (incasso, gestito altrove ma loggabile qui)
CREATE TABLE IF NOT EXISTS stock_movements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty            int  NOT NULL CHECK (qty > 0),
  delta          int  NOT NULL,             -- negativo = uscita
  reason         text NOT NULL CHECK (reason IN
                   ('sale','internal_use','restock','wastage','gift','adjustment')),
  unit_cost_cents int,                       -- snapshot COGS (da products.cost_cents)
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  occurred_on    date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Rome')::date,
  source         text NOT NULL DEFAULT 'admin' CHECK (source IN ('admin','telegram','system')),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements (product_id, occurred_on DESC);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manages stock_movements" ON stock_movements;
CREATE POLICY "admin manages stock_movements" ON stock_movements FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────── 3. Appuntamenti: pagamento reale + sconto ──────────────────
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS price_paid_cents int,                 -- incasso reale
  ADD COLUMN IF NOT EXISTS discount_cents   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason  text,                -- coupon/package/manual/loyalty/fedelta
  ADD COLUMN IF NOT EXISTS payment_method   text CHECK (payment_method IN
                   ('cash','pos','package_credit','mixed','free','none')),
  ADD COLUMN IF NOT EXISTS paid_at          timestamptz;
-- backfill prudente: incasso reale = listino dove già completato e non valorizzato
UPDATE appointments SET price_paid_cents = total_cents
  WHERE price_paid_cents IS NULL AND status = 'completed';

-- ─────────────────── 4. Timbratura: sorgente (auto/manuale) ──────────────────
ALTER TABLE staff_clock_entries
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','auto'));

-- ─────────────────── 5. Brief / chiusura giornaliera ────────────────────────
CREATE TABLE IF NOT EXISTS daily_brief (
  brief_date          date PRIMARY KEY DEFAULT (now() AT TIME ZONE 'Europe/Rome')::date,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  -- presenze / ore (questionario di chiusura)
  attendance_ok       boolean,             -- tutti si sono presentati?
  attendance_notes    text,
  hours_ok            boolean,             -- hanno lavorato tutte le ore di servizio?
  hours_notes         text,
  -- materiale di vendita usato in salone (consumo da stock-vendita)
  sale_stock_used     boolean,
  sale_stock_notes    text,
  -- spese straordinarie del giorno
  extraordinary_cents int NOT NULL DEFAULT 0,
  extraordinary_notes text,
  -- incassi (recap notturno)
  revenue_cash_cents  int NOT NULL DEFAULT 0,
  revenue_pos_cents   int NOT NULL DEFAULT 0,
  revenue_other_cents int NOT NULL DEFAULT 0,
  -- conteggi appuntamenti
  appts_expected      int,
  appts_completed     int,
  no_shows            int,
  owner_notes         text,
  completed_at        timestamptz,
  completed_via       text CHECK (completed_via IN ('telegram','admin')),
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE daily_brief ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manages daily_brief" ON daily_brief;
CREATE POLICY "admin manages daily_brief" ON daily_brief FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────── 6. Stato conversazionale bot Telegram ──────────────────
CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id     text PRIMARY KEY,
  state       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- flusso brief multi-turno
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manages telegram_sessions" ON telegram_sessions;
CREATE POLICY "admin manages telegram_sessions" ON telegram_sessions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- RPC di supporto (SECURITY DEFINER, gate is_admin)
-- ============================================================================

-- Registra una spesa
CREATE OR REPLACE FUNCTION fn_record_expense(
  p_amount_cents int, p_category text, p_description text DEFAULT NULL,
  p_payment_method text DEFAULT NULL, p_is_extraordinary boolean DEFAULT false,
  p_source text DEFAULT 'telegram'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO expenses (amount_cents, category, description, payment_method, is_extraordinary, source)
  VALUES (p_amount_cents, p_category, p_description, p_payment_method, p_is_extraordinary, p_source)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Registra uso/consumo prodotto (decrementa stock + logga movimento)
CREATE OR REPLACE FUNCTION fn_record_stock_use(
  p_product_id uuid, p_qty int, p_reason text DEFAULT 'internal_use',
  p_appointment_id uuid DEFAULT NULL, p_source text DEFAULT 'telegram'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid; v_cost int;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT cost_cents INTO v_cost FROM products WHERE id = p_product_id;
  UPDATE products SET stock = GREATEST(0, COALESCE(stock,0) - p_qty) WHERE id = p_product_id;
  INSERT INTO stock_movements (product_id, qty, delta, reason, unit_cost_cents, appointment_id, source)
  VALUES (p_product_id, p_qty, -p_qty, p_reason, v_cost, p_appointment_id, p_source)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Imposta pagamento/sconto reale su un appuntamento
CREATE OR REPLACE FUNCTION fn_set_appointment_payment(
  p_appointment_id uuid, p_price_paid_cents int, p_payment_method text,
  p_discount_cents int DEFAULT 0, p_discount_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE appointments
     SET price_paid_cents = p_price_paid_cents,
         payment_method   = p_payment_method,
         discount_cents   = COALESCE(p_discount_cents, 0),
         discount_reason  = p_discount_reason,
         paid_at          = now()
   WHERE id = p_appointment_id;
END $$;

-- Split incassi del giorno (POS / contanti / altro / sconti)
CREATE OR REPLACE FUNCTION fn_daily_revenue_split(p_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'cash_cents',  COALESCE(SUM(CASE WHEN payment_method='cash' THEN price_paid_cents END),0),
    'pos_cents',   COALESCE(SUM(CASE WHEN payment_method='pos'  THEN price_paid_cents END),0),
    'package_cents', COALESCE(SUM(CASE WHEN payment_method='package_credit' THEN price_paid_cents END),0),
    'other_cents', COALESCE(SUM(CASE WHEN payment_method NOT IN ('cash','pos','package_credit') OR payment_method IS NULL THEN price_paid_cents END),0),
    'discount_cents', COALESCE(SUM(discount_cents),0),
    'total_cents', COALESCE(SUM(price_paid_cents),0),
    'paid_count',  COUNT(*) FILTER (WHERE price_paid_cents IS NOT NULL)
  ) INTO v
  FROM appointments
  WHERE (start_at AT TIME ZONE 'Europe/Rome')::date = p_date
    AND status = 'completed';
  RETURN v;
END $$;

-- Aggregato completo per il brief (appuntamenti + incassi + spese + COGS interno)
CREATE OR REPLACE FUNCTION fn_daily_brief(p_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v jsonb; v_rev jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  v_rev := fn_daily_revenue_split(p_date);
  SELECT jsonb_build_object(
    'date', p_date,
    'appts_expected', (SELECT COUNT(*) FROM appointments
        WHERE (start_at AT TIME ZONE 'Europe/Rome')::date = p_date AND status <> 'cancelled'),
    'appts_completed', (SELECT COUNT(*) FROM appointments
        WHERE (start_at AT TIME ZONE 'Europe/Rome')::date = p_date AND status = 'completed'),
    'no_shows', (SELECT COUNT(*) FROM appointments
        WHERE (start_at AT TIME ZONE 'Europe/Rome')::date = p_date AND status = 'no_show'),
    'revenue', v_rev,
    'expenses_cents', (SELECT COALESCE(SUM(amount_cents),0) FROM expenses WHERE occurred_on = p_date),
    'stock_consumed_cost_cents', (SELECT COALESCE(SUM(COALESCE(unit_cost_cents,0)*qty),0)
        FROM stock_movements WHERE occurred_on = p_date AND reason='internal_use')
  ) INTO v;
  RETURN v;
END $$;

-- Auto-timbratura mattutina: registra 'in' (source='auto') per gli staff attivi
-- che non hanno già una timbratura 'in' oggi. Chiamata dal cron di apertura.
CREATE OR REPLACE FUNCTION fn_auto_clock_in_all()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int := 0; r record;
BEGIN
  FOR r IN
    SELECT s.id FROM staff s
    WHERE s.is_active = true AND COALESCE(s.role_type,'') NOT IN ('founder','receptionist')
      AND NOT EXISTS (
        SELECT 1 FROM staff_clock_entries c
        WHERE c.staff_id = s.id AND c.kind='in'
          AND (c.occurred_at AT TIME ZONE 'Europe/Rome')::date = (now() AT TIME ZONE 'Europe/Rome')::date
      )
  LOOP
    INSERT INTO staff_clock_entries (staff_id, kind, source, note)
    VALUES (r.id, 'in', 'auto', 'Apertura attività (auto)');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

-- Buchi in agenda oggi → spunto "storia IG posti liberi"
-- Ritorna conteggio appuntamenti di oggi e un flag se sotto soglia (default 6).
CREATE OR REPLACE FUNCTION fn_day_gaps(p_date date, p_low_threshold int DEFAULT 6)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COUNT(*) INTO v_count FROM appointments
   WHERE (start_at AT TIME ZONE 'Europe/Rome')::date = p_date AND status <> 'cancelled';
  RETURN jsonb_build_object(
    'appointments', v_count,
    'has_gaps', v_count < p_low_threshold,
    'suggest_ig_story', v_count < p_low_threshold
  );
END $$;

-- ─────────────────── 7. Skills Hub: nuove skill (default OFF) ────────────────
INSERT INTO skills_config (skill_key, enabled) VALUES
  ('owner_daily_brief', false),
  ('expense_tracking', false),
  ('stock_consumption', false),
  ('auto_clock_in', false),
  ('owner_morning_digest', false)
ON CONFLICT (skill_key) DO NOTHING;
