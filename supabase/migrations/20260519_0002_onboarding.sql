-- Hair Rich · Onboarding flag
-- Marks whether the initial setup wizard has been completed. The admin
-- layout guards against unconfigured salons by redirecting first.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Existing salons (with phone + email already filled) count as onboarded.
UPDATE salon_settings
   SET onboarding_completed_at = now()
 WHERE onboarding_completed_at IS NULL
   AND phone IS NOT NULL
   AND email IS NOT NULL;
