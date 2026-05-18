-- Hair Rich · Admin reports
-- Two functions powering the dashboard "Da richiamare" widget and the
-- /admin/statistiche range view.

-- ──────────────────────────────────────────────────────────────────────
-- Customers at risk: completed ≥ 2 visits, last completed > N days ago,
-- and no upcoming booking on the books.
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_customers_at_risk(
  p_min_visits int DEFAULT 2,
  p_days_silent int DEFAULT 90
) RETURNS TABLE (
  customer_id uuid,
  first_name text,
  last_name text,
  phone text,
  email text,
  completed_count bigint,
  last_visit_at timestamptz,
  days_since_last int,
  lifetime_value_cents bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      a.customer_id,
      COUNT(*) FILTER (WHERE a.status = 'completed') AS completed_count,
      MAX(a.start_at) FILTER (WHERE a.status = 'completed') AS last_visit_at,
      SUM(a.total_cents) FILTER (WHERE a.status = 'completed') AS lifetime_value_cents,
      BOOL_OR(a.start_at > now() AND a.status IN ('booked', 'confirmed')) AS has_future
    FROM appointments a
    WHERE a.customer_id IS NOT NULL
    GROUP BY a.customer_id
  )
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    agg.completed_count,
    agg.last_visit_at,
    EXTRACT(DAY FROM (now() - agg.last_visit_at))::int AS days_since_last,
    COALESCE(agg.lifetime_value_cents, 0)
  FROM agg
  JOIN customers c ON c.id = agg.customer_id
  WHERE agg.completed_count >= p_min_visits
    AND agg.last_visit_at IS NOT NULL
    AND agg.last_visit_at < (now() - make_interval(days => p_days_silent))
    AND COALESCE(agg.has_future, false) = false
  ORDER BY agg.lifetime_value_cents DESC NULLS LAST, agg.last_visit_at ASC
  LIMIT 50;
END $$;

GRANT EXECUTE ON FUNCTION fn_customers_at_risk(int, int) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────
-- Stats range: aggregated metrics for the date range, returned as JSON
-- so the frontend can pick what it needs without N+1 round-trips.
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_admin_stats_range(
  p_from date,
  p_to date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from timestamptz := p_from::timestamptz;
  v_to timestamptz := (p_to + 1)::timestamptz; -- inclusive end
  v_result jsonb;
  v_revenue_by_day jsonb;
  v_top_services jsonb;
  v_top_staff jsonb;
  v_no_show_rate numeric;
  v_total_completed int;
  v_total_noshow int;
  v_total_revenue_cents bigint;
  v_new_customers int;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(jsonb_build_object('day', day, 'revenue_cents', revenue_cents) ORDER BY day)
    INTO v_revenue_by_day
  FROM (
    SELECT
      (start_at AT TIME ZONE 'Europe/Rome')::date AS day,
      SUM(total_cents) AS revenue_cents
    FROM appointments
    WHERE start_at >= v_from AND start_at < v_to
      AND status = 'completed'
    GROUP BY 1
  ) t;

  SELECT jsonb_agg(jsonb_build_object(
    'service_id', service_id,
    'service_name', service_name,
    'count', cnt,
    'revenue_cents', revenue_cents
  ) ORDER BY revenue_cents DESC)
    INTO v_top_services
  FROM (
    SELECT
      s.id AS service_id,
      s.name AS service_name,
      COUNT(*) AS cnt,
      SUM(a.total_cents) AS revenue_cents
    FROM appointments a
    JOIN appointment_services aps ON aps.appointment_id = a.id
    JOIN services s ON s.id = aps.service_id
    WHERE a.start_at >= v_from AND a.start_at < v_to AND a.status = 'completed'
    GROUP BY s.id, s.name
    ORDER BY revenue_cents DESC NULLS LAST
    LIMIT 5
  ) t;

  SELECT jsonb_agg(jsonb_build_object(
    'staff_id', staff_id,
    'staff_name', staff_name,
    'count', cnt,
    'revenue_cents', revenue_cents
  ) ORDER BY cnt DESC)
    INTO v_top_staff
  FROM (
    SELECT
      s.id AS staff_id,
      s.name AS staff_name,
      COUNT(*) AS cnt,
      SUM(a.total_cents) AS revenue_cents
    FROM appointments a
    JOIN staff s ON s.id = a.staff_id
    WHERE a.start_at >= v_from AND a.start_at < v_to AND a.status = 'completed'
    GROUP BY s.id, s.name
    ORDER BY cnt DESC
    LIMIT 5
  ) t;

  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'no_show'),
    COALESCE(SUM(total_cents) FILTER (WHERE status = 'completed'), 0)
  INTO v_total_completed, v_total_noshow, v_total_revenue_cents
  FROM appointments
  WHERE start_at >= v_from AND start_at < v_to;

  v_no_show_rate := CASE
    WHEN (v_total_completed + v_total_noshow) > 0
    THEN ROUND(v_total_noshow::numeric * 100 / (v_total_completed + v_total_noshow), 1)
    ELSE 0
  END;

  SELECT COUNT(*) INTO v_new_customers
  FROM customers
  WHERE created_at >= v_from AND created_at < v_to;

  v_result := jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'total_completed', v_total_completed,
    'total_noshow', v_total_noshow,
    'total_revenue_cents', v_total_revenue_cents,
    'no_show_rate_pct', v_no_show_rate,
    'new_customers', v_new_customers,
    'revenue_by_day', COALESCE(v_revenue_by_day, '[]'::jsonb),
    'top_services', COALESCE(v_top_services, '[]'::jsonb),
    'top_staff', COALESCE(v_top_staff, '[]'::jsonb)
  );

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION fn_admin_stats_range(date, date) TO authenticated;
