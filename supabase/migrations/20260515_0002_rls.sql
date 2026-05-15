-- Hair Rich · RLS policies

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to make migration idempotent
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
     WHERE schemaname='public' AND tablename IN (
      'staff','services','staff_services','chairs','working_hours','time_off',
      'customers','appointments','appointment_services','reviews','portfolio_images','admins'
     )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Public read (anon + authenticated)
CREATE POLICY "public read services" ON services FOR SELECT USING (is_active);
CREATE POLICY "public read staff" ON staff FOR SELECT USING (is_active);
CREATE POLICY "public read staff_services" ON staff_services FOR SELECT USING (true);
CREATE POLICY "public read chairs" ON chairs FOR SELECT USING (is_active);
CREATE POLICY "public read working_hours" ON working_hours FOR SELECT USING (true);
CREATE POLICY "public read time_off" ON time_off FOR SELECT USING (true);
CREATE POLICY "public read portfolio" ON portfolio_images FOR SELECT USING (is_active);
CREATE POLICY "public read reviews" ON reviews FOR SELECT USING (is_public);

-- Admin: full access
CREATE POLICY "admin all services" ON services FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all staff" ON staff FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all staff_services" ON staff_services FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all chairs" ON chairs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all working_hours" ON working_hours FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all time_off" ON time_off FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all customers" ON customers FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all appointments" ON appointments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all appt_services" ON appointment_services FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all reviews" ON reviews FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin all portfolio" ON portfolio_images FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin read admins" ON admins FOR SELECT USING (is_admin() OR user_id = auth.uid());
CREATE POLICY "admin manage admins" ON admins FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Customer self-access
CREATE POLICY "self read customer" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "self update customer" ON customers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "self read appointments" ON appointments FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
);
CREATE POLICY "self read appt_services" ON appointment_services FOR SELECT USING (
  appointment_id IN (
    SELECT a.id FROM appointments a JOIN customers c ON a.customer_id = c.id WHERE c.user_id = auth.uid()
  )
);
