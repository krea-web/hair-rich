-- Hair Rich · Chat 2 task 5: packages, surveys, push subs, no-show outreach
--
-- One migration, five concerns. They share a common pattern (admin-driven
-- ops on customer-owned records) so it's cheaper to ship them together
-- than to fan out five thin files. RLS is consistent: customer can read
-- their own rows; admins can do everything.

-- ─────────────── Service Packages (#43) ──────────────────────────────
-- Catalog of pre-paid bundles ("5 tagli a tariffa scontata"). No Stripe:
-- payment captured in-salon, recorded on the sale row.
CREATE TABLE IF NOT EXISTS service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  -- Pricing: total bundle cost and the inferred per-credit cost so
  -- BookingDrawer can show "Risparmi €X" at redemption time.
  total_price_cents int NOT NULL CHECK (total_price_cents >= 0),
  credits int NOT NULL CHECK (credits > 0),
  -- Optional restriction: which services can burn a credit. NULL means
  -- "any service the catalog has".
  eligible_service_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  validity_days int NOT NULL DEFAULT 180,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS service_packages_updated_at ON service_packages;
CREATE TRIGGER service_packages_updated_at BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Per-customer purchased pack. credits_remaining is the ledger of truth
-- — decremented at appointment booking via fn_use_package_credit (0036).
CREATE TABLE IF NOT EXISTS customer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE RESTRICT,
  credits_total int NOT NULL CHECK (credits_total > 0),
  credits_remaining int NOT NULL CHECK (credits_remaining >= 0),
  price_paid_cents int NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash','pos','bonifico','omaggio')),
  sold_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sold_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','consumed','expired','refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_packages_active_idx
  ON customer_packages (customer_id, status, expires_at)
  WHERE status = 'active';
DROP TRIGGER IF EXISTS customer_packages_updated_at ON customer_packages;
CREATE TRIGGER customer_packages_updated_at BEFORE UPDATE ON customer_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────── Post-visit Survey (#72) ─────────────────────────────
-- Private NPS-ish signal collected ~2h post completion. Separate from
-- the public Reviews Harvester (#62) so we can route 😞 internally
-- BEFORE the customer parks the negativity on Google.
CREATE TABLE IF NOT EXISTS customer_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_via text NOT NULL DEFAULT 'email'
    CHECK (sent_via IN ('email','telegram','push','sms')),
  responded_at timestamptz,
  -- "happy" | "neutral" | "sad"
  sentiment text CHECK (sentiment IN ('happy','neutral','sad')),
  free_text text,
  -- Whether the owner routed/escalated this signal somewhere
  internal_action_taken text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_surveys_sentiment_idx
  ON customer_surveys (sentiment, responded_at DESC) WHERE sentiment IS NOT NULL;

-- ─────────────── Push subscriptions (#9) ─────────────────────────────
-- One row per browser+device the customer enabled push for. The PushSubscription
-- payload (endpoint + p256dh + auth keys) is stored verbatim — the
-- push-sender Edge Function consumes it via web-push.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  enabled boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_uniq ON push_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS push_subscriptions_customer_idx ON push_subscriptions (customer_id, enabled);
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────── No-show outreach audit (#46) ────────────────────────
-- Append-only record of every "ask for explanation" message the owner
-- sent after a no-show. We never auto-block customers; this table is
-- the human side of the loop.
CREATE TABLE IF NOT EXISTS noshow_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','telegram','whatsapp','sms')),
  message_text text NOT NULL,
  ai_drafted boolean NOT NULL DEFAULT false,
  ai_model text,
  sent_at timestamptz,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_replied_at timestamptz,
  customer_reply_text text,
  outcome text CHECK (outcome IN ('replied','silent','rebooked','blocked_by_customer')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS noshow_outreach_customer_idx
  ON noshow_outreach (customer_id, created_at DESC);

-- ─────────────── salon_settings flag flips ───────────────────────────
ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS packages_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_vapid_public_key text,
  ADD COLUMN IF NOT EXISTS post_visit_survey_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_visit_survey_delay_min int NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS noshow_outreach_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN salon_settings.push_vapid_public_key IS
  'Public VAPID key clients use to subscribe via PushManager.subscribe(). Private key lives only in Supabase secrets.';

-- ─────────────── RLS ─────────────────────────────────────────────────
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE noshow_outreach ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read packages" ON service_packages;
CREATE POLICY "public read packages" ON service_packages
  FOR SELECT USING (is_active);

DROP POLICY IF EXISTS "admin all packages" ON service_packages;
CREATE POLICY "admin all packages" ON service_packages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customer read own packages" ON customer_packages;
CREATE POLICY "customer read own packages" ON customer_packages
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin all customer packages" ON customer_packages;
CREATE POLICY "admin all customer packages" ON customer_packages
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customer read own surveys" ON customer_surveys;
CREATE POLICY "customer read own surveys" ON customer_surveys
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin all surveys" ON customer_surveys;
CREATE POLICY "admin all surveys" ON customer_surveys
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Surveys are answered anonymously via token; token holders patch their own row.
DROP POLICY IF EXISTS "token holder updates own survey" ON customer_surveys;
CREATE POLICY "token holder updates own survey" ON customer_surveys
  FOR UPDATE USING (true) WITH CHECK (responded_at IS NOT NULL);

DROP POLICY IF EXISTS "customer manage own push subs" ON push_subscriptions;
CREATE POLICY "customer manage own push subs" ON push_subscriptions
  FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "admin all push subs" ON push_subscriptions;
CREATE POLICY "admin all push subs" ON push_subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin all noshow outreach" ON noshow_outreach;
CREATE POLICY "admin all noshow outreach" ON noshow_outreach
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
