@AGENTS.md

# Hair Rich Olbia — stato del progetto

Salon site + booking engine + e-commerce + auth + admin gestionale.
Cliente reale: barbiere a Olbia. Sito in italiano, multilingua (it/en/fr/de).

> **Strategic context (aggiornato 2026-05-26)**: questo repo è di fatto il
> **template "salon-platform"**, e Hair Rich Olbia è l'istanza di test #1
> ("Full tier" con tutte le skill sbloccate). Il piano commerciale è
> vendere il gestionale ad altri parrucchieri/barbieri/estetisti/centri
> massaggi italiani in 3 pacchetti (Vetrina €19/mese, Pro €29, Full €50),
> con customer-site brandizzato per cliente e gestionale unificato a
> template. Il fork in repo `salon-template` separato avviene quando
> arriva il **primo cliente non-Hair Rich**.

---

## 🧭 Stato reale al 3 giugno 2026 — RESOCONTO

> Aggiornamento richiesto dal titolare. Riassume cosa è LIVE in
> produzione, cosa serve dalle sue mani per attivarlo, e cosa è ancora
> da fare. Sostituisce per chiarezza i snapshot precedenti che con i
> 30+ round di iterazione UX rischiavano di non essere più affidabili.

### 1. Codice in produzione — funzionante senza altre azioni
- **Sito pubblico** (50+ pagine, 4 lingue, brandizzato Hair Rich Olbia)
  - Hero + servizi + lavori + team + prodotti + contatti + legal
  - Booking drawer end-to-end (cliente → Supabase appointments)
  - PWA installabile, manifest + service worker
  - JSON-LD HairSalon / Service / FAQ / Breadcrumb su 5 pagine
  - SEO: meta tag i18n, sitemap, robots, OG image 1200×630
  - Performance: build 80 pagine in 8-12s, Lighthouse pre-audit OK
- **Sticky team** (commit `b43f4a5`): finalmente funzionante,
  foto sticky che "scende insieme allo scroll" mentre il bio scorre
- **Hero `/contatti`**: foto bg salone-esterno scurita 65→35 opacity
- **Card "I nostri servizi"** in home: aspect landscape, foto dal
  portfolio bucket
- **IntroSequence** (forbice+rosa): solo su mobile, rimossa da PC
- **Gestionale admin** `/admin`: 29 view operative
  - Dashboard / Inbox realtime / Agenda mese+settimana+giorno
  - Waitlist / Chiusure / Statistiche / Clienti (incl. ricerca avanzata + no-show)
  - Ordini & Cassa / Foto risultato / Salute sistema
  - Servizi / Prodotti / Staff / Orari / CMS
  - Marketing / Gamification / Pacchetti / Sondaggi
  - Fornitori / QR promo / Hardware / Log / Impostazioni
  - **Skills Hub** `/admin/funzionalita` (101 toggle con guida completa)
- **Vista mese agenda** (commit `6290b9c`): grid 7×6 con pill
  appuntamenti + CTA "Nuovo appuntamento", default su mese
- **Admin RBAC due livelli** (commit `1b7570b` + `fc3d43e`):
  - Owner: vista completa
  - Staff/Dipendente: vista filtrata (Agenda, Clienti, Foto, Timbratura, Ferie)
  - Toggle tablet "Titolare ↔ Dipendente" con PIN di unlock
- **`/staff` unificato in `/admin`** (commit `5641f7d`): redirect
  automatico, timbratura e ferie accessibili anche al dipendente
- **Pagine pubbliche staff `/team/[slug]`** (commit `e110013`):
  Federico + Cristian generate dinamicamente da DB con bio, expertise,
  Q&A, watermark editoriale
- **Profilo cliente** `/profilo`:
  - Dashboard con prossimo appuntamento + crediti
  - Appuntamenti (lista, cancel, reschedule)
  - La mia storia (foto pre/post)
  - Crediti & bonus / Passaparola (skill-gated)
  - **Impostazioni** con **5 consensi GDPR raggruppati in 3 accordion**
    (commit `424e2b1`): Notifiche / Dati / Programmi
  - CTA Instagram + CTA "Lasciaci 5 stelle Google" (commit `b8bb1ec`)
- **Navigation**: bottone Profilo nel SiteHeader PC, link Admin nel
  Footer (commit `705d5eb`)
- **Database Supabase**: 60 tabelle, 60+ migrations applicate, 55 RPC,
  RLS attive, audit log automatico, triggers GDPR
- **Edge Functions**: 27 deployate ACTIVE, 12 cron schedulati (pg_cron)

### 2. Codice in produzione — ATTIVO solo dopo credenziali

Tutte le skill marketing/AI/integrazione sono **già scritte e
deployate** ma in stato `enabled=false` su `skills_config`. Il
titolare le accende dalla Skills Hub UNA VOLTA che le credenziali
corrispondenti sono inserite. Vedi sezione "🔑 Credenziali esterne
da fornire" in fondo per la lista esatta.

Esempi di cosa si attiva con quali credenziali:
- `GMAIL_USER` + `GMAIL_APP_PASSWORD` (Gmail dedicato)
  → Email reminder cliente, recensioni, ricevute pacchetti, cancel,
    win-back, anteprime AI report
- `TELEGRAM_BOT_TOKEN` + `owner_telegram_chat_id`
  → TUTTI gli alert al titolare (prenotazioni, cancellazioni,
    no-show, recensione negativa, calo prenotazioni, daily digest 18:00)
- `OPENAI_API_KEY`
  → AI weekly suggestions, AI monthly report, AI content generator,
    no-show outreach drafts, Voice control gestionale, Telegram AI
- `VAPID_*` keys
  → Push notification web ai clienti
- `GOOGLE_*` (OAuth)
  → Sync Google Calendar staff, Google Business Profile orari,
    Reserve with Google

### 3. Cosa manca da fare lato CODE (non bloccante per la presentazione)

Tre cantieri pianificati in `~/.claude/plans/` e nelle sezioni
Sessione A/B/C/D più in basso. Riassunto:

**a. Sessione A — finitura Hair Rich (~25h)**
- CMS `/admin/cms` editor TipTap reale su `cms_blocks`
- Statistiche dashboard recharts (RPC `fn_admin_stats_range` esiste)
- Gamification CRUD coupon + fidelity
- Onboarding wizard guard + 4-step
- Drag&drop appuntamenti in `/admin/agenda` (RPC esiste)
- Editor orari settimanali staff
- Clienti CSV export
- Customer health alerts dashboard

**b. Sessione B — productization template (~30-45h)**
- Multi-tier mapping skills_config con `min_tier`
- Salon onboarding seed script `scripts/onboard_salon.py`
- Estrazione Hair Rich-specific (loghi, foto, copy) verso `cms_blocks` / `salon_settings`
- Architettura multi-location base (Nuoro)

**c. Voice control + Telegram AI** (~20h totali)
- Fase 1: Voice in `/admin/agenda` per tutti (titolare + dipendenti)
- Fase 2: Telegram bot conversazionale per titolare con tool calling

**d. Sessione C — Hardware POS** (~30h)
- SumUp Air plugin
- Stripe Terminal plugin
- Stampante termica Star Micronics
- Scanner barcode + cassetto contante

**e. Sessione D — Fiscale + HR** (~50h)
- Integrazione Fatture in Cloud
- Liquidazione IVA + export commercialista
- RT Olivetti integration (dopo che il titolare comunica il modello)
- HR / Cassa giornaliera / commissioni staff

### 4. Stato della presentazione

La presentazione di lunedì 1 giugno è **già passata**. Lo sviluppo
ha continuato dopo con focus su:
- UX iterativa (12+ round calibrazione su feedback titolare)
- Fix bug emergenti (sticky team, doppio menu agenda, foto formati)
- Gestionale: agenda mese view, RBAC, voice/Telegram plan, PIN
- Profilo: consensi raggruppati, CTA review/IG, nav header/footer

**Cosa serve dal titolare adesso** per andare effettivamente in
produzione con clienti reali:
1. Confermare se vuole la **Sessione A** (finitura Hair Rich)
   completata prima di accendere il sito al pubblico, o se vuole
   andare live con quello che c'è e completare il resto in parallelo
2. Procurare le **credenziali bloccanti** elencate sotto (Gmail,
   Telegram bot, dominio definitivo) — sono 4 cose, ~20 min totali
3. Decidere se la **Sessione B** (productization template) va fatta
   prima del primo cliente non-Hair Rich, o se Hair Rich resta come
   istanza singola per ora

---

## Stato corrente (snapshot)

- ✅ **Sito pubblico**: completo (50+ pagine), 4 lingue, brandizzato Hair Rich
- ✅ **Gestionale admin**: 29 view operative, sidebar completa
- ✅ **Skills Hub**: 101 toggle in DB, 2 sempre-ON (gdpr_consents, admin_inbox)
- ✅ **Notification Router**: bifurcated customer/owner, GDPR-gated, Gmail+Telegram channels, 50 template messaggi seeded
- ✅ **Audit log automatico**: triggers su 19 tabelle critiche
- ✅ **Inbox admin realtime** con badge sidebar
- ✅ **System Health dashboard** `/admin/salute`
- ✅ **Hardware catalog** `/admin/hardware` (11 dispositivi censiti, prezzi reali)
- ✅ **52 migrations applicate in produzione** (DB pop. con 52 tabelle, 55 funzioni)
- ✅ **Cron idempotency lock** + Sentry client + 3 Playwright E2E spec
- ✅ **3 GitHub Actions**: deploy Edge Functions, E2E, migrations lint
- ✅ **Login admin operativo**: site_url corretto, redirect adaptive (admin → /admin)
- ✅ **27 Edge Functions deployate** in produzione (ACTIVE)
- ✅ **12 cron jobs schedulati** via pg_cron + pg_net (ACTIVE)
- ⏸️ **Go-live rinviato a dopo la presentazione di lunedì 1 giugno** — secrets Gmail/Telegram/OpenAI da configurare quando il cliente li conferma. Vedi `docs/PRODUCTION-CHECKLIST.md`
- ✅ **Sprint finale completato (eccetto Lighthouse + manual click-through)**:
  - **E1 Desktop UX**: 23 file landing rebalanced con `lg:`/`xl:`/`2xl:` breakpoint scaling (commit `5ee3f76`)
  - **E2.1 JSON-LD**: HairSalon schema + Service ×3 + FAQ + Breadcrumb su 5 pagine (commit `1746a12`)
  - **E2.3 SEO quick wins**: robots.txt esteso, OG fallback unico, font-display=swap già presente (commit `1746a12`)
  - **E2.4 Breadcrumbs**: lavori/prodotti/team/contatti/servizi (commit `1746a12`)
  - **E2.5 Image perf**: decoding + fetchPriority sui hero LCP (commit `4a78499`)
  - **E3.1 LoginForm bg**: da Unsplash a `salone-esterno.webp` Supabase (commit `4a78499`)
  - **E3.2 DE i18n**: rimossi italianismi residui (commit `4a78499`)
  - **E3.3 Manifest**: verificato (icon-192/512/maskable/apple-icon + og 1200×630 OK)
  - **E2.2 OG image**: già esistente in `public/og-image.png` 1200×630 ✓
- ⏳ **E3.4 Lighthouse audit**: audit statico OK; full Lighthouse va eseguito lunedì mattina con browser
- ⏳ **E3.5 Manual click-through**: da fare sabato/domenica

### Sprint UX rounds 1-12 (28-30 maggio 2026)

12 rounds di calibrazione/UX iterativa post-sprint E, tutti pushati in produzione:

- **Round 1-5 (calibration scripts v1→v4)**: 3 script Python in `scripts/calibrate_landing_*.py` che ribilanciano padding/font/min-h su 32 componenti landing. Eliminato il problema "tutto sproporzionato su PC".
- **Round 6 (commit `35e0463`)**: pagina `/team/[slug]` dinamica SSG. Migration 0059 `staff_public_profile` con role_type/expertise/qa/signature/full_bio. Seed di Federico Asara + Cristian.
- **Round 7 (commit `de5cac2`)**: `/admin/staff` editor CMS-like del profilo pubblico, drawer modale con bio/foto/role_type/QA/specialties.
- **Round 8 (commit `e4c3011`)**: Skills Hub modal "Guida completa" con tutorial dettagliati per le 10 skill più impattanti.
- **Round 9 (commit `1b7570b`)**: RBAC due livelli admin. `admins.role = owner|manager|staff`. AdminLayout filtra sidebar in base a EMPLOYEE_VOICES whitelist.
- **Round 10 (commit `094206e`)**: Staff portal self-claim del titolare. Migration 0058 `fn_claim_owner_staff` RPC.
- **Round 11 (commit `5641f7d`)**: unificato `/staff` dentro `/admin`. Timbratura + Ferie + "Le mie prenotazioni" accessibili anche al dipendente. `/staff/*` ora redirect a `/admin/*`.
- **Round 12 (commit `e110013`)**: `/team/[slug]` arricchito con gradient bg + watermark 01/02/03 + closing editoriale. CTA "Prenota con X" rimossi. InstagramSection aspect-[4/5]. CTA Footer object-position 20%. IntroSequence auto-scroll su primo wheel.

### Bug noti residui in tracking attivo

- **Sticky team** (commit `fc3d43e` → fallback ulteriore in `StickyOnDesktop.tsx`): il diagnostico browser dell'utente ha mostrato `position: 'static'` nonostante il CSS sia nel bundle. Cache CDN Vercel sospetta. Fallback definitivo: componente `StickyOnDesktop` che applica `el.style.position = 'sticky'` programmaticamente in useEffect — inline style ha specificità massima, vince ogni CSS bundle.
- **IntroSequence**: 6 fix iterativi su scroll budget, frame range, drawFrame centering. Adesso applica auto-scroll al primo wheel/touch per skippare il play-through.

### Admin tablet-mode (commit `fc3d43e` + nuovo)

