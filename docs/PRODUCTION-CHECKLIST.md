# 🚀 Checklist di produzione Hair Rich Olbia

Stato aggiornato al 2026-05-27. Quello che è già fatto da me e quello che
serve da te per andare live al 100%.

---

## ✅ Cosa è già fatto in produzione

### Codice & infrastruttura
- ✅ Repo Git su GitHub `krea-web/hair-rich`, branch `main` deployato auto su Vercel
- ✅ **78 pagine** Astro pre-generate (sito + admin + staff + profilo)
- ✅ **40 migrations** applicate al DB Supabase di produzione (`fznzfmgfsijhzjqcwmyt`)
- ✅ **27 Edge Functions** deployate e ACTIVE
- ✅ **12 cron jobs** schedulati e attivi via `pg_cron` + `pg_net`
- ✅ **DB schema**: 52+ tabelle, 55+ funzioni public, RLS su tutto

### Auth & accessi
- ✅ Login admin funzionante per `kreafase1@gmail.com` + `hairrich12@gmail.com`
- ✅ Redirect intelligente: admin → /admin, customer → /profilo
- ✅ Site URL Supabase configurato → `https://www.hairricholbia.com`
- ✅ Auth allowlist include hairricholbia.com + hair-rich.vercel.app + localhost

### Funzionalità
- ✅ **101 skill** in Skills Hub, mappate ai 3 tier (Vetrina 17 / Pro 41 / Full 43)
- ✅ Hair Rich su tier `full` = tutto sbloccato
- ✅ Notification Router operativo (smoke test passato)
- ✅ Cron idempotency lock su tutti i 12 cron schedulati
- ✅ Customer site multilingua (IT/EN/FR/DE) con privacy/cookie/termini aggiornati GDPR
- ✅ Staff portal `/staff` con 6 view (dashboard, appuntamenti, clienti, incassi, ferie, timbratura)
- ✅ Customer profile `/profilo` con 6 view (dashboard, appuntamenti, storia foto, crediti, referral, impostazioni)
- ✅ Admin gestionale `/admin` con 30 view incluso Skills Hub, Inbox, Salute, Log, Hardware catalog

---

## ⏳ Cosa serve da te per attivare le skill

Tutte le skill sono spente di default (tranne `gdpr_consents` e `admin_inbox`).
Per ogni gruppo di skill, ti serve aprire un account esterno e poi inserire
le credenziali nei **secrets Supabase** del progetto.

### 🔴 Setup minimo per andare live oggi (~30 min)

#### 1. Email (Gmail) — sblocca tutto il Router via email
**Cosa fare**:
1. Crea (o usa esistente) un Gmail dedicato: consigliato `hairrich.olbia@gmail.com`
2. Attiva la 2FA su quel Gmail
3. Vai su https://myaccount.google.com/apppasswords → genera una "App password"
   per "Mail" → "Other (Hair Rich Bot)". Riceverai 16 caratteri.

**Cosa darmi (o inserire tu)**:
```
GMAIL_USER=hairrich.olbia@gmail.com
GMAIL_APP_PASSWORD=<16 caratteri>
GMAIL_FROM_NAME=Hair Rich Olbia
```

**Come impostarli**:
```bash
npx supabase secrets set --project-ref fznzfmgfsijhzjqcwmyt \
  GMAIL_USER=... GMAIL_APP_PASSWORD=... GMAIL_FROM_NAME="Hair Rich Olbia"
```
oppure dal Dashboard: Project Settings → Edge Functions → Secrets → Add new.

**Skill che si attivano**: tutto il Router → email per conferme, promemoria,
birthday, riattivazione, recensioni, sondaggio NPS.

---

#### 2. Telegram bot — sblocca alert al titolare
**Cosa fare**:
1. Su Telegram apri chat con `@BotFather`
2. `/newbot` → segui le istruzioni, scegli nome (es. "Hair Rich Admin")
3. BotFather ti dà un **token** tipo `1234567890:ABC-DEF...`
4. Cerca il bot appena creato in Telegram, premi `/start`
5. Apri nel browser: `https://api.telegram.org/bot<TUO_TOKEN>/getUpdates`
6. Cerca `"chat":{"id":<NUMERO>,...}` → quello è il **chat_id** del titolare

