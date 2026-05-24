-- Hair Rich · Chat 3 · Last-minute promo audience RPC (Task 14)
--
-- Targets only "clienti abituali" per CLAUDE.md mitigations:
--   • >=3 completed visits in last 180 days
--   • marketing_consent=true
--   • max 1 last_minute_promo coupon already issued in last 30 days
--   • no last-minute promo already received in last 30 days
-- Ordered by lifetime value desc.

CREATE OR REPLACE FUNCTION fn_last_minute_promo_audience(p_limit int DEFAULT 25)
RETURNS TABLE (
  customer_id uuid,
  first_name text,
  visits_180d bigint,
  lifetime_value_cents bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      c.id,
      c.first_name,
      c.marketing_consent,
      c.is_guest,
      count(*) FILTER (
        WHERE a.status = 'completed'
          AND a.start_at > now() - interval '180 days'
      ) AS visits_180d,
      coalesce(sum(a.total_cents) FILTER (WHERE a.status = 'completed'), 0) AS ltv
    FROM customers c
    LEFT JOIN appointments a ON a.customer_id = c.id
    GROUP BY c.id, c.first_name, c.marketing_consent, c.is_guest
  ),
  recent_promos AS (
    SELECT issued_to_customer_id, max(created_at) AS last_promo_at
      FROM coupons
     WHERE origin = 'last_minute'
       AND issued_to_customer_id IS NOT NULL
       AND created_at > now() - interval '30 days'
     GROUP BY issued_to_customer_id
  )
  SELECT b.id, b.first_name, b.visits_180d, b.ltv
    FROM base b
    LEFT JOIN recent_promos rp ON rp.issued_to_customer_id = b.id
   WHERE b.visits_180d >= 3
     AND COALESCE(b.marketing_consent, false) = true
     AND b.is_guest = false
     AND rp.last_promo_at IS NULL
   ORDER BY b.ltv DESC, b.visits_180d DESC
   LIMIT p_limit;
END $$;

GRANT EXECUTE ON FUNCTION fn_last_minute_promo_audience(int) TO service_role, authenticated;
