# Skills Hub — cosa accendere e cosa no (guida per il titolare)

> Materiale per la formazione del proprietario. Aggiornato 3 giugno 2026.
> Riflette esattamente il registro reale in `src/lib/skills/registry.ts`.
> Tutte le skill si gestiscono da **`/admin/funzionalità`** (Skills Hub):
> ogni riquadro ha un interruttore ON/OFF e una "Guida completa".
>
> **Regola d'oro**: di default è tutto SPENTO. Si accende una skill alla
> volta, solo quando serve. Niente si rompe se resta spenta.

Totale: **101 skill** → 40 consigliate (✅) · 41 opzionali (⏸️) · 20 escluse (❌).

---

## 0. Sempre accese — non si toccano (2)

Sono infrastruttura di base, non si possono spegnere:

| Skill | Cosa fa |
|---|---|
| 🔐 **Consensi GDPR** (`gdpr_consents`) | Raccoglie e archivia i consensi privacy. Obbligo di legge. |
| 📥 **Inbox admin** (`admin_inbox`) | L'elenco unico di tutto ciò che succede (prenotazioni, cancellazioni, ecc.). |

---

## 1. Accendere SUBITO — funzionano da sole, nessuna credenziale (11)

Queste lavorano solo sui dati interni del gestionale. Si possono accendere
in settimana 1 senza configurare nulla di esterno.

| Skill | Cosa fa in una riga |
|---|---|
| 🎪 **Coupon & sconti** (`coupons`) | Crea codici sconto; appare il campo "Hai un codice?" nel booking. |
| 🎟️ **Fidelity / punti** (`loyalty`) | Tessera punti configurabile (a timbri / punti / cashback). |
| 🎫 **Pacchetti prepagati** (`service_packages`) | Vendi 5/10 tagli in salone; il credito si scala al booking. |
| 🛒 **Upsell intelligente** (`smart_upsell`) | "Aggiungi barba +€10?" prima di confermare la prenotazione. |
| 🏷️ **Segmenti clienti** (`customer_segments`) | Etichetta automatica: nuovo / abituale / VIP / a rischio… |
| ⚙️ **Onboarding cliente** (`customer_onboarding`) | Mini-wizard al primo accesso del cliente (nome, compleanno, consensi). |
| 🔍 **Ricerca avanzata clienti** (`advanced_customer_search`) | Filtri combinati + ricerche salvate + export. |
| 📄 **QR promozioni** (`qr_promotions`) | QR stampabili per volantini, con tracciamento di quante prenotazioni portano. |
| 🏠 **Rubrica fornitori** (`suppliers_directory`) | Anagrafica fornitori + storico ordini + PDF ordine. |
| 🤝 **Passaparola / referral** (`referrals`) | Codice invita-un-amico; condivisione via WhatsApp/SMS del cliente (nessuna API). |
| 📋 **Log attività** (`activity_log`) | Traccia ogni modifica (chi/cosa/quando) per controllo. |

---

## 2. Già attive da sole — niente da fare, solo da sapere (9)

Fanno parte del sito/gestionale e funzionano senza interruttore da gestire:

- 🤳 **Prenota da Instagram** (`instagram_booking`) — basta il link in bio.
- ⏰ **Analisi orari di punta** (`peak_hours_analysis`).
- 📸 **Archivio foto clienti** (`customer_photos_archive`).
- 📆 **Calendario ferie/chiusure** (`vacation_calendar`).
- 🖼️ **Gallery prima/dopo** (`before_after_gallery`) — pagina Lavori.
- 🔗 **Link in bio dinamico** (`dynamic_link_in_bio`) — il sito stesso.
- 💡 **Prezzi dinamici** (`dynamic_pricing_widget`) — prezzi dal listino.
- 💾 **Backup & export dati** (`data_backup_export`) — Supabase + export CSV.
- 📱 **App cliente PWA** (`customer_pwa`) — il sito è installabile.

---

## 3. Accendere DOPO aver inserito le credenziali (18)

Funzionano solo quando la credenziale corrispondente è configurata.
Le 6 credenziali si procurano una volta sola (vedi sez. 6).

### 📧 Servono Gmail dedicato (email ai clienti)
| Skill | Cosa fa |
|---|---|
| 🎂 **Auguri compleanno** (`birthday_campaign`) | Email + coupon il giorno del compleanno. |
| 🌱 **Riattivazione** (`reactivation_campaigns`) | "Ti aspettiamo" ai clienti spariti da >90 giorni. |
| ⏳ **Lista d'attesa** (`waitlist`) | Su cancellazione, avvisa il primo in coda dello slot libero. |
| 📝 **Sondaggio post-visita** (`post_visit_survey`) | 3 faccine + commento privato, per intercettare gli scontenti. |

### 📧 Gmail + ⭐ Google Place ID
| ⭐ **Raccolta recensioni** (`reviews_harvester`) | Dopo il taglio chiede recensione; i felici → Google, gli scontenti → te. |

### 📧 Gmail + 📲 Telegram
| 📣 **Promo last-minute** (`last_minute_promo`) | Quando domani ha buchi, tu (via Telegram) attivi una promo ai clienti abituali. |

### 📧 Gmail + 🤖 OpenAI
| 🤝 **No-show outreach** (`noshow_outreach`) | Lista no-show + bozza email "tutto bene?" scritta dall'AI (la cruscotto funziona già senza AI). |

