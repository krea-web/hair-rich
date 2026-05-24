-- Hair Rich · Chat 3 · Birthday helpers
--
-- Lightweight RPCs + cms_blocks templates for the birthday cron (Task 11)
-- and reactivation cron (Task 12). All gated by skills_config inside the
-- Edge Functions themselves.

CREATE OR REPLACE FUNCTION fn_customers_birthday_today()
RETURNS TABLE (id uuid, first_name text, birthdate date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.first_name, c.birthdate
    FROM customers c
   WHERE c.birthdate IS NOT NULL
     AND extract(month from c.birthdate) = extract(month from CURRENT_DATE)
     AND extract(day from c.birthdate)   = extract(day from CURRENT_DATE)
     AND c.is_guest = false
     AND COALESCE(c.marketing_consent, false) = true;
$$;

GRANT EXECUTE ON FUNCTION fn_customers_birthday_today() TO service_role;

-- ────────── Note: cms_blocks templates are seeded in 0051 with the
--           correct (key, label, value, kind) schema. ─────────────────
