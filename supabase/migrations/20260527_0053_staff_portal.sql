-- Hair Rich · Staff portal foundations
--
-- Aggiunge il legame tra operatori (staff) e auth.users + le tabelle che
-- supportano il portal Staff: timbratura entrata/uscita + richieste di
-- ferie/permessi. RLS permette a un operatore di vedere solo i propri
-- dati; admin vede tutto.

-- ────────────────── 1. Staff: collegamento ad auth.users ──────────────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS commission_pct numeric(5,2) DEFAULT 0
    CHECK (commission_pct >= 0 AND commission_pct <= 100),
  ADD COLUMN IF NOT EXISTS hourly_rate_cents int DEFAULT 0
    CHECK (hourly_rate_cents >= 0);

COMMENT ON COLUMN staff.user_id IS
  'Auth user that logs into the staff portal as this operator. Optional — staff without portal access leave it null.';
COMMENT ON COLUMN staff.commission_pct IS
  'Commission percentage on services performed by this operator (0-100). Used by /staff/incassi.';

-- Helper: current auth user → staff_id (null if not a staff member)
CREATE OR REPLACE FUNCTION fn_current_staff_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM staff WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION fn_current_staff_id() FROM public;
GRANT EXECUTE ON FUNCTION fn_current_staff_id() TO authenticated;

-- Helper: is the current user a staff member?
CREATE OR REPLACE FUNCTION is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION is_staff() FROM public;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;

-- ────────────────── 2. Staff clock entries (timbratura) ──────────────────
CREATE TABLE IF NOT EXISTS staff_clock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('in', 'out')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_clock_entries_staff_idx
  ON staff_clock_entries (staff_id, occurred_at DESC);

ALTER TABLE staff_clock_entries ENABLE ROW LEVEL SECURITY;

-- Operator: read + insert own entries
DROP POLICY IF EXISTS "staff reads own clock" ON staff_clock_entries;
CREATE POLICY "staff reads own clock" ON staff_clock_entries
  FOR SELECT USING (staff_id = fn_current_staff_id());

DROP POLICY IF EXISTS "staff writes own clock" ON staff_clock_entries;
CREATE POLICY "staff writes own clock" ON staff_clock_entries
  FOR INSERT WITH CHECK (staff_id = fn_current_staff_id());

-- Admin: full access
DROP POLICY IF EXISTS "admin all clock" ON staff_clock_entries;
CREATE POLICY "admin all clock" ON staff_clock_entries
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Quick toggle RPC: inserts the opposite kind of the last entry today
CREATE OR REPLACE FUNCTION fn_staff_toggle_clock(p_note text DEFAULT NULL) RETURNS staff_clock_entries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staff uuid;
  v_last_kind text;
  v_next_kind text;
  v_row staff_clock_entries;
BEGIN
  v_staff := fn_current_staff_id();
  IF v_staff IS NULL THEN
    RAISE EXCEPTION 'Solo personale autenticato' USING ERRCODE = '42501';
  END IF;

  SELECT kind INTO v_last_kind
    FROM staff_clock_entries
   WHERE staff_id = v_staff
     AND occurred_at::date = current_date
   ORDER BY occurred_at DESC
   LIMIT 1;

  v_next_kind := CASE WHEN v_last_kind = 'in' THEN 'out' ELSE 'in' END;

  INSERT INTO staff_clock_entries (staff_id, kind, note)
  VALUES (v_staff, v_next_kind, p_note)
  RETURNING * INTO v_row;

  RETURN v_row;
END$$;

REVOKE EXECUTE ON FUNCTION fn_staff_toggle_clock(text) FROM public;
GRANT EXECUTE ON FUNCTION fn_staff_toggle_clock(text) TO authenticated;