### 📲 Servono Telegram (avvisi al titolare)
| Skill | Cosa fa |
|---|---|
| 📲 **Avvisi Telegram titolare** (`telegram_owner_alerts`) | Tutti gli alert (prenotazioni, cancellazioni, no-show…) sul tuo Telegram. |
| 📉 **Alert calo prenotazioni** (`bookings_drop_alert`) | Avviso se la settimana è >20% sotto media (utile dopo ~2 mesi di dati). |
| 📦 **Alert scorte basse** (`stock_alerts`) | Ti avvisa quando un prodotto sta finendo. |

### 🤖 Servono OpenAI (qualche euro/mese)
| Skill | Cosa fa |
|---|---|
| 🎨 **Generatore contenuti AI** (`ai_content_generator`) | Carichi una foto → 3 caption Instagram + hashtag. |
| 🧠 **Suggerimenti AI settimanali** (`ai_weekly_suggestions`) | 3-5 azioni operative ogni lunedì (utile dopo 60-90 gg di dati). |
| 📊 **Report mensile AI** (`ai_monthly_report`) | Report del mese il 1° di ogni mese (utile dopo qualche mese). |

### 🔔 Servono chiavi VAPID
| 🔔 **Notifiche push web** (`web_push`) | Notifiche al cliente sul telefono/PC (senza app). |

### 🟦 Servono Google OAuth
| Skill | Cosa fa |
|---|---|
| 📅 **Sync Google Calendar staff** (`staff_gcal_sync`) | Gli appuntamenti finiscono nel calendario personale dell'operatore. |
| 🕑 **Sync orari su Google** (`google_hours_sync`) | Orari/chiusure aggiornati automaticamente sul profilo Google. |
| 🔗 **Prenota da Google** (`google_reserve`) | Pulsante "Prenota" sul profilo Google (richiede approvazione partner ~1-2 sett). |

### ⚠️ Consigliata ma rimandata
| 💬 **Reminder WhatsApp** (`whatsapp_reminders`) | Promemoria via WhatsApp. **Richiede approvazione Meta Business (~1 mese)**: non è ancora nel codice. Per ora i reminder vanno via Email. |

---

## 4. Sequenza consigliata per la formazione

1. **Settimana 1 (subito, zero setup)**: accendi le 11 della sez. 1.
   Mostra al titolare che le 2 sempre-accese e le 9 "già attive" lavorano da sole.
2. **Quando arriva Gmail + Telegram**: accendi `telegram_owner_alerts`,
   `birthday_campaign`, `waitlist`, `post_visit_survey`, `reviews_harvester`.
3. **Quando arriva OpenAI**: `ai_content_generator` subito; `ai_weekly_suggestions`
   e `ai_monthly_report` lasciale accese ma daranno valore dopo qualche mese di dati.
4. **Quando arrivano VAPID / Google**: `web_push`, `staff_gcal_sync`,
   `google_hours_sync`, e infine `google_reserve` (dopo approvazione).
5. **WhatsApp**: solo dopo il setup Meta (~1 mese).

---

## 5. NON attivare — escluse di proposito per questo salone (20)

Fuori scope per un barbiere a 2 poltrone, o già coperte da strumenti gratuiti.
Non perderci tempo:

`auto_quote` (preventivo automatico — prezzi fissi) ·
`telegram_booking_bot` · `whatsapp_quote_agent` ·
`hair_consult_ai` (consulenza capelli AI) ·
`ai_price_optimizer` (prezzi fissi) ·
`customer_technical_sheet` (formule colore — è un barbiere) ·
`allergens_management` ·
`team_internal_chat` (meglio WhatsApp esterno) ·
`social_scheduler` (Buffer/Later gratis) ·
`social_comment_bot` ·
`credit_recovery_bot` (niente insoluti) ·
`seasonal_pricing` (prezzi fissi) ·
`seo_position_tracker` (Search Console gratis) ·
`apple_maps_integration` ·
`uptime_monitoring` (UptimeRobot gratis) ·
`salon_tv_dashboard` ·
`shipping_courier` (solo ritiro in salone) ·
`multi_location` + `multi_location_price_sync` (un solo salone) ·
`staff_contracts` (HR fuori scope).

---

## 6. Le 6 credenziali che sbloccano la sez. 3

| # | Credenziale | Sblocca | Dove si mette |
|---|---|---|---|
| 1 | Gmail dedicato + App Password | Tutte le email ai clienti | Supabase Secrets |
| 2 | Telegram Bot Token | Avvisi al titolare | Supabase Secrets |
| 3 | Chat ID Telegram titolare | Destinatario avvisi | `/admin/impostazioni` |
| 4 | OpenAI API key | Tutte le skill AI | Supabase Secrets |
| 5 | Chiavi VAPID | Notifiche push web | Supabase Secrets + impostazioni |
| 6 | Google OAuth + Place ID | Calendar / orari / Reserve / recensioni | Supabase Secrets + impostazioni |

Dettaglio passo-passo: vedi `CLAUDE.md` → "Checklist unica di attivazione produzione" (Step 1-8).

---

## 6 cose opzionali (⏸️) che esistono ma decidi più avanti

Non servono per partire. Le più sensate da tenere a mente:
SMS di fallback (`sms_notifications`), Newsletter (`newsletter`),
Gift card (`gift_cards`), Acconto/deposito (`deposit_prepayment`, serve Stripe),
Stampa agenda PDF (`agenda_pdf_print`), Simulatore guadagni operatore
(`staff_earnings_simulator`), Heatmap clienti (`customer_heatmap`),
Meta Ads (`meta_ads_integration`), Fatture in Cloud (`fatture_in_cloud`),
POS pagamenti (`pos_payments`), Assistente multilingua (`multilingual_assistant`).
