# Handoff — Go-live prep (11 giugno 2026, sessione pomeriggio)

> **Stato: pronto al lancio.** Tutto committato e pushato su `main` (deploy Vercel
> automatico). **Unica cosa bloccante rimasta: la Gmail App Password** (per le email
> ai clienti). Tutto il resto è fatto e verificato.

---

## 1. Cosa è stato fatto in questa sessione (tutto LIVE su `main`)

### A. Landing "Taglio a domicilio" (nuova pillar SEO/AEO/GEO)
- **`/taglio-a-domicilio`** (it/en/fr/de) — componente bespoke `TaglioDomicilioContent.astro`,
  layout distinto da `/parrucchiere-olbia` (no contenuto duplicato). Hero immersiva con vista
  marina, intro split, "come funziona", gallery masonry, social proof, FAQ (8 Q&A citabili),
  fascia oro. Copy con ~15 keyword (barbiere a domicilio Olbia/Costa Smeralda/Porto Cervo/yacht/
  villa/eventi). Solo CTA telefonica (servizio non prenotabile online).
- **19 foto reali** caricate ottimizzate (webp) nel bucket Storage `asset/` via
  `scripts/upload_domicilio_photos.mjs` (2 sessioni: villa Porto Cervo + vista marina con
  mantellina rossa). Tutte usate nella landing; la migliore anche come foto servizio in
  `HomeServiceFocus` (/servizi) e `ServicesSection` (home).
- **Schema**: `Service` "a domicilio" arricchito (areaServed 7 città + Costa Smeralda, url
  canonico, OfferCatalog) + FAQPage + Breadcrumb. Niente AggregateRating duplicato.
- **Linking interno** (footer + in-content, MAI nelle navbar sticky): footer (ogni pagina) +
  link in-content su home, /servizi, /lavori, /prodotti, e teaser sulla pillar /parrucchiere-olbia.
- **`/mappa-del-sito`** (it/en/fr/de) HTML nel footer per i crawler. Sitemap.xml auto-aggiornata.
  `llms.txt` aggiornato.
- **Riferimento VIP**: allusione elegante senza nome (privacy).

### B. Branding / loghi
- Tutti i loghi a bordo nero **ri-zoomati** (ritaglio margine): `logo.png`, `icon-192/512`,
  `apple-icon`, `favicon 16/32`, `og-image` (logo più grande). Nuova `icon-maskable-512.png`
  con safe-zone (manifest aggiornato). Nuovo **`logo-250.png`** (250×250).
  Utility: `scripts/regen_logos.mjs`.

### C. Dati attività
- **P.IVA `IT03020610907`**: footer (`03020610907`), schema (`vatID`), llms.txt.
- **`foundingDate` 2023-06-17** nello schema HairSalon + llms.txt ("Attivo dal 17 giugno 2023").
- **Foto Riccardo** (founder): `riccardo.webp` caricata; `staff.avatar_url` aggiornato →
  /team/riccardo ora ha la foto.

### D. Dominio
- `hairricholbia.com` collegato su Vercel: **apex + `hair-rich.vercel.app` → 308 → www**;
  `www.hairricholbia.com` = Production. Coerente col canonical. Il codice usa già il dominio
  ovunque (canonical, `site`, sitemap, schema, robots, llms, `PUBLIC_SITE_URL`).

### E. Google Calendar (integrazione)
- Secrets impostati: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT`.
- Edge Function **`gcal-oauth`** (ACTIVE, `--no-verify-jwt`) e **`gcal-sync`** (ACTIVE) deployate;
  cron `gcal-sync-10min` ogni 10 min (no-op finché nessuno collega il calendario).

### F. Recensioni Google
- `salon_settings.google_review_url` = `https://g.page/r/CW7L55AEqsREEBM/review`
- `salon_settings.google_place_id` = `ChIJDzpZjM1L2RIRbsvnkASqxEQ` (risolto via Places API)
- `GOOGLE_PLACES_API_KEY` salvata come secret (per la futura verifica recensioni — nessuna Edge
  Function la consuma ancora).
- Sostituito il placeholder finto in `ReviewGate.tsx`. Le CTA "5 stelle" (`FollowReviewCta`) e gli
  RPC review usano già `google_review_url`.

### G. Bot contabile Parte C (deployato in mattinata)
- `telegram-assistant` **v2** (`--no-verify-jwt`), `owner-morning-digest` (cron 0 8 * * *),
  `owner-evening-brief` (cron 0 20 * * *) — tutte ACTIVE. Migration `0062` (cron) applicata.

---

## 2. Cosa MANCA (azioni titolare)

