// Skill tutorials — guide motivazionali in stile "perché attivarla?".
//
// Tenute fuori dal registry per non gonfiare il file con prosa lunga.
// Lookup per skill_key. Le skill senza tutorial dedicato ricadono su un
// fallback generico costruito dai campi del registry (descriptionIT,
// exampleIT, benefitIT, requiresAccount, effortHours).

export interface SkillTutorial {
    /** Hook motivazionale — 2-3 frasi che il titolare legge per primo. */
    whyMatters: string;
    /** 3-5 benefici concreti, scritti per il titolare (no jargon). */
    pros: string[];
    /** Trade-off onesti. Lasciare vuoto se non rilevante. */
    cons?: string[];
    /** Esempio di scenario quotidiano in salone. */
    realScenario?: string;
    /** Passi di attivazione, ordinati. */
    steps: string[];
    /** Numeri stimati (impatto atteso). */
    expectedImpact?: string[];
    /** Domande frequenti. */
    faq?: Array<{ q: string; a: string }>;
}

export const SKILL_TUTORIALS: Record<string, SkillTutorial> = {
    reviews_harvester: {
        whyMatters:
            "Le recensioni Google sono il primo segnale che vede chi cerca 'barbiere Olbia'. Passare da 4.2 a 4.7 stelle si traduce in più click sul tuo profilo, più chiamate, più prenotazioni — senza spendere un euro in pubblicità.",
        pros: [
            "Ogni cliente felice riceve un nudge gentile 2h dopo il taglio: tap su 😊 → si apre Google con la recensione pronta.",
            "I clienti scontenti vengono dirottati su un canale interno (form privato) → tu sai subito di un problema PRIMA che diventi pubblico.",
            "Anti-spam su 5 livelli: nessun cliente riceve mai più di una richiesta per appuntamento, cooldown 90gg.",
            "Tu vedi il funnel in /admin/marketing: quanti inviati, quanti aperti, quanti effettivamente lasciati.",
        ],
        cons: [
            "Richiede di inserire il tuo Google Place ID in /admin/impostazioni (5 minuti).",
            "I primi 30 giorni l'impatto si vede poco — Google indicizza le nuove recensioni con un piccolo delay.",
        ],
        realScenario:
            "Marco esce dal salone alle 14. Alle 16:30 riceve un WhatsApp 'Com'è andata oggi? 😊 / 😞'. Tap su 😊 → si apre direttamente la pagina Google del salone con la recensione pre-compilata. 5 minuti di lavoro per Marco, 0.05 stelle in più per te ogni 5 recensioni positive.",
        steps: [
            "Recupera il tuo Google Place ID da Google Business Profile (cerca 'Hair Rich Olbia' su https://www.google.com/maps e copia l'ID dall'URL).",
            "In /admin/impostazioni → sezione SEO inserisci il Place ID e l'URL recensione.",
            "Torna in Skills Hub e attiva 'reviews_harvester'.",
            "Aspetta il primo appuntamento completato → 2h dopo, la richiesta parte automaticamente.",
            "Monitora il funnel da /admin/marketing → Recensioni.",
        ],
        expectedImpact: [
            "+0.3-0.5 stelle nei primi 2-3 mesi",
            "+30% click sul profilo Google a parità di posizione",
            "1-2 problemi intercettati al mese PRIMA che diventino recensioni 1★ pubbliche",
        ],
    },
    birthday_campaign: {
        whyMatters:
            "Un auguri il giorno del compleanno con un coupon -20% valido 7 giorni è una delle automazioni con il ROI più alto in assoluto. Apertura messaggio ~80%, riscatto ~30%, costo zero per messaggio.",
        pros: [
            "Il cliente si sente ricordato, non spammato — il 25 luglio non ti aspetti un'email dal salone.",
            "Coupon a scadenza breve (7gg) → urgency naturale, prenotazione veloce.",
            "Tu non devi ricordarti niente — parte automaticamente alle 9:00 di ogni giorno.",
            "Funziona solo per chi ha la data di nascita registrata → spinge i clienti a completare il profilo (vedi skill customer_onboarding).",
        ],
        realScenario:
            "Carlo compie 35 anni il 12 marzo. Alle 9:00 del 12 marzo riceve 'Buon compleanno Carlo! 🎂 Il taglio è -20% fino al 19 marzo'. Apre, prenota, viene. Aov medio €25 → -20% = €5 di sconto, +€20 di ricavo che senza la campagna non avresti avuto.",
        steps: [
            "Attiva la skill 'customer_onboarding' (richiede il campo birthday al primo accesso /profilo).",
            "Attiva 'birthday_campaign' dallo Skills Hub.",
            "Verifica in /admin/cms il template 'birthday_message' — è personalizzabile (testo + sconto).",
            "Il cron parte automaticamente ogni mattina alle 9:00.",
        ],
        expectedImpact: [
            "Apertura messaggio: ~80%",
            "Riscatto coupon: ~30%",
            "Ricavo aggiuntivo: ~€60-100/mese su 50 clienti registrati con birthday",
        ],
        faq: [
            {
                q: "E se il cliente non ha il birthday compilato?",
                a: "Nessun problema — la skill manda solo a chi ha il campo popolato. Per popolarlo, attiva customer_onboarding (wizard 90s al primo accesso /profilo).",
            },
        ],
    },
    coupons: {
        whyMatters:
            "I coupon sono il modo più diretto di trasformare un'intenzione 'forse vado dal barbiere' in una prenotazione concreta. Senza un sistema strutturato i coupon sono caos — con questa skill diventano misurabili.",
        pros: [
            "Crei codici una volta, valgono finché vuoi.",
            "Vincoli configurabili: cap totale, max per cliente, valido solo su X servizio, min spesa, scadenza.",
            "Tracking automatico: vedi quanti riscatti, da quale fonte (volantino A vs newsletter B).",
            "Si integra con la skill referrals (codici amico) e qr_promotions (volantini stampati).",
        ],
        realScenario:
            "Stampi 100 volantini con QR per un evento locale. Ogni QR è un coupon univoco WELCOME-XXXX. Dopo l'evento sai esattamente quante prenotazioni hai recuperato da quei volantini, e quanto ti è costata l'attivazione per cliente nuovo acquisito.",
        steps: [
            "Attiva 'coupons' dallo Skills Hub.",
            "Vai in /admin/gamification → Coupon → 'Nuovo coupon'.",
            "Imposta codice (es. WELCOME10), sconto (€/% ), durata, vincoli.",
            "Il campo 'Hai un codice?' compare automaticamente nel BookingDrawer.",
            "Monitora i riscatti in /admin/gamification → tab 'Riscatti'.",
        ],
        expectedImpact: [
            "Conversione lead → cliente: +15-25% con coupon di benvenuto",
            "AOV: leggera flessione (-5%) ma volume +20%",
        ],
    },
    service_packages: {
        whyMatters:
            "Vendere 5 tagli prepagati invece di uno significa cash-flow immediato + cliente legato per le prossime 5 visite. È il prodotto più redditizio che puoi offrire senza alzare i prezzi.",
        pros: [
            "Il cliente paga in salone — niente Stripe, niente commissioni, niente complicazioni online.",
            "Crediti tracciati automaticamente: BookingDrawer rileva il credito e chiede 'Usa 1 credito?'",
            "Promemoria scadenza automatici 30/7/1 giorno prima → evita 'mi sono dimenticato'.",
            "Marginalità più alta: 5 tagli a €90 invece di 5 × €20 = €100 — il cliente paga 10% in meno ma tu hai il cash subito.",
        ],
        realScenario:
            "Federico viene una volta al mese. Gli proponi il pacchetto '6 tagli a €100 invece di €120'. Paga oggi €100 cash. Tu hai 6 visite garantite per i prossimi 6 mesi, e sai che torna sempre da te (non dal concorrente).",
        steps: [
            "Attiva 'service_packages' dallo Skills Hub.",
            "Vai in /admin/pacchetti → 'Nuovo pacchetto'.",
            "Imposta nome, num crediti, prezzo, scadenza, servizi inclusi.",
            "Da /admin/clienti/[id] → 'Vendi pacchetto' lo applichi a un cliente specifico.",
            "Il cliente vede i suoi crediti attivi in /profilo/credito.",
        ],
        expectedImpact: [
            "5-10% dei clienti abituali compra il pacchetto",
            "Cash-flow upfront: €500-1000 al lancio",
            "Tasso di abbandono: -40% (chi ha crediti torna)",
        ],
    },
    loyalty: {
        whyMatters:
            "Una raccolta-stamp digitale ('5 tagli, il 6° gratis') è semplice, riconosciuta universalmente, e fa tornare il cliente in modo prevedibile. È il programma fedeltà che funziona davvero per un barber a 2 sedie.",
        pros: [
            "Tutto configurabile da admin: modello (stamp / punti / cashback), soglia, reward.",
            "Cliente vede la sua progress bar in /profilo/dashboard ('4/6 tagli per il prossimo omaggio').",
            "Stamp accumulati automaticamente al completamento appuntamento.",
            "Anti-gaming: una sola stamp per appuntamento, max 1 reward attivo per volta.",
        ],
        realScenario:
            "Roberto al suo 5° taglio vede in /profilo 'Sei a 5/6 — la prossima volta ti aspetta un regalo'. La settimana dopo prenota (probabilmente prima del previsto). Tu offri un taglio gratis che ti costa €5 di tempo, lui torna fedele per altri 6.",
        steps: [
            "Attiva 'loyalty' dallo Skills Hub.",
            "Vai in /admin/gamification → tab Fedeltà → configura il modello (es. 5 stamp → 1 gratis).",
            "Da subito tutti i clienti registrati vedono il loro contatore in /profilo.",
            "Le stamp vengono attribuite quando un appuntamento passa a status='completed'.",
        ],
        expectedImpact: [
            "Frequenza visite: +20% nei primi 3 mesi",
            "Tasso di ritorno entro 6 settimane: da ~50% a ~70%",
        ],
    },
    referrals: {
        whyMatters:
            "Il cliente soddisfatto è il tuo miglior marketer — ma serve un sistema che gli dia un motivo concreto per parlare di te. Codice amico con doppio vantaggio (sconto per chi invita + sconto per chi viene) trasforma il passaparola passivo in passaparola misurabile.",
        pros: [
            "Codice univoco per ogni cliente registrato (ABC-1234).",
            "Quando un nuovo si registra con quel codice → entrambi ricevono un coupon.",
            "Cliente vede in /profilo/referral chi ha invitato, chi ha effettivamente prenotato, il suo credito accumulato.",
            "Share buttons WhatsApp/SMS pronti, no copia-incolla.",
        ],
        realScenario:
            "Marco prenota, riceve un buon servizio, riceve via email il suo codice GRAZIE-MARCO. Lo manda al cugino Luca su WhatsApp. Luca prenota con quel codice → riceve -10% sul primo taglio. Marco riceve un credito di €5 sul prossimo suo taglio. Tu acquisisci Luca a costo €5.",
        steps: [
            "Attiva 'referrals' dallo Skills Hub.",
            "Verifica in /admin/gamification → tab Referral il tipo di reward (sconto/credito).",
            "Ogni cliente attivo vede automaticamente il proprio codice in /profilo/referral.",
            "Il campo 'Codice amico' compare nel BookingDrawer al primo accesso.",
        ],
        expectedImpact: [
            "Tasso di share: ~15% dei clienti soddisfatti condivide attivamente",
            "Conversion rate del codice condiviso: ~10%",
            "Costo per acquisizione cliente: €5-10 (solo il coupon di benvenuto)",
        ],
    },
    waitlist: {
        whyMatters:
            "Ogni cancellazione last-minute è un buco in agenda — soldi persi. La waitlist trasforma quel buco in un'opportunità: i clienti in attesa ricevono un alert e prenotano in minuti, non in giorni.",
        pros: [
            "Cliente in waitlist con un click sul calendario quando lo slot è già preso.",
            "Soft-reservation: chi cancella libera lo slot, il primo in lista riceve un token valido X ore.",
            "Token validity adattiva: 6h se cancellazione >24h prima, 45min se <3h prima.",
            "Niente 'corsa al primo che risponde': lo slot è bloccato per chi ha il token.",
        ],
        realScenario:
            "Sabato alle 11 ti cancellano l'appuntamento delle 17. Stefano è in waitlist per quello slot — riceve subito 'Si è liberato il sabato alle 17. Tap qui per confermare entro 1 ora'. Conferma. Tu hai recuperato un appuntamento che sarebbe rimasto vuoto.",
        steps: [
            "Attiva 'waitlist' dallo Skills Hub.",
            "Verifica in /admin/impostazioni i parametri (cancel_min_hours, token validity).",
            "Il bottone 'Mettimi in lista' compare automaticamente nel BookingDrawer quando uno slot è pieno.",
            "Monitora la coda in /admin/waitlist.",
        ],
        expectedImpact: [
            "Recupero cancellazioni: ~60% degli slot liberati riempiti entro 1h",
            "Slot vuoti per cancellazione last-minute: -50%",
        ],
    },
    telegram_owner_alerts: {
        whyMatters:
            "Email + WhatsApp business diventano rumore quando il volume cresce. Un canale dedicato (Telegram, gratuito) per gli alert operativi è la cosa più semplice e potente: notifiche istantanee, lette in 1 secondo, niente confusione con i clienti.",
        pros: [
            "Setup 5 minuti: parli con @BotFather su Telegram, ottieni il token, lo metti in Skills Hub.",
            "Granularità completa: scegli quali eventi notificare (nuova prenotazione / cancellazione / no-show / recensione negativa / slot vuoto).",
            "Quiet hours configurabili (default 22-08): di notte non vibri.",
            "Daily digest opzionale alle 18:00: chiusura giornata in un solo messaggio.",
        ],
        realScenario:
            "Alle 14:30 ricevi 'Nuova prenotazione: Roberto, taglio classico, sabato 15:00. Cliente da 3 mesi, ultima visita 18gg fa.' Tutto quel contesto in 1 messaggio Telegram, mentre stai facendo barba a un altro cliente.",
        steps: [
            "Su Telegram cerca @BotFather → /newbot → salva il TOKEN.",
            "Invia /start al bot dal tuo Telegram personale.",
            "Recupera il tuo chat_id da https://api.telegram.org/bot<TOKEN>/getUpdates",
            "In /admin/impostazioni → Notifiche & Comunicazioni inserisci chat_id.",
            "Attiva 'telegram_owner_alerts' dallo Skills Hub e configura quali eventi.",
        ],
        expectedImpact: [
            "Tempo di reazione a problemi operativi: da ore a minuti",
            "Costo: €0/mese",
        ],
    },
    ai_weekly_suggestions: {
        whyMatters:
            "Ogni lunedì alle 9:00 ricevi 3-5 azioni concrete basate sui dati della settimana scorsa: chi richiamare, dove c'è una flessione, quale promo fare. È un consulente operativo che lavora mentre tu dormi.",
        pros: [
            "GPT-4o-mini analizza i tuoi dati anonimizzati (no PII al modello).",
            "3-5 azioni concrete, non analisi generiche: 'Chiama questi 4 clienti che non sono tornati da 60gg'.",
            "Costo: €0.05/mese (microscopico).",
            "Diventa più utile dopo 30-60gg di dati raccolti.",
        ],
        realScenario:
            "Lunedì 9:00 ricevi via email: '1) Le prenotazioni del giovedì sono calate del 30% — considera una promo Giovedì Felice. 2) Carlo (cliente da 2 anni) non viene da 75 giorni — un richiamo manuale costa nulla. 3) I clienti che hanno usato il coupon WELCOME10 nei 60gg precedenti hanno fatto in media 1.8 visite — il pattern funziona.'",
        steps: [
            "Inserisci OPENAI_API_KEY nei secrets Supabase (Dashboard → Edge Functions → Secrets).",
            "Carica €10 sul wallet OpenAI (basta per 200 settimane).",
            "Attiva 'ai_weekly_suggestions' dallo Skills Hub.",
            "Lunedì successivo alle 9:00 ricevi la prima analisi via email.",
        ],
        expectedImpact: [
            "1-2 azioni operative/settimana che altrimenti ti perderesti",
            "Costo: ~€2-5/anno",
        ],
    },
    ai_content_generator: {
        whyMatters:
            "Pubblicare su Instagram costantemente è il modo numero uno per restare visibile in zona — ma scrivere caption originali è il lavoro che il barber rimanda sempre. Carica una foto, ottieni 3 caption + hashtag + best time to post in 10 secondi.",
        pros: [
            "Tono configurabile per il brand (professionale / amichevole / editorial).",
            "Hashtag suggeriti automaticamente (mix di tag generici + locali Olbia).",
            "3 varianti per ogni foto → scegli quella che ti piace di più.",
            "Risparmio: 2 ore a settimana per il social.",
        ],
        realScenario:
            "Finisci un fade su Marco. Foto col cell. La carichi in /admin/contenuti-ai. In 10 secondi hai: 'Skin fade su capelli ricci — la chiave è la sfumatura nascosta sotto. ✂️ Prenota su hair-rich.it' + 15 hashtag mix. Copi-incolli su IG. Fine.",
        steps: [
            "Inserisci OPENAI_API_KEY nei secrets Supabase (se non già fatto per ai_weekly_suggestions).",
            "Attiva 'ai_content_generator' dallo Skills Hub.",
            "Vai in /admin/contenuti-ai → upload foto → genera.",
        ],
        expectedImpact: [
            "+50% frequenza di pubblicazione Instagram",
            "Costo: ~€2/mese per ~30 foto",
        ],
    },
};
