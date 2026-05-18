-- Storage RLS for client-references bucket
-- - anon + authenticated can INSERT (uploads from booking wizard, no auth required)
-- - only admins can SELECT/UPDATE/DELETE
-- - Files are read via signed URLs created with the service role in edge
--   functions or admin view, so no need for public READ here.

-- Allow inserts from anyone into client-references
DROP POLICY IF EXISTS "ref_upload_anon" ON storage.objects;
CREATE POLICY "ref_upload_anon" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'client-references');

-- Admin full access on the bucket objects
DROP POLICY IF EXISTS "ref_admin_all" ON storage.objects;
CREATE POLICY "ref_admin_all" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'client-references' AND is_admin())
    WITH CHECK (bucket_id = 'client-references' AND is_admin());

-- Same setup for appointment-photos: admin uploads + reads
DROP POLICY IF EXISTS "appt_photos_admin_all" ON storage.objects;
CREATE POLICY "appt_photos_admin_all" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'appointment-photos' AND is_admin())
    WITH CHECK (bucket_id = 'appointment-photos' AND is_admin());

-- Customers can READ photos from appointment-photos when the path belongs to
-- one of their appointments. We rely on the file naming convention
-- {appointment_id}/{filename}; the policy joins back via the path prefix.
DROP POLICY IF EXISTS "appt_photos_self_read" ON storage.objects;
CREATE POLICY "appt_photos_self_read" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'appointment-photos'
        AND (storage.foldername(name))[1]::uuid IN (
            SELECT a.id FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );
