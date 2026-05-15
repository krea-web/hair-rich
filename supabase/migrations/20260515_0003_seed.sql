-- Hair Rich · Seed initial data

-- STAFF
INSERT INTO staff (slug, name, role, bio, is_active, sort_order) VALUES
  ('federico-asara', 'Federico Asara', 'Master Barber', 'Fondatore di Hair Rich, specializzato in fade chirurgici e lavorazioni editorial.', true, 1),
  ('luca',           'Luca',           'Senior Barber', 'Cura sartoriale di barba e razor cut.', true, 2)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, role = EXCLUDED.role, bio = EXCLUDED.bio,
      is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;

-- SERVICES
INSERT INTO services (slug, name, description, price_cents, duration_min, badge, sort_order) VALUES
  ('taglio-classico',    'Taglio classico',     'Forbice + rifinitura, lavaggio incluso.',                2000, 30, NULL,                      1),
  ('fade-sfumatura',     'Fade & Sfumatura',    'Fade chirurgico con macchinetta + rifinitura.',          2500, 45, 'Più scelto',              2),
  ('razor-cut',          'Razor cut',           'Lavorazione con rasoio per texture morbide.',            3000, 50, NULL,                      3),
  ('barba-sartoriale',   'Barba sartoriale',    'Modellatura barba con asciugamano caldo e oli.',         1500, 30, NULL,                      4),
  ('taglio-barba',       'Taglio + Barba',      'Combo completo, risparmi €5 sul singolo.',               3500, 60, 'Combo · risparmi €5',     5),
  ('taglio-domicilio',   'Taglio a domicilio',  'Servizio premium on-demand.',                            4500, 60, '🏡 Su prenotazione',     6)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, description = EXCLUDED.description,
      price_cents = EXCLUDED.price_cents, duration_min = EXCLUDED.duration_min,
      badge = EXCLUDED.badge, sort_order = EXCLUDED.sort_order;

-- staff_services: tutti i barber fanno tutti i servizi tranne il domicilio (solo Federico)
INSERT INTO staff_services (staff_id, service_id)
SELECT s.id, sv.id
  FROM staff s, services sv
 WHERE NOT (sv.slug = 'taglio-domicilio' AND s.slug <> 'federico-asara')
ON CONFLICT DO NOTHING;

-- CHAIRS (3 postazioni)
INSERT INTO chairs (name, sort_order)
SELECT 'Postazione 1', 1 WHERE NOT EXISTS (SELECT 1 FROM chairs WHERE name='Postazione 1');
INSERT INTO chairs (name, sort_order)
SELECT 'Postazione 2', 2 WHERE NOT EXISTS (SELECT 1 FROM chairs WHERE name='Postazione 2');
INSERT INTO chairs (name, sort_order)
SELECT 'Postazione 3', 3 WHERE NOT EXISTS (SELECT 1 FROM chairs WHERE name='Postazione 3');

-- WORKING HOURS (salone-wide: staff_id NULL) — Tue (2) → Sat (6)
-- (Mon=1, Sun=0 chiusi, come da UI)
DELETE FROM working_hours WHERE staff_id IS NULL;
INSERT INTO working_hours (staff_id, weekday, start_time, end_time)
SELECT NULL::uuid, w::smallint, '09:00'::time, '13:00'::time FROM generate_series(2,6) w
UNION ALL
SELECT NULL::uuid, w::smallint, '14:30'::time, '19:30'::time FROM generate_series(2,6) w;

-- PORTFOLIO IMAGES (22 foto da bucket portfolio/provvisorio)
WITH files(filename, tag, title) AS (
  VALUES
    ('45D80610-FFA8-4F04-AD2B-ACAF848A99C9.jpeg', 'Editorial', 'Editorial #01'),
    ('6D4AFA12-69E8-4EFB-9A3C-90B590D23019.jpeg', 'Mood',      'Studio Mood'),
    ('IMG_1176.jpeg', 'Fade',      'Razor Fade'),
    ('IMG_1200.jpeg', 'Classic',   'Side Part'),
    ('IMG_1208.jpeg', 'Beard',     'Beard Sculpt'),
    ('IMG_1323.jpeg', 'Modern',    'Crop Textured'),
    ('IMG_1340.jpeg', 'Color',     'Salt & Pepper'),
    ('IMG_2090.jpeg', 'Editorial', 'Editorial #03'),
    ('IMG_2143.jpeg', 'Modern',    'Mid Skin Fade'),
    ('IMG_2174.jpeg', 'Mood',      'Backroom Light'),
    ('IMG_2242.jpeg', 'Fade',      'Low Fade'),
    ('IMG_2246.jpeg', 'Classic',   'Forbice Classica'),
    ('IMG_2261.jpeg', 'Beard',     'Barba Sartoriale'),
    ('IMG_2287.jpeg', 'Modern',    'Texture Lavorata'),
    ('IMG_2374.jpeg', 'Editorial', 'Editorial #04'),
    ('IMG_2391.jpeg', 'Mood',      'Specchio Notturno'),
    ('IMG_2404.jpeg', 'Fade',      'Skin Fade'),
    ('IMG_2405.jpeg', 'Classic',   'Pompadour'),
    ('IMG_2430.jpeg', 'Modern',    'Undercut'),
    ('IMG_2493.jpeg', 'Color',     'Slate Grey'),
    ('IMG_2518.jpeg', 'Editorial', 'Editorial #05'),
    ('IMG_2549.jpeg', 'Mood',      'Postazione Oro')
)
INSERT INTO portfolio_images (storage_path, title, tag, alt_text, is_featured, sort_order)
SELECT 'provvisorio/' || filename,
       title,
       tag,
       title || ' · Hair Rich Olbia',
       row_number() OVER () = 1,  -- prima è featured
       row_number() OVER ()
  FROM files
ON CONFLICT DO NOTHING;
