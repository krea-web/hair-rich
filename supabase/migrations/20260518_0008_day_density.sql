-- Calendar density indicator
-- For each candidate day in the booking wizard, fn_day_density returns a
-- 0–1 ratio of how full the day already is for a given service. The wizard
-- renders 4 dots filled proportionally so the user picks "quiet" days at
-- a glance — also a soft nudge to fill weekday slots that would otherwise
-- go empty.

CREATE OR REPLACE FUNCTION fn_day_density(
    p_date date,
    p_service_id uuid,
    p_step_min int DEFAULT 30
) RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_total int;
    v_taken int;
    v_duration int;
    v_weekday int;
BEGIN
    SELECT duration_min INTO v_duration FROM services WHERE id = p_service_id;
    IF v_duration IS NULL THEN RETURN 0; END IF;

    v_weekday := EXTRACT(DOW FROM p_date)::int;

    -- Total possible step slots across all open windows for the salon today.
    -- We use working_hours rows where staff_id IS NULL (salon-wide schedule).
    SELECT COALESCE(SUM(
        FLOOR(EXTRACT(EPOCH FROM (end_time - start_time)) / 60 / p_step_min)::int
    ), 0)
    INTO v_total
    FROM working_hours
    WHERE staff_id IS NULL AND weekday = v_weekday;

    IF v_total = 0 THEN RETURN 1; END IF; -- closed → "full" so it's not enticing

    -- Multiply by active staff count: every staff member is a parallel slot
    SELECT v_total * COUNT(*) INTO v_total FROM staff WHERE is_active;

    -- Active appointments that day (any staff)
    SELECT COUNT(*) INTO v_taken
    FROM appointments
    WHERE status NOT IN ('cancelled','no_show')
        AND start_at::date = p_date;

    IF v_total = 0 THEN RETURN 1; END IF;
    RETURN LEAST(1, v_taken::numeric / v_total::numeric);
END $$;

GRANT EXECUTE ON FUNCTION fn_day_density(date, uuid, int) TO anon, authenticated;