Switch role visivo in sidebar admin per scenario "1 tablet condiviso in salone":
- Toggle 2-button **Titolare** vs **Dipendente** sotto il brand chip.
- Override salvato in `localStorage` (`hairrich:admin:role_override`).
- Switch a `Dipendente` libero. Switch a `Titolare` da `Dipendente` → richiede PIN salvato in `salon_settings.owner_unlock_pin` (migration `0060`).
- Visibile solo se utente ha role base `owner` o `manager`. Un `staff` puro non vede il toggle.
- Quando si switcha a `Dipendente` su una rotta proibita, redirect automatico a `/admin`.

### Piano Voice + Telegram bot (post-presentazione)

Decisione: implementare **entrambe** ma in fasi distinte.

**Fase 1 — Voice control nel gestionale** (~8h dev)
- Bottone microfono in `/admin/agenda` accessibile a titolare E dipendenti
- Web Speech API → trascrizione locale → invio a Edge Function `voice-to-appointment`
- Edge Function: OpenAI Whisper (se serve speech-to-text server-side) + GPT-4o-mini con prompt "estrai data, ora, servizio, cliente, staff dalla frase italiana" → JSON strutturato
- JSON → RPC `fn_create_appointment_from_voice(p_payload jsonb)` SECURITY DEFINER → insert appointments + conferma
- Toast UI con preview "Hai detto: domani 10:00 taglio per Luca con Federico — confermi?" + bottoni Conferma/Annulla/Modifica
- Costo runtime: ~€0.0001 per comando

**Fase 2 — Telegram AI Assistant** (~12h dev, solo titolare)
- Bot Telegram dedicato (riusa `TELEGRAM_BOT_TOKEN` già previsto)
- Riceve messaggi testo o audio del titolare
- Audio → Whisper → trascrizione
- Trascrizione → GPT-4o con tool calling esposto (`fn_get_today_appointments`, `fn_get_week_revenue`, `fn_create_appointment`, `fn_list_customers_at_risk`, ecc.)
- Risposta del bot con dati reali del gestionale
- Solo `owner_telegram_chat_id` autorizzato (security gate)

**Credenziali aggiuntive richieste** (vedi sezione "Credenziali esterne da fornire" in fondo):
- Voice: `OPENAI_API_KEY` (già nella lista per altre AI skill)
- Telegram bot: `TELEGRAM_BOT_TOKEN` (già nella lista)
- Nessuna nuova oltre quelle già pianificate.

## Decisioni strategiche prese

- **Multi-location: Opzione A** — ogni sede = Supabase project + Vercel deploy separati, stesso repo
- **Hair Rich = "Full tier"**: tutte le 101 skill sbloccate, lui sceglie quali accendere
- **Fiscale italiano**: deferred per Hair Rich (usa RT esterna, Olivetti modello TBD); scaffolding template fa parte di Fase 3
- **Hardware**: catalog UI fatto, plugin attivi `on_request` (build quando primo cliente lo chiede)
- **Salon onboarding seed script**: da costruire (Fase 2)
- **Nuoro**: parte solo dopo aver finito Olbia + scaffolding template

## Open questions

- **Modello RT Olivetti di Hair Rich?** Determina se Path A (integrazione read-only) è fattibile o si skippa
- **Hair Rich vende mai B2B (yacht/hotel)?** Determina priorità di Fatture in Cloud integration
- **Stripe Terminal vs SumUp Air come primo POS plugin?** SumUp consigliato (più diffuso in IT)
- **Dominio definitivo:** ancora da comprare. Per ora `PUBLIC_SITE_URL` resta env var, niente hardcoded nel codice

---

## 🏁 Sprint finale verso presentazione lunedì 1 giugno 2026

Piano completo in `~/.claude/plans/aspetta-per-il-go-tidy-treehouse.md`.
Sintesi:

### Sessione E1 — Desktop UX rebalance (priorità massima, ~10-12h)

15+ componenti `src/components/landing/*` si fermano a breakpoint `md:` (768px) senza
scalare a `lg:`/`xl:` → su monitor 1920px tutto si vede stretto. Pattern di fix sistematico:
- `gap-X md:gap-Y` → aggiungere `lg:gap-Z xl:gap-W` (Z≈1.5×Y, W≈2×Y)
- `py-X md:py-Y` → aggiungere `lg:py-Z xl:py-W` (hero: `py-16 md:py-32 lg:py-40 xl:py-48`)
- Font hero `text-[Xvw] md:text-[Yvw] lg:text-[Zvw]` → aggiungere `xl:text-[W]vw` con W≈0.85×Z
- Max-width fissi (es. `max-w-[420px]`) → scalare con `lg:max-w-[500px] xl:max-w-[600px]`

Componenti da rivisitare: HeroSection, ServicesSection, ManifestoSection, TeamSection,
WhyUsSection, GallerySection, ReviewsSection, ServicesHero, PortfolioHero, ShopHero,
ProductCatalog, StyleQuiz, HomeServiceFocus, Footer.

### Sessione E2 — SEO refinement (~5-7h)

- **E2.1 P0**: JSON-LD schema markup (LocalBusiness + BarberShop + Service ×3 + FAQPage +
  BreadcrumbList) in nuovi componenti `src/components/seo/JsonLd*.astro` mountati da
  `src/layouts/RootLayout.astro`. Letti da `salon_settings` + `services` + `cms_blocks`
  via fetch server-side a build time
- **E2.2 P1**: OG image brandizzata 1200×630 unica per tutte e 4 le lingue → `public/og-image.png`
- **E2.3 P1**: `&display=swap` su Google Fonts; robots.txt sitemap URL via env var; meta
  description specifica per /login + /registrazione
- **E2.4 P2**: per-page metadata audit (legal pages, recensione/[token], coupon/[code])
- **E2.5 P2**: lazy loading + `astro:assets` <Image /> sulle gallery e hero non-LCP

### Sessione E3 — Polish + assets (~3-5h)

- LoginForm bg da Unsplash → asset locale Hair Rich
- i18n DE check (potenziali stringhe italiane lasciate)
- Manifest icon + favicon variants verify
- Lighthouse 6 pagine, target Performance ≥85, SEO ≥95, A11y ≥90, BP ≥95
- Manual click-through end-to-end con regression mobile

### Sequence operativa

| Quando | Sessione |
|---|---|
| Mer 27 sera | E1 partial (HeroSection + ServicesSection + Manifest + Footer) |
| Gio 28 | E1 complete + E2.1 JSON-LD |
| Ven 29 mattina | E2.2-E2.5 |
| Ven 29 pomeriggio | E3.1-E3.3 |
| Sab/Dom | E3.4 Lighthouse + spot fixes |
| Dom sera | E3.5 click-through end-to-end |
| Lun mattina | last-mile fixes |

### File che NON vengono toccati durante lo sprint

Edge Functions, migrations DB, admin views, staff portal, customer profile, Notification
Router — già funzionali. Fix solo se Lighthouse li segnala.

---

## Stack

- **Astro 6** (SSG, ~50 pagine pre-rendered) + **React 19** islands
- **Supabase**: Postgres + Storage + Auth + RLS + RPCs
  - Project ref: `fznzfmgfsijhzjqcwmyt`
  - URL: `https://fznzfmgfsijhzjqcwmyt.supabase.co`
  - Service role key in `.env.local` come `SUPABASE_SERVICE_ROLE_KEY` (per script Node admin)
- **Tailwind CSS 4** + framer-motion + vaul Drawer
- **State**: zustand stores in `src/lib/store.ts` (`useBookingDrawer`, `useCartStore`, `useProductDrawer`, `useFavoritesStore`, `useToastStore`, `useBookingStore`, `useAuthStore`)

## Comandi critici

```bash
npm run build         # build statico (~6s, 50 pagine)
npm run dev           # dev server
git push origin main  # deploy Vercel automatico
```

Vincoli:
- Working dir: `c:\Users\daian\hair-rich` (Windows, shell PowerShell o Bash)
- Astro 6 ha breaking changes — leggere `node_modules/astro/dist/docs/` se in dubbio (vedi AGENTS.md)

---

## Sito pubblico — ✅ COMPLETO

Tutte le pagine consumer-facing sono live e funzionanti:

| Route | Componenti chiave | Stato |
|---|---|---|
| `/` | HeroSection, ServicesSection, ManifestoSection, WhyUsSection, TeamSection, GallerySection, ReviewsSection | ✅ |
| `/servizi` | ServicesHero (pitch + 3 metric + CTA), StyleQuiz (listino 3 SKU), HomeServiceFocus (taglio a domicilio yacht) | ✅ |
| `/lavori` | PortfolioHero (mosaic 4 foto), BeforeAfterSlider, PortfolioGallery (filter chips circolari + lightbox), FeaturedWork | ✅ |
| `/team` | TeamSection, InstagramSection (griglia 3-col mobile / 6-col desktop) | ✅ |
| `/prodotti` | ShopHero (4 card categorie: Capelli/Barba/Rasatura/Merchandising), ProductCatalog, FAQAccordion, MerchCTA (phone-only) | ✅ |
| `/contatti` | ContactHero, mappa, FAQ | ✅ |
| `/login`, `/registrazione` | Auth Supabase flow | ✅ |
| `/privacy`, `/cookie`, `/termini` | legal pages | ✅ |
| `/offline`, `/404` | PWA fallback + error | ✅ |

**Architettura globale**: SiteHeader + MobileTopBar + MobileBottomBar + BookingDrawer + CartDrawer + ProductDrawer + ToastViewport + CookieBanner + InstallPrompt sono mountati su ogni pagina.

**Booking = drawer-only**: niente più `/prenota`, tutto via `BookingDrawer` aperto con `useBookingDrawer().open()`.

**Foto reali da Supabase**:
- `asset/` bucket: foto salone (`salone-esterno`, `salone-vetrina`, `taglio-domicilio-yacht`, staff portraits, ecc.)
- `portfolio/tagli/` bucket: 12 foto curate per taglio (`taper-fade-01`, `mid-fade-01`, `low-fade-01`, `burst-fade-01`, `french-crop-01`, `buzz-cut-01`, `mullet-01` + alcuni `-02`). 10 foto vecchie sono ancora in `portfolio/provvisorio/` con `is_active=false` come backup.
- `products/` bucket: 13 foto prodotti (tutte WebP ottimizzate)

**Catalogo prodotti** (13 SKU attivi):
- Tutti **€20** tranne **Slick Gorilla €15**
- 3 prodotti eliminati di recente (reuzel-hair-tonic, marmara-crazy-pink-spray, marmara-hero-red-spray)
- Aggiunto: **Mr Bear Beard Brew Woodland** (`mr-bear-beard-brew-woodland.webp`)

**Servizi attivi** (3 SKU bookable):
- `taglio-classico` (Taglio capelli) — €20 / 30min — badge "Più scelto"
- `barba-sartoriale` (Taglio barba) — €10 / 30min
- `taglio-barba` (Combo) — €30 / 60min
- `taglio-domicilio` — DEATTIVATO (phone-only, gestito da HomeServiceFocus + MerchCTA tel: links)

---

## Admin gestionale — 🚧 PARZIALMENTE WIRED

Routes: `/admin` → `src/pages/admin/[...slug].astro` → `AdminApp.tsx` → `AdminLayout.tsx` con sidebar.

**17 view in `src/components/admin/views/`**:

| View | DB? | Stato |
|---|---|---|
| `dashboard.tsx` | ✅ | Wired. KPI cards + recent appointments. Manca: customer health alerts ("Da richiamare", clienti >90gg) |
| `agenda.tsx` | ✅ | Day view wired. **Manca drag&drop** (RPC `fn_admin_reschedule_appointment` esiste già) |
| `agenda-week.tsx` | ⚠️ | Week-view aggiunta ma da rifinire |
| `chiusure.tsx` | ✅ | Time-off / blackout days wired su `time_off` |
| `clienti.tsx` | ✅ | Lista + dettaglio. **Manca**: CSV export, customer-at-risk filter |
| `ordini.tsx` | ✅ | Wired su `product_orders` |
| `servizi.tsx` | ✅ | Inline-editable. PriceCell / DurationCell / BadgeCell pattern |
| `prodotti.tsx` | ✅ | Inline-editable + toggle attivo |
| `staff.tsx` | ✅ | Lista + toggle attivo. **Manca**: editor orari settimanali (working_hours), sort_order drag |
| `orari.tsx` | ⚠️ | Stub iniziale, da finire |
| `foto-risultati.tsx` | ⚠️ | Lista appointment_photos, da rifinire |
| `statistiche.tsx` | ⚠️ | Stub. RPC `fn_admin_stats_range` esiste ma UI da costruire (recharts) |
| `marketing.tsx` | ⚠️ | Stub. Tabella `review_overrides` esiste. Da wire-up |
| `gamification.tsx` | ⚠️ | Stub. Tabella `coupons` esiste. Da wire-up |
| `cms.tsx` | ⚠️ | Stub. Tabella `cms_blocks` (6 keys popolate). Da wire-up con TipTap |
| `impostazioni.tsx` | ⚠️ | Stub. Tabella `salon_settings` (1 row) esiste. Da wire-up |
| `onboarding.tsx` | ⚠️ | Stub. Wizard 4-step da finire + guard in AdminLayout |

**RPC esistenti** (`supabase/migrations/20260518_0018_admin_reports.sql`):
- `fn_admin_stats_range(p_from, p_to)` → JSON aggregato per dashboard
- `fn_customers_at_risk()` → clienti >90gg da rivisitare
- `fn_admin_reschedule_appointment(p_id, p_start, p_staff)` → conflict-checked update

---

## Profilo cliente — 🚧 PARZIALMENTE WIRED

Routes: `/profilo`, `/profilo/appuntamenti`, `/profilo/impostazioni`, `/profilo/referral` → `[...slug].astro` → `ProfiloApp.tsx` → `ProfiloLayout.tsx`.

**4 view in `src/components/profilo/views/`**:

