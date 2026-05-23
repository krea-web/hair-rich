-- Hair Rich · Waitlist + appointments cancellation metadata
--
-- Chat 2 task 1. Foundation for the waitlist matcher: when a customer
-- cancels via /profilo, we capture WHO cancelled, WHEN and WHY so the
-- matcher cron + admin audit can reason about lead-time, ghosting, etc.
--
-- Also introduces:
--   - status='soft_reserved' for the slot fantasma window while a waitlist
--     token is outstanding (excluded from fn_available_slots)
--   - package_credit_id forward-declared on appointments so task 8 can
--     wire BookingDrawer redemption without another schema change
--   - waitlist queue table with adaptive token validity (computed when
--     the matcher fires, based on hours_until_slot)
--   - cancellation_history append-only ledger for behavioural analysis
--     (no-show outreach, segmentation, etc.)
--
-- The matching RPC lives in 0031 to keep this file declarative.

-- 1. Extend appointment_status enum with 'soft_reserved'
DO $$ BEGIN
  ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'soft_reserved';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Appointments: cancellation + package credit metadata
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer','admin','staff','system','no_show')),
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS package_credit_id uuid,
  ADD COLUMN IF NOT EXISTS soft_reserve_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS waitlist_entry_id uuid;

CREATE INDEX IF NOT EXISTS appointments_cancelled_idx
  ON appointments (cancelled_at DESC) WHERE cancelled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS appointments_soft_reserve_idx
  ON appointments (soft_reserve_expires_at) WHERE status = 'soft_reserved';

-- 3. Bridge fn_cancel_appointment_by_customer to stamp the new columns
--    so the waitlist matcher has structured data to read.
CREATE OR REPLACE FUNCTION fn_cancel_appointment_by_customer(
  p_id uuid,
  p_reason text DEFAULT NULL
) RETURNS appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appt appointments;
  v_user uuid := auth.uid();
  v_customer_id uuid;
  v_cancel_min_hours int;
  v_hours_until numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Autenticazione richiesta' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_customer_id FROM customers WHERE user_id = v_user;
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Cliente non trovato' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_appt FROM appointments WHERE id = p_id FOR UPDATE;
  IF v_appt.id IS NULL THEN
    RAISE EXCEPTION 'Appuntamento non trovato' USING ERRCODE = 'P0002';
  END IF;

  IF v_appt.customer_id <> v_customer_id THEN
    RAISE EXCEPTION 'Non puoi cancellare appuntamenti di altri' USING ERRCODE = '42501';
  END IF;

  IF v_appt.status IN ('cancelled', 'completed', 'no_show') THEN
    RAISE EXCEPTION 'Appuntamento già chiuso' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(cancel_min_hours, 4) INTO v_cancel_min_hours
    FROM salon_settings LIMIT 1;

  v_hours_until := EXTRACT(EPOCH FROM (v_appt.start_at - now())) / 3600.0;
  IF v_hours_until < v_cancel_min_hours THEN
    RAISE EXCEPTION 'Troppo tardi per cancellare: servono almeno % ore di preavviso (mancano %)',
      v_cancel_min_hours, ROUND(v_hours_until, 1)
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE appointments
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = 'customer',
         cancellation_reason = NULLIF(p_reason, ''),
         notes = COALESCE(NULLIF(notes, '') || E'\n', '') ||
                 'Cancellato dal cliente' ||
                 COALESCE(': ' || NULLIF(p_reason, ''), '') ||
                 ' · ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
         updated_at = now()
   WHERE id = p_id
   RETURNING * INTO v_appt;

  RETURN v_appt;
END $$;

-- 4. Waitlist queue: one row per customer waiting on a flexible window
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  -- preferred window: any slot whose start_at falls in [date_from, date_to]
  date_from date NOT NULL,
  date_to date NOT NULL CHECK (date_to >= date_from),
  preferred_time_start time,
  preferred_time_end time,
  -- queue lifecycle
  status text NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','notified','confirmed','expired','cancelled','ghosted')),
  position int NOT NULL DEFAULT 0,
  -- adaptive token (set at notification time, validity depends on
  -- hours until slot - see fn_match_waitlist_entry in 0031)
  notify_token text,
  notify_token_expires_at timestamptz,
  notified_appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  notified_at timestamptz,
  confirmed_at timestamptz,
  -- ghosting tracking: 3 consecutive missed notifications = auto-cancel
  missed_notifications int NOT NULL DEFAULT 0,
  notes text,
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status, created_at);
CREATE INDEX IF NOT EXISTS waitlist_customer_idx ON waitlist (customer_id, status);
CREATE INDEX IF NOT EXISTS waitlist_service_window_idx ON waitlist (service_id, date_from, date_to);
CREATE INDEX IF NOT EXISTS waitlist_token_idx ON waitlist (notify_token) WHERE notify_token IS NOT NULL;

