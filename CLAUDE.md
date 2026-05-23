@AGENTS.md

# Hair Rich Olbia — stato del progetto

Salon site + booking engine + e-commerce + auth + admin gestionale.
Cliente reale: barbiere a Olbia. Sito in italiano, multilingua (it/en/fr/de).

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