| View | Stato |
|---|---|
| `dashboard.tsx` | ⚠️ Mostra prossimi appuntamenti + loyalty progress. Da rifinire (data binding) |
| `appuntamenti.tsx` | ⚠️ Lista storico/futuri. **Manca**: cancel (RPC `fn_cancel_appointment_by_customer` + lead-time policy da `salon_settings.cancel_min_hours`) + reschedule (riusa BookingDrawer edit-mode). Cancel **triggera waitlist auto-notify** se lead-time >3h. |
| `impostazioni.tsx` | ⚠️ Form dati personali + privacy. Da wire-up completo |
| `referral.tsx` | ⚠️ Codice referral + credit history. Tabella `referrals` esiste, RPC da completare |

Componenti `_shared`: `AppointmentPhotos`, `BirthdayBanner`, `LoyaltyProgress`.

---

## 🔴 Cosa resta da fare (priorità prossima sessione)

### 1. Gestionale admin completo
Round 2 + 3 + 4 del piano già scritto in `C:\Users\daian\.claude\plans\nella-home-la-navabar-jazzy-tide.md`:
- **`impostazioni.tsx`** wire-up reale (singleton row `salon_settings`)
- **`cms.tsx`** wire-up con editor TipTap su `cms_blocks` (6 keys: manifesto_h1, footer_tagline, faq_json, ecc.)
- **`marketing.tsx`** moderation reviews + toggle pubblicazione su `review_overrides`
- **`gamification.tsx`** CRUD coupon + generator (compleanno, referral, win-back)
- **`statistiche.tsx`** dashboard recharts (revenue, top staff, no-show, cohort)
- **`onboarding.tsx`** wizard wire-up + guard in AdminLayout
- **`agenda.tsx`** drag&drop con `@dnd-kit/core` (RPC già pronta)
- **`staff.tsx`** sub-form orari settimanali su `working_hours`
- **`clienti.tsx`** CSV export + "da richiamare" filter
- **`dashboard.tsx`** customer health alerts box

### 2. Profilo cliente perfetto
- Dashboard con next-appointment hero card animata
- Appuntamenti: cancel (con policy lead-time da `salon_settings`) + reschedule (riusa BookingDrawer in modalità edit)
- Impostazioni: avatar upload, password change, soft delete
- Referral: copy code button, lista invitati, credit balance, share via Whatsapp/SMS
- Notifiche browser per appuntamento imminente

### 3. Pagina staff (NON ESISTE ANCORA)
Il cliente ha chiesto una "pagina profilo staff". Da chiarire all'inizio della prossima sessione: si intende
(a) view profilo staff dentro admin (gestione orari/permessi propria)
(b) pagina pubblica con bio + portfolio per ogni staff (tipo /team/cristian)
(c) entrambe

Sospetto sia (a)+(b). Da decidere con il cliente.

---

## Convenzioni critiche del codebase

- **No commenti se non necessari** (vedi AGENTS.md). Identificatori auto-esplicativi.
- **Niente backwards-compat hacks**: se elimini codice, eliminalo davvero.
- **Foto via helper**: `assetImageUrl()`, `portfolioImageUrl()`, `productImageUrl()` con `width/quality/format` params. Usa `*Srcset()` per responsive.
- **Booking sempre via drawer**: `useBookingDrawer().open()` + opzionale `useBookingStore().setService(id)` per preselezione.
- **CTA primarie**: classi `cta-shine cta-pulse` (definite in `globals.css`).
- **Ordinali editorial** (01, 02…) come watermark gigante nelle hero — pattern consolidato.
- **Mobile-first**: tutte le hero hanno layout mobile dedicato (vedi HeroSection con `items-center md:items-start`).
- **iOS-safe interactions**: BeforeAfterSlider e marquee usano workaround espliciti (native addEventListener, CSS keyframes invece di framer reduced-motion).

## Pattern riusabili

- **Inline-editable cells** (admin): `PriceCell` / `DurationCell` / `BadgeCell` in `servizi.tsx`
- **Toggle attivo**: pattern in `prodotti.tsx` / `servizi.tsx`
- **Realtime subscribe**: `supabase.channel().on('postgres_changes', ...)` (non ancora usato in admin)
- **Toast**: `useToastStore.getState().push({ type, message })`
- **Booking CTA**: usa `<BookingCtaButton label="..." />` da `src/components/ui/BookingCtaButton.tsx`

## File chiave

```
src/
├── pages/
│   ├── index.astro              # home (delegates to HomeContent.astro)
│   ├── servizi.astro            # /servizi
│   ├── lavori.astro             # /lavori (portfolio)
│   ├── prodotti.astro           # /prodotti (shop)
│   ├── team.astro               # /team
│   ├── admin/[...slug].astro    # admin SPA mount
│   ├── profilo/[...slug].astro  # client profile SPA mount
│   └── ...                       # legal, login, etc
├── components/
│   ├── admin/                   # AdminApp + AdminLayout + views/
│   ├── profilo/                 # ProfiloApp + ProfiloLayout + views/
│   ├── booking/BookingDrawer.tsx
│   ├── shop/                    # CartDrawer, ProductDrawer, MerchCTA
│   ├── landing/                 # tutte le sezioni del sito pubblico
│   └── ui/                      # SiteHeader, MobileTopBar, MobileBottomBar, BookingCtaButton, etc
├── lib/
│   ├── supabase/queries.ts      # TUTTI gli helper fetch + image URL
│   ├── supabase/types.ts        # TypeScript types DB
│   ├── store.ts                 # zustand stores
│   └── constants.ts             # SITE constants (phone, instagram, ecc)
├── i18n/                        # it.ts, en.ts, fr.ts, de.ts + useLang hook
└── styles/globals.css           # Tailwind 4 base + cta-shine + marquee keyframes

supabase/migrations/             # 21 migrations versionate
```

## Credenziali (in `.env.local`)

```
PUBLIC_SUPABASE_URL=https://fznzfmgfsijhzjqcwmyt.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<service role JWT>     # per script Node admin
```

Management API token per ops da CLI: nel password manager del cliente (variabile `SUPABASE_MGMT_TOKEN` se la esporti in shell).

## 🧩 Dipendenti digitali — 101 idee valutate

Legenda:
- ✅ già fatto / wire-up in corso (almeno parziale)
- ⏸️ utile, in attesa di decisione cliente (ROI / budget / priorità)
- ❌ non adeguato (overkill per un barber a 2-chair, fuori scope, già coperto da tool esterni gratis)

**Conteggio**: 14 ✅ · 67 ⏸️ · 20 ❌

### Comunicazione & Reminder

