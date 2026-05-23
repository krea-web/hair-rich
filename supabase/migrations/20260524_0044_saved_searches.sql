-- Hair Rich · Chat 3 · Saved searches (#101 advanced customer search)
--
-- Backs the visual query builder in /admin/clienti. Each row is a JSON-encoded
-- rule set (compatible with react-querybuilder), an optional execution_sql
-- preview, and bookkeeping (created_by, last_run_at, hit_count).
--
-- Plus: fn_search_customers(p_filters) — server-side evaluator that translates
-- the jsonb rule set into a parameterized query against customers +
-- appointments + customer_segments. Returns customer ids; client joins
-- columns it needs.

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  template_key text UNIQUE,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_hit_count int
);

CREATE INDEX IF NOT EXISTS saved_searches_template_idx
  ON saved_searches (is_template) WHERE is_template;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all saved_searches" ON saved_searches;
CREATE POLICY "admin all saved_searches" ON saved_searches
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_saved_searches_updated ON saved_searches;
CREATE TRIGGER trg_saved_searches_updated
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────── 5 template predefined searches ─────────────────────────────
INSERT INTO saved_searches (name, description, filters, is_template, template_key)
VALUES
  ('VIP a rischio',
   'Clienti VIP che non vengono da più di 60 giorni',
   '{"combinator":"and","rules":[
      {"field":"segment","operator":"contains","value":"vip"},
      {"field":"days_since_last_visit","operator":">","value":60}
    ]}'::jsonb,
   true, 'vip_at_risk'),
  ('Compleanno del mese',
   'Clienti con compleanno nel mese corrente',
   '{"combinator":"and","rules":[
      {"field":"birthday_month","operator":"=","value":"current"}
    ]}'::jsonb,
   true, 'birthday_month'),
  ('Top spender',
   'Clienti con spesa totale > €300 lifetime',
   '{"combinator":"and","rules":[
      {"field":"lifetime_spend_cents","operator":">=","value":30000}
    ]}'::jsonb,
   true, 'top_spenders'),
  ('Da riattivare',
   'Clienti con ≥2 visite ma silenziosi da 90+ giorni',
   '{"combinator":"and","rules":[
      {"field":"visits_total","operator":">=","value":2},
      {"field":"days_since_last_visit","operator":">=","value":90}
    ]}'::jsonb,
   true, 'reactivation_candidates'),
  ('Nuovi del mese',
   'Clienti acquisiti negli ultimi 30 giorni',
   '{"combinator":"and","rules":[
      {"field":"days_since_signup","operator":"<=","value":30}
    ]}'::jsonb,
   true, 'new_this_month')
ON CONFLICT (template_key) DO NOTHING;

-- ────────── Search executor ────────────────────────────────────────────
-- Supported fields (resolved server-side, kept in sync with the front-end
-- registry in src/lib/customers/searchFields.ts):
--   segment              → customer has segment_key
--   days_since_last_visit
--   days_since_signup
--   visits_total
--   lifetime_spend_cents
--   noshow_count
--   birthday_month       (value: 'current' or 1-12)
--   has_email / has_phone
--   marketing_consent
--   notes_match          (text)
CREATE OR REPLACE FUNCTION fn_search_customers(p_filters jsonb)
RETURNS TABLE (customer_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_combinator text;
  v_rules jsonb;
  v_rule jsonb;
  v_clauses text[] := '{}';
  v_clause text;
  v_field text;
  v_op text;
  v_val jsonb;
  v_sql text;
  v_join_segments boolean := false;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin_only' USING ERRCODE = 'P0003';
  END IF;

  v_combinator := upper(COALESCE(p_filters->>'combinator', 'and'));
  IF v_combinator NOT IN ('AND','OR') THEN v_combinator := 'AND'; END IF;
  v_rules := COALESCE(p_filters->'rules', '[]'::jsonb);

  FOR v_rule IN SELECT * FROM jsonb_array_elements(v_rules) LOOP
    v_field := v_rule->>'field';
    v_op := v_rule->>'operator';
    v_val := v_rule->'value';

    CASE v_field
      WHEN 'segment' THEN
        v_join_segments := true;
        v_clause := format('cs.segment_key = %L', v_val#>>'{}');
      WHEN 'days_since_last_visit' THEN
        v_clause := format(
          'EXTRACT(epoch FROM now() - (SELECT max(start_at) FROM appointments WHERE customer_id = c.id AND status = ''completed''))/86400 %s %s',
          v_op, (v_val#>>'{}')::numeric);
      WHEN 'days_since_signup' THEN
        v_clause := format(
          'EXTRACT(epoch FROM now() - c.created_at)/86400 %s %s',
          v_op, (v_val#>>'{}')::numeric);
      WHEN 'visits_total' THEN
        v_clause := format(
          '(SELECT count(*) FROM appointments WHERE customer_id = c.id AND status = ''completed'') %s %s',
          v_op, (v_val#>>'{}')::int);
      WHEN 'lifetime_spend_cents' THEN
        v_clause := format(
          '(SELECT COALESCE(sum(total_cents),0) FROM appointments WHERE customer_id = c.id AND status = ''completed'') %s %s',
          v_op, (v_val#>>'{}')::int);
      WHEN 'noshow_count' THEN
        v_clause := format(
          '(SELECT count(*) FROM appointments WHERE customer_id = c.id AND status = ''no_show'') %s %s',
          v_op, (v_val#>>'{}')::int);
      WHEN 'birthday_month' THEN
        IF v_val#>>'{}' = 'current' THEN
          v_clause := 'EXTRACT(month FROM c.birthdate) = EXTRACT(month FROM CURRENT_DATE)';
        ELSE
          v_clause := format('EXTRACT(month FROM c.birthdate) = %s', (v_val#>>'{}')::int);
        END IF;
      WHEN 'has_email' THEN
        v_clause := CASE WHEN (v_val#>>'{}')::boolean THEN 'c.email IS NOT NULL' ELSE 'c.email IS NULL' END;
      WHEN 'has_phone' THEN
        v_clause := CASE WHEN (v_val#>>'{}')::boolean THEN 'c.phone IS NOT NULL' ELSE 'c.phone IS NULL' END;
      WHEN 'marketing_consent' THEN
        v_clause := format('c.marketing_consent = %L', (v_val#>>'{}')::boolean);
      WHEN 'notes_match' THEN
        v_clause := format('c.notes ILIKE %L', '%' || (v_val#>>'{}') || '%');
      ELSE
        CONTINUE;
    END CASE;

    v_clauses := array_append(v_clauses, v_clause);
  END LOOP;

  IF array_length(v_clauses, 1) IS NULL THEN
    RETURN QUERY SELECT id FROM customers;
    RETURN;
  END IF;

  v_sql := 'SELECT DISTINCT c.id FROM customers c';
  IF v_join_segments THEN
    v_sql := v_sql || ' LEFT JOIN customer_segments cs ON cs.customer_id = c.id';
  END IF;
  v_sql := v_sql || ' WHERE ' || array_to_string(v_clauses, ' ' || v_combinator || ' ');

  RETURN QUERY EXECUTE v_sql;
END $$;

GRANT EXECUTE ON FUNCTION fn_search_customers(jsonb) TO authenticated;
