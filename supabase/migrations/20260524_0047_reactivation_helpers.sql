-- Hair Rich · Chat 3 · Reactivation candidates RPC (Task 12)
--
-- Service-role variant of fn_customers_at_risk that:
--   • requires marketing_consent
--   • respects per-customer 60-day cooldown via notifications_sent
--   • limits batch size

CREATE OR REPLACE FUNCTION fn_reactivation_candidates(
  p_min_visits int DEFAULT 2,
  p_days_silent int DEFAULT 90,
  p_cooldown_days int DEFAULT 60,
  p_limit int DEFAULT 40
) RETURNS TABLE (
  customer_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  completed_count bigint,
  last_visit_at timestamptz,
  days_since_last int,
  lifetime_value_cents bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
  ),
  recent_sends AS (
    SELECT recipient_id, MAX(sent_at) AS last_sent_at
      FROM notifications_sent
     WHERE recipient_type = 'customer'
       AND event_type = 'reactivation'
     GROUP BY recipient_id
  )
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    agg.completed_count,
    agg.last_visit_at,
    EXTRACT(DAY FROM (now() - agg.last_visit_at))::int AS days_since_last,
    COALESCE(agg.lifetime_value_cents, 0)
  FROM agg
  JOIN customers c ON c.id = agg.customer_id
  LEFT JOIN recent_sends rs ON rs.recipient_id = c.id
  WHERE agg.completed_count >= p_min_visits
    AND agg.last_visit_at IS NOT NULL
    AND agg.last_visit_at < (now() - make_interval(days => p_days_silent))
    AND COALESCE(agg.has_future, false) = false
    AND COALESCE(c.marketing_consent, false) = true
    AND c.is_guest = false
    AND (rs.last_sent_at IS NULL OR rs.last_sent_at < now() - make_interval(days => p_cooldown_days))
  ORDER BY agg.lifetime_value_cents DESC NULLS LAST, agg.last_visit_at ASC
  LIMIT p_limit;
END $$;

GRANT EXECUTE ON FUNCTION fn_reactivation_candidates(int, int, int, int) TO service_role;