| # | Idea | Stato | Nota |
|---|---|---|---|
| 1 | 💬 Reminder WhatsApp | ⏸️ | Top ROI doc. Foundation: WhatsApp Cloud API gratuita |
| 2 | 📩 Notifiche SMS | ⏸️ | Fallback per non-WA, costo per SMS (~€0,04) |
| 3 | 🔄 Promemoria Rinnovo | ⏸️ | Barber → ogni 3-4 settimane. Fattibile su appointments history |
| 4 | 🎂 Birthday Campaign | ✅ promosso (con flag) | `customers.birthday` field esiste. Cron quotidiano 09:00 → coupon "regalo compleanno" valido 7gg via Router. Open rate 80%+. Effort ~3h. Skills Hub key: `birthday_campaign`. |
| 5 | 🎯 Campagne Riattivazione | ✅ promosso (con flag) | RPC `fn_customers_at_risk` esiste. Cron settimanale → clienti >90gg + ≥2 visite → coupon auto (#45) + msg via Router. Tono "Ti aspettiamo" non commerciale invadente. Skills Hub key: `reactivation_campaigns`. |
| 6 | 📣 Promo Last Minute | ✅ promosso (con flag + mitigations) | **Mitigations**: solo clienti abituali (≥3 visite/6 mesi), max 1 promo/mese per cliente, sconto cap -15%, **trigger MANUALE** dal titolare via Telegram alert (no automatico — il titolare valuta), slot valido solo oggi/domani. Quando l'agenda di domani ha buchi (rilevato da `fn_day_density`), Telegram tap "Attiva promo" → invio via Router al subset eligible. Skills Hub key: `last_minute_promo`. |
| 7 | 💌 Newsletter Automatica | ⏸️ | Valore basso per un barber 2-chair |
| 8 | 🌱 Campagne Stagionali | ⏸️ | Natale ok, San Valentino meno barber |
| 9 | 🔔 Notifiche Push Web | ✅ promosso (con flag + router) | **Master flag** `push_enabled` in `salon_settings`. **Vincolo critico**: NON inviare push se lo stesso evento è già stato spedito via WA/email — vedi sezione "Notification Router" sotto. Coverage realistica: 15-25% utenti registrati. Foundation PWA già pronta. |
| 10 | ✅ WhatsApp Business API | ⏸️ | Foundational per #1, #2, #3, #6 |

### Prenotazione & Booking

| # | Idea | Stato | Nota |
|---|---|---|---|
| 11 | ⏳ Waitlist Manager | ✅ promosso (design ricco) | **Trigger**: cancellazione cliente in /profilo/appuntamenti (RPC `fn_cancel_appointment_by_customer`). **Lead-time rule**: auto-notify solo se cancellazione >3h prima (configurable). **Token validity adattiva**: 24h se >7gg, 6h se >24h, 2h se >6h, 45min se >3h, no notify se <3h. **Soft-reservation**: slot fantasma con `status=soft_reserved` durante token window → escluso da `fn_available_slots`. **Sender iniziale**: Gmail SMTP via Nodemailer (`GMAIL_USER`+`GMAIL_APP_PASSWORD`); architettura channel-agnostic, switch WA Cloud quando #1 attivato. **DB**: tabella `waitlist` + estensioni `appointments` (cancelled_at, cancelled_by, cancellation_reason) + `cancellation_history`. **Master flag**: `waitlist_enabled` in `salon_settings`. **Edge case da gestire**: ghosting (auto-remove dopo 3 missed), salone chiuso, cliente ritira waitlist, prenotazione autonoma rimuove waitlist, walk-in manuale da admin, slot già notificato a qualcun altro. Visibilità in /admin/agenda con badge "👀 in waitlist". |
| 12 | 📲 QR Code Check-in | ⏸️ | Niche per un barber piccolo |
| 13 | 💳 Deposito Anticipo | ⏸️ | Utile per combo €30. Stripe integration |
| 14 | 🤳 Booking da Instagram | ✅ | Già funziona — basta il link in bio al sito |
| 15 | 💡 Preventivo Automatico | ❌ | 3 SKU a prezzo fisso (€10/€20/€30), no preventivo |
| 16 | 💬 Chatbot Prenotazioni | ⏸️ | Utile fuori orario, OpenAI + supabase RPC |
| 17 | 📱 Bot Telegram Prenotazioni | ❌ | Niche in Sardegna, basso ROI |
| 18 | 🤖 Agente Preventivi WhatsApp | ❌ | Prezzi fissi, non serve calcolatore |
| 19 | 🔗 Booking da Google | ✅ promosso (con flag) | Reserve with Google: il pulsante "Prenota" appare direttamente sul profilo Google Business. Setup richiede approvazione partner program Google (~1-2 settimane). Traffico free dai motori di ricerca. Skills Hub key: `google_reserve`. |
| 20 | 📊 Analisi Abbandono Prenotazione | ⏸️ | GA4 funnel + WA recovery |

### AI & Intelligenza

| # | Idea | Stato | Nota |
|---|---|---|---|
| 21 | 🤖 Receptionist AI | ⏸️ | Alto valore, complesso. OpenAI + WA API |
| 22 | 💇 Consulenza Capelli AI | ❌ | 3 SKU barber, non serve consulenza foto |
| 23 | 🧠 Suggerimenti AI Gestionale | ✅ promosso (con flag) | Cron settimanale (lun 9:00) → analizza dati settimana → GPT-4o-mini genera 3-5 azioni operative → email al titolare. **Sub-flag** `weekly_suggestions_enabled` in `salon_settings`. Anonymize dati cliente. Costo ~€0.05/mese. Implementazione tecnica subito, attivazione effettiva dopo 60-90gg di dati reali. |
| 24 | 😊 Analisi Sentiment Recensioni | ⏸️ | Utile, Google + reviews table |
| 25 | 🎨 Generatore Contenuti AI | ✅ promosso (con flag) | Tool in admin: carica foto del lavoro → GPT-4o genera 3 caption Instagram + hashtag + best time to post. Tone configurabile per il brand. Risparmio 2h/settimana al titolare. Stesso engine LLM di #23/#31. Skills Hub key: `ai_content_generator`. |
| 26 | 🎙️ Risponditore Vocale AI | ⏸️ | Twilio missed call → SMS con link prenota |
| 27 | 📆 Calendario Editoriale AI | ⏸️ | Tool tipo Hootsuite + AI |
| 28 | 📈 Previsione Domanda | ⏸️ | Stat module — RPC esiste |
| 29 | 💰 Ottimizzatore Prezzi AI | ❌ | Prezzi fissi, irrilevante |
| 30 | 💬 Chatbot Instagram DM | ⏸️ | Meta API, utile per leads |

### Analytics & Report

| # | Idea | Stato | Nota |
|---|---|---|---|
| 31 | 📊 Report Mensile AI | ✅ promosso (con flag) | Cron 1° del mese 9:00 → analizza mese precedente → GPT-4o-mini genera report ricco (KPI + analisi + obiettivi) → email titolare (+commercialista opzionale). **Sub-flag** `monthly_report_enabled`. RPC `fn_admin_stats_range` esiste. Archivio storico in tabella `ai_reports`. Stesso engine di #23. |
| 32 | 📈 Performance Operatori | ⏸️ | Pianificato (statistiche.tsx) |
| 33 | 🏆 Classifica Operatori | ⏸️ | Gamification minor |
| 34 | 🗺️ Heatmap Clienti | ⏸️ | Customer ZIP/lat-lng → Leaflet heatmap |
| 35 | 🧮 Report Fiscale Trimestrale | ⏸️ | CSV per commercialista nel piano |
| 36 | 📉 Alert Calo Prenotazioni | ✅ promosso (con flag) | Cron settimanale (lun 09:00): se le prenotazioni della settimana sono >20% sotto la media ultime 8 settimane → alert Telegram al titolare con suggerimenti azione automatici ("Attiva promo last-minute #6", "Lancia campagna riattivazione #5"). Threshold configurabile. **Early warning systemico** anti-disastro. Skills Hub key: `bookings_drop_alert`. |
| 37 | ⏰ Analisi Orari di Punta | ✅ | RPC `fn_day_density` già attivo, UI parziale |
| 38 | 📡 Tracciamento UTM Campagne | ⏸️ | Cookie + UTM column in `appointments` |
| 39 | 📊 Integrazione Google Analytics | ⏸️ | GA4 non ancora integrato |
| 40 | 💹 Previsione Incassi Mensile | ⏸️ | Trivia query sulla agenda confermata |

### Gestione Clienti

| # | Idea | Stato | Nota |
|---|---|---|---|
| 41 | 📝 Scheda Tecnica Cliente | ❌ | Non serve formule colore per barber |
| 42 | 🎟️ Fidelity & Punti | ✅ promosso (con flag + config) | `LoyaltyProgress` UI esiste. **REQUISITI**: (a) master flag `loyalty_enabled` in `salon_settings`, default OFF. (b) admin /admin/gamification deve permettere configurazione COMPLETA: modello (a-stamp / a-punti / cashback), soglia reward, tipo reward (free service / sconto fisso / sconto %), validità giorni, bonus iniziale, regole anti-gaming. Niente hardcoded. Quando OFF: component nascosto in /profilo, trigger Postgres in pausa. |
| 43 | 🎫 Gestione Abbonamenti / Pacchetti | ✅ promosso (flag + in-salon sale, **NO Stripe**) | **Master flag** `packages_enabled` in `salon_settings`, default OFF. **Coerenza filosofica**: come tutto il sito, niente pagamenti online — il pacchetto si vende e si paga in salone (cash/POS). **Vendita**: admin-driven da `/admin/clienti/[id]` → bottone "Vendi pacchetto" → modale con catalogo + payment_method (cash/pos/bonifico/omaggio) + price_paid effettivo. **Email cliente**: ricevuta digitale via Gmail SMTP (no transazione online). **DB**: `service_packages` (catalogo CRUD admin) + `customer_packages` (con sold_by, sold_at, payment_method, price_paid_cents, notes) + `package_credit_id` in `appointments`. **Redemption**: invariato — BookingDrawer rileva crediti attivi → CTA "Usa 1 credito?". **Effort** ridotto: ~10h (no Stripe integration, no webhook, no reconciliation). |
| 44 | 🎁 Gift Card Digitali | ⏸️ | Stripe + coupons table |
| 45 | 🎪 Gestione Coupon & Sconti | ✅ promosso | Tabella `coupons` esiste. **REQUISITO**: master feature-flag `coupons_enabled` in `salon_settings` — il campo "Hai un codice?" nel BookingDrawer appare SOLO se il flag è ON. Default OFF. Toggle dal gestionale. |
| 46 | 🤝 No-show Manager (no lista nera) | ✅ promosso (con flag) | **REDESIGN**: nessun blocco automatico, mai. Dashboard `/admin/clienti/no-show` con lista cronologica no-show, counter per cliente, badge soft (🟡🟠🔴) visibile SOLO in admin. Click cliente → modale storico + bottone "📧 Chiedi spiegazione" che apre composer con **bozza email AI generata da GPT-4o-mini** (tono empatico, "tutto bene? posso aiutarti?"), editabile prima dell'invio. Canale configurabile (Email / Telegram cliente / WA se attivo). Tabella `noshow_outreach` per audit. Skills Hub key: `noshow_outreach`. |
| 47 | 🔐 Gestione Consensi GDPR | ✅ promosso (indispensabile legale) | **Obbligo legale Italia**. Schermata consensi separati: marketing, reminder appuntamenti, foto pre/post (#48), profilazione (#50), referral (#65). Salvataggio firmato (PDF archiviato in Supabase Storage). Revoca self-service da /profilo/impostazioni. Audit log integrazione (#58). Tabella `customer_consents` con timestamp + IP + versione policy. Skills Hub key: `gdpr_consents`. **Default: SEMPRE ON** (non disattivabile, è normativo). |
| 48 | 📸 Archivio Foto Clienti | ✅ | `appointment_photos` table + `AppointmentPhotos` component + admin foto-risultati.tsx |
| 49 | ⚠️ Gestione Allergeni | ❌ | Non rilevante per barber |
| 50 | 🏷️ Segmentazione Clienti | ✅ promosso (con flag) | Etichette auto + manuali. **Segmenti auto** (cron daily): 🆕Nuovo · 🔁Abituale · 💎VIP · 😴A rischio · 🚪Perso · ⚠️No-show · 🎂Compleanno mese · 🌍Turista · 🎁Referral. Tutte le soglie configurabili da admin. **Segmenti manuali** liberi (max 5/cliente, mai esposti al cliente). Tabella `customer_segments`. Badge in `/admin/clienti`, `/admin/agenda`, dashboard counter. **Foundation per #4, #5, #6, #62** (target chirurgico vs blast generico). Skills Hub key: `customer_segments`. |

### Gestione Team

| # | Idea | Stato | Nota |
|---|---|---|---|
| 51 | 🕐 Gestione Turni Operatori | ✅ | `working_hours` table + orari.tsx (parz, da finire) |
| 52 | 📅 Sync Google Calendar staff | ✅ promosso (con flag) | Ogni operatore connette il suo Google Calendar personale (OAuth). **Bidirezionale**: (1) appuntamenti Hair Rich appaiono auto nel calendar personale come read-only. (2) eventi "occupato" creati manualmente nel calendar personale dello staff sincronizzano in `time_off` → bloccano slot booking. Niente doppie prenotazioni con impegni privati. Skills Hub key: `staff_gcal_sync`. |
| 53 | 🖨️ Stampa Agenda Giornaliera | ⏸️ | PDF export da agenda.tsx |
| 54 | 💰 Simulatore Guadagno Operatore | ⏸️ | Calcolo su appointments confermati |
| 55 | 🔑 Gestione Permessi Operatori | ⏸️ | RLS base c'è, granulare da fare |
| 56 | 📱 Dashboard Mobile Operatore | ⏸️ | Admin è responsive, no PWA dedicata staff |
| 57 | ⚙️ Onboarding Operatore Auto | ⏸️ | onboarding.tsx admin view stub esiste |
| 58 | 📋 Log Attività Gestionale | ✅ promosso (con flag) | Trigger Postgres su tutte le tabelle critiche → tabella `activity_log` con before/after diff. Admin view `/admin/log` con feed cronologico, filtri (categoria/attore/target/data), diff viewer, export CSV. Categorie: appointments, customers, payments, catalog, staff, system, login. **Sub-config**: retention (90gg/12m/24m/forever), alert critici via Telegram (login falliti, cambi prezzo, VIP cancel), visibilità per-staff. Default: tipi `high` priority sempre ON, gli altri opt-in. Skills Hub key: `activity_log`. |
| 59 | 📆 Calendario Ferie Automatico | ✅ | `time_off` table + chiusure.tsx admin view |
| 60 | 💬 Chat Interna Team | ❌ | WA/Telegram esterno fanno meglio |

### Marketing & Social

| # | Idea | Stato | Nota |
|---|---|---|---|
| 61 | 📱 Social Scheduler | ❌ | Buffer/Later gratis fanno meglio |
| 62 | ⭐ Review Harvester | ✅ promosso (con flag + anti-spam) | Top ROI — auto-trigger 2h post-app. **REQUISITI**: (a) master flag `reviews_enabled` in `salon_settings`, default OFF. (b) **anti-spam multilivello** per evitare invii infiniti: L1 click-through tracking (`routed_to_google_at`), L2 self-report (`confirmed_left_review_at`), L3 one-shot per appointment, L4 cooldown 90gg per cliente, L5 verifica fuzzy-match Google Places API. (c) Tabella nuova `review_requests` con tutti i flag. (d) Pagina cuscinetto `/recensione/[token]` con smart-routing 😊/😞. (e) Admin funnel dashboard. Tutto configurabile da gestionale. |
| 63 | 🗣️ Raccolta Testimonianze | ⏸️ | Form video, upload S3 |
| 64 | 📸 Gallery Before/After | ✅ | BeforeAfterSlider component live in /lavori |
| 65 | 🤝 Referral Automatico | ✅ promosso (con flag) | `referrals` table + /profilo/referral page esistono. **REQUISITO**: master flag `referrals_enabled` in `salon_settings`. Quando OFF → /profilo/referral mostra placeholder "Programma in arrivo"; nessun campo "codice amico" nel BookingDrawer. Default OFF. |
| 66 | 📡 Integrazione Meta Ads | ⏸️ | Pixel + Conversion API |
| 67 | 💬 Bot Risposta Commenti Social | ❌ | Edge case, complessità Meta API |
| 68 | 🔗 Link in Bio Dinamico | ✅ | Il sito stesso serve da link-in-bio aggiornato dal DB |
| 69 | 📱 Integrazione TikTok | ⏸️ | TikTok Pixel, useful per giovani |
| 70 | 📲 Alert Telegram Titolare | ✅ promosso (con flag) | Bot Telegram dedicato via @BotFather. **Master flag** `telegram_alerts_enabled` in `salon_settings`. **Config admin granulare**: quali eventi notificare (toggle per tipo: nuova prenotazione / cancellazione / recensione negativa / no-show / slot vuoto / coupon esaurito / win-back / VIP booking / errore tecnico / daily digest 18:00), priorità minima, quiet hours (default 22-08), chat IDs multipli. Setup ~5 min titolare. Costo €0. **Variabile** `TELEGRAM_BOT_TOKEN` in `.env.local`. Fase 2: inline buttons per actions inline (conferma, sposta, cancel). |

### Vendite & Revenue

| # | Idea | Stato | Nota |
|---|---|---|---|
| 71 | 🛒 Upsell Intelligente | ✅ promosso (con flag) | Step opzionale prima della conferma in BookingDrawer: se taglio → propone "Aggiungi barba +€10". Max 1 upsell per booking, dismiss permanente per cliente che dice "no grazie 3 volte". +20% AOV stimato. Skills Hub key: `smart_upsell`. |
| 72 | 📋 Sondaggio Post-Visita | ✅ promosso (con flag) | Email/Telegram cliente 2h post-appuntamento: 3 emoji 😊😐😞 + 1 campo libero opzionale. **Privato** (NON va su Google) — serve a intercettare insoddisfazioni PRIMA che diventino recensioni pubbliche. Separato da #62 Review Harvester che invece spinge i felici verso Google. Dashboard NPS in `/admin/marketing`. Tabella `customer_surveys`. Skills Hub key: `post_visit_survey`. |
| 73 | 💸 Bot Recupero Crediti | ❌ | Barber non ha insoluti tipici |
| 74 | 📅 Gestione Listino Stagionale | ❌ | Prezzi fissi, no logica stagionale |
| 75 | 📦 Scorte & Riordino | ✅ promosso (con flag) | `products.stock` esiste. Estensione: `stock_low_threshold` + `stock_critical_threshold` per prodotto. Cron daily 08:00 → check soglie → Telegram alert titolare con trend velocità vendite. `/admin/prodotti` esteso: barra progresso colorata, sort by stock, quick action "Riordina" che apre modale con quantità suggerita (storico × 30gg) + selettore fornitore (#76) + genera PDF ordine bozza. Auto-decremento stock al completamento `product_orders`. Skills Hub key: `stock_alerts`. |
| 76 | 🏠 Rubrica Fornitori | ✅ promosso (con flag) | Nuove tabelle `suppliers` (contatti completi + payment_terms + notes) e `supplier_orders` (storico ordini con items jsonb + status + PDF). Colonna `products.default_supplier_id`. Admin `/admin/fornitori` con lista + dettaglio + storico + quick "Nuovo ordine" che genera PDF. Sinergia diretta con #75 (riordino in 2 click). Skills Hub key: `suppliers_directory`. |
| 77 | 🛠️ Manutenzione Attrezzature | ⏸️ | Cron + checklist, minor |
| 78 | 🔁 Follow-up Post-Acquisto | ⏸️ | Utile per click & collect orders |
| 79 | 💡 Widget Prezzi Dinamici | ✅ | Già wired — prezzi da `services` / `products` table |
| 80 | ⚙️ Onboarding Cliente Automatico | ✅ promosso (con flag) | Wizard 90 secondi al primo login `/profilo`: nome, telefono, **birthday** (sblocca #4), consensi GDPR (#47), foto profilo opzionale, preferenze taglio. Stepper UX con skip per ogni campo non-required. Re-prompt soft dopo 3 visite per i campi mancanti. **Foundation per tutte le campagne mirate** (#4, #5, #50): senza dati cliente popolati, niente funziona davvero. Skills Hub key: `customer_onboarding`. |

### Integrazioni

| # | Idea | Stato | Nota |
|---|---|---|---|
| 81 | 🧾 Integrazione Fatture in Cloud | ⏸️ | API Fatture in Cloud disponibile |
| 82 | 💾 Backup & Export Dati | ✅ | Supabase backup auto attivo; CSV export admin in piano |
| 83 | 🕑 Aggiornamento Orari Google | ✅ promosso (con flag) | Google Business Profile API: quando titolare aggiorna orari/chiusure straordinarie in `/admin/chiusure` o `salon_settings`, sync automatico verso Google Business. Auth OAuth Google. Zero clienti arrivati per trovare chiuso = zero recensioni negative "ho trovato chiuso". Skills Hub key: `google_hours_sync`. |
| 84 | 📌 Monitoraggio Posizione SEO | ❌ | Ahrefs/Semrush/Search Console gratis |
| 85 | 🗺️ Integrazione Apple Maps | ❌ | No API pubblica per piccoli business |
| 86 | 💳 Integrazione Pagamenti POS | ⏸️ | Stripe Terminal o SumUp webhook |
| 87 | 📡 Monitoraggio Uptime Sito | ❌ | UptimeRobot/Better Stack gratis |
| 88 | 📄 Generatore QR Promozioni | ✅ promosso (con flag) | Admin genera QR univoci stampabili per coupon fisici (volantini, cartoline, vetrina di bar/palestre/hotel). Ogni QR è un coupon code con UTM tracking → vedi esattamente quante prenotazioni vengono dal volantino X vs Y. Sinergia con #45. Skills Hub key: `qr_promotions`. |
| 89 | 📺 Dashboard TV Salone | ❌ | Overkill per un 2-chair barber |
| 90 | 📦 Integrazione Corriere Spedizioni | ❌ | Solo click & collect, no spedizioni |

### Gestione Avanzata

| # | Idea | Stato | Nota |
|---|---|---|---|
| 91 | 🌍 Assistente Multilingua | ✅ | Sito già i18n (it/en/fr/de). Chatbot multilingua → ⏸️ |
| 92 | 🏢 Gestione Multi-sede | ❌ | Un solo salone, overkill |
| 93 | 🔄 Sincronizzazione Prezzi Multi-sede | ❌ | Vedi 92 |
| 94 | 📜 Gestione Contratti Operatori | ❌ | HR niche, fuori scope |
| 95 | 📄 Generatore Fattura Proforma | ⏸️ | Utile se entrano clienti B2B (hotel) |
| 96 | 📊 Report Accessi Clienti | ⏸️ | GA4 fa la maggior parte |
| 97 | 🔔 Inbox Notifiche Centralizzata admin | ✅ promosso (con flag) | Sostituisce la dispersione Telegram/email/log con UN'unica inbox in cima a `/admin` (badge counter unread in sidebar). Ogni evento operativo (nuove prenotazioni, cancellazioni, no-show, recensioni, scorte basse, alert calo #36, scadenze pacchetti, ecc) entra qui. Archivable, filterable per categoria/priorità/data. Realtime tramite `useAdminLiveBookings` hook + Supabase Realtime. Sub-source di verità per `notifications_sent`. Skills Hub key: `admin_inbox`. **Default: SEMPRE ON** (è infrastruttura core admin). |
| 98 | 🔁 Automazione Feedback Strutturato | ⏸️ | Diverso da #62 — survey per servizio |
| 99 | 🗂️ Audit Trail Appuntamenti | ⏸️ | Variante di #58 |
| 100 | 📱 App Cliente PWA | ✅ | Il sito è già installable PWA |
| 101 | 🔍 Ricerca Avanzata Clienti | ✅ promosso (con flag) | Query builder visuale in `/admin/clienti`. **Filtri concatenabili**: segmento (#50), servizio fatto, operatore preferito, # visite, spesa totale, ultima visita, no-show, compleanno, referral source, coupon usati, pacchetto attivo, indirizzo, età, lingua, note libere. Salva ricerche con nome. Azioni batch: msg via Router, segmento manuale, coupon mirato, export CSV. 5 ricerche **template predefinite** (VIP a rischio, Compleanno mese, Top spender, Da riattivare, ecc). Stack: react-querybuilder + RPC `fn_search_customers(p_filters jsonb)` + materialized view aggregate. **Foundation dati già pronta**: tabelle `customers`/`appointments`/`product_orders` si popolano automaticamente dal flow live (booking online, ordini, completion) — la skill lavora su dati reali dal giorno 1, niente backfill. Skills Hub key: `advanced_customer_search`. |

## 📅 Roadmap a 3 chat — come orchestrare il lavoro

> Il sistema si costruisce in 3 chat Claude Code indipendenti.
> All'inizio di ogni chat l'utente scrive: **"Sei la Chat N — leggi CLAUDE.md sezione `Chat N`, esegui i task in ordine, committa+pusha alla fine di ogni task."**
> Chat 1 deve completarsi PRIMA delle altre. Chat 2 e Chat 3 possono girare in parallelo dopo.

---

### Chat 1 · Foundation + Owner UX 🏗️

**Scope**: scheletro infrastrutturale. Dopo questa chat il gestionale ha il sistema di flag, il routing notifiche, gli alert al titolare, e i fondamenti legali/UX cliente.

**Dipendenze**: nessuna (parte per prima, blocca le altre).

**File "owned" da Chat 1** (le altre chat NON toccano):
- `src/components/admin/views/skills-hub.tsx` (nuovo)
- `src/components/admin/views/inbox.tsx` (nuovo)
- `src/components/admin/views/log.tsx` (nuovo)
- `src/components/admin/views/impostazioni.tsx` (estensione)
- `src/components/admin/AdminLayout.tsx` (sidebar + badge inbox)
- `src/lib/skills/registry.ts` (nuovo — metadata 101 skill)
- `src/lib/notifications/router.ts` (nuovo)
- `src/lib/notifications/channels/gmail.ts` (nuovo)
- `src/lib/notifications/channels/telegram.ts` (nuovo)
- `src/components/profilo/views/impostazioni.tsx` (consensi GDPR + preferenze canale)
- `src/components/profilo/_shared/OnboardingWizard.tsx` (nuovo)
- `supabase/functions/notifications-router/index.ts` (Edge Function nuova)
- `supabase/functions/admin-inbox-realtime/index.ts` (nuovo)
- Migrations 0021-0028 (vedi sotto)

**Task list in ordine** (committa + pusha a fine di ognuno):

1. **Migration `skills_config`** — tabella registry + seed con tutte le 101 skill_key in `enabled=false`
2. **Migration `customer_consents`** — schema GDPR signed records con versione policy
3. **Migration `customer_notification_preferences`** — JSONB column su `customers`
4. **Migration `notifications_sent`** — audit log centrale per Router
5. **Migration `activity_log` + triggers** — su tutte le tabelle critiche (#58)
6. **Migration `admin_inbox_items`** — items con type/payload/read_at
7. **Migration `cms_blocks` seed templates** — email/telegram template per ogni eventType
8. **Notification Router lib + Edge Function** — `sendCustomerNotification` + `sendOwnerAlert`
9. **Gmail SMTP channel** — Nodemailer con app password, env `GMAIL_USER`/`GMAIL_APP_PASSWORD`
10. **Telegram bot channel** — `TELEGRAM_BOT_TOKEN`, recipient `salon_settings.owner_telegram_chat_id`
11. **Skills registry TypeScript** — array con 101 skill (icon, nameIT, descriptionIT, exampleIT, benefitIT, effortHours, category, relatedSkills)
12. **Skills Hub view `/admin/funzionalita`** — cards grid filtrabili, toggle ON/OFF persist su `skills_config`, configure modal per skill
13. **Activity Log view `/admin/log`** — feed cronologico + filtri + diff viewer + export CSV
14. **Inbox admin view `/admin/inbox`** — list + filters + realtime via Supabase channel
15. **Sidebar badge inbox** in `AdminLayout` con counter unread
16. **GDPR consents** — onboarding del primo accesso `/profilo` raccoglie firme + `/profilo/impostazioni` revoca/aggiornamento
17. **OnboardingWizard `/profilo`** — wizard 90s al primo accesso (birthday, foto, preferenze taglio, consensi)
18. **Cancel + Reschedule appointment in /profilo** — RPC `fn_cancel_appointment_by_customer` + RPC `fn_reschedule_appointment_by_customer` + UI in `/profilo/appuntamenti` (precondizione per Chat 2 waitlist)
19. **`/admin/impostazioni` wire-up real** — singleton `salon_settings` con tutti i campi (cancel_min_hours, default channel priority, owner Telegram chat ID, quiet hours, ecc.)

**Done criteria**:
- Build `npm run build` verde, 50+ pagine
- `/admin/funzionalita` mostra 101 skill, tutti OFF
- Toggle di una skill → persist su `skills_config`
- Invio test notifica via Router (a un email finto + a un Telegram bot finto) funziona
- Cliente onboarding wizard si completa
- Cliente può cancellare/spostare propri appuntamenti
- `/admin/inbox` riceve un evento "appointment created" in realtime
- `/admin/log` mostra l'audit trail di ogni edit

**Handoff a Chat 2/3**:
- Le altre chat trovano `skills_config` populated, possono attivare i loro flag specifici
- Router pronto, basta chiamare `sendCustomerNotification(customerId, eventType, payload)`
- Inbox pronta, basta inserire row in `admin_inbox_items`
- Activity log automatico per ogni trigger Postgres
- `salon_settings` ha tutti i campi config

---

### Chat 2 · Booking experience + Customer-facing 🛋️

**Scope**: tutto il flow di prenotazione potenziato (waitlist, no-show, pacchetti, sync calendar, push, sondaggi). Parte appena Chat 1 chiusa.

**Dipendenze**:
- Chat 1 completata (Router + skills_config + cancel /profilo)
- `salon_settings.cancel_min_hours` configurato
- Tabelle `notifications_sent` + `admin_inbox_items` operative

**File "owned" da Chat 2**:
- `src/components/booking/BookingDrawer.tsx` (estensioni: waitlist opt-in, package credit redemption, upsell step)
- `src/components/admin/views/waitlist.tsx` (nuovo)
- `src/components/admin/views/clienti-no-show.tsx` (nuovo, sotto-view di clienti)
- `src/components/admin/views/pacchetti.tsx` (nuovo)
- `src/components/profilo/views/appuntamenti.tsx` (lista crediti pacchetti attivi)
- `src/components/profilo/views/dashboard.tsx` (card "pacchetto attivo")
- `src/components/ui/PushOptInPrompt.tsx` (nuovo)
- `supabase/functions/waitlist-matcher/index.ts` (nuovo cron 15min)
- `supabase/functions/post-visit-survey-sender/index.ts` (nuovo cron 30min)
- `supabase/functions/push-sender/index.ts` (nuovo)
- Migrations 0029-0036

**Task list in ordine**:

1. **Migrations `waitlist` + `appointments` extension (cancelled_at, cancelled_by, soft_reserved status, package_credit_id)**
2. **RPC `fn_match_waitlist_entry(p_cancelled_appointment_id)`** + cron waitlist-matcher con soft-reservation + token validity adattiva
3. **BookingDrawer waitlist opt-in** — quando slot non disponibili → CTA "entra in lista"
4. **`/admin/waitlist`** view — coda con position, status, override manuale
5. **Migration `noshow_outreach` + `service_packages` + `customer_packages` + `customer_surveys` + `push_subscriptions`**
6. **`/admin/clienti/no-show`** dashboard — lista cronologica, counter, bottone "📧 Chiedi spiegazione" con bozza AI GPT-4o-mini
7. **`/admin/pacchetti`** — CRUD service_packages + sell modale in `/admin/clienti/[id]` (payment_method: cash/pos/bonifico/omaggio)
8. **BookingDrawer package credit detection** — se cliente ha crediti → CTA "Usa 1 credito? (gratis)"
9. **Cron `package-expiry-reminders`** — notifica clienti con crediti in scadenza <30gg
10. **Upsell step BookingDrawer** — "Aggiungi barba +€10" prima della conferma, dismiss "3 volte = mai più"
11. **Push subscriptions + opt-in UI** + Push Edge Function sender + integrate con Router come canale
12. **Sondaggio post-visita cron** + tabella `customer_surveys` + dashboard NPS in `/admin/marketing`
13. **Google Calendar OAuth integration** + `staff_gcal_tokens` table + sync bidirezionale Hair Rich ⇄ personal Gcal
14. **Google Business Profile API** — sync orari/chiusure straordinarie (`salon_settings` + `time_off` → Google)
15. **Google Reserve with Google** — registrazione partner program + endpoint conferma slot

**Done criteria**:
- Cliente cancella appointment in `/profilo` → cron waitlist-matcher invia notifica al #1 in lista entro 15 min (se lead-time >3h)
- Cliente in waitlist conferma via token → appointment creato, soft-reservation chiusa
- Cliente che ha pacchetto vede "Usa 1 credito" in BookingDrawer
- Push subscription si salva + invio test funziona
- Storico no-show visibile in admin con AI outreach pronto
- Google Calendar staff sincronizzato in entrambe le direzioni

**Handoff a Chat 3**:
- BookingDrawer pronto per coupon input field (slot UI a destra dell'upsell step)
- Push channel disponibile nel Router
- Tutti i flag relevant attivabili dalla Skills Hub

---

### Chat 3 · Marketing engine + AI + Insights 🚀

**Scope**: motore di marketing automation, AI assistants, analytics, operatività magazzino. Può girare in parallelo a Chat 2 ma con attenzione ai merge BookingDrawer.

**Dipendenze**:
- Chat 1 completata
- BookingDrawer base pronto (se Chat 2 in corso, coordinarsi sui merge)

**File "owned" da Chat 3**:
- `src/components/admin/views/gamification.tsx` (CRUD coupon + fidelity rules + referral admin)
- `src/components/admin/views/marketing.tsx` (campagne + reviews moderation + sondaggio NPS lettura)
- `src/components/admin/views/statistiche.tsx` (recharts dashboards)
- `src/components/admin/views/cms.tsx` (CMS lite con TipTap)
- `src/components/admin/views/fornitori.tsx` (nuovo)
- `src/components/admin/views/contenuti-ai.tsx` (nuovo — AI Content Generator)
- `src/components/admin/views/clienti.tsx` (estensione: query builder #101 + segment badges)
- `src/components/admin/views/dashboard.tsx` (customer health alerts box)
- `src/components/admin/views/prodotti.tsx` (estensione scorte + threshold)
- `src/components/profilo/views/referral.tsx` (wire-up completo)
- `src/components/profilo/views/dashboard.tsx` (loyalty progress card + segment badges interni — ma SOLO se mostrabili a cliente)
- `src/components/booking/BookingDrawer.tsx` (solo: coupon input field "Hai un codice?") — coordinarsi con Chat 2
- `src/pages/recensione/[token].astro` (nuovo — pagina cuscinetto Reviews)
- `src/pages/coupon/[code].astro` (nuovo — landing QR promo)
- `supabase/functions/birthday-sender/index.ts` (cron daily 09:00)
- `supabase/functions/reactivation-sender/index.ts` (cron weekly)
- `supabase/functions/ai-content-generator/index.ts` (OpenAI)
- `supabase/functions/ai-weekly-suggestions/index.ts` (cron lun 09:00 + OpenAI)
- `supabase/functions/ai-monthly-report/index.ts` (cron 1° del mese + OpenAI)
- `supabase/functions/reviews-harvester/index.ts` (cron 30min post-completed)
- `supabase/functions/reviews-google-verify/index.ts` (cron weekly — Places API fuzzy-match)
- `supabase/functions/bookings-drop-alert/index.ts` (cron weekly)
- `supabase/functions/stock-low-alert/index.ts` (cron daily 08:00)
- Migrations 0037-0048

**Task list in ordine**:

1. **Migrations coupon ecosystem** — `coupons` table extension + `coupon_redemptions` + `coupon_qr_batches` + `service_packages_referrals` (link referral-coupons)
2. **Migration `loyalty_config` + `loyalty_transactions`** — config rules customizable da admin + ledger
3. **Migration `customer_segments` + cron classifier**
4. **Migration `review_requests` + Google Place ID in `salon_settings`**
5. **Migration `ai_reports` + `ai_content_drafts`**
6. **Migration `suppliers` + `supplier_orders` + `products.default_supplier_id` + threshold columns**
7. **Migration `saved_searches`**
8. **`/admin/gamification`** — CRUD coupon, regole fidelity (modello a-stamp / a-punti / cashback, soglie reward), referral admin (link generator, lista invitati, credit tracking)
9. **Referral wire-up** completo: `/profilo/referral` page + share buttons + code generator + tracking conversioni
10. **Coupon input nel BookingDrawer** (coord. con Chat 2 per il merge)
11. **Birthday cron** + template messaggio Router-routed
12. **Reactivation cron** + RPC `fn_customers_at_risk` (esiste) + AI-drafted message option
13. **Reviews Harvester end-to-end** — cron, pagina cuscinetto `/recensione/[token]`, anti-spam 5 livelli, Google Places API fuzzy match
14. **Promo Last-Minute** — trigger Telegram manuale, target solo abituali, cap -15%, max 1/mese
15. **Customer Segments classifier cron** + badge UI in `/admin/clienti`, `/admin/agenda`, dashboard counters
16. **Ricerca Avanzata Clienti** — query builder react-querybuilder + RPC `fn_search_customers(p_filters jsonb)` + 5 ricerche template + saved searches + batch actions
17. **Statistiche admin view** — recharts (revenue daily, top services, top staff, no-show rate, cohort retention)
18. **AI Content Generator** — upload foto + GPT-4o-mini → 3 caption + hashtag + best time to post
19. **AI Weekly Suggestions** + **AI Monthly Report** — Edge Functions + email titolare via Gmail SMTP
20. **Bookings Drop Alert** — cron weekly + Telegram + suggested actions
21. **Stock Low Alert** — cron daily + Telegram + reorder modal
22. **Suppliers Directory** — `/admin/fornitori` CRUD + PDF order generator
23. **CMS lite** — `/admin/cms` con TipTap editor su `cms_blocks` (testi homepage, footer, FAQ, email/telegram templates)
24. **QR Promotions** — generatore QR univoci + UTM tracking + landing `/coupon/[code].astro`

**Done criteria**:
- Tutti i 14 skill marketing/AI/ops sono ON in Skills Hub e funzionanti
- Almeno una campagna birthday + una riattivazione + un review request inviati end-to-end
- Dashboard recharts popolata con dati reali
- Ricerca avanzata clienti restituisce risultati corretti su query composite
- AI report mensile arriva in casella email di test

**Handoff finale**:
- Sito + admin + profilo cliente sono operativi al 100%
- Tutte le skill Skills Hub disattivate by default — il titolare attiva quelle che vuole
- Documentazione utente generata in `docs/manuale-titolare.md` (opzionale)

---

### ⚠️ Note sul merge

- **BookingDrawer** è il file più "conteso": Chat 2 ci aggiunge waitlist opt-in + package credit + upsell. Chat 3 ci aggiunge coupon input field. **Risoluzione**: Chat 3 fa merge DOPO Chat 2 e si limita alla sua slot UI senza toccare il resto.
- **Migrations**: Chat 1 ha usato **0021-0029** (task 18 ha richiesto una slot RPC extra), Chat 2 parte da **0030-0037**, Chat 3 da **0038-0048** → niente collisioni numeriche.
- **`salon_settings`**: tutte e 3 le chat aggiungono colonne. Per evitare conflitti: ogni chat fa la sua migration di ALTER TABLE atomica con `ADD COLUMN IF NOT EXISTS`.
- **`skills_config`**: Chat 1 fa il seed iniziale di tutte le 101 skill_key. Chat 2 e Chat 3 non toccano la tabella, solo leggono il flag della loro skill.

---

### 🎛️ Skills Hub — la pagina "centro funzionalità" dell'admin

**Concept**: una pagina dedicata in admin (`/admin/funzionalita` o `/admin/skills`) dove il titolare vede TUTTE le skill digitali del gestionale e le accende/spegne a piacimento con un toggle. Sostituisce la dispersione di mille checkbox tra varie view di impostazioni.

#### UX

- Cards grid filtrabili per categoria (Comunicazione / Booking / AI / Analytics / Clienti / Team / Marketing / Vendite / Integrazioni / Avanzata)
- Filtro stato: "Tutte" / "Attive" / "Disattive" / "Disponibili (consigliate)" / "In sviluppo"
- Ogni card mostra:
  - 🎨 icona grande + nome friendly (es. "Reminder appuntamento via WhatsApp", non "WhatsApp Cloud API reminder")
  - 📝 descrizione in 2-3 righe in italiano semplice (zero jargon — il titolare è un barbiere, non un dev)
  - 💡 esempio pratico (es. "Marco prenota giovedì → riceve un messaggio mercoledì sera e giovedì mattina")
  - 💰 ROI atteso o beneficio (es. "Riduce mancate presentazioni di circa il 25%")
  - ⚙️ toggle ON/OFF master
  - 🔧 link "Configura" → modale con opzioni avanzate (rate-limit, channel preference, ecc.)
  - 📊 mini-stat se attiva da >7gg (es. "32 messaggi inviati, 28 letti")
- Confirmation modale prima di disattivare una skill già attiva (mostra impatto: "X cron job verranno fermati, Y notifiche già pianificate verranno cancellate")
- Search bar per trovare velocemente una skill

#### Tono delle descrizioni (esempi)

| Cattivo (tech) | Buono (friendly) |
|---|---|
| "Cron job Postgres che invoca fn_admin_stats_range" | "Ogni 1° del mese ricevi un report dettagliato del mese precedente nella tua email" |
| "Soft-reservation slot durante token window" | "Quando qualcuno cancella, blocchiamo lo slot per dare tempo al primo in attesa di confermare" |
| "RPC fuzzy-match su Google Places API" | "Controlliamo se il cliente ha già scritto la recensione, così non gli scriviamo più" |

#### Schema DB

```sql
create table skills_config (
  skill_key text pk,                   -- 'reviews_harvester', 'waitlist', 'coupons', etc
  enabled bool default false,
  enabled_at timestamptz null,
  disabled_at timestamptz null,
  config jsonb default '{}'::jsonb,    -- opzioni per-skill (rate-limit, threshold, ecc.)
  last_used_at timestamptz null,
  usage_count int default 0
);
```

**Default**: tutte le skill `enabled = false`. Si attivano una a una solo se il titolare lo decide.

#### Mapping skill_key → master flag

Il toggle nella Skills Hub UI è la stessa cosa del `<feature>_enabled` flag che abbiamo deciso per ogni feature. Solo che invece di stare sparso in `salon_settings.coupons_enabled` + `salon_settings.waitlist_enabled` + ..., **tutto vive in `skills_config`** come single source of truth.

Le feature leggono: `SELECT enabled FROM skills_config WHERE skill_key = 'coupons'`.

#### Skill metadata (in codice TypeScript)

Centralizzato in `src/lib/skills/registry.ts`:

```ts
export const SKILLS: Skill[] = [
  {
    key: 'reviews_harvester',
    category: 'marketing',
    icon: '⭐',
    nameIT: 'Raccolta automatica recensioni Google',
    descriptionIT: 'Dopo ogni appuntamento concluso, manda al cliente un messaggio per chiedergli di lasciare una recensione su Google. I clienti scontenti li dirotta su un canale interno per non rovinare la media.',
    exampleIT: 'Marco esce alle 14. Alle 16:30 riceve "Com\'è andata oggi?". Tap su 😊 → si apre Google con la recensione pronta. Se tap su 😞 → arriva una segnalazione a te (non a Google).',
    benefitIT: 'Da 4.2 a 4.7 stelle in 3 mesi = +30% click dal profilo Google',
    effortHours: 12,
    monthlyCostEur: 0,
    requiresAccount: ['Google Place ID'],
    relatedSkills: ['whatsapp_reminders', 'telegram_owner_alerts'],
    docsUrl: '/admin/funzionalita/reviews_harvester'
  },
  // ... altre 100 skill
];
```

#### Vantaggi di questa architettura

- **One-stop-shop**: il titolare ha UN posto solo per gestire tutto, non deve scoprire dove sta cosa
- **Onboarding**: alla prima apertura del gestionale, propone "Vuoi vedere cosa puoi fare? 🎁" → tour della Skills Hub
- **Self-service**: il titolare può sperimentare (attiva/disattiva, vede l'effetto, sceglie) senza chiamarmi ogni volta
- **Marketing interno**: ogni skill è un "venduto" — il titolare vede chiaramente il valore di quello che ha pagato
- **Update senza modifiche admin**: quando aggiungiamo una nuova skill, basta aggiungerla al registry — appare auto nella Hub
- **Stato del business**: la Hub diventa un KPI dashboard del "quanto sto sfruttando il sistema?"

---

### ⚠️ Notification Router — regola cross-cutting

**Problema**: con 4+ canali messaging attivi (WA, Push, Email, SMS), c'è il rischio reale che il cliente riceva lo STESSO evento (es. reminder) 3 volte.

**Soluzione architetturale**: tutte le notifiche passano per UN SOLO punto centrale che separa due tipi di flusso:

#### 1️⃣ Notifiche CLIENTI (esterni)
Funzione `sendCustomerNotification(customerId, eventType, payload)` → sceglie UN canale e basta.

**Hierarchy default** (configurabile in `salon_settings.notification_channel_priority`):
```
WhatsApp (se opt-in + numero) → Push (se subscribed) → Email (sempre) → SMS (solo se abilitato)
```

**Preferenze per-cliente** in `customers.notification_preferences` JSONB (mode "smart" o "manual" per categoria).

**Eccezione critical events**: opzionale flag `multi_channel_critical = true` per eventi time-sensitive (waitlist match con token <1h).

#### 2️⃣ Notifiche INTERNE (titolare / staff)
**Decisione cliente**: TUTTE le notifiche owner-facing vanno SOLO su **Telegram** (vedi #70). No email, no WA, no push web.

Funzione `sendOwnerAlert(eventType, payload)` → invio diretto a `salon_settings.owner_telegram_chat_id` (e opzionalmente chat IDs aggiuntivi per staff/delegati).

Eventi owner che usano questo canale (tutti su Telegram):
- Nuova prenotazione / cancellazione / no-show
- Recensione negativa (#62 routing 😞)
- Slot vuoto urgente / coupon esaurito (#45)
- Win-back / VIP booking
- Alert calo prenotazioni (#36)
- Daily digest 18:00 (config)
- Suggerimenti AI weekly (#23) e Report Mensile (#31) — header su Telegram, dettaglio email per archivio

**Quiet hours** sempre applicate (default 22-08) tranne eventi critical-priority.

#### Log centrale
Tabella `notifications_sent` con `(recipient_type, recipient_id, event_type, related_id, channel, sent_at, opened_at)` → garantisce idempotenza, impedisce duplicati, fornisce audit.

#### Implementazione
**Prima** di costruire qualsiasi feature messaging (#1, #2, #5, #6, #9, #62, ecc), implementare le 2 funzioni del Router. Tutte le feature le riusano. Il canale per owner-alert è fisso (Telegram), non passa per la hierarchy clienti.

---

### Top 10 da prioritizzare (mia opinione, da confermare col cliente)

Pensando a impact/effort + budget cliente (~€4.5-6.5k):

1. **#10 + #1** WhatsApp Biz API + Reminder → no-show -25% subito, ROI immediato
2. **#45** Coupon CRUD (gamification.tsx) → già scaffolded
3. **#42** Fidelity loyalty → component esiste, finire flow
4. **#65** Referral wire-up completo → tabella + UI parziali
5. **#62** Review Harvester Google → +0.5 stelle in 2 mesi
6. **#11** Waitlist → recupera cancellazioni
7. **#43** Pacchetti prepagati (5-10 tagli) → cash flow + fedeltà
8. **#9** Push Web → PWA-native, free
9. **#23 + #31** Suggerimenti AI + Report mensile → admin dashboard premium
10. **#70** Alert Telegram titolare → owner sempre informato a basso costo

Cose da NON proporre (sono ❌ confermati):
Multi-sede, Apple Maps, SEO tracker interno, Uptime monitor, Dashboard TV, Listino stagionale, Bot Telegram, Allergeni, Formule colore — tutte fuori scope per un barber a Olbia.

---

## Verifica end-to-end (dopo ogni round)

1. `npm run build` deve completare in <8s, 50 pagine
2. Aprire `/admin/<view>` e testare il flow
3. Aprire `/profilo` come cliente registrato e verificare hydration
4. Booking flow end-to-end: drawer → seleziona slot → conferma → DB row in `appointments`
5. Lighthouse desktop > 85 sulle pagine principali

---

## ✅ Checklist unica di attivazione produzione (Chat 1 + 2 + 3)

Una sola lista ordinata. Fai tutto in sequenza, dall'alto verso il basso. Ogni step abilita i successivi.

### Step 1 — Account esterni (fare prima di tutto)

Aprire tutti gli account servono i token/keys nei prossimi step.

- [ ] **Gmail dedicato** — `hairrich.olbia@gmail.com`, attivare 2FA, generare App Password da `https://myaccount.google.com/apppasswords` (16 caratteri). _~5 min_
- [ ] **Telegram bot** — chattare con `@BotFather` → `/newbot` → salvare il token. Poi inviare `/start` al bot dal proprio Telegram. _~5 min_
- [ ] **OpenAI API key** — `https://platform.openai.com/api-keys` → carta di credito (budget €10/mese sufficiente). _~10 min_
- [ ] **Google Cloud project** — `https://console.cloud.google.com` → nuovo progetto Hair Rich → abilitare API: Google Calendar, Google Business Profile, Maps Booking. Creare OAuth 2.0 client (Web app). Redirect URI: `https://fznzfmgfsijhzjqcwmyt.supabase.co/functions/v1/gcal-oauth`. _~30 min_
- [ ] **Web Push VAPID keys** — `npx web-push generate-vapid-keys` da terminale, salvare entrambe le chiavi. _~2 min_
- [ ] **(Opzionale) Reserve with Google** — submission a `https://developers.google.com/maps-booking` (review 1-2 settimane). Solo se vuoi il pulsante "Prenota" diretto sul profilo Google. _~30 min + attesa_

### Step 2 — Applicare le migrations Supabase (39 totali, ordine cronologico)

Dashboard Supabase → SQL Editor (oppure `supabase db push`):

```
# Foundation Chat 1 (9)
20260523_0021_skills_config.sql                          → 101 skill_keys + 2 always-ON
20260523_0022_customer_consents.sql                      → GDPR ledger
20260523_0023_customer_notification_preferences.sql      → JSONB customer prefs
20260523_0024_notifications_sent.sql                     → Router audit log
20260523_0025_activity_log.sql                           → Triggers 19 tabelle
20260523_0026_admin_inbox_items.sql                      → Inbox + realtime
20260523_0027_cms_message_templates.sql                  → 29 template Router
20260523_0028_salon_settings_router_config.sql           → owner_telegram, quiet hours
20260523_0029_customer_appointment_rpcs.sql              → cancel + reschedule cliente

# Booking experience Chat 2 (11)
20260524_0030_waitlist.sql                               → waitlist + soft-reserve
20260524_0031_salon_settings_waitlist_config.sql         → token validity adattiva
20260524_0032_waitlist_rpcs.sql                          → match + notify
20260524_0033_waitlist_owner_template.sql                → cms template
20260524_0034_packages_surveys_pushes_noshow.sql         → 4 nuove tabelle
20260524_0035_package_credit_rpcs.sql                    → fn_sell_package / redeem
20260524_0036_package_reminder_templates.sql             → scadenza 30/7/1gg
20260524_0037_push_and_survey_templates.sql              → push + NPS
20260524_0038_staff_gcal_tokens.sql                      → Google OAuth tokens
20260524_0039_gbp_sync.sql                               → orari su GBP
20260524_0040_reserve_with_google.sql                    → RWG feed schema

# Marketing + AI Chat 3 (14)
20260524_0038_coupons_ecosystem.sql                      → coupon meta + QR + referrals
20260524_0039_loyalty.sql                                → loyalty config + ledger
20260524_0040_customer_segments.sql                      → 7 segmenti auto + manuali
20260524_0041_review_requests.sql                        → token + smart routing
20260524_0042_ai_reports.sql                             → ai_reports + ai_content_drafts
20260524_0043_suppliers.sql                              → fornitori + ordini + soglie stock
20260524_0044_saved_searches.sql                         → query builder + 5 template
20260524_0045_referral_customer_rpcs.sql                 → RPCs lato cliente referral
20260524_0046_birthday_helpers.sql                       → fn_customers_birthday_today
20260524_0047_reactivation_helpers.sql                   → fn_reactivation_candidates
20260524_0048_reviews_helpers.sql                        → fn_review_request_candidates
20260524_0049_last_minute_audience.sql                   → fn_last_minute_promo_audience
20260524_0050_bookings_drop.sql                          → threshold + snapshot RPC
20260524_0051_cms_templates_fix.sql                      → re-seed template marketing
```

**Verifiche post-migration**:
- `select count(*) from skills_config;` → 101
- `select count(*) from cms_blocks;` → ≥35 template
- `select count(*) from saved_searches where is_template;` → 5

### Step 3 — Secrets Supabase

Dashboard → Project Settings → Edge Functions → Secrets (o `supabase secrets set`):

```bash
# Router · canale email
GMAIL_USER=hairrich.olbia@gmail.com
GMAIL_APP_PASSWORD=<16 char generato in step 1>

# Router · canale owner Telegram
TELEGRAM_BOT_TOKEN=<token da @BotFather>

# AI (no-show outreach + content gen + weekly/monthly reports)
OPENAI_API_KEY=sk-...

# Web Push
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>
VAPID_SUBJECT=mailto:hairrich.olbia@gmail.com

# Google OAuth (Calendar + Business Profile + Reserve)
GOOGLE_CLIENT_ID=<da GCP>
GOOGLE_CLIENT_SECRET=<da GCP>
GOOGLE_OAUTH_REDIRECT=https://fznzfmgfsijhzjqcwmyt.supabase.co/functions/v1/gcal-oauth

# Link-back nei messaggi (cancel/recensione/coupon)
PUBLIC_SITE_URL=https://hairricholbia.com
```

### Step 4 — Deploy delle 21 Edge Functions

```bash
# Foundation Router (Chat 1)
supabase functions deploy notifications-router

# Booking experience (Chat 2)
supabase functions deploy waitlist-matcher
supabase functions deploy ai-noshow-draft
supabase functions deploy package-expiry-reminders
supabase functions deploy post-visit-survey-sender
supabase functions deploy push-sender
supabase functions deploy gcal-oauth
supabase functions deploy gcal-sync
supabase functions deploy gbp-hours-sync
supabase functions deploy rwg-feed
supabase functions deploy rwg-booking-server

# Marketing + AI (Chat 3)
supabase functions deploy birthday-sender
supabase functions deploy reactivation-sender
supabase functions deploy reviews-harvester
supabase functions deploy last-minute-promo
supabase functions deploy segments-classifier
supabase functions deploy bookings-drop-alert
supabase functions deploy stock-low-alert
supabase functions deploy ai-content-generator
supabase functions deploy ai-weekly-suggestions
supabase functions deploy ai-monthly-report
```

### Step 5 — Cron schedules (Dashboard → Edge Functions → Schedule)

| Funzione | Cron | Cosa fa |
|---|---|---|
| `waitlist-matcher` | `*/15 * * * *` | Match cancellati → primi in coda |
| `reviews-harvester` | `*/30 * * * *` | Richiesta recensione 2h post-visita |
| `post-visit-survey-sender` | `*/30 * * * *` | Sondaggio NPS privato |
| `gcal-sync` | `*/10 * * * *` | Sync bidirezionale staff calendar |
| `stock-low-alert` | `0 8 * * *` | Alert scorte basse |
| `birthday-sender` | `0 9 * * *` | Auguri + coupon -20% |
| `package-expiry-reminders` | `0 9 * * *` | Reminder pacchetti 30/7/1gg |
| `segments-classifier` | `0 4 * * *` | Riclassifica segmenti clienti |
| `gbp-hours-sync` | `0 3 * * *` | Push orari + chiusure su Google |
| `bookings-drop-alert` | `0 9 * * 1` | Alert calo prenotazioni settimanale |
| `reactivation-sender` | `0 10 * * 1` | Win-back clienti >90gg |
| `ai-weekly-suggestions` | `0 9 * * 1` | 3-5 azioni AI ogni lunedì |
| `ai-monthly-report` | `0 9 1 * *` | Report mensile 1° del mese |

`last-minute-promo`, `ai-content-generator`, `gcal-oauth`, `push-sender`, `notifications-router`, `ai-noshow-draft`, `rwg-feed`, `rwg-booking-server` → **NESSUN cron**, sono on-demand (invocate da admin o altri trigger).

### Step 6 — Setup titolare in `/admin/impostazioni`

Login admin, sezione "Notifiche & Comunicazioni":

1. **`owner_telegram_chat_id`** — leggere il proprio chat ID da `https://api.telegram.org/bot<TOKEN>/getUpdates` dopo aver fatto `/start` al bot.
2. **`owner_telegram_extra_chat_ids`** — stesso flusso per staff/delegati (opzionale).
3. **Quiet hours** — default 22:00→08:00.
4. **Channel priority** — default `whatsapp → push → email → sms` (riordinabile).
5. **`multi_channel_critical`** — ON: eventi waitlist <1h vanno su più canali.
6. **`cancel_min_hours`** — default 4, finestra autocancellazione cliente.
7. **`google_place_id`** + **`google_review_url`** — per il Reviews Harvester (#62).
8. **`reviews_cooldown_days`** (90) + **`reviews_request_delay_min`** (120) — anti-spam recensioni.
9. **`bookings_drop_threshold_pct`** (20) — soglia alert calo settimanale.
10. **`push_vapid_public_key`** — la chiave pubblica generata in step 1.

### Step 7 — Skills Hub `/admin/funzionalita` (rollout graduale)

Tutte le 101 skill partono OFF (eccetto `gdpr_consents` e `admin_inbox`, sempre ON). Accendere a ondate:

- **Settimana 1 — Foundation**: `customer_onboarding`, `telegram_owner_alerts`, `whatsapp_reminders`
- **Settimana 2 — Booking**: `waitlist`, `smart_upsell`, `post_visit_survey`, `staff_gcal_sync`
- **Settimana 3 — Vendite**: `coupons`, `service_packages`, `loyalty`, `referrals`
- **Settimana 4 — Marketing**: `reviews_harvester`, `birthday_campaign`, `reactivation_campaigns`, `customer_segments`
- **Mese 2 — Avanzate**: `web_push`, `google_hours_sync`, `google_reserve`, `noshow_outreach`, `qr_promotions`, `suppliers_directory`, `stock_alerts`, `last_minute_promo`, `bookings_drop_alert`, `advanced_customer_search`, `activity_log`
- **Mese 3 — AI premium**: `ai_content_generator`, `ai_weekly_suggestions`, `ai_monthly_report`

Per ogni skill: aprire il modale, leggere l'esempio italiano, configurare parametri (soglie/cooldown), confermare.

### Step 8 — Connessioni OAuth per-utente

- **Google Calendar** — ogni barber: visitare `/admin/staff/<id>/connect-gcal` → consenso Google → token in `staff_gcal_tokens`. _~2 min/operatore_
- **Google Business Profile** — solo titolare: visitare endpoint OAuth `gcal-oauth?scope=business.manage` → inserire `location_id` (`accounts/X/locations/Y`) in `salon_gbp_tokens`. _~10 min_
- **Reserve with Google** — solo dopo approvazione partner. Configurare feed URL nel partner portal puntando a `/functions/v1/rwg-feed`.

### Step 9 — Test end-to-end (pre-lancio)

1. `npm run build` → 68+ pagine verdi.
2. `/admin/funzionalita` → 101 skill visibili.
3. **Router test**: notifica manuale da `/admin/inbox` → email + Telegram ricevuti.
4. **Booking + coupon**: prenotare con codice `WELCOME-XXXX` (creato in `/admin/gamification`) → vedere sconto in summary → conferma → riga in `coupon_redemptions`.
5. **Waitlist**: cliente cancella appointment >3h prima → entro 15 min, primo in lista riceve token → conferma → `appointments` aggiornato.
6. **Reviews Harvester**: chiudere un appuntamento di test → entro 30 min messaggio cliente con link `/recensione/[token]` → 😊 redirect Google, 😞 form interno → riga in `admin_inbox_items`.
7. **Referral**: utente A genera codice in `/profilo/referral` → utente B si registra con quel codice → coupon AMICO-XXXX → B completa primo appuntamento → A riceve GRAZIE-XXXX automatico.
8. **AI content**: caricare foto in `/admin/contenuti-ai` → 3 caption + hashtag generati.
9. **QR Promo**: generare batch 10 codici → stampa anteprima → scan QR su mobile apre `/coupon/[code]` con auto-copy.
10. **GBP sync**: cambiare un orario in `/admin/impostazioni` → entro 5 min visibile sul profilo Google.
11. Lighthouse desktop ≥85 su `/`, `/servizi`, `/lavori`, `/prodotti`.

### Step 10 — Operatività ricorrente

- **Backup**: Supabase fa snapshot giornalieri automatici. Export CSV manuale da `/admin/clienti` quando serve.
- **Inbox `/admin/inbox`**: fonte di verità di tutto ciò che il sistema fa.
- **`/admin/log`**: audit trail completo per debugging post-mortem.
- **Costi mensili attesi**:
  - Supabase Pro: ~€25
  - Gmail SMTP: gratis
  - Telegram Bot: gratis
  - OpenAI: ~€5-10 (AI weekly + monthly + content gen + no-show drafts)
  - Web Push, Google Calendar, GBP, Reserve: gratis
  - **Totale: ~€30-35/mese**

### Step 11 — Cose che NON sono ancora pronte (rinviate)

- `whatsapp_business_api` (#10) e `whatsapp_reminders` (#1): richiedono approvazione Meta Business + template — circa 1 mese di setup, NON inclusa nel codice.
- `sms_notifications` (#2): nessun gateway integrato, da scegliere (Twilio/MessageBird) a posteriori se serve fallback.
- `fatture_in_cloud` (#81): integrazione opzionale per commercialista, da fare on-demand.

---

# 🗺️ Roadmap prossime sessioni (post Chat 1+2+3)

Dopo le 3 chat originali + il polish round dei 12 item + il deploy migrations + il fix login,
il prodotto è funzionalmente al ~85% per Hair Rich e al ~60% per la **productizzazione SaaS**.
La roadmap sotto è suddivisa in 4 sessioni di lavoro, sequenziali ma indipendenti tra loro.

> **Convenzione**: ogni sessione è un commit-set autonomo. Si committa + pusha a fine task come
> nelle 3 chat originali. Le sessioni A e B sono prioritarie (Hair Rich da finire);
> C e D si pianificano in seguito.

## Sessione A — Completamento Hair Rich (~25-35h)

Obiettivo: portare Hair Rich Olbia al 100% operativo e dare al titolare un prodotto vero da testare.

### A1. Gestionale: gap residui (8-12h)
- **`/admin/cms`**: editor TipTap reale sui `cms_blocks` (manca implementazione full)
- **`/admin/gamification`**: refinement editor coupon con anteprima
- **`/admin/agenda`**: drag&drop completo (RPC `fn_admin_reschedule_appointment` esiste)
- **`/admin/agenda-week`**: print PDF settimanale
- **`/admin/staff`**: editor orari settimanali (`working_hours`) inline

### A2. Portal Staff (12-16h) — NUOVO
**Concept**: ogni operatore (Cristian, ...) ha un proprio login con vista limitata.
Non vede agenda colleghi, dati clienti completi, contabilità. Vede solo:
- I suoi appuntamenti di oggi + settimana
- I suoi clienti recenti (last 30 days)
- I suoi incassi giornalieri (no aggregati salone)
- Richiesta ferie/permessi → finisce nell'admin inbox del titolare
- Foto pre/post solo per i suoi appuntamenti
- Timbratura entrata/uscita semplice

Nuove route in `src/pages/staff/[...slug].astro`:
- `/staff` → dashboard "oggi"
- `/staff/appuntamenti` → i suoi (passati/futuri)
- `/staff/clienti` → solo quelli che ha servito
- `/staff/incassi` → suoi soldi + commissione (% configurabile)
- `/staff/ferie` → richiesta giorni off
- `/staff/timbratura` → entrata/uscita giornaliera

DB:
- Nuova tabella `staff_clock_entries` (id, staff_id, type 'in'/'out', occurred_at, location_id)
- Nuova tabella `staff_time_off_requests` (id, staff_id, starts_at, ends_at, reason, status, approved_by, decided_at)
- View `staff_my_appointments` con RLS che filtra per `auth.uid()` → staff_id

RLS:
- Operatore vede solo i propri dati (proprio staff_id collegato via `staff.user_id`)
- Non può vedere `customers` complete — solo nome/cognome/telefono dei suoi
- Non può vedere `orders` se non quelle dei suoi appointments

### A3. Customer site: arricchimento `/profilo` (6-8h)
- **`/profilo/dashboard`**: hero card "prossimo appuntamento" animata + countdown
- **`/profilo/storia`**: gallery foto pre/post di tutti gli appuntamenti
- **`/profilo/preferenze`**: barber preferito, servizio abituale, lingua, notification preferences UI completa
- **`/profilo/credito`**: pacchetti attivi + coupon disponibili + crediti referral in un unico posto
- **`/profilo/referral`**: refinement UI (share buttons WA/SMS, copy link, lista invitati con stato)
- **`/profilo/recensioni`**: lista delle recensioni che il cliente ha lasciato (su Google e in privato)

---

## Sessione B — Productization layer (~30-45h)

Obiettivo: rendere il repo davvero clonabile per il prossimo salone. Tutto rimane in
`hair-rich/` come "instance 1", ma con la disciplina del template.

### B1. Multi-tier mapping in DB (4h)
- Migration `ALTER TABLE skills_config ADD COLUMN min_tier text` ('vetrina'/'pro'/'full')
- Migration `ALTER TABLE salon_settings ADD COLUMN current_tier text` (default 'full' per Hair Rich)
- Skills Hub UI: skills con `min_tier > current_tier` mostrate lockate con CTA "Upgrade"
- Default seed: ogni skill mappata al suo tier appropriato (dai 100 dipendenti digitali del pricing-saloni.html)

### B2. Salon onboarding seed script (16-20h)
File `scripts/onboard_salon.py`:
1. Input: nome salone, slug, email titolare, indirizzo, palette colori (3 hex), logo url
2. Crea nuovo Supabase project via Management API
3. Applica le 52+ migrations
4. Seed: salon_settings + 1 admin user + 3 servizi default + 1 staff
5. Seed CMS blocks con copy generica
6. Crea storage bucket + carica logo + carica placeholder photos
7. Output: env vars per il deploy Vercel + URL admin

### B3. Estrazione Hair Rich-specific (8-12h)
Audit completo del codice per spostare in DB / cms_blocks tutto quello che oggi è hardcoded:
- "HAIR RICH OLBIA" in header/footer → cms_blocks
- "Via Regina Elena 33/A" → salon_settings
- Foto staff (Cristian) → Supabase storage `staff_avatars/{staff_id}.webp`
- Colori (#0a0a0a, accent-warm) → CSS custom properties driven da salon_settings.theme jsonb
- Font choices (Fraunces, Inter) → salon_settings.theme.fonts
- 3 servizi (Taglio €20, Barba €10, Combo €30) → seed data, già OK
- Manifesto "Il taglio è un'arte" → cms_blocks
- 12 foto portfolio → Supabase storage per-instance

### B4. Multi-location architecture base (per Nuoro futuro) (2-4h)
- `salon_settings`: aggiungere `parent_brand_id text` opzionale per Hair Rich → Olbia/Nuoro
- Documentare in CLAUDE.md la procedura "duplicate Supabase for new location"
- Lasciare singleton constraint per ora (un salone = una Supabase) → cambio quando arriva sede #3

---

## Sessione C — Hardware plugins (~30-50h)

Obiettivo: passare dal catalog informativo a integrazioni reali per i primi cliente che le chiedono.

### C1. POS bridge architecture (8-12h)
- Migration: tabelle `pos_terminals` + `pos_transactions`
- Edge Function `pos-bridge` con plugin pattern
- UI `/admin/cassa` → tab "Hardware connessi" che mostra terminali paired + bottone "Aggiungi"

### C2. SumUp Air plugin (12-16h) — priorità 1
- Pairing flow via Web Bluetooth
- Charge / refund / status endpoint
- Wire con `orders` table per riconciliazione automatica

### C3. Stripe Terminal plugin (12-16h) — priorità 2
- Stripe Connect account
- Terminal SDK integration
- Funziona anche su iPhone (a differenza di SumUp)

### C4. Stampante termica (Star Micronics) (8-10h)
- Web Bluetooth pairing
- ESC/POS command builder
- Use cases: pre-conto, ricevuta cortesia, ordini per dipendenti

### C5. Scanner barcode + cassetto contante (4-6h)
- WebHID per scanner USB → integrato in `/admin/prodotti` per scarico magazzino
- ESC/POS drawer kick comando legato a stampante

---

## Sessione D — Fiscale + HR (~50-70h)

Obiettivo: rendere il template legalmente venduibile in Italia oltre Hair Rich.

### D1. Fatture in Cloud integration (16-20h)
- Skill `fatture_in_cloud` (#81)
- Edge Function `fic-bridge`: crea/invia fatture B2B via API
- UI `/admin/fiscale/fatture` con elenco emesse + creator
- Trigger: quando `orders.requires_fattura = true` → crea fattura via FiC

### D2. Liquidazione IVA + export commercialista (12h)
- View con calcolo IVA trimestrale per aliquota
- Export CSV nel formato richiesto dal commercialista del cliente

### D3. RT integration (Custom Q3X — first priority) (16-24h)
- Skill `rt_custom`
- Discovery API REST locale del dispositivo
- Read-only mirror: legge incassi giornalieri e li mostra in `/admin/cassa`
- Skip per Hair Rich finché non sappiamo il modello Olivetti

### D4. HR / Cassa giornaliera (16-24h)
- Migration `staff_timeclocks` + `daily_cash_reconciliation`
- View `/admin/cassa/chiusura` per chiusura cassa giornaliera
- View `/admin/staff/commissioni` per calcolo commissioni
- Export P&L mensile (CSV/PDF)

---

## Ordine consigliato di esecuzione

1. **Sessione A** — completa Hair Rich. Il titolare ha un prodotto completo per testare.
2. **Sessione B** — productization. Il repo è clonabile per il prossimo salone.
3. **Sessione C** (parziale: solo C1 + C2) — primo POS reale quando un cliente lo chiede.
4. **Sessione D** (D1 + D2) — fattura elettronica + IVA quando primo cliente B2B chiede.
5. **Sessione D** (D3 + D4 + Sessione C completa) — quando il prodotto è venduto a >5 saloni.

---

## Convenzioni operative ferme

- Ogni nuova feature passa per Skills Hub (tabella `skills_config` + registro in `src/lib/skills/registry.ts`)
- Ogni nuova migration ha la numerazione `YYYYMMDD_NNNN_snake_case.sql` con NNNN globale ascending
- Ogni Edge Function cron usa `acquireCronLock` da `_shared/cronLock.ts`
- Ogni Edge Function che può fallire usa `captureException` da `_shared/sentry.ts`
- Il Router rispetta i consensi GDPR (eventi marketing/reminder/referral controllano `customer_consents_current`)
- Il customer site mantiene branding Hair Rich; il gestionale è già "neutro" template-ready
- Prezzi hardware nel catalog: solo prezzi reali del fornitore, zero ricarico, link a sito ufficiale

---

## 🔑 Credenziali esterne da fornire (TO-DO cliente)

Lista live delle credenziali che il titolare deve procurarsi e poi
incollarmi (oppure caricarmi su Supabase Secrets / Vercel env / admin
impostazioni). Aggiornata insieme allo sviluppo: ogni nuova feature che
richiede setup esterno aggiorna questa lista.

### Bloccanti per attivare il gestionale in produzione

| # | Credenziale | Dove prenderla | Dove va | Cosa abilita |
|---|---|---|---|---|
| 1 | `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Gmail dedicato `hairrich.olbia@gmail.com` → 2FA on → https://myaccount.google.com/apppasswords (16 char) | Supabase Secrets | Email transazionali (cancel, recensioni, ricevute pacchetti, ecc.) |
| 2 | `TELEGRAM_BOT_TOKEN` | `@BotFather` su Telegram → `/newbot` → token | Supabase Secrets | Alert titolare + Telegram AI Assistant (fase 2) |
| 3 | `owner_telegram_chat_id` | Dopo `/start` al bot, leggi da `https://api.telegram.org/bot<TOKEN>/getUpdates` | `/admin/impostazioni` (campo) | Destinatario di tutti gli alert owner-side |
| 4 | `owner_unlock_pin` | Sceglilo tu (4-6 cifre) | `/admin/impostazioni` (campo) | Tablet-mode: torna a vista Titolare dopo essere in vista Dipendente |
| 5 | `PUBLIC_SITE_URL` | Dominio definitivo (es. `https://hairricholbia.com`) | Vercel env + Supabase Secrets | URL nei link email/telegram |
| 6 | Supabase auth Site URL + redirect | Supabase Dashboard → Authentication → URL Configuration | Supabase Dashboard | Magic link login admin/cliente |

### Per le skill AI (puoi attivarle dopo, costano qualche euro/mese)

| # | Credenziale | Dove prenderla | Dove va | Cosa abilita |
|---|---|---|---|---|
| 7 | `OPENAI_API_KEY` | https://platform.openai.com/api-keys (con carta) | Supabase Secrets | AI weekly suggestions, AI monthly report, AI content generator, no-show outreach drafts, **voice control gestionale**, **Telegram AI Assistant** |
| 8 | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` (terminal) | Supabase Secrets + `/admin/impostazioni` (public) | Push notification web ai clienti |
| 9 | `VAPID_SUBJECT` | `mailto:hairrich.olbia@gmail.com` | Supabase Secrets | Required by VAPID spec |

### Per integrazioni Google (skill avanzate, opzionali)

| # | Credenziale | Dove prenderla | Dove va | Cosa abilita |
|---|---|---|---|---|
| 10 | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | https://console.cloud.google.com → progetto + OAuth 2.0 + abilita Calendar API, Business Profile API, Maps Booking | Supabase Secrets | Sync Google Calendar per ogni operatore + Google Business Profile orari/chiusure + Reserve with Google |
| 11 | `google_place_id` + `google_review_url` | Da Google Maps URL del salone | `/admin/impostazioni` | Reviews Harvester usa URL diretto invece di fallback search |

### Cose che non sono credenziali ma vanno configurate

- **Foto Instagram** (~6-10 selezionate): il titolare invia le foto al sviluppatore. Senza Graph API approvata (richiede review Meta 2-3 settimane), niente auto-sync. Per lunedì basta caricare manualmente.
- **Avatar staff aggiuntivi**: se l'organico cresce oltre Federico+Cristian, foto nei bucket Supabase `asset/`.
- **Skills da attivare al go-live**: da `/admin/funzionalita` il titolare sceglie quali skill turn ON tra le 101 disponibili. Default tutte OFF tranne `gdpr_consents` e `admin_inbox`.

### Cose rimandate (post-lunedì)

- WhatsApp Business API: richiede approvazione Meta (1 mese setup)
- SMS gateway (Twilio/MessageBird)
- Fatture in Cloud (quando primo cliente B2B chiede)
- Hardware POS (SumUp Air / Stripe Terminal)
- Instagram Graph API (per auto-sync feed)
