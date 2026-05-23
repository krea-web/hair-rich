-- Hair Rich · GDPR consent ledger
--
-- Append-only ledger of every consent grant/revoke. Each action writes a NEW
-- row with the policy version, IP, user-agent and optional signed PDF path —
-- this is the GDPR audit trail required by Italian law (Codice Privacy +
-- Reg. UE 2016/679). Current state per (customer, type) is exposed via the
-- view `customer_consents_current`.
--
-- The legacy boolean `customers.marketing_consent` stays in place for
-- backwards compatibility with existing flows but is no longer the source of
-- truth — new code reads from this ledger.

CREATE TABLE IF NOT EXISTS customer_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN (
    'marketing',
    'appointment_reminders',
    'photos_pre_post',
    'profiling',
    'referral_program'
  )),
  granted boolean NOT NULL,
  policy_version text NOT NULL,
  ip_address inet,
  user_agent text,
  signed_pdf_path text,
  source text NOT NULL DEFAULT 'profile_settings' CHECK (source IN (
    'onboarding',
    'profile_settings',
    'admin',
    'booking',
    'import'
  )),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_consents_customer_idx
  ON customer_consents (customer_id, consent_type, created_at DESC);

CREATE INDEX IF NOT EXISTS customer_consents_type_idx
  ON customer_consents (consent_type, created_at DESC);

ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;

-- Customers can see only their own consent history
DROP POLICY IF EXISTS "customer reads own consents" ON customer_consents;
CREATE POLICY "customer reads own consents" ON customer_consents
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Customers can record new consent rows for themselves (grant or revoke)
DROP POLICY IF EXISTS "customer writes own consents" ON customer_consents;
CREATE POLICY "customer writes own consents" ON customer_consents
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Admin sees and writes everything
DROP POLICY IF EXISTS "admin all consents" ON customer_consents;
CREATE POLICY "admin all consents" ON customer_consents
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- No UPDATE or DELETE policies → ledger is immutable. A revoke is recorded
-- as a new row with granted=false; rows are never edited or removed.

-- Current state per (customer, type) = the most recent row.
CREATE OR REPLACE VIEW customer_consents_current AS
SELECT DISTINCT ON (customer_id, consent_type)
  customer_id,
  consent_type,
  granted,
  policy_version,
  source,
  created_at AS effective_at
FROM customer_consents
ORDER BY customer_id, consent_type, created_at DESC;

GRANT SELECT ON customer_consents_current TO anon, authenticated;

COMMENT ON TABLE customer_consents IS
  'GDPR consent ledger — immutable append-only audit trail. Read current state from customer_consents_current view.';
COMMENT ON COLUMN customer_consents.policy_version IS
  'Privacy policy version the customer was shown (e.g. "2026-05-23"). Lets us prove which text they consented to.';
COMMENT ON COLUMN customer_consents.signed_pdf_path IS
  'Optional relative path inside the consents storage bucket where the signed PDF copy is archived.';
