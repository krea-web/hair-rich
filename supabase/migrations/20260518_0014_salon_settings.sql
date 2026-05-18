-- Hair Rich · Salon settings (singleton)
-- Centralizes brand contact info + booking policy so the public site can
-- read it at runtime and the admin can edit it without a code deploy.

CREATE TABLE IF NOT EXISTS salon_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton boolean NOT NULL DEFAULT true,

  display_name text NOT NULL DEFAULT 'Hair Rich Olbia',
  phone text,
  whatsapp text,
  email text,
  address text,
  city text,
  province text,
  postal_code text,
  lat double precision,
  lng double precision,

  -- Booking policy
  booking_lead_time_min int NOT NULL DEFAULT 60,           -- minutes from now before earliest bookable slot
  booking_lead_time_max_days int NOT NULL DEFAULT 60,      -- furthest-out bookable day
  cancel_min_hours int NOT NULL DEFAULT 4,                 -- min hours before start to allow self-cancel
  no_show_threshold int NOT NULL DEFAULT 2,                -- no-shows before deposit required
  slot_step_min int NOT NULL DEFAULT 30,                   -- booking engine step granularity

  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salon_settings_singleton CHECK (is_singleton)
);

CREATE UNIQUE INDEX IF NOT EXISTS salon_settings_singleton_uniq
  ON salon_settings ((is_singleton)) WHERE is_singleton;

ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read salon_settings" ON salon_settings;
CREATE POLICY "public read salon_settings" ON salon_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin all salon_settings" ON salon_settings;
CREATE POLICY "admin all salon_settings" ON salon_settings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Seed default row (no-op if already present thanks to the unique index)
INSERT INTO salon_settings (display_name, phone, email, address, city, province)
SELECT 'Hair Rich Olbia', '+39 333 1234567', 'info@hairrich.it', 'Via Roma 1', 'Olbia', 'SS'
WHERE NOT EXISTS (SELECT 1 FROM salon_settings);

-- Keep updated_at fresh on every update
DROP TRIGGER IF EXISTS trg_salon_settings_updated ON salon_settings;
CREATE TRIGGER trg_salon_settings_updated
  BEFORE UPDATE ON salon_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
