-- Fix: fn_available_slots usa Europe/Rome come wall-clock di riferimento
-- per allineare working_hours (time senza TZ) con start_at (timestamptz).

CREATE OR REPLACE FUNCTION fn_available_slots(
  p_date date,
  p_service_id uuid,
  p_staff_id uuid DEFAULT NULL,
  p_step_min int DEFAULT 30
) RETURNS TABLE (slot_time time, staff_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_duration int;
  v_weekday int;
BEGIN
  SELECT duration_min INTO v_duration FROM services WHERE id = p_service_id;
  IF v_duration IS NULL THEN RETURN; END IF;

  v_weekday := EXTRACT(DOW FROM p_date)::int;

  RETURN QUERY
  WITH base AS (
    SELECT s.id AS staff_id, wh.start_time, wh.end_time
      FROM staff s
      JOIN working_hours wh ON wh.staff_id = s.id OR wh.staff_id IS NULL
     WHERE s.is_active
       AND wh.weekday = v_weekday
       AND (p_staff_id IS NULL OR s.id = p_staff_id)
  ),
  slots AS (
    SELECT b.staff_id,
           ((p_date::timestamp + b.start_time
             + (n * make_interval(mins => p_step_min))) AT TIME ZONE 'Europe/Rome') AS start_at,
           b.end_time
      FROM base b,
           generate_series(0, ((EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60) / p_step_min)::int - 1) AS n
  )
  SELECT ((s.start_at AT TIME ZONE 'Europe/Rome')::time) AS slot_time, s.staff_id
    FROM slots s
   WHERE fn_check_slot_availability(s.start_at, s.start_at + make_interval(mins => v_duration), s.staff_id, NULL)
     AND ((s.start_at + make_interval(mins => v_duration)) AT TIME ZONE 'Europe/Rome')::time <= s.end_time
   ORDER BY slot_time, s.staff_id;
END $$;