DROP TRIGGER IF EXISTS waitlist_updated_at ON waitlist;
CREATE TRIGGER waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Re-attach the FK from appointments.waitlist_entry_id now that
-- the target table exists.
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_waitlist_entry_fk;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_waitlist_entry_fk
  FOREIGN KEY (waitlist_entry_id) REFERENCES waitlist(id) ON DELETE SET NULL;

-- 5. Cancellation history: append-only, derived via trigger on
--    appointments. Lets the admin spot patterns (chronic last-minute,
--    same-day cancellation streaks, etc.) without paying the cost
--    on every appointments read.
CREATE TABLE IF NOT EXISTS cancellation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  cancelled_at timestamptz NOT NULL DEFAULT now(),
  cancelled_by text NOT NULL,
  hours_before_slot numeric,
  reason text,
  total_cents int
);
CREATE INDEX IF NOT EXISTS cancellation_history_customer_idx
  ON cancellation_history (customer_id, cancelled_at DESC);

CREATE OR REPLACE FUNCTION fn_log_cancellation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND COALESCE(OLD.status, ''::text) <> 'cancelled' THEN
    INSERT INTO cancellation_history (
      appointment_id, customer_id, cancelled_at, cancelled_by,
      hours_before_slot, reason, total_cents
    ) VALUES (
      NEW.id,
      NEW.customer_id,
      COALESCE(NEW.cancelled_at, now()),
      COALESCE(NEW.cancelled_by, 'admin'),
      ROUND(EXTRACT(EPOCH FROM (NEW.start_at - COALESCE(NEW.cancelled_at, now()))) / 3600.0, 2),
      NEW.cancellation_reason,
      NEW.total_cents
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_cancellation ON appointments;
CREATE TRIGGER trg_log_cancellation
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW EXECUTE FUNCTION fn_log_cancellation();

-- 6. Exclude soft_reserved + cancelled from availability checks.
--    fn_check_slot_availability in init schema already filters out
--    cancelled/no_show — extend it to also skip soft_reserved slots
--    that have already expired (treat expired soft holds as free).
CREATE OR REPLACE FUNCTION fn_check_slot_availability(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_staff_id uuid DEFAULT NULL,
  p_chair_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE conflict_exists boolean;
BEGIN
  IF p_end_at <= p_start_at THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM time_off
     WHERE (staff_id IS NULL OR staff_id = p_staff_id)
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM appointments
     WHERE status NOT IN ('cancelled','no_show')
       AND (
         status <> 'soft_reserved'
         OR (soft_reserve_expires_at IS NOT NULL AND soft_reserve_expires_at > now())
       )
       AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
       AND (
         (p_staff_id IS NOT NULL AND staff_id = p_staff_id)
         OR (p_chair_id IS NOT NULL AND chair_id = p_chair_id)
       )
  ) INTO conflict_exists;

  RETURN NOT conflict_exists;
END $$;

GRANT EXECUTE ON FUNCTION fn_check_slot_availability(timestamptz,timestamptz,uuid,uuid) TO anon, authenticated;

-- 7. RLS for waitlist + cancellation_history
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer read own waitlist" ON waitlist;
CREATE POLICY "customer read own waitlist" ON waitlist
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer manage own waitlist" ON waitlist;
CREATE POLICY "customer manage own waitlist" ON waitlist
  FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer delete own waitlist" ON waitlist;
CREATE POLICY "customer delete own waitlist" ON waitlist
  FOR UPDATE USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    AND status IN ('waiting','notified')
  ) WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    AND status IN ('waiting','cancelled')
  );

DROP POLICY IF EXISTS "admin all waitlist" ON waitlist;
CREATE POLICY "admin all waitlist" ON waitlist
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin read cancellations" ON cancellation_history;
CREATE POLICY "admin read cancellations" ON cancellation_history
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "system insert cancellations" ON cancellation_history;
CREATE POLICY "system insert cancellations" ON cancellation_history
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE waitlist IS
  'Queue of customers waiting on flexible date/time windows. Matched by fn_match_waitlist_entry when an appointment is cancelled with lead-time > soft_reserve_min_hours.';
COMMENT ON COLUMN waitlist.notify_token_expires_at IS
  'Token validity is adaptive: 24h if slot >7gg, 6h if >24h, 2h if >6h, 45min if >3h, none if <3h.';
COMMENT ON COLUMN appointments.soft_reserve_expires_at IS
  'When status = soft_reserved, slot is held for the notified waitlist customer until this timestamp. Expired holds are skipped in availability checks.';
