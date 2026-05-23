-- Hair Rich · Notification Router config on salon_settings
--
-- Adds the owner-side delivery target (Telegram chat ID) and the global
-- quiet-hours window the Router uses to defer non-critical messages.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS owner_telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS owner_telegram_extra_chat_ids text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS quiet_hours_start time NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Europe/Rome',
  ADD COLUMN IF NOT EXISTS multi_channel_critical boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN salon_settings.owner_telegram_chat_id IS
  'Primary Telegram chat ID that receives owner alerts. Obtain via @BotFather + /start to your bot.';
COMMENT ON COLUMN salon_settings.owner_telegram_extra_chat_ids IS
  'Additional Telegram chat IDs (delegates, staff) that also receive owner alerts.';
COMMENT ON COLUMN salon_settings.multi_channel_critical IS
  'When true, time-sensitive events (waitlist match <1h) fan out across multiple channels regardless of dedup.';