**Cosa darmi**:
```
TELEGRAM_BOT_TOKEN=<token da BotFather>
```

E il **chat_id** numerico va inserito in `/admin/impostazioni` →
"Notifiche & Comunicazioni" → "Chat ID Telegram".

**Skill che si attiva**: `telegram_owner_alerts` (#70) — appena attivata,
ricevi alert Telegram per nuova prenotazione, cancellazione, no-show,
recensione negativa, daily digest 18:00.

---

#### 3. Sito URL definitivo
**Ora** il site_url Supabase è `https://www.hairricholbia.com` ma quel
dominio non è attivo. Vercel sta servendo su `https://hair-rich.vercel.app`.

**Cosa fare**: scegli quale dominio sarà quello vero per Hair Rich e
fammelo sapere. Posso aggiornare il site_url Supabase in 1 click.

Opzioni:
- A) Compri/configuri `hairricholbia.com` su Vercel → si attiva da solo
- B) Cambi site_url a `hair-rich.vercel.app` (più veloce, dominio Vercel default)

---

### 🟡 Setup per attivare le skill AI (~10 min + carta credito)

#### 4. OpenAI API
**Cosa fare**:
1. Crea account su https://platform.openai.com
2. Inserisci una carta di credito (per Hair Rich basta budget €5/mese)
3. Vai su https://platform.openai.com/api-keys → "Create new secret key"
4. Copia la chiave `sk-proj-...`

**Cosa darmi**:
```
OPENAI_API_KEY=sk-proj-...
```

