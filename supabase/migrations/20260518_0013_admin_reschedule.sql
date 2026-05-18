-- Hair Rich · Admin reschedule appointment
-- Powers drag&drop in /admin/agenda. Validates the new slot against
-- existing bookings and time_off, then atomically updates start/end/staff.

CREATE OR REPLACE FUNCTION fn_admin_reschedule_appointment(
  p_id uuid,
  p_start_at timestamptz,
  p_staff_id uuid
) RETURNS appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appt appointments;
  v_duration int;
  v_new_end timestamptz;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_appt FROM appointments WHERE id = p_id FOR UPDATE;
  IF v_appt.id IS NULL THEN
    RAISE EXCEPTION 'Appuntamento non trovato' USING ERRCODE = 'P0002';
  END IF;

  v_duration := EXTRACT(EPOCH FROM (v_appt.end_at - v_appt.start_at)) / 60;
  v_new_end := p_start_at + make_interval(mins => v_duration);

  -- Block on time_off overlapping the new range for the target staff (or salon-wide).
  IF EXISTS (
    SELECT 1 FROM time_off
     WHERE (staff_id IS NULL OR staff_id = p_staff_id)
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_start_at, v_new_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Slot non disponibile: ferie/chiusura' USING ERRCODE = 'P0002';
  END IF;

  -- Block on overlapping appointment for the same staff, excluding self.
  IF EXISTS (
    SELECT 1 FROM appointments
     WHERE id <> p_id
       AND staff_id = p_staff_id
       AND status NOT IN ('cancelled', 'no_show')
       AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, v_new_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Slot non disponibile: conflitto con altro appuntamento' USING ERRCODE = 'P0002';
  END IF;

  UPDATE appointments
     SET start_at = p_start_at,
         end_at = v_new_end,
         staff_id = p_staff_id,
         updated_at = now()
   WHERE id = p_id
   RETURNING * INTO v_appt;

  RETURN v_appt;
END $$;

GRANT EXECUTE ON FUNCTION fn_admin_reschedule_appointment(uuid, timestamptz, uuid) TO authenticated;
