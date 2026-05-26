-- Hair Rich · Brand grouping (multi-location base)
--
-- Aggiunge il concetto di "brand parent" per saloni con più sedi che
-- condividono identità ma vengono deployati come Supabase project
-- separati. Esempio: Hair Rich Olbia + Hair Rich Nuoro condividono
-- parent_brand_id = 'hair-rich' anche se hanno DB diversi.
--
-- È solo metadata — non implementa multi-tenancy a livello DB.
-- L'architettura resta "un salone = un Supabase project" (Opzione A
-- del piano strategico). Questo campo serve a:
--   • Footer customer site: "Altre sedi: Olbia · Nuoro" con link cross
--   • Admin /salute: mostrare lo stato della sede sorella
--   • Onboarding script: clonare branding e skills da una sede esistente

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS parent_brand_id text,
  ADD COLUMN IF NOT EXISTS parent_brand_name text,
  ADD COLUMN IF NOT EXISTS sibling_locations jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN salon_settings.parent_brand_id IS
  'Slug del brand di cui questo salone è una sede. Esempio: "hair-rich" condiviso tra Olbia e Nuoro.';
COMMENT ON COLUMN salon_settings.parent_brand_name IS
  'Nome visualizzato del brand (es. "Hair Rich"). Diverso da display_name che è il nome della singola sede.';
COMMENT ON COLUMN salon_settings.sibling_locations IS
  'Array di altre sedi dello stesso brand: [{slug, display_name, url, city}]. Manuale, da aggiornare quando una nuova sede entra online.';

-- Backfill per Hair Rich Olbia
UPDATE salon_settings
   SET parent_brand_id = COALESCE(parent_brand_id, 'hair-rich'),
       parent_brand_name = COALESCE(parent_brand_name, 'Hair Rich')
 WHERE display_name ILIKE '%hair rich%';
