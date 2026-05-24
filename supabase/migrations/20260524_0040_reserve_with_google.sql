-- Hair Rich · Reserve with Google partner integration (#19)
--
-- Google Maps "Prenota" button on the Business Profile maps to a
-- merchant booking server. This migration tracks the link between
-- Hair Rich appointment rows and the RWG booking_id Google issues
-- when a slot is confirmed via the partner program.
--
-- The actual partner approval is external (1-2 weeks review); this
-- migration prepares the schema + flags so the rwg-booking-server
-- Edge Function can go live the moment Google flips the switch.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS rwg_booking_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS rwg_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS appointments_rwg_idx
  ON appointments (rwg_booking_id) WHERE rwg_booking_id IS NOT NULL;

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS rwg_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rwg_merchant_id text,
  ADD COLUMN IF NOT EXISTS rwg_partner_token_hash text;

COMMENT ON COLUMN salon_settings.rwg_partner_token_hash IS
  'SHA-256 hash of the shared secret Google signs partner requests with. Validate request.headers.authorization against this.';