-- ────────────────── 3. Staff time-off requests ──────────────────
CREATE TABLE IF NOT EXISTS staff_time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  approved_time_off_id uuid REFERENCES time_off(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_time_off_requests_staff_idx
  ON staff_time_off_requests (staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_time_off_requests_pending_idx
  ON staff_time_off_requests (status, created_at DESC) WHERE status = 'pending';

ALTER TABLE staff_time_off_requests ENABLE ROW LEVEL SECURITY;

-- Operator: own only
DROP POLICY IF EXISTS "staff reads own time off" ON staff_time_off_requests;
CREATE POLICY "staff reads own time off" ON staff_time_off_requests
  FOR SELECT USING (staff_id = fn_current_staff_id());

DROP POLICY IF EXISTS "staff submits own time off" ON staff_time_off_requests;
CREATE POLICY "staff submits own time off" ON staff_time_off_requests
  FOR INSERT WITH CHECK (
    staff_id = fn_current_staff_id() AND status = 'pending' AND decided_by IS NULL
  );

DROP POLICY IF EXISTS "staff cancels own pending time off" ON staff_time_off_requests;
CREATE POLICY "staff cancels own pending time off" ON staff_time_off_requests
  FOR UPDATE USING (
    staff_id = fn_current_staff_id() AND status = 'pending'
  ) WITH CHECK (status = 'cancelled');

-- Admin
DROP POLICY IF EXISTS "admin all time off requests" ON staff_time_off_requests;
CREATE POLICY "admin all time off requests" ON staff_time_off_requests
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Admin RPC: approve a request → also creates a time_off row that blocks slots
CREATE OR REPLACE FUNCTION fn_approve_time_off_request(
  p_id uuid,
  p_note text DEFAULT NULL
) RETURNS staff_time_off_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req staff_time_off_requests;
  v_time_off_id uuid;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_req FROM staff_time_off_requests WHERE id = p_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Richiesta non trovata' USING ERRCODE = 'P0002';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Richiesta già processata' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO time_off (staff_id, starts_at, ends_at, reason)
  VALUES (v_req.staff_id, v_req.starts_at, v_req.ends_at, COALESCE(v_req.reason, 'Approvato'))
  RETURNING id INTO v_time_off_id;

  UPDATE staff_time_off_requests
     SET status = 'approved',
         decided_by = auth.uid(),
         decided_at = now(),
         decision_note = p_note,
         approved_time_off_id = v_time_off_id
   WHERE id = p_id
   RETURNING * INTO v_req;

  RETURN v_req;
END$$;

REVOKE EXECUTE ON FUNCTION fn_approve_time_off_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION fn_approve_time_off_request(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION fn_reject_time_off_request(
  p_id uuid,
  p_note text DEFAULT NULL
) RETURNS staff_time_off_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req staff_time_off_requests;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  UPDATE staff_time_off_requests
     SET status = 'rejected',
         decided_by = auth.uid(),
         decided_at = now(),
         decision_note = p_note
   WHERE id = p_id AND status = 'pending'
   RETURNING * INTO v_req;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Richiesta non trovata o già processata' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_req;
END$$;

REVOKE EXECUTE ON FUNCTION fn_reject_time_off_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION fn_reject_time_off_request(uuid, text) TO authenticated;

-- ────────────────── 4. Staff-side appointments view (RLS-filtered) ──────────────────
-- Staff can read appointments where they are assigned, even though the base
-- appointments table is admin-only. We do this with a SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION fn_staff_my_appointments(
  p_from timestamptz DEFAULT now() - interval '7 days',
  p_to timestamptz DEFAULT now() + interval '30 days'
) RETURNS TABLE (
  appointment_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  customer_first_name text,
  customer_last_name text,
  customer_phone text,
  service_names text,
  total_cents int,
  notes text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  v_staff_id := fn_current_staff_id();
  IF v_staff_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT a.id,
           a.start_at,
           a.end_at,
           a.status::text,
           c.first_name,
           c.last_name,
           c.phone,
           COALESCE(string_agg(s.name, ', '), 'Servizio') AS service_names,
           a.total_cents,
           a.notes
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      LEFT JOIN appointment_services ass ON ass.appointment_id = a.id
      LEFT JOIN services s ON s.id = ass.service_id
     WHERE a.staff_id = v_staff_id
       AND a.start_at >= p_from
       AND a.start_at <= p_to
     GROUP BY a.id, c.id
     ORDER BY a.start_at;
END$$;

REVOKE EXECUTE ON FUNCTION fn_staff_my_appointments(timestamptz, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION fn_staff_my_appointments(timestamptz, timestamptz) TO authenticated;

-- Staff earnings summary
CREATE OR REPLACE FUNCTION fn_staff_my_earnings(
  p_from date DEFAULT date_trunc('month', current_date)::date,
  p_to date DEFAULT current_date
) RETURNS TABLE (
  day date,
  appointments_count int,
  gross_revenue_cents bigint,
  commission_cents bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staff_id uuid;
  v_pct numeric;
BEGIN
  v_staff_id := fn_current_staff_id();
  IF v_staff_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(commission_pct, 0) INTO v_pct FROM staff WHERE id = v_staff_id;

  RETURN QUERY
    SELECT a.start_at::date AS day,
           COUNT(*)::int AS appointments_count,
           SUM(a.total_cents)::bigint AS gross_revenue_cents,
           (SUM(a.total_cents) * v_pct / 100)::bigint AS commission_cents
      FROM appointments a
     WHERE a.staff_id = v_staff_id
       AND a.status = 'completed'
       AND a.start_at::date BETWEEN p_from AND p_to
     GROUP BY a.start_at::date
     ORDER BY day DESC;
END$$;

REVOKE EXECUTE ON FUNCTION fn_staff_my_earnings(date, date) FROM public;
GRANT EXECUTE ON FUNCTION fn_staff_my_earnings(date, date) TO authenticated;

-- ────────────────── 5. Notify admin on new time-off request ──────────────────
CREATE OR REPLACE FUNCTION fn_notify_admin_time_off_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_staff_name text;
BEGIN
  SELECT name INTO v_staff_name FROM staff WHERE id = NEW.staff_id;

  INSERT INTO admin_inbox_items (
    event_type, category, priority, title, body, icon, action_url,
    related_type, related_id, payload
  ) VALUES (
    'staff_time_off_request',
    'staff',
    'normal',
    'Richiesta ferie · ' || COALESCE(v_staff_name, 'Operatore'),
    'Dal ' || to_char(NEW.starts_at, 'DD/MM') || ' al ' || to_char(NEW.ends_at, 'DD/MM') ||
      CASE WHEN NEW.reason IS NOT NULL AND NEW.reason <> '' THEN ' · ' || NEW.reason ELSE '' END,
    '🏖️',
    '/admin/staff',
    'staff_time_off_request',
    NEW.id,
    jsonb_build_object('staff_id', NEW.staff_id, 'staff_name', v_staff_name)
  );

  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_notify_admin_time_off ON staff_time_off_requests;
CREATE TRIGGER trg_notify_admin_time_off
  AFTER INSERT ON staff_time_off_requests
  FOR EACH ROW EXECUTE FUNCTION fn_notify_admin_time_off_request();
