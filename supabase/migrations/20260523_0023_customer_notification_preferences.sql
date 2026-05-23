-- Hair Rich · Per-customer notification preferences
--
-- Adds a JSONB column to customers that the Notification Router reads to
-- decide channel + ordering for each event category. When empty/null the
-- Router falls back to salon_settings.notification_channel_priority.
--
-- Expected shape (all keys optional):
-- {
--   "mode": "smart" | "manual",
--   "channels": {
--     "appointment_reminders": ["whatsapp","push","email"],
--     "marketing":             ["email"],
--     "birthday":              ["whatsapp","email"],
--     "waitlist":              ["whatsapp","push","email"],
--     "review_request":        ["email"],
--     "post_visit_survey":     ["email"],
--     "package_expiry":        ["whatsapp","email"]
--   },
--   "quiet_hours": { "start": "22:00", "end": "08:00", "tz": "Europe/Rome" },
--   "opt_out": ["marketing"]
-- }
--
-- "smart" mode (default): Router picks the best channel using the global
-- hierarchy + customer reachability (opted-in to WA? has push sub? has email?).
-- "manual" mode: Router honours the channels[category] array verbatim.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Light shape guard: must be a JSON object, and `mode` (if present) must be
-- one of the two known values. Anything else is rejected at insert/update.
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_notification_preferences_shape;
ALTER TABLE customers ADD CONSTRAINT customers_notification_preferences_shape CHECK (
  jsonb_typeof(notification_preferences) = 'object'
  AND (
    NOT (notification_preferences ? 'mode')
    OR notification_preferences->>'mode' IN ('smart', 'manual')
  )
);

CREATE INDEX IF NOT EXISTS customers_notif_prefs_idx
  ON customers USING gin (notification_preferences);

-- Mirror on salon_settings: global channel priority hierarchy used as the
-- fallback when a customer has no per-category override. Stored as a JSONB
-- array of channel ids in priority order, e.g. ["whatsapp","push","email","sms"].
ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS notification_channel_priority jsonb NOT NULL
  DEFAULT '["whatsapp","push","email","sms"]'::jsonb;

ALTER TABLE salon_settings DROP CONSTRAINT IF EXISTS salon_settings_channel_priority_shape;
ALTER TABLE salon_settings ADD CONSTRAINT salon_settings_channel_priority_shape CHECK (
  jsonb_typeof(notification_channel_priority) = 'array'
);

COMMENT ON COLUMN customers.notification_preferences IS
  'Notification Router reads this to pick channel/order per event category. See migration 0023 for shape.';
COMMENT ON COLUMN salon_settings.notification_channel_priority IS
  'Global channel hierarchy used as fallback when customer has no per-category override.';
