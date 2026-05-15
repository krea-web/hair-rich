-- Hair Rich · Initial schema
-- Tables: staff, services, chairs, customers, appointments, reviews, portfolio_images, admins
-- Functions: fn_check_slot_availability, fn_get_admin_dashboard_stats, fn_book_appointment
-- Triggers: updated_at, handle_new_auth_user

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMS
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('booked','confirmed','completed','cancelled','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_source AS ENUM ('app','admin','phone','walkin','widget');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────── STAFF ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'Barber',
  bio text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────── SERVICES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_cents int NOT NULL CHECK (price_cents >= 0),
  duration_min int NOT NULL CHECK (duration_min > 0),
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_services (
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- ─────────────── CHAIRS (postazioni) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS chairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

-- ─────────────── WORKING HOURS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NULL REFERENCES staff(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time)
);

-- ─────────────── TIME OFF ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NULL REFERENCES staff(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  CHECK (ends_at > starts_at)
);

-- ─────────────── CUSTOMERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  is_guest boolean NOT NULL DEFAULT false,
  marketing_consent boolean NOT NULL DEFAULT false,
  birthdate date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_uniq ON customers (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_uniq ON customers (phone) WHERE phone IS NOT NULL;

-- ─────────────── APPOINTMENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  chair_id uuid REFERENCES chairs(id) ON DELETE SET NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL CHECK (end_at > start_at),
  status appointment_status NOT NULL DEFAULT 'booked',
  source appointment_source NOT NULL DEFAULT 'app',
  notes text,
  total_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_start_idx ON appointments (start_at);
CREATE INDEX IF NOT EXISTS appointments_staff_idx ON appointments (staff_id, start_at);
CREATE INDEX IF NOT EXISTS appointments_customer_idx ON appointments (customer_id, start_at DESC);

CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE RESTRICT,
  price_cents int NOT NULL,
  duration_min int NOT NULL,
  PRIMARY KEY (appointment_id, service_id)
);

-- ─────────────── REVIEWS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  public_text text,
  internal_feedback text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────── PORTFOLIO IMAGES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  title text NOT NULL,
  tag text NOT NULL DEFAULT 'Editorial',
  alt_text text,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────── ADMIN ROLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
$$;

-- ─────────────── TRIGGERS ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE customers SET user_id = NEW.id, is_guest = false, updated_at = now()
   WHERE user_id IS NULL
     AND (
       (NEW.email IS NOT NULL AND lower(email) = lower(NEW.email))
       OR (NEW.phone IS NOT NULL AND phone = NEW.phone)
     );

  IF NOT FOUND THEN
    INSERT INTO customers (user_id, first_name, last_name, email, phone, is_guest)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email,'@',1), 'Cliente'),
      NEW.raw_user_meta_data->>'last_name',
      NEW.email,
      NEW.phone,
      false
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ─────────────── SLOT AVAILABILITY ───────────────────────────────────
CREATE OR REPLACE FUNCTION fn_check_slot_availability(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_staff_id uuid DEFAULT NULL,
  p_chair_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE conflict_exists boolean;
BEGIN
  IF p_end_at <= p_start_at THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM time_off
     WHERE (staff_id IS NULL OR staff_id = p_staff_id)
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM appointments
     WHERE status NOT IN ('cancelled','no_show')
       AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
       AND (
         (p_staff_id IS NOT NULL AND staff_id = p_staff_id)
         OR (p_chair_id IS NOT NULL AND chair_id = p_chair_id)
       )
  ) INTO conflict_exists;

  RETURN NOT conflict_exists;
END $$;

-- Find available time slots for a given date + service
CREATE OR REPLACE FUNCTION fn_available_slots(
  p_date date,
  p_service_id uuid,
  p_staff_id uuid DEFAULT NULL,
  p_step_min int DEFAULT 30
) RETURNS TABLE (slot_time time, staff_id uuid) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_duration int;
  v_weekday int;
