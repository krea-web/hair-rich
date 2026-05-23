-- Hair Rich · salon_settings waitlist config
--
-- Chat 2 patch on top of 0030. Atomic ALTER, no overlap with the
-- Router config columns added by 0028 (Chat 1) or any future Chat 3
-- ALTER TABLE.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS waitlist_soft_reserve_min_hours numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS waitlist_max_per_customer int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS waitlist_max_ghosts int NOT NULL DEFAULT 3;

COMMENT ON COLUMN salon_settings.waitlist_enabled IS
  'Master flag: when false, BookingDrawer hides the "join waitlist" CTA and the matcher cron skips processing.';
COMMENT ON COLUMN salon_settings.waitlist_soft_reserve_min_hours IS
  'If a cancellation lands within this many hours of the slot, we do not notify the waitlist (no useful lead-time).';
COMMENT ON COLUMN salon_settings.waitlist_max_per_customer IS
  'Max concurrent waitlist entries one customer can hold open. Anti-spam.';
COMMENT ON COLUMN salon_settings.waitlist_max_ghosts IS
  'Consecutive missed notifications before the waitlist entry is auto-cancelled as ghosted.';
