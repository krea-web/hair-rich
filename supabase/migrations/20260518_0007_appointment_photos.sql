-- Photo memory ("Ricorda il mio taglio")
-- After a completed appointment, an admin uploads 1+ result photos to the
-- `appointment-photos` storage bucket. The metadata row in this table
-- links the storage path to the appointment so the client can browse a
-- mini-gallery of their previous cuts in /profilo/appuntamenti.

CREATE TABLE IF NOT EXISTS appointment_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    caption text,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointment_photos_appt_idx
    ON appointment_photos (appointment_id, sort_order);

ALTER TABLE appointment_photos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname='public' AND tablename='appointment_photos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointment_photos', r.policyname);
    END LOOP;
END $$;

-- Admin can do anything
CREATE POLICY "admin all appointment_photos" ON appointment_photos
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Customer can read photos of their own appointments (joined via customers.user_id)
CREATE POLICY "self read appointment_photos" ON appointment_photos
    FOR SELECT USING (
        appointment_id IN (
            SELECT a.id FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );
