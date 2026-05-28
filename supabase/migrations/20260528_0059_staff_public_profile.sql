-- Hair Rich · Staff public profile
--
-- Estende la tabella `staff` con i campi che fino ad oggi vivevano
-- hardcoded in `TeamShowcase.tsx` (STAFF_ENRICHMENT object). Spostarli
-- nel DB permette al titolare di gestire ogni profilo da
-- /admin/staff e di alimentare la pagina pubblica /team/[slug].
--
-- I valori esistenti di Federico Asara e Cristian sono copiati 1-1
-- dal codice di TeamShowcase così che il /team attuale continui a
-- mostrare lo stesso contenuto dopo che il componente smette di usare
-- STAFF_ENRICHMENT.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS role_type text DEFAULT 'employee'
    CHECK (role_type IN ('founder', 'co_founder', 'master_barber', 'barber', 'apprentice', 'receptionist', 'employee')),
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS years_active text,
  ADD COLUMN IF NOT EXISTS expertise text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS qa jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS full_bio text,
  ADD COLUMN IF NOT EXISTS show_on_team_page boolean DEFAULT true;

COMMENT ON COLUMN staff.role_type IS
  'Bucket logico del ruolo (founder/master_barber/barber/...). Il campo `role` resta come label libera "Master barber", "Senior barber". role_type guida sia il filtering pubblico (/team founder vs dipendenti) sia i permessi futuri (RBAC).';
COMMENT ON COLUMN staff.expertise IS
  'Array di specialità mostrate come chips sulla pagina pubblica.';
COMMENT ON COLUMN staff.qa IS
  'Array di JSON {q: text, a: text} per la sezione "domande a NOME".';
COMMENT ON COLUMN staff.cover_url IS
  'Foto cover (16:9 o 21:9) per la pagina /team/[slug]. Se null, fallback su avatar_url.';
COMMENT ON COLUMN staff.show_on_team_page IS
  'Visibilità sulla pagina pubblica /team. False per nascondere un membro (es. apprendista temporaneo) senza disattivare la riga.';

-- ────────────────────────────────────────────────────────────────────
-- Seed: porta i valori hardcoded di TeamShowcase nel DB. Aggiorna solo
-- se la riga esiste già con quello slug — niente INSERT, non vogliamo
-- creare staff fantasma se uno è stato rimosso.
-- ────────────────────────────────────────────────────────────────────

UPDATE staff SET
  role_type = 'founder',
  tagline = 'Un taglio non si esegue, si costruisce. Prima sulla persona, poi sui capelli.',
  years_active = 'Dal 2017',
  expertise = ARRAY['Fade chirurgico', 'Editorial cuts', 'Razor cut', 'Consulenza forma viso'],
  signature = 'Razor cut con fade graduato',
  full_bio = 'Federico è il fondatore di Hair Rich. Ha aperto il salone nel 2017 dopo dieci anni passati tra Milano, Londra e i set editorial italiani. La sua specialità è il fade chirurgico e il razor cut su capelli medi — ma quello che lo distingue è il consulto iniziale: prima di toccare le forbici dedica sempre due minuti a capire chi hai davanti, come vivi, che tempo dedichi al mattino.',
  qa = '[
    {
      "q": "Il taglio che fai meglio?",
      "a": "Il razor cut su capelli medi-lunghi con fade graduato alla nuca. È dove la mia formazione editorial italiana si sposa con la tecnica britannica di sfumatura."
    },
    {
      "q": "L''errore che vedi più spesso?",
      "a": "Clienti che chiedono uno stile vedendolo su qualcun altro senza considerare la forma del proprio viso. Il consulto iniziale serve esattamente a evitare questa trappola."
    },
    {
      "q": "Il tuo tool preferito?",
      "a": "Le forbici Joewell Convex 5.5\" — le uso da 12 anni, una taglia perfetta per il razor cut. Sono tarate sulla mia mano."
    },
    {
      "q": "Un consiglio dopo il taglio?",
      "a": "Investi in una sola pomata buona invece di cinque mediocri. La qualità del prodotto fa il 30% del risultato finale al mattino."
    }
  ]'::jsonb
WHERE slug = 'federico-asara';

UPDATE staff SET
  role_type = 'master_barber',
  tagline = 'Sulla barba si fa la differenza nei millimetri, non nei centimetri.',
  years_active = 'Dal 2019',
  expertise = ARRAY['Barba sartoriale', 'Rasoio classico', 'Skin fade', 'Modellatura sopracciglia'],
  signature = 'Barba sartoriale a rasoio classico',
  full_bio = 'Cristian è il nostro specialista barba e rasoio. Formato a Roma alla scuola Mascotte, in Hair Rich dal 2019. La modellatura barba è la sua cifra: lavora a rasoio classico per i contorni, forbice-trama per la rifinitura, e finisce con un olio scelto sulla base del tuo tipo di pelle.',
  qa = '[
    {
      "q": "Cosa rende una barba ''sartoriale''?",
      "a": "La precisione del contorno e l''armonia con la forma del viso, non la lunghezza. Lavoriamo i millimetri sul collo, sulle gote e sotto lo zigomo — quel triangolo è dove si gioca tutto."
    },
    {
      "q": "Rasoio classico o macchinetta?",
      "a": "Per i contorni sempre rasoio: la macchinetta lascia una linea piatta, il rasoio crea un bordo vivo. Per la lunghezza dipende dal tipo di barba, ma forbice-trama nove volte su dieci."
    },
    {
      "q": "Un cliente con problemi di pelle?",
      "a": "Pre-shave oil sempre, asciugamano tiepido (non bollente), rasoio in una sola passata nel verso del pelo. Olio post a base di jojoba per chi ha pelle sensibile."
    },
    {
      "q": "Il taglio classico più sottovalutato?",
      "a": "Il side part italiano. Lo chiedono in pochi ma sta bene praticamente a tutti gli ovali e quadri. Forbice pulita, scriminatura netta, finitura con cera leggera."
    }
  ]'::jsonb
WHERE slug = 'cristian';

-- Mark every other row (es. il titolare auto-claimato) come dipendente
-- generico per default. Il titolare cambierà manualmente da /admin/staff.
UPDATE staff
  SET role_type = COALESCE(role_type, 'employee'),
      expertise = COALESCE(expertise, '{}'::text[]),
      qa = COALESCE(qa, '[]'::jsonb),
      show_on_team_page = COALESCE(show_on_team_page, true)
  WHERE role_type IS NULL OR expertise IS NULL OR qa IS NULL OR show_on_team_page IS NULL;