**Skill che si attivano**:
- `ai_weekly_suggestions` (#23) — email lunedì 9:00 con suggerimenti operativi
- `ai_monthly_report` (#31) — email 1° del mese con KPI + analisi
- `ai_content_generator` (#25) — caption Instagram da `/admin/contenuti-ai`
- `noshow_outreach` (#46) — bozza messaggio empatico AI per chiedere spiegazioni

**Costo stimato**: €1-3/mese.

---

### 🟢 Setup opzionali (puoi farli dopo aver iniziato)

#### 5. Sentry — error tracking
- Account gratis su https://sentry.io
- Crea progetto JavaScript → copia DSN
- `supabase secrets set SENTRY_DSN=https://...`
- Vedi `docs/SENTRY.md` per dettagli

#### 6. Web Push (notifiche push browser)
- Genera VAPID keys: `npx web-push generate-vapid-keys`
- Set secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:hairrich.olbia@gmail.com`
- Skill `web_push` (#9) si attiva

#### 7. Google Cloud (per Calendar staff, GBP, Reserve)
- Solo se vuoi che gli operatori sincronizzino il loro Google Calendar
  personale con il salone
- Setup ~30 min seguendo `docs/PRODUCTION-CHECKLIST.md` step Google Cloud
- Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT`

---

## 🤖 Comandi pronti per impostare i secrets

Quando hai TUTTE le chiavi pronte, in un colpo solo:

```bash
export SUPABASE_ACCESS_TOKEN='<TUO_PERSONAL_ACCESS_TOKEN>'
# (Genera il token da https://supabase.com/dashboard/account/tokens
#  — NON committare mai questo valore nel repo!)

# Minimo per andare live
npx supabase secrets set --project-ref fznzfmgfsijhzjqcwmyt \
  GMAIL_USER="hairrich.olbia@gmail.com" \
  GMAIL_APP_PASSWORD="<16 chars>" \
  GMAIL_FROM_NAME="Hair Rich Olbia" \
  TELEGRAM_BOT_TOKEN="<token>" \
  PUBLIC_SITE_URL="https://hair-rich.vercel.app"

# Per le skill AI (opzionale)
npx supabase secrets set --project-ref fznzfmgfsijhzjqcwmyt \
  OPENAI_API_KEY="sk-..."

# Per Sentry (opzionale)
npx supabase secrets set --project-ref fznzfmgfsijhzjqcwmyt \
  SENTRY_DSN="https://..." \
  SENTRY_ENV="production"
```

Dopo aver impostato i secrets, **NON serve ridistribuire le Edge Functions** —
i secrets sono globali al progetto Supabase e vengono letti runtime.

---

## 📋 Sequenza di smoke test consigliata

Dopo aver impostato i secrets minimi, fai questi 5 test in ordine:

### Test 1 — Login admin
1. Apri `https://hair-rich.vercel.app/login`
2. Email `kreafase1@gmail.com` o `hairrich12@gmail.com`
3. Copia il codice OTP dall'email (ignora il link)
4. Confermi → atterri su `/admin` ✓

### Test 2 — Skills Hub
1. Vai su `/admin/funzionalita`
2. Cerca "telegram_owner_alerts"
3. Click sul toggle → si attiva
4. Vai su `/admin/impostazioni` → "Notifiche & Comunicazioni"
5. Inserisci il `chat_id` Telegram del titolare → Salva ✓

### Test 3 — Smoke Router via Telegram
Apri il Supabase SQL Editor (Dashboard) e esegui:
```sql
SELECT net.http_post(
  url := 'https://fznzfmgfsijhzjqcwmyt.supabase.co/functions/v1/notifications-router',
  headers := jsonb_build_object(
    'Authorization', 'Bearer <ANON_KEY>',
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object(
    'mode', 'owner',
    'event_type', 'owner_tech_error',
    'payload', jsonb_build_object('error', 'Test manuale post-deploy')
  )
);
```
Dovresti ricevere un messaggio Telegram tipo "🚨 Errore tecnico: Test manuale post-deploy".

### Test 4 — Crea un appuntamento di test
1. Vai sulla home pubblica `/`
2. Click "Prenota" → completa con email vera
3. Conferma
4. In admin `/admin/inbox` vedi la nuova prenotazione ✓
5. Hai ricevuto sia email che Telegram ✓

### Test 5 — Cron birthday (manuale)
Vai sul Supabase SQL Editor:
```sql
SELECT fn_invoke_edge_function('birthday-sender');
```
Se hai birthday del giorno con consenso marketing ON, riceve l'email.
Altrimenti: nessuna mail (e va bene, lo `skipped` è normale).

---

## 🎯 La domanda finale

Per andare live **oggi**, mi servono SOLO 3 cose:

1. **App Password Gmail** (~5 min di setup, ti spiego)
2. **Telegram Bot token** (~5 min di setup, ti spiego)
3. **Chat ID Telegram** del titolare (~30 sec)

Tutto il resto è OPZIONALE. Una volta che le 3 cose sono pronte, in 5
minuti rendo Hair Rich operativo al 100% sulle skill `vetrina` + alcune
`pro` (telegram_owner_alerts, customer_onboarding, gdpr_consents).

Per le skill AI (`ai_*`), aggiungi OpenAI API key successivamente.

Per i Google integration (Calendar, GBP), aggiungi quando vuoi.

---

## 💡 Cosa significa "ho attivato una skill" ora

Quando vai su `/admin/funzionalita` e accendi una skill:
1. `skills_config.enabled = true` viene salvato in DB ✅
2. La skill è "accesa" dal punto di vista del sistema ✅
3. Le Edge Functions related girano via cron quando il loro orario arriva ✅
4. Le notifiche Router rispettano il flag ✅

**Quindi**: accendere una skill ORA funziona già. Quello che manca è
solo i **secrets** per i provider esterni (Gmail, Telegram, OpenAI).

Senza Gmail: il Router non manda email → il cron birthday gira ma
salta tutti i clienti (status "no_address" perché email channel
fallisce silently).

Senza Telegram bot: gli alert al titolare non arrivano → il sistema
funziona ma tu non lo vedi.

Quindi: **accendi pure le skill che vuoi ora**, ma servono i secrets
per vederle agire.
