# Manuale del titolare · Hair Rich Olbia

Benvenuto. Questo documento ti accompagna nell'uso quotidiano del gestionale.
Niente termini tecnici se possibile, niente jargon. Se trovi qualcosa che non
si capisce, scrivimi — riscriviamo la sezione.

---

## Indice

1. [Primo accesso](#1-primo-accesso)
2. [La dashboard](#2-la-dashboard)
3. [Agenda e prenotazioni](#3-agenda-e-prenotazioni)
4. [Clienti](#4-clienti)
5. [Skills Hub: le 101 funzionalità](#5-skills-hub-le-101-funzionalit)
6. [Le 12 skill che ti consiglio di accendere subito](#6-le-12-skill-che-ti-consiglio-di-accendere-subito)
7. [Inbox: dove arrivano le notifiche](#7-inbox-dove-arrivano-le-notifiche)
8. [Salute del sistema](#8-salute-del-sistema)
9. [Telegram: il tuo canale veloce](#9-telegram-il-tuo-canale-veloce)
10. [Coupon, fedeltà, referral](#10-coupon-fedelt-referral)
11. [Pacchetti prepagati](#11-pacchetti-prepagati)
12. [Recensioni Google](#12-recensioni-google)
13. [AI: suggerimenti, report, caption](#13-ai-suggerimenti-report-caption)
14. [Privacy e GDPR](#14-privacy-e-gdpr)
15. [Quando qualcosa non va](#15-quando-qualcosa-non-va)
16. [Glossario in due righe](#16-glossario-in-due-righe)

---

## 1. Primo accesso

1. Vai su `https://hairricholbia.com/admin` dal browser (Chrome, Safari, Firefox).
2. Inserisci email e password che ti ho consegnato.
3. Al primo login parte un **wizard di 4 passaggi**: nome salone, contatti, team, servizi base. Compila e clicca avanti. Tutto modificabile dopo da Impostazioni — non è bloccante.
4. Dopo il wizard atterri sulla **dashboard**.

> 💡 **Aggiungi `/admin` come schermata home sul tuo cellulare**: dal browser → condividi → "Aggiungi a Home". Si comporta come un'app vera.

---

## 2. La dashboard

Quando apri `/admin` vedi:

- **Prossimi appuntamenti**: chi viene oggi e domani
- **KPI veloci**: clienti totali, appuntamenti settimana, no-show ultimi 30 giorni
- **Inbox unread** (in alto a sinistra, badge giallo se ci sono notifiche da leggere)

La dashboard non è il posto dove fare cose — è il posto dove **capire al volo come va**. Per fare cose vai nelle sezioni della barra laterale.

---

## 3. Agenda e prenotazioni

### Vedere la giornata
- `/admin/agenda` mostra il giorno corrente in colonna
- `/admin/agenda-week` mostra la settimana
- Click su un appuntamento → dettaglio con cliente, servizio, foto pre/post

### Aggiungere un appuntamento manualmente (walk-in)
Click su uno slot vuoto in agenda → si apre un modale → scegli cliente (o crea un cliente nuovo al volo) → servizio → conferma.

### Spostare un appuntamento
Trascina (drag) un appuntamento in un altro slot. Il sistema controlla che non ci siano conflitti e blocca l'azione se lo staff è occupato.

### Cancellare
Click sull'appuntamento → "Cancella". Se la cancellazione avviene con più di 4 ore di preavviso e la lista d'attesa è attiva, il primo cliente in coda viene avvisato automaticamente (vedi [Skills Hub](#5-skills-hub-le-101-funzionalit) → Lista d'attesa).

### No-show
Click sull'appuntamento già passato → "Non si è presentato". Il cliente non viene bloccato (nessuna black-list). Ricevi le statistiche aggregate in `/admin/clienti-no-show`.

---

## 4. Clienti

### Ricerca veloce
`/admin/clienti` → cerca per nome, telefono o email nella barra in alto.

### Ricerca avanzata
`/admin/clienti-cerca` → componi filtri complessi con il query builder:
- "Clienti VIP che non vengono da 60+ giorni con compleanno questo mese"
- "Top spender che hanno fatto solo taglio base, mai combo"
- "Clienti del referral di Luca Rossi"

Salva le ricerche per riusarle. **Azioni in batch**: messaggio via Router, esporta CSV, applica coupon mirato.

### Segmenti automatici
Ogni notte il sistema classifica i clienti in: 🆕 Nuovo, 🔁 Abituale, 💎 VIP, 😴 A rischio, 🚪 Perso, ⚠️ No-show ricorrente, 🎂 Compleanno mese, 🌍 Turista, 🎁 Referral. I segmenti compaiono come badge accanto al nome.

### Scheda cliente
Click su un cliente → tabs:
- **Storico**: tutti gli appuntamenti passati con foto pre/post
- **Consensi**: cosa ti ha autorizzato a fare (marketing, foto, ecc.)
- **Pacchetti**: crediti attivi
- **Coupon usati**
- **Referral**: chi ha portato e da chi è stato portato
- **Note libere** (visibili solo a te)

---

## 5. Skills Hub: le 101 funzionalità

`/admin/funzionalita` è la "centrale di controllo" del gestionale. Ogni capability digitale del sistema è una **skill** con un toggle ON/OFF.

### Categorie
Comunicazione · Prenotazione · AI · Analytics · Clienti · Team · Marketing · Vendite · Integrazioni · Avanzata

### Filtri
- "Tutte" / "Attive" / "Disattive" / "Consigliate" / "In sviluppo"
- Barra di ricerca per nome o descrizione

### Cosa vedi su ogni card
- Icona + nome
- Descrizione in 2-3 righe
- Esempio pratico
- Beneficio atteso ("Da 4.2 a 4.7 stelle in 3 mesi")
- Effort di setup + costo mensile
- Toggle ON/OFF

### Stato di configurazione
Alcune skill richiedono account esterni (Telegram bot, Google Place ID, ecc.). Se mancano, vedi un banner giallo **"⚠️ Configurazione incompleta"** con il link per completarla. Se attivi una skill incompleta, il sistema la mette ON ma non agisce finché non completi la configurazione.

### Sempre ON
Due skill sono **infrastruttura non disattivabile**:
- 🔐 Consensi GDPR (obbligo legale)
- 🔔 Inbox notifiche admin (è il modo in cui ti parliamo)

---

## 6. Le 12 skill che ti consiglio di accendere subito

Ordine di priorità basato su **impatto / sforzo**. Accendile una alla volta nell'arco di una settimana:

| # | Skill | Cosa fa | Quando accenderla |
|---|---|---|---|
| 1 | 📲 Alert Telegram titolare | Ti notifica nuove prenotazioni, cancellazioni, recensioni negative | Subito — serve a tutto il resto |
| 2 | 🔔 Promemoria via push web | I clienti registrati ricevono promemoria 24h prima | Subito — gratis, riduce no-show |
| 3 | 🛒 Upsell intelligente | Propone "+barba €10" al booking | Subito — +20% AOV |
| 4 | 🤝 Gestione no-show empatica | Mai blocchi, solo outreach AI | Subito — Telegram bot già fatto |
| 5 | ⭐ Raccolta recensioni Google | Dopo il taglio, link a Google ai clienti felici | Quando hai Google Place ID |
| 6 | 🎂 Auguri compleanno | Coupon -20% il giorno del compleanno | Dopo 2 settimane di dati clienti |
| 7 | 🎯 Riattivazione clienti persi | Win-back automatico ogni lunedì | Dopo 60 giorni di dati |
| 8 | ⏳ Lista d'attesa | Quando uno cancella, avvisa il prossimo in coda | Quando hai 10+ prenotazioni al giorno |
| 9 | 🎫 Pacchetti prepagati | Vendi 5 tagli prepagati in salone | Quando vuoi cash flow anticipato |
| 10 | 📋 Sondaggio post-visita NPS | Intercetta insoddisfazione prima di Google | Insieme a #5 |
| 11 | 🧠 Suggerimenti AI settimanali | Email ogni lunedì con azioni operative | Dopo 30 giorni di dati |
| 12 | 📊 Report AI mensile | Email il 1° del mese con KPI + analisi | Dopo 60 giorni |

---

## 7. Inbox: dove arrivano le notifiche

`/admin/inbox` (anche raggiungibile dal badge in alto a sinistra) è la **casella unica** dove arriva ogni evento operativo:

- 🟢 Nuova prenotazione
- 🔴 Cancellazione
- ⚠️ No-show
- 😞 Cliente insoddisfatto (sondaggio negativo o recensione bassa)
- 📦 Scorta bassa
- 📉 Calo prenotazioni della settimana
- 📊 Riepilogo giornaliero ore 18:00

### Filtri
- "Da leggere" / "Tutte" / "Archiviate"
- Categoria (appuntamenti / clienti / catalogo / sistema / marketing)

### Azioni
- Click su un evento → vai dove serve (es. cancellazione → /admin/agenda)
- "Letta" → sparisce dal contatore unread
- "Archivia" → la togli dal feed corrente, resta in "Archiviate"

> 💡 Lo stesso evento ti arriva anche su **Telegram** in tempo reale se hai attivato gli Alert (skill #70). L'inbox è il backup permanente.

---

## 8. Salute del sistema

`/admin/salute` è la tua "dashboard di fiducia": ti dice se le cose stanno funzionando.

### Banner traffic-light in alto
- 🟢 Tutto OK
- 🟡 Attenzione (qualche job in ritardo o errore recente)
- 🔴 Problemi attivi (errori multipli — chiamami)

### KPI cards
- Funzionalità attive: X su 101
- Notifiche inviate ultime 24h
- Inbox da leggere
- Errori ultimi 7 giorni

### Canali
Per Telegram, Email, Google Calendar staff: ✓ configurato o ⚠️ da configurare con link rapido per completare.

### Job pianificati
Tabella di tutti i cron automatici: quando hanno girato l'ultima volta e se hanno avuto successo. Se vedi un "⚠️ in ritardo" significa che il job non è girato dal momento previsto — segnalamelo.

---

## 9. Telegram: il tuo canale veloce

Il bot Telegram è il modo più rapido per restare informato. Setup una tantum:

1. Su Telegram cerca `@BotFather` → `/newbot` → segui le istruzioni → copia il token
2. Su Telegram cerca il bot appena creato e premi `/start`
3. Apri `https://api.telegram.org/bot<TUO-TOKEN>/getUpdates` nel browser
4. Trova il campo `"chat":{"id":NUMERO,...}` → copia il numero
5. In `/admin/impostazioni` → Notifiche & Comunicazioni → incolla il numero in **Chat ID Telegram**
6. Salva

Da quel momento ricevi gli alert configurati (puoi scegliere quali in Skills Hub → Alert Telegram titolare).

### Quiet hours
Per default tra le 22:00 e le 08:00 i messaggi non urgenti vengono trattenuti. Cambi gli orari in Impostazioni.

### Eventi critici che ignorano quiet hours
- Cancellazione cliente <3h
- Cliente waitlist conferma slot
- Errore tecnico

---

## 10. Coupon, fedeltà, referral

### Coupon (`/admin/gamification`)
- Crea codici con scadenza, importo minimo, sconto fisso o %, una-tantum o ricorrenti
- Genera codici random in batch (es. 50 codici per un volantino)
- Vedi quanti sono stati usati, da chi, su quale appuntamento

### Fidelity
Modello configurabile: a-stamp (5 tagli = 1 gratis), a-punti (€10 = 1 punto), cashback. Soglie e premi modificabili senza codice.

### Referral
Ogni cliente registrato ha un codice unico. Lo condivide. Quando l'amico prenota:
1. L'amico inserisce il codice nel booking drawer
2. Quando l'amico viene davvero (status='completed') → entrambi ricevono un credito
3. Statistiche in `/admin/gamification` → tab Referral

---

## 11. Pacchetti prepagati

`/admin/pacchetti` — niente Stripe, tutto in salone.

### Catalogo
Crea pacchetti tipo "10 tagli a €180" (sconto vs prezzo singolo) o "5 combo a €130". Modificabili in qualsiasi momento.

### Vendita
Vai sulla scheda cliente → "Vendi pacchetto" → scegli pacchetto, importo pagato effettivo, metodo (cash/POS/bonifico/omaggio), note. Il cliente riceve una ricevuta email automatica.

### Uso del credito
Quando il cliente prenota online o tu lo aggiungi manualmente, il booking drawer vede i crediti attivi e propone "Usa 1 credito? (gratis)".

### Scadenza
Per default 12 mesi dall'acquisto. Pacchetti scaduti → status diventa "expired", non più utilizzabili. Cron daily manda promemoria 30/7/1 giorni prima della scadenza.

---

## 12. Recensioni Google

`/admin/marketing` → tab Recensioni.

### Setup una tantum
- Google Business Profile attivo per il salone (se non ce l'hai, aprilo gratis su google.com/business)
- Place ID del salone → in Impostazioni → Notifiche & Integrazioni

### Come funziona
1. 2 ore dopo un appuntamento completato il sistema manda un messaggio al cliente
2. Tre opzioni: 😊 😐 😞
3. 😊 → link diretto a Google con recensione pre-compilata
4. 😐 o 😞 → arriva un alert a te su Telegram, NON va su Google. Tu lo richiami.

### Anti-spam
- Massimo 1 richiesta per appuntamento
- Cooldown 90 giorni per cliente
- Verifica fuzzy-match con Google Places API: se il cliente ha già lasciato recensione, non lo disturbiamo più

---

## 13. AI: suggerimenti, report, caption

Il sistema usa GPT-4o-mini di OpenAI per generare testi in italiano. Costo ~€1-2 al mese per il tuo volume tipico.

### Setup
Una sola API key OpenAI da inserire nei secrets Supabase (chiedimi se non l'hai).

### Cosa fa
1. **Suggerimenti settimanali** (lunedì 9:00): email con 3-5 azioni operative basate sui dati della settimana ("Marco non viene da 60gg, attiva campagna riattivazione", "Lunedì sempre vuoto, considera promo")
2. **Report mensile** (1° del mese 9:00): email con KPI dettagliati + obiettivi per il mese in corso. Lo puoi inoltrare al commercialista.
3. **Caption Instagram**: in `/admin/contenuti-ai`, carichi una foto del lavoro → AI propone 3 caption + hashtag + miglior orario per postare.
4. **Bozza outreach no-show**: nella scheda no-show, click "Chiedi spiegazione" → AI scrive una bozza empatica che tu modifichi e invii.

---

## 14. Privacy e GDPR

### Quello che il cliente vede
Al primo login `/profilo` mostra un wizard che chiede 5 consensi separati:
1. Marketing e promozioni
2. Promemoria appuntamenti (consigliato, pre-spuntato)
3. Foto prima/dopo
4. Profilazione comportamentale
5. Programma referral

### Quello che tu devi sapere
- I consensi sono **revocabili in qualsiasi momento** dal cliente in `/profilo/impostazioni`
- Ogni grant/revoca è registrato con data, IP e versione policy in un audit log immutabile
- **Il Notification Router rispetta i consensi**: se un cliente revoca "marketing", il cron compleanno non gli manda nulla. Garantito.
- Se cambi i testi della privacy in modo sostanziale, devi incrementare la **policy version** in `src/lib/profilo/consents.ts` e i clienti ricevono al login un re-prompt

### Esportazione dati
Il cliente può scaricare un JSON con profilo + appuntamenti + ordini + consensi da `/profilo/impostazioni`. È un diritto GDPR (art. 20).

### Cancellazione account
Il pulsante "Elimina account" non cancella subito — apre un'email a info@hairrich.it. Tu hai 30 giorni per processarla. Per ora è manuale; quando avremo volume basso ma costante, automatizzo la cancellazione self-service.

---

## 15. Quando qualcosa non va

### Il sito è giù
Vercel ha un dashboard di stato: `https://www.vercel-status.com/`. Solitamente non è quello — è uno dei servizi (Supabase, Gmail, ecc.). Vai su `/admin/salute` — ti dice quale canale è ok e quale no.

### Un cliente dice "non mi è arrivato il messaggio"
1. `/admin/inbox` → controlla se l'evento è stato registrato
2. Apri la scheda cliente → tab "Comunicazioni" → vedi ogni messaggio inviato, su quale canale, stato (delivered/failed)
3. Se è "failed" e tutti gli altri funzionano → probabilmente il cliente ha mail piena / numero sbagliato

### Un cron job non è girato
`/admin/salute` → sezione "Job pianificati". Se vedi "⚠️ in ritardo" segnalamelo, controllo i log Supabase.

### Una skill non funziona dopo averla attivata
- Apri la card su `/admin/funzionalita`
- Se vedi il banner giallo "Configurazione incompleta" → segui le istruzioni nel banner
- Se sembra tutto verde ma non funziona → controlla `/admin/salute` per il canale che dovrebbe usare

### Errori 500 in admin
Probabile causa: una migration non applicata in Supabase. Chiamami, applico io.

---

## 16. Glossario in due righe

- **Skill** — una funzionalità del gestionale (ce ne sono 101). Si accende/spegne da Skills Hub.
- **Router** — il sistema che decide come mandare un messaggio (WA, email, push, SMS). Trasparente.
- **Cron** — un'azione automatica che gira a orario fisso (es. compleanni alle 9:00).
- **Edge Function** — un mini-programma che gira nel cloud Supabase. Non devi toccarli, ma sappi che esistono.
- **PWA** — il sito installato come app sul telefono del cliente.
- **GDPR** — il regolamento europeo sulla privacy che dobbiamo rispettare.
- **Inbox** — la tua casella di notifiche admin.
- **Place ID** — l'identificatore univoco del tuo salone su Google Maps. Serve per le recensioni.

---

## Domande?

Scrivimi su Telegram o email. Questo documento è vivo: quando trovi qualcosa di poco chiaro, segnalami quale paragrafo e te lo riscrivo.

— Krea
