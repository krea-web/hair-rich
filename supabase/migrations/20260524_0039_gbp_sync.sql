-- Hair Rich · Google Business Profile token + sync metadata (#83)
--
-- Owner-side OAuth: one token for the whole salon. Lets the
-- gbp-hours-sync cron push working_hours + time_off windows to the
-- public Google Business Profile so search-shoppers never find the
-- shop "open" when it's actually closed.
--
-- Singleton constraint mirrors salon_settings: one row per business.

CREATE TABLE IF NOT EXISTS salon_gbp_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton boolean NOT NULL DEFAULT true,
  google_email text,
  refresh_token text NOT NULL,
  access_token text,
  access_token_expires_at timestamptz,
  -- e.g. "accounts/1234/locations/5678" — discovered post-OAuth.
  account_id text,
  location_id text,
  last_hours_pushed_at timestamptz,
  last_special_hours_pushed_at timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salon_gbp_tokens_singleton CHECK (is_singleton)
);
CREATE UNIQUE INDEX IF NOT EXISTS salon_gbp_tokens_singleton_uniq
  ON salon_gbp_tokens ((is_singleton)) WHERE is_singleton;

DROP TRIGGER IF EXISTS salon_gbp_tokens_updated ON salon_gbp_tokens;
CREATE TRIGGER salon_gbp_tokens_updated BEFORE UPDATE ON salon_gbp_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS gbp_hours_sync_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE salon_gbp_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all gbp tokens" ON salon_gbp_tokens;
CREATE POLICY "admin all gbp tokens" ON salon_gbp_tokens
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