### 🔴 Bloccante per le email ai clienti
1. **Gmail App Password**: sull'account Gmail mittente → attiva verifica in 2 passaggi →
   https://myaccount.google.com/apppasswords → codice 16 caratteri. Poi passare allo sviluppo
   **`GMAIL_USER`** (email) + **`GMAIL_APP_PASSWORD`** → si impostano i 2 secret e si accendono
   reminder/recensioni/ricevute/cancellazioni via email.
   *(NB: NON serve la "Gmail API" di Google Cloud — è SMTP + App Password.)*

### 🟡 Per accendere le funzioni Google
2. **OAuth consent screen**: per far collegare il Calendar ai barbieri, mettere l'app in
   **Testing** + aggiungere i barbieri come **Test users** (rapido, nessuna verifica).
   In alternativa (produzione): verificare il dominio `hairricholbia.com` in **Google Search
   Console** con lo stesso account, aggiungerlo agli **Authorized domains**, poi "Ho risolto i
   problemi". → risolve l'errore "verifica del branding".
3. **Places API**: abilitata ✅. Key salvata ✅. Consiglio: **restringere la key** (API
   restrictions = solo Places API) in Google Cloud → Credentials.

### 🟢 Configurazione / rollout
4. **Skills Hub** `/admin/funzionalita` — accendere ciò che si vuole usare:
   - Parte C: `telegram_assistant`, `owner_morning_digest`, `owner_daily_brief`,
     `auto_clock_in`, `expense_tracking`, `stock_consumption`.
   - Google/recensioni: `staff_gcal_sync`, `reviews_harvester` (+ `post_visit_survey` se voluto).
5. **Supabase → Auth → URL Configuration**: Site URL + redirect = `https://www.hairricholbia.com`
   (per magic-link login admin/cliente) — verificare se già fatto.
6. **Google Search Console**: submit `https://www.hairricholbia.com/sitemap-index.xml`.

### ⚪ Opzionali / rimandabili
7. **VAPID keys** (push web): `npx web-push generate-vapid-keys` → `VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
8. **Sync orari su Google (GBP)**: richiede le **My Business Business Information API**
   (ad accesso ristretto: serve richiesta/allowlist a Google). Rimandato.
9. **Prenota con Google** (Maps Booking / RWG): richiede approvazione partner program. Rimandato.
10. Riconciliare i testi "dal 2017" (esperienza barbieri) vs apertura attività 2023 (opzionale).

---

## 3. Stato secrets (Supabase Edge Functions)

| Secret | Stato |
|---|---|
| `OPENAI_API_KEY` | ✅ |
| `TELEGRAM_BOT_TOKEN` · `TELEGRAM_WEBHOOK_SECRET` | ✅ |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_OAUTH_REDIRECT` | ✅ |
| `GOOGLE_PLACES_API_KEY` | ✅ |
| `GMAIL_USER` · `GMAIL_APP_PASSWORD` | ⏳ **mancano** |
| `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `VAPID_SUBJECT` | ⚪ opzionali |

> Impostati via Supabase CLI con un **Personal Access Token** del titolare (poi revocabile da
> https://supabase.com/dashboard/account/tokens). L'MCP Supabase di sessione è read-only.

## 4. salon_settings impostati
`owner_telegram_chat_id`, `google_review_url`, `google_place_id`, avatar staff Riccardo.

## 5. Edge Functions ACTIVE
`telegram-assistant` (v2, no-jwt) · `owner-morning-digest` (cron 8) · `owner-evening-brief`
(cron 20) · `gcal-oauth` (no-jwt) · `gcal-sync` (cron */10). + le altre già deployate nelle
sessioni precedenti.

---

## 6. Commit principali della sessione
```
b411037 branding: loghi zoomati + logo 250 + maskable + link recensioni
40d8876 chore: gitignore supabase/.temp
00bf341 seo: landing domicilio rinnovata (foto marina) + Riccardo + P.IVA + foundingDate
eb92cae accountant: cron Parte C morning/evening digest (0062)
b8635c0 seo: landing /taglio-a-domicilio + mappa del sito + foto villa Porto Cervo
```

## 7. Note operative
- Foto: bucket `asset/` (convenzione per nome, niente tabella). Upload via
  `scripts/upload_domicilio_photos.mjs`; loghi via `scripts/regen_logos.mjs`.
- Build: `npm run build` → 110 pagine, ~10s. Preview locale: `astro preview` (porta 3000).
- Verifiche fatte: build verde, overflow-x=0 mobile su landing/mappa (4 lingue), schema/canonical/
  hreflang nell'HTML, Place ID risolto via Places API.