BEGIN
  SELECT duration_min INTO v_duration FROM services WHERE id = p_service_id;
  IF v_duration IS NULL THEN RETURN; END IF;

  v_weekday := EXTRACT(DOW FROM p_date)::int;

  RETURN QUERY
  WITH base AS (
    SELECT s.id AS staff_id, wh.start_time, wh.end_time
      FROM staff s
      JOIN working_hours wh ON wh.staff_id = s.id OR wh.staff_id IS NULL
     WHERE s.is_active
       AND wh.weekday = v_weekday
       AND (p_staff_id IS NULL OR s.id = p_staff_id)
  ),
  slots AS (
    SELECT b.staff_id,
           (p_date::timestamp + b.start_time
             + (n * make_interval(mins => p_step_min)))::timestamptz AS start_at,
           b.end_time
      FROM base b,
           generate_series(0, ((EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60) / p_step_min)::int - 1) AS n
  )
  SELECT (s.start_at AT TIME ZONE 'Europe/Rome')::time AS slot_time, s.staff_id
    FROM slots s
   WHERE fn_check_slot_availability(s.start_at, s.start_at + make_interval(mins => v_duration), s.staff_id, NULL)
     AND (s.start_at + make_interval(mins => v_duration))::time <= s.end_time
   ORDER BY slot_time, s.staff_id;
END $$;

-- ─────────────── BOOK APPOINTMENT (atomic) ───────────────────────────
CREATE OR REPLACE FUNCTION fn_book_appointment(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_at timestamptz,
  p_notes text DEFAULT NULL,
  p_marketing_consent boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id uuid;
  v_appointment_id uuid;
  v_duration int;
  v_price int;
  v_end_at timestamptz;
  v_user_id uuid;
BEGIN
  SELECT duration_min, price_cents INTO v_duration, v_price FROM services WHERE id = p_service_id AND is_active;
  IF v_duration IS NULL THEN RAISE EXCEPTION 'Servizio non valido' USING ERRCODE = 'P0001'; END IF;

  v_end_at := p_start_at + make_interval(mins => v_duration);

  IF NOT fn_check_slot_availability(p_start_at, v_end_at, p_staff_id, NULL) THEN
    RAISE EXCEPTION 'Slot non disponibile' USING ERRCODE = 'P0002';
  END IF;

  v_user_id := auth.uid();

  -- Resolve customer: by user_id, else by email/phone, else create guest
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM customers WHERE user_id = v_user_id;
  END IF;

  IF v_customer_id IS NULL AND p_email IS NOT NULL AND p_email <> '' THEN
    SELECT id INTO v_customer_id FROM customers WHERE lower(email) = lower(p_email) LIMIT 1;
  END IF;
  IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (first_name, last_name, email, phone, is_guest, marketing_consent, user_id)
    VALUES (p_first_name, p_last_name, NULLIF(p_email,''), p_phone, v_user_id IS NULL, p_marketing_consent, v_user_id)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE customers
       SET first_name = COALESCE(NULLIF(p_first_name,''), first_name),
           last_name  = COALESCE(NULLIF(p_last_name,''), last_name),
           marketing_consent = marketing_consent OR p_marketing_consent
     WHERE id = v_customer_id;
  END IF;

  INSERT INTO appointments (customer_id, staff_id, start_at, end_at, status, source, notes, total_cents)
  VALUES (v_customer_id, p_staff_id, p_start_at, v_end_at, 'booked', 'app', NULLIF(p_notes,''), v_price)
  RETURNING id INTO v_appointment_id;

  INSERT INTO appointment_services (appointment_id, service_id, price_cents, duration_min)
  VALUES (v_appointment_id, p_service_id, v_price, v_duration);

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id,
    'start_at', p_start_at,
    'end_at', v_end_at,
    'total_cents', v_price
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_book_appointment(text,text,text,text,uuid,uuid,timestamptz,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_check_slot_availability(timestamptz,timestamptz,uuid,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_available_slots(date,uuid,uuid,int) TO anon, authenticated;

-- ─────────────── ADMIN STATS ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_admin_dashboard_stats(
  p_start timestamptz,
  p_end timestamptz
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'P0003'; END IF;

  SELECT jsonb_build_object(
    'total_appointments', COUNT(*),
    'total_revenue_cents', COALESCE(SUM(total_cents), 0),
    'completed', COUNT(*) FILTER (WHERE status='completed'),
    'cancelled', COUNT(*) FILTER (WHERE status='cancelled'),
    'no_show', COUNT(*) FILTER (WHERE status='no_show'),
    'unique_customers', COUNT(DISTINCT customer_id),
    'avg_ticket_cents', CASE WHEN COUNT(*)>0 THEN ROUND(SUM(total_cents)::numeric/COUNT(*)) ELSE 0 END
  ) INTO result
   FROM appointments
  WHERE start_at >= p_start AND start_at < p_end;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION fn_get_admin_dashboard_stats(timestamptz,timestamptz) TO authenticated;
