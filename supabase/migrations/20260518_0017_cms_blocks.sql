-- Hair Rich · CMS-lite blocks
-- Key/value store for editable copy. Lets the salon update headlines,
-- taglines, FAQs without a code deploy.

CREATE TABLE IF NOT EXISTS cms_blocks (
  key text PRIMARY KEY,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'text', -- 'text' | 'markdown' | 'json'
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cms_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read cms" ON cms_blocks;
CREATE POLICY "public read cms" ON cms_blocks FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin all cms" ON cms_blocks;
CREATE POLICY "admin all cms" ON cms_blocks
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_cms_blocks_updated ON cms_blocks;
CREATE TRIGGER trg_cms_blocks_updated
  BEFORE UPDATE ON cms_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed the canonical editable blocks. Inserts are idempotent.
INSERT INTO cms_blocks (key, label, value, kind) VALUES
  ('home_manifesto_heading', 'Home · titolo manifesto', 'Il taglio è un rituale.', 'text'),
  ('home_manifesto_body', 'Home · testo manifesto', 'Da Hair Rich non vendiamo tempo. Vendiamo cura, attenzione, e un risultato che riconosci appena ti specchi.', 'markdown'),
  ('footer_tagline', 'Footer · tagline', 'Hair Rich · Olbia · barberia di precisione dal 2018.', 'text'),
  ('intro_welcome_word', 'Intro · parola benvenuto', 'Benvenuto', 'text'),
  ('booking_thanks', 'Booking · ringraziamento conferma', 'Ti aspettiamo. Se devi cambiare, hai 4 ore di preavviso senza penali.', 'text'),
  ('faq_items', 'FAQ · contenuto (JSON)',
   '[{"q":"Quanto dura un taglio?","a":"30 minuti per il taglio base, 60 per taglio + barba."},{"q":"Posso pagare con carta?","a":"Sì, accettiamo POS contactless."},{"q":"Si può cancellare?","a":"Sì, fino a 4 ore prima dell''appuntamento senza nessun costo."}]',
   'json')
ON CONFLICT (key) DO NOTHING;
