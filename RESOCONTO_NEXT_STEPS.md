# Hair Rich Olbia — Resoconto e Prossimi Passi (Go-Live)

Il progetto frontend è stato completato e strutturato interamente con architettura Next.js 16 App Router, Tailwind CSS 4, e componenti React (framer-motion, Zustand). Abbiamo un set di Edge Functions e uno schema DB robusto. 

Allo stato attuale, l'interfaccia utilizza logica simulata (mock data) nel frontend per permettere una navigazione e uno sviluppo UI rapidissimi, senza dipendere dal backend online. 

Cosa manca per il **Go-Live in Produzione**:

## 1. Connettere il Frontend alle chiamate Supabase (Dati Reali)
Nei vari file dentro `src/app/`, `src/components/`, attualmente usiamo array di mock come `MOCK_CLIENTS`, `MOCK_SERVICES`, ecc.
Per attivare il backend:
- [ ] Sostituire i Fake Events in `admin/agenda` con una GET request tramite il client `supabaseBrowserClient()`.
- [ ] Nell'`admin/clienti`, `admin/servizi`, eseguire fetching sul DB Postgres usando TanStack React Query (che è già wrappato in `Providers.tsx`).
- [ ] Nel Booking Engine (`StepDateTime.tsx` e finalizzazione), sostituire la logica di fallback locale preimpostata chiamando nativamente l'Edge Function `booking-create`.
- [ ] Lo Store Zustand del carrello (`useCartStore`) e del booking (`useBookingStore`) deve idratarsi dai dati live.

## 2. Deploy del Database & Edge Functions
- [ ] Accedere a Supabase Cloud, progetto vuoto.
- [ ] Eseguire `schema.sql` nell'SQL Editor per buildare le 30+ tabelle.
- [ ] Installare Supabase CLI ed eseguire `supabase functions deploy` per srotolare sul Cloud i 5 file Deno presenti in `/supabase/functions`.
- [ ] Inserire le variabili ambiente `.env.production` in Vercel.

## 3. Workflow n8n
- [ ] Importare su n8n i workflow listati in `workflows-n8n.md`.
- [ ] Linkare l'URL del primo webhook n8n come variabile d'ambiente Supabase `N8N_WEBHOOK_URL` così che le Edge Functions comunichino correttamente.

## 4. Contenuti e Asset Grafici
- [ ] Sostituire le immagini placeholder o caricate nei mock con il book fotografico definitivo del salone.
- [ ] Usare il "CMS TipTap" nell'Admin per stabilizzare i testi finali.
- [ ] Richiedere l'approvazione formale dal notaio/avvocato per `privacy/page.tsx` e `termini/page.tsx`.

## 5. PWA (Progressive Web App)
- [ ] Inserire i file `manifest.json`, icone iOS Safari e Android nella cartella `public/`. (I meta tag sono già configurati in `layout.tsx`).

Con l'espletazione di questi 5 passaggi, Hair Rich Olbia è pronto per essere rilasciato pubblicamente a tutti i clienti.
