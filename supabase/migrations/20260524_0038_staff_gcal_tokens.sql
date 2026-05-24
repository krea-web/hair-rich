-- Hair Rich · Staff Google Calendar OAuth tokens (#52)
--
-- One row per staff member that opted-in. The OAuth refresh_token is
-- the durable secret — we keep access_token only for the lifetime of
-- the current API session and refresh on demand.
--
-- gcal_event_id on appointments lets the sync function update / cancel
-- the mirror event when the appointment changes.

CREATE TABLE IF NOT EXISTS staff_gcal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL UNIQUE REFERENCES staff(id) ON DELETE CASCADE,
  google_user_id text,
  google_email text,
  -- Encrypted at rest by Supabase storage. We persist both because the
  -- access_token is short-lived (~1h) and we refresh it inside the sync
  -- Edge Function before each batch.
  refresh_token text NOT NULL,
  access_token text,
  access_token_expires_at timestamptz,
  -- Calendar ID to push events into (defaults to "primary"). The same
  -- calendar is monitored for inbound "busy" events.
  calendar_id text NOT NULL DEFAULT 'primary',
  -- Sync state for incremental polls.
  sync_token text,
  last_full_sync_at timestamptz,
  last_incremental_sync_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  scopes text[] NOT NULL DEFAULT ARRAY['https://www.googleapis.com/auth/calendar.events']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS staff_gcal_tokens_updated ON staff_gcal_tokens;
CREATE TRIGGER staff_gcal_tokens_updated BEFORE UPDATE ON staff_gcal_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS gcal_event_id text,
  ADD COLUMN IF NOT EXISTS gcal_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS appointments_gcal_idx
  ON appointments (gcal_event_id) WHERE gcal_event_id IS NOT NULL;

-- Inbound "busy" events created by the staff in their personal calendar
-- and pulled into time_off. We tag them with their Gcal event ID so
-- subsequent syncs can update / delete the matching time_off row.
ALTER TABLE time_off
  ADD COLUMN IF NOT EXISTS gcal_event_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin'
    CHECK (source IN ('admin','gcal','system'));

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS staff_gcal_sync_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN salon_settings.staff_gcal_sync_enabled IS
  'Master flag for the staff Google Calendar bidirectional sync. Default off; staff member must individually OAuth before sync activates.';

-- RLS
ALTER TABLE staff_gcal_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all staff_gcal_tokens" ON staff_gcal_tokens;
CREATE POLICY "admin all staff_gcal_tokens" ON staff_gcal_tokens
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
