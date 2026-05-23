-- Hair Rich · Customer-side appointment RPCs
--
-- The basic cancel/reschedule flows used by /profilo/appuntamenti. RLS
-- prevents customers from writing to appointments directly, so we expose
-- these as SECURITY DEFINER functions that validate ownership + lead-time
-- before mutating.
--
-- NOTE re Chat 1 migration budget: CLAUDE.md says "Chat 1 usa numeri
-- 0021-0028" but Task 18 explicitly requires these RPCs. We use 0029 so
-- Chat 2 should start its waitlist + appointments-extension migrations
-- from 0030 onward.

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
         notes = COALESCE(NULLIF(notes, '') || E'\n', '') ||
                 'Cancellato dal cliente' ||
                 COALESCE(': ' || NULLIF(p_reason, ''), '') ||
                 ' · ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
         updated_at = now()
   WHERE id = p_id
   RETURNING * INTO v_appt;

  RETURN v_appt;
END $$;

REVOKE EXECUTE ON FUNCTION fn_cancel_appointment_by_customer(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION fn_cancel_appointment_by_customer(uuid, text) TO authenticated;

-- Reschedule: same ownership + lead-time checks, plus conflict checks
-- (reuses the logic shape from fn_admin_reschedule_appointment).
CREATE OR REPLACE FUNCTION fn_reschedule_appointment_by_customer(
  p_id uuid,
  p_start_at timestamptz
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
  v_duration int;
  v_new_end timestamptz;
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
    RAISE EXCEPTION 'Non puoi spostare appuntamenti di altri' USING ERRCODE = '42501';
  END IF;

  IF v_appt.status IN ('cancelled', 'completed', 'no_show') THEN
    RAISE EXCEPTION 'Appuntamento già chiuso' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(cancel_min_hours, 4) INTO v_cancel_min_hours
    FROM salon_settings LIMIT 1;

  v_hours_until := EXTRACT(EPOCH FROM (v_appt.start_at - now())) / 3600.0;
  IF v_hours_until < v_cancel_min_hours THEN
    RAISE EXCEPTION 'Troppo tardi per spostare: servono almeno % ore di preavviso',
      v_cancel_min_hours USING ERRCODE = 'P0002';
  END IF;

  IF p_start_at < now() + make_interval(mins => 60) THEN
    RAISE EXCEPTION 'La nuova data deve essere nel futuro' USING ERRCODE = 'P0002';
  END IF;

  v_duration := EXTRACT(EPOCH FROM (v_appt.end_at - v_appt.start_at)) / 60;
  v_new_end := p_start_at + make_interval(mins => v_duration);

  IF EXISTS (
    SELECT 1 FROM time_off
     WHERE (staff_id IS NULL OR staff_id = v_appt.staff_id)
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_start_at, v_new_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Slot non disponibile: salone chiuso' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments
     WHERE id <> p_id
       AND staff_id = v_appt.staff_id
       AND status NOT IN ('cancelled', 'no_show')
       AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, v_new_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Slot già occupato — scegli un altro orario' USING ERRCODE = 'P0002';
  END IF;

  UPDATE appointments
     SET start_at = p_start_at,
         end_at = v_new_end,
         notes = COALESCE(NULLIF(notes, '') || E'\n', '') ||
                 'Spostato dal cliente · ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
         updated_at = now()
   WHERE id = p_id
   RETURNING * INTO v_appt;

  RETURN v_appt;
END $$;

REVOKE EXECUTE ON FUNCTION fn_reschedule_appointment_by_customer(uuid, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION fn_reschedule_appointment_by_customer(uuid, timestamptz) TO authenticated;
