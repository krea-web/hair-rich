-- Contact form submissions

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'website',
  user_agent text,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='contact_messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_messages', r.policyname);
  END LOOP;
END $$;

-- Anyone may submit a message; only admins may read/edit.
CREATE POLICY "public insert messages" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin all messages" ON contact_messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
