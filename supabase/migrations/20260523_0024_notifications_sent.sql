-- Hair Rich · Notification Router audit log
--
-- Every message the Router emits — to a customer or to the owner — lands
-- here. Provides:
--   • idempotency: Router checks for prior send before retrying
--   • dedup across channels: "don't push if already emailed for same event"
--   • engagement tracking: opened_at, clicked_at, delivered_at
--   • debugging: full payload and provider IDs
--   • compliance audit: who got what when, on which channel

CREATE TABLE IF NOT EXISTS notifications_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  recipient_type text NOT NULL CHECK (recipient_type IN ('customer', 'owner', 'staff')),
  recipient_id uuid,                          -- customers.id / staff.id; null for owner Telegram
  recipient_address text,                     -- denormalized email/phone/chat_id for audit

  event_type text NOT NULL,                   -- 'appointment_reminder', 'waitlist_match', 'birthday', ...
  related_id uuid,                            -- appointment.id, coupon.id, etc — context for dedup
  related_type text,                          -- 'appointment', 'coupon', 'waitlist', ...

  channel text NOT NULL CHECK (channel IN ('whatsapp', 'push', 'email', 'sms', 'telegram')),

  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
  )),
  error text,                                 -- populated on status='failed'/'bounced'

  subject text,                               -- for email; null for other channels
  body_preview text,                          -- first 200 chars for audit search
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, -- full template vars + final rendered body

  provider text,                              -- 'gmail', 'twilio', 'whatsapp_cloud', 'telegram', 'web_push'
  provider_message_id text,                   -- external ID for delivery webhooks

  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,

  -- Optional source skill (matches skills_config.skill_key) — useful for the
  -- Skills Hub usage_count rollup.
  source_skill text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hot path: "have we already sent eventType X for related_id Y to recipient Z?"
CREATE INDEX IF NOT EXISTS notifications_sent_dedup_idx
  ON notifications_sent (recipient_type, recipient_id, event_type, related_id)
  WHERE status IN ('sent', 'delivered', 'opened', 'clicked');

-- Admin feed: most-recent-first by recipient
CREATE INDEX IF NOT EXISTS notifications_sent_recipient_idx
  ON notifications_sent (recipient_type, recipient_id, sent_at DESC);

-- Per-skill usage rollup
CREATE INDEX IF NOT EXISTS notifications_sent_skill_idx
  ON notifications_sent (source_skill, sent_at DESC)
  WHERE source_skill IS NOT NULL;

-- Delivery-webhook lookup
CREATE INDEX IF NOT EXISTS notifications_sent_provider_msg_idx
  ON notifications_sent (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- Customers can read their own messages (engagement transparency)
DROP POLICY IF EXISTS "customer reads own notifications" ON notifications_sent;
CREATE POLICY "customer reads own notifications" ON notifications_sent
  FOR SELECT USING (
    recipient_type = 'customer'
    AND recipient_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Admin sees and writes everything
DROP POLICY IF EXISTS "admin all notifications_sent" ON notifications_sent;
CREATE POLICY "admin all notifications_sent" ON notifications_sent
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- The Router runs with the service role key (Edge Function) so RLS is
-- bypassed for writes. No service_role-specific policy needed.

COMMENT ON TABLE notifications_sent IS
  'Audit log of every Router send. Read by Router before send for cross-channel dedup.';
COMMENT ON INDEX notifications_sent_dedup_idx IS
  'Lookup index for "already sent?" dedup checks. Partial: only successful sends count.';
