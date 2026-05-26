-- Hair Rich · Brand theme + extracted copy
--
-- Estrazione progressiva dei dati specifici del singolo salone fuori dal
-- codice e dentro al DB. Una volta completata, lo stesso codebase può
-- servire qualsiasi salone semplicemente cambiando i valori in
-- salon_settings + cms_blocks.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT jsonb_build_object(
    'accent_color', '#D4A574',
    'accent_color_warm', '#D4A574',
    'background_color', '#0a0a0a',
    'surface_color', '#121212',
    'text_color', '#F5F0E8',
    'font_display', 'Fraunces',
    'font_body', 'Inter',
    'logo_url', null,
    'wordmark_text', null
  );

COMMENT ON COLUMN salon_settings.theme IS
  'Tokens di branding (colori, font, logo) sostituibili per ogni salone. Letti dal frontend via useBrand() + iniettati come CSS variables.';

-- Cms blocks per le copy del customer site oggi hardcoded
INSERT INTO cms_blocks (key, label, value, kind) VALUES
  ('site_brand_name', 'Brand · nome corto', 'Hair Rich', 'text'),
  ('site_brand_location', 'Brand · città/sede', 'Olbia', 'text'),
  ('site_brand_full', 'Brand · nome completo', 'Hair Rich Olbia', 'text'),
  ('site_brand_tagline_short', 'Brand · tagline breve', 'Barberia di precisione', 'text'),
  ('admin_sidebar_brand', 'Admin · titolo sidebar', 'HAIR RICH ADMIN', 'text'),
  ('staff_sidebar_brand', 'Staff · titolo sidebar', 'HAIR RICH STAFF', 'text')
ON CONFLICT (key) DO NOTHING;
