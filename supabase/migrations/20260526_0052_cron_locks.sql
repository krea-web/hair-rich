-- Hair Rich · Cron idempotency locks
--
-- A small ledger that prevents the same cron from running twice for the
-- same period. Each cron picks a "period_key" granularity (daily,
-- weekly, 15min, etc.) and calls fn_try_acquire_cron_lock at startup:
-- if the lock is acquired (newly inserted row) the cron proceeds;
-- otherwise it returns silently and exits.
--
-- Why this matters: Supabase scheduled functions can re-fire on retry
-- (network timeout, instance restart, deploy overlap). Without a lock,
-- cron jobs that emit notifications can double-send.

CREATE TABLE IF NOT EXISTS cron_locks (
  name text NOT NULL,
  period_key text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  succeeded boolean,
  notes text,
  PRIMARY KEY (name, period_key)
);

CREATE INDEX IF NOT EXISTS cron_locks_recent_idx
  ON cron_locks (name, acquired_at DESC);

ALTER TABLE cron_locks ENABLE ROW LEVEL SECURITY;

-- Admin reads everything; no one writes via REST — only the RPC below.
DROP POLICY IF EXISTS "admin reads cron_locks" ON cron_locks;
CREATE POLICY "admin reads cron_locks" ON cron_locks
  FOR SELECT USING (is_admin());

-- Atomic acquire. Returns true on first call for the (name, period_key)
-- tuple; subsequent calls return false. Uses INSERT ... ON CONFLICT to
-- avoid race conditions when two cron invocations overlap.
CREATE OR REPLACE FUNCTION fn_try_acquire_cron_lock(
  p_name text,
  p_period_key text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inserted boolean;
BEGIN
  INSERT INTO cron_locks (name, period_key)
  VALUES (p_name, p_period_key)
  ON CONFLICT (name, period_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END$$;

GRANT EXECUTE ON FUNCTION fn_try_acquire_cron_lock(text, text) TO service_role;

-- Mark a previously-acquired lock as completed (success or failure).
-- Optional — useful for the health dashboard to surface "last run
-- succeeded YYYY-MM-DD HH:MM" per cron.
CREATE OR REPLACE FUNCTION fn_release_cron_lock(
  p_name text,
  p_period_key text,
  p_succeeded boolean,
  p_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE cron_locks
     SET released_at = now(),
         succeeded = p_succeeded,
         notes = p_notes
   WHERE name = p_name AND period_key = p_period_key;
END$$;

GRANT EXECUTE ON FUNCTION fn_release_cron_lock(text, text, boolean, text) TO service_role;

-- Housekeeping: keep only the last 90 days of locks. Optional, can be
-- run on demand or by a separate cron.
CREATE OR REPLACE FUNCTION fn_prune_cron_locks() RETURNS int
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH deleted AS (
    DELETE FROM cron_locks
     WHERE acquired_at < now() - interval '90 days'
     RETURNING 1
  )
  SELECT COUNT(*)::int FROM deleted;
$$;

GRANT EXECUTE ON FUNCTION fn_prune_cron_locks() TO service_role;
