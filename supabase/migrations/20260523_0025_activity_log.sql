-- Hair Rich · Activity Log (audit trail)
--
-- Generic Postgres-trigger-based audit log. Every INSERT/UPDATE/DELETE on
-- a critical table flows through fn_activity_log_trigger() which captures
-- before/after snapshots, computes a field-level diff, and writes a row to
-- activity_log. Read by /admin/log.
--
-- To bypass logging (e.g. bulk migrations, system cron jobs), set the
-- session var: `SET LOCAL hair_rich.suppress_activity_log = 'on';`

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),

  category text NOT NULL,                     -- 'appointments','customers','catalog','staff','payments','marketing','system','media'
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  table_name text NOT NULL,
  row_id uuid,

  actor_id uuid,                              -- auth.uid()
  actor_email text,
  actor_role text,                            -- 'admin', 'customer', 'staff', 'system', 'anon'

  before_data jsonb,
  after_data jsonb,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {col: {from, to}} only changed fields

  ip inet,
  user_agent text,
  notes text
);

CREATE INDEX IF NOT EXISTS activity_log_occurred_idx ON activity_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_category_idx ON activity_log (category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_table_row_idx ON activity_log (table_name, row_id);
CREATE INDEX IF NOT EXISTS activity_log_actor_idx ON activity_log (actor_id, occurred_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS activity_log_priority_idx ON activity_log (priority, occurred_at DESC) WHERE priority IN ('high', 'critical');

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Admin reads everything; no one updates or deletes (immutable).
DROP POLICY IF EXISTS "admin reads activity_log" ON activity_log;
CREATE POLICY "admin reads activity_log" ON activity_log
  FOR SELECT USING (is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Generic trigger function. TG_ARGV[0] = category, TG_ARGV[1] = priority.
-- Noise columns (updated_at, last_used_at, usage_count, ...) are stripped
-- from before/after before diffing so timestamp-only touches don't spam.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_activity_log_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_category text := COALESCE(TG_ARGV[0], 'system');
  v_priority text := COALESCE(TG_ARGV[1], 'normal');
  v_action text;
  v_row_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_diff jsonb;
  v_actor uuid;
  v_email text;
  v_role text;
  v_noise text[] := ARRAY['updated_at', 'last_used_at', 'usage_count'];
BEGIN
  -- Honour the per-session bypass switch (set by bulk-load or cron jobs).
  IF current_setting('hair_rich.suppress_activity_log', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_actor := auth.uid();

  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_after := to_jsonb(NEW) - v_noise;
    v_row_id := (to_jsonb(NEW)->>'id')::uuid;
    v_diff := v_after;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_before := to_jsonb(OLD) - v_noise;
    v_after := to_jsonb(NEW) - v_noise;
    v_row_id := (to_jsonb(NEW)->>'id')::uuid;

    SELECT COALESCE(jsonb_object_agg(key, jsonb_build_object('from', v_before->key, 'to', v_after->key)), '{}'::jsonb)
    INTO v_diff
    FROM jsonb_each(v_after) AS e(key, value)
    WHERE v_before->key IS DISTINCT FROM v_after->key;

    -- No material change → skip log row.
    IF v_diff = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_before := to_jsonb(OLD) - v_noise;
    v_row_id := (to_jsonb(OLD)->>'id')::uuid;
    v_diff := v_before;
  END IF;

  IF v_actor IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
    IF EXISTS (SELECT 1 FROM admins WHERE user_id = v_actor) THEN
      v_role := 'admin';
    ELSIF EXISTS (SELECT 1 FROM customers WHERE user_id = v_actor) THEN
      v_role := 'customer';
    ELSE
      v_role := 'authenticated';
    END IF;
  ELSE
    v_role := 'system';
  END IF;

  INSERT INTO activity_log (
    category, action, priority, table_name, row_id,
    actor_id, actor_email, actor_role,
    before_data, after_data, diff
  ) VALUES (
    v_category, v_action, v_priority, TG_TABLE_NAME, v_row_id,
    v_actor, v_email, v_role,
    v_before, v_after, v_diff
  );

  RETURN COALESCE(NEW, OLD);
END$$;

COMMENT ON FUNCTION fn_activity_log_trigger() IS
  'Generic audit-log trigger. Attach with: CREATE TRIGGER ... EXECUTE FUNCTION fn_activity_log_trigger(category, priority);';

-- ─────────────────────────────────────────────────────────────────────────
-- Attach triggers to critical tables.
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r record;
  triggers text[][] := ARRAY[
    -- table              category         priority
    ['appointments',      'appointments',  'high'],
    ['appointment_services', 'appointments', 'normal'],
    ['customers',         'customers',     'normal'],
    ['services',          'catalog',       'high'],
    ['products',          'catalog',       'high'],
    ['coupons',           'catalog',       'high'],
    ['coupon_redemptions', 'catalog',      'normal'],
    ['portfolio_images',  'catalog',       'normal'],
    ['staff',             'staff',         'high'],
    ['staff_services',    'staff',         'normal'],
    ['working_hours',     'staff',         'normal'],
    ['time_off',          'staff',         'normal'],
    ['orders',            'payments',      'high'],
    ['order_items',       'payments',      'normal'],
    ['reviews',           'marketing',     'high'],
    ['salon_settings',    'system',        'high'],
    ['skills_config',     'system',        'high'],
    ['cms_blocks',        'system',        'high'],
    ['appointment_photos', 'media',        'normal']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(triggers, 1) LOOP
    -- Skip silently if the target table does not exist in this environment.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = triggers[i][1]
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_activity_log ON %I;',
      triggers[i][1]
    );
    EXECUTE format(
      'CREATE TRIGGER trg_activity_log AFTER INSERT OR UPDATE OR DELETE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION fn_activity_log_trigger(%L, %L);',
      triggers[i][1], triggers[i][2], triggers[i][3]
    );
  END LOOP;
END$$;
