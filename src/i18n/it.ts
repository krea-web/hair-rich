import type { Dict } from "./types";

export const it: Dict = {
    nav: {
        about: "About",
        services: "Servizi",
        gallery: "Gallery",
        pricing: "Listino",
        booking: "Prenota",
        team: "Team",
        products: "Prodotti",
        home: "Home",
        bookCta: "Prenota Ora",
    },
    common: {
        bookNow: "Prenota Ora",
        exploreServices: "Esplora i servizi",
        learnMore: "Scopri di più",
        seeAll: "Vedi tutto",
        next: "Avanti",
        back: "Indietro",
        cancel: "Annulla",
        confirm: "Conferma",
        save: "Salva",
        edit: "Modifica",
        delete: "Elimina",
        close: "Chiudi",
        loading: "Caricamento…",
        error: "Si è verificato un errore",
        success: "Fatto",
        copy: "Copia",
        copied: "Copiato",
        share: "Condividi",
        followUs: "Seguici",
        scroll: "Scroll",
    },
    hero: {
        eyebrow: "The",
        titleA: "BARBER",
        titleB: "STUDIO",
        body:
            "Da otto anni la nostra missione è scolpire la tua identità. Taglio, barba e trattamenti esclusivi nel cuore di Olbia.",
        primaryCta: "Prenota Ora",
        secondaryCta: "Esplora i servizi",
        captionEyebrow: "Premium",
        captionTitle: "MASTER BARBER",
        info: { open: "Aperto", phone: "Telefono", location: "Posizione" },
        openHours: "Mar–Sab",
        scrollHint: "Scroll",
        mobileScrollHint: "Scorri per scoprire",
    },
    stats: {
        years: "Anni di Attività",
        clients: "Clienti Soddisfatti",
        styles: "Stili Realizzati",
        rating: "Recensioni Medie",
    },
    about: {
        eyebrow: "About",
        titleA: "Il nostro",
        titleB: "studio.",
        bodyP1:
            "Hair Rich nasce da una visione: trasformare il taglio in un'esperienza intima, sartoriale, irripetibile. Una poltrona, un Master Barber, mani esperte.",
        bodyP2:
            "Niente fretta. Niente standardizzazioni. Solo il tempo che serve per scolpire il tuo carattere — un fade alla volta.",
        values: [
            "Sartorialità ossessiva",
            "Materiali premium",
            "Atmosfera intima",
            "Tempo lento",
        ],
        cta: "Vivi l'esperienza",
        sinceLabel: "since",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "I nostri",
        titleB: "servizi.",
        intro:
            "Tre famiglie di trattamenti per ogni momento della tua giornata. Scegli il servizio che ti rappresenta — noi pensiamo al resto.",
        items: [
            {
                eyebrow: "Sharp",
                title: "TAGLIO",
                description:
                    "Tagli classici, fade chirurgici, sfumature al rasoio. Ogni capo è studiato sul tuo viso.",
                items: ["Taglio classico", "Fade & Sfumature", "Razor Cut", "Bambino"],
            },
            {
                eyebrow: "Refined",
                title: "BARBA",
                description:
                    "Modellatura, rifinitura, asciugamani caldi e olio essenziale per una rasatura impeccabile.",
                items: [
                    "Modellatura",
                    "Rasatura tradizionale",
                    "Designer beard",
                    "Trattamento idratante",
                ],
            },
            {
                eyebrow: "Home",
                title: "DOMICILIO",
                description:
                    "Veniamo da te. Servizio su prenotazione per chi non può raggiungere il salone — stessa qualità sartoriale.",
                items: [
                    "Taglio a domicilio",
                    "Barba a domicilio",
                    "Cerimonie & matrimoni",
                    "Su prenotazione",
                ],
            },
        ],
        bookFromCard: "Prenota",
    },
    whyUs: {
        eyebrow: "What makes us",
        titleA: "Diversi,",
        titleB: "davvero.",
        features: [
            {
                title: "Atmosfera Intima",
                description:
                    "Solo poche poltrone, niente folla. Ogni cliente è un ospite — non una pratica da chiudere.",
            },
            {
                title: "Master Barber Certificati",
                description:
                    "Anni di formazione internazionale. Ogni taglio è studiato sulla tua morfologia, non sulle mode passeggere.",
            },
            {
                title: "Strumenti Premium",
                description:
                    "Lame giapponesi, prodotti formulati a mano, salviette in cotone organico. Niente compromessi.",
            },
            {
                title: "Tempo Dedicato",
                description:
                    "Slot ampi, mai sovrapposti. Il servizio richiede calma — ne avrai a sufficienza.",
            },
        ],
    },
    team: {
        eyebrow: "Meet the",
        titleA: "Master",
        titleB: "Barber.",
        featured: {
            name: "Federico Asara",
            role: "Master Barber & Founder",
            quote: "Ogni taglio è un atto sartoriale. Niente formule, niente shortcut.",
            bio:
                "Federico è il fondatore di Hair Rich. Ha imparato il mestiere giovanissimo e da allora non ha mai smesso di affinare la tecnica. Specializzato in razor cut, fade chirurgici e shape-up cuciti sulla morfologia del viso. Oggi taglia personalmente in salone e forma il suo team con metodo sartoriale.",
            specialties: ["Razor", "Fade", "Classic", "Beard"],
            yearsLabel: "10+",
            yearsCaption: "anni di mestiere",
        },
        members: [
            {
                name: "Cristian",
                role: "Senior Barber",
                specialties: "Taglio · Barba · Styling",
                quote: "Il taglio giusto si vede dopo una settimana, non dopo cinque minuti.",
                bio:
                    "Cristian è entrato nel team Hair Rich dopo anni in saloni di Roma e Cagliari. Specializzato in tagli moderni, texturizzazioni e barba sartoriale. Mano leggera, ascolto vero, e quel pizzico di ironia che fa volare la seduta.",
                tags: ["Modern", "Texture", "Beard", "Styling"],
                yearsLabel: "6+",
                yearsCaption: "anni di mestiere",
            },
        ],
    },
    pricing: {
        eyebrow: "Explore",
        titleA: "Listino",
        titleB: "prezzi.",
        intro:
            "Tariffe trasparenti, tempi onesti. Niente sovrapprezzo nel weekend, mai. Per pacchetti aziendali e cerimonie scrivici.",
        groups: [
            {
                title: "Taglio",
                items: [
                    { name: "Taglio classico", description: "Forbice, lavaggio e styling", duration: "30'", price: "€20" },
                    { name: "Fade & Sfumatura", description: "Sfumatura precisa, forbice, rasoio", duration: "45'", price: "€25" },
                    { name: "Razor cut", description: "Lavorazione completa al rasoio", duration: "50'", price: "€30" },
                    { name: "Taglio bambino", description: "Da 0 a 12 anni", duration: "25'", price: "€15" },
                ],
            },
            {
                title: "Barba & Domicilio",
                items: [
                    { name: "Barba sartoriale", description: "Modellatura, asciugamani caldi, olio", duration: "30'", price: "€15" },
                    { name: "Rasatura tradizionale", description: "Rasoio a mano libera, rifinitura precisa", duration: "40'", price: "€25" },
                    { name: "Taglio + Barba", description: "Il combo signature", duration: "60'", price: "€35" },
                    { name: "Taglio a domicilio", description: "Veniamo noi. Su prenotazione, in orari concordati.", duration: "60'", price: "€45" },
                ],
            },
        ],
        footnote:
            "Tutti i listini includono lavaggio, asciugatura e styling. Pagamento in cassa, contanti o carta.",
        cta: "Prenota un servizio",
        sideCardEyebrow: "Pricing",
        sideCardTitle: "PAY AS YOU GO",
    },
    gallery: {
        eyebrow: "Gallery",
        titleA: "Il nostro",
        titleB: "portfolio.",
        intro:
            "Un piccolo assaggio del nostro lavoro. Per il book completo, segui Instagram o vieni in salone.",
        filters: { all: "Tutti" },
        openShot: (title) => `Apri ${title}`,
        close: "Chiudi",
    },
    trends: {
        eyebrow: "Tips & Tricks",
        titleA: "Hair care",
        titleB: "a casa.",
        intro:
            "Quattro abitudini semplici per far durare il taglio e mantenere capello e barba al meglio tra un appuntamento e l'altro.",
        proTipLabel: "Pro tip",
        proTipBody: "Mantieni il taglio pulito ogni 4 settimane",
        tips: [
            {
                n: "01",
                title: "Lavaggio meno frequente",
                body: "Lava i capelli ogni 2–3 giorni con shampoo solfato-free. Il sebo naturale è il miglior conditioner.",
            },
            {
                n: "02",
                title: "Asciugatura intelligente",
                body: "Tampona, non sfregare. Aria tiepida a 20cm. Asciuga sempre nella direzione del taglio.",
            },
            {
                n: "03",
                title: "Pomade vs cera",
                body: "Pomade per look definiti e duraturi. Cera per look mossi e modulari. Mai entrambe insieme.",
            },
            {
                n: "04",
                title: "Manutenzione barba",
                body: "Olio una volta al giorno, balsamo la sera. Pettinare sempre dopo la doccia, mai a secco.",
            },
        ],
    },
    reviews: {
        eyebrow: "Testimonials",
        title: "Le voci di chi torna.",
        items: [
            {
                name: "Alessandro M.",
                text: "Il miglior barbiere di Olbia, senza dubbio. Marco ha un talento incredibile per il fade — ascolta davvero e ti propone soluzioni cucite addosso. Ci torno ogni mese.",
                date: "Aprile 2025",
                location: "Olbia",
            },
            {
                name: "Francesco R.",
                text: "Ambiente curato, musica perfetta, taglio impeccabile. Hair Rich è un'esperienza, non un semplice appuntamento. Il momento della barba con asciugamani caldi è qualcosa di unico.",
                date: "Marzo 2025",
                location: "Cagliari",
            },
            {
                name: "Giovanni P.",
                text: "Finalmente un posto dove sanno ascoltare. Ho mostrato una foto e il risultato è stato anche meglio. Consigliatissimo a chi cerca qualità sartoriale.",
                date: "Febbraio 2025",
                location: "Sassari",
            },
            {
                name: "Luigi B.",
                text: "La cura dei dettagli è impressionante. Dal lavaggio al rifinitura, ogni gesto è studiato. Il taglio dura davvero un mese e si modella benissimo.",
                date: "Gennaio 2025",
                location: "Olbia",
            },
        ],
        prev: "Recensione precedente",
        next: "Recensione successiva",
    },
    products: {
        eyebrow: "Curated",
        titleA: "La nostra",
        titleB: "linea.",
        intro:
            "Prodotti premium, scelti e testati dai nostri Master Barber. Per portare a casa l'esperienza del salone.",
        addToCart: (name) => `Aggiungi ${name} al carrello`,
        added: "Aggiunto",
        prev: "Prodotto precedente",
        next: "Prodotto successivo",
    },
    booking: {
        eyebrow: "Let's create",
        titleA: "Il tuo",
        titleB: "stile.",
        intro:
            "Scegli servizio, barber e momento. Pochi step, zero attese al telefono. Conferma immediata.",
        contactLabels: { salon: "Salone", phone: "Telefono", email: "Email" },
        responseHint: "Risposta entro 1 ora negli orari di apertura",
        steps: { serviceStaff: "Servizio & Barber", dateTime: "Data e Ora", confirm: "Conferma" },
        stepLabels: { service: "Servizio", staff: "Barbiere", date: "Data", time: "Ora", details: "Dati" },
        chooseService: "Scegli il servizio",
        chooseStaff: "Scegli il barber",
        anyStaff: "Nessuna preferenza",
        chooseDate: "Scegli il giorno",
        chooseTime: "Scegli l'ora",
        details: {
            firstName: "Nome",
            phone: "Telefono",
            email: "Email",
            notes: "Note (opzionale)",
            notesPlaceholder: "Allergie, richieste particolari, foto reference…",
        },
        validation: {
            required: "Campo obbligatorio",
            invalidEmail: "Email non valida",
            invalidPhone: "Telefono non valido",
        },
        summary: {
            title: "Riepilogo",
            service: "Servizio",
            staff: "Barber",
            datetime: "Data e ora",
            total: "Totale",
            confirmCta: "Conferma prenotazione",
        },
        confirmed: {
            title: "Prenotazione confermata",
            body: "Ti aspettiamo in salone. Riceverai un promemoria 24h prima.",
            addToCalendar: "Aggiungi al calendario",
            google: "Google Calendar",
            apple: "Apple Calendar",
            ics: "Scarica .ics",
        },
        savedDraft: "Bozza salvata",
        resumeDraft: "Riprendi prenotazione",
        startOver: "Ricomincia",
    },
    instagram: {
        eyebrow: "Follow us",
        titleA: "Su",
        titleB: "Instagram.",
        cta: "@hair_rich_",
    },
    map: {
        eyebrow: "Dove siamo",
        titleA: "Nel cuore di",
        titleB: "Olbia.",
        intro:
            "Lo studio Hair Rich è in centro a Olbia, a pochi passi da Corso Umberto. Parcheggio nelle vicinanze.",
        cta: "Indicazioni stradali",
        hoursSummary: "Mar–Sab · 9:00–19:00",
        labels: { address: "Indirizzo", hours: "Orari" },
    },
    footer: {
        signupEyebrow: "Il club",
        signupTitle: "Unisciti al club.",
        signupBody:
            "Crea il tuo profilo: prenotazioni in un tap, storico tagli, vantaggi riservati e referral.",
        signupSubmit: "Crea il tuo profilo",
        signupLogin: "Ho già un account",
        sections: { contact: "Contatti", navigate: "Naviga", hours: "Orari" },
        days: { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab", sun: "Dom" },
        closed: "Chiuso",
        legalNote: "Tutti i diritti riservati.",
        legalLinks: { privacy: "Privacy", cookie: "Cookie", terms: "Termini" },
    },
    sticky: { cta: "Prenota Ora" },
    badges: {
        rating: "★ 4.9 · 247 recensioni Google",
        certified: "Master Barber Certificato",
        premium: "Premium products only",
    },
    bundle: {
        eyebrow: "Combo signature",
        title: "Taglio + Barba a €35 invece di €40",
        save: (eur) => `Risparmi ${eur}`,
        cta: "Prenota il combo",
    },
    availability: {
        slotsLeft: (n) =>
            n === 1 ? "Solo 1 slot rimasto questa settimana" : `Solo ${n} slot rimasti questa settimana`,
        urgentSlot: "Posto libero oggi",
    },
    socialProof: {
        weekly: (n) => `${n} prenotazioni questa settimana`,
        recentBooking: (name, service) => `${name} ha appena prenotato un ${service}`,
    },
    cookies: {
        title: "Cookie & Privacy",
        body:
            "Usiamo cookie essenziali per il funzionamento del sito e (con il tuo consenso) cookie analitici per migliorarlo.",
        accept: "Accetta tutto",
        essentials: "Solo essenziali",
        customize: "Personalizza",
    },
    install: {
        title: "Installa Hair Rich",
        body: "Aggiungi il sito alla home screen — nessuno store, niente download.",
        cta: "Installa",
        notNow: "Non ora",
    },
    auth: {
        login: {
            welcome: "Bentornato",
            choose: "Scegli come vuoi accedere.",
            withEmail: "Continua con Email",
            withPhone: "Continua con Telefono",
            or: "Oppure",
            continueGoogle: "Continua con Google",
            emailLabel: "Email",
            phoneLabel: "Telefono",
            emailPlaceholder: "nome@email.com",
            phonePlaceholder: "+39 333 1234567",
            emailHint: "Ti invieremo un link magico o un codice.",
            phoneHint: "Riceverai un SMS con il codice di accesso.",
            continue: "Prosegui",
            otpTitle: "Codice",
            otpHint: (id) => `Abbiamo inviato un codice a ${id}.`,
            otpAccess: "Accedi",
            otpResend: "Invia di nuovo",
            noAccount: "Non hai ancora un account?",
            registerLink: "Registrati o prenota come ospite",
        },
        register: {
            title: "Unisciti al Club",
            intro: "Crea il tuo profilo per prenotazioni veloci, storico tagli e vantaggi esclusivi.",
            firstName: "Nome",
            lastName: "Cognome",
            phone: "Telefono",
            email: "Email",
            birthdate: "Data di nascita (opzionale)",
            marketingConsent:
                "Acconsento all'invio di promemoria, sconti speciali e comunicazioni di servizio (puoi disattivarlo dal profilo).",
            submit: "Crea profilo",
            haveAccount: "Hai già un account?",
            loginLink: "Accedi",
        },
    },
    profilo: {
        nav: { dashboard: "Dashboard", appointments: "Appuntamenti", referral: "Passaparola", settings: "Impostazioni" },
        dashboard: {
            greetingEyebrow: "Bentornato,",
            greetingName: (name) => `${name}.`,
            intro:
                "Il tuo prossimo appuntamento è già fissato. Ecco un riepilogo veloce dei tuoi crediti e dell'attività recente.",
            ctaNew: "Nuovo appuntamento",
            kpis: {
                wallet: "Portafoglio",
                visits: "Visite tot.",
                favoriteCut: "Taglio prefer.",
                trustScore: "Trust score",
            },
            nextEyebrow: "Up next",
            nextTitle: "Prossimo appuntamento",
            allAppointments: "Tutti gli appuntamenti",
            statusConfirmed: "Confermato",
            move: "Sposta",
            cancel: "Annulla",
            historyEyebrow: "History",
            historyTitle: "Attività recente",
            historyIntro: "Ultimi movimenti tra appuntamenti, ordini e crediti.",
        },
        appointments: {
            eyebrow: "Your",
            title: "Appuntamenti.",
            intro:
                "Gestisci le prenotazioni future o rivedi lo storico dei tuoi tagli, barba e trattamenti.",
            new: "Nuovo",
            filters: { all: "Tutti", confirmed: "Confermati", completed: "Completati", cancelled: "Annullati" },
            count: (n) => (n === 1 ? "1 appuntamento" : `${n} appuntamenti`),
            future: "Futuri",
            history: "Storico",
            empty: "Nessun appuntamento in questa categoria.",
            statuses: { upcoming: "Confermato", completed: "Completato", cancelled: "Annullato" },
            rebook: "Prenota di nuovo",
            edit: "Modifica",
        },
        settings: {
            eyebrow: "Manage your",
            title: "Impostazioni.",
            intro:
                "Profilo, notifiche, privacy. Tutto quello che riguarda il tuo account in un posto solo.",
            edit: "Modifica",
            sections: {
                notifications: { eyebrow: "Notifications", title: "Comunicazioni" },
                gdpr: { eyebrow: "Privacy", title: "Diritti GDPR" },
            },
            toggles: [
                {
                    label: "Marketing e promozioni",
                    description: "Ricevi sconti, anteprime nuovi prodotti e novità via email",
                },
                {
                    label: "Promemoria appuntamenti",
                    description: "Ti ricordiamo l'appuntamento via SMS 24h prima",
                },
                {
                    label: "Recensioni post-visita",
                    description: "Ti chiediamo un feedback dopo ogni servizio",
                },
            ],
            export: { title: "Esporta i miei dati", body: "Scarica un file JSON con tutto lo storico" },
            deleteAccount: {
                title: "Elimina account",
                body: "Diritto all'oblio. Questa azione è irreversibile.",
            },
            confirmDelete: {
                eyebrow: "Attention",
                title: "Elimino l'account?",
                body:
                    "Tutti gli appuntamenti futuri, lo storico e i crediti saranno persi per sempre. Questa azione non può essere annullata.",
                cancel: "Annulla",
                confirm: "Sì, elimina",
            },
        },
        referral: {
            eyebrow: "Word of mouth",
            title: "Passaparola.",
            intro:
                "Invita un amico, guadagnate entrambi 5€. Lui sul primo taglio, tu in credito spendibile in salone.",
            codeEyebrow: "Il tuo codice invito",
            copyLink: "Copia link",
            copied: "Copiato",
            stats: { friends: "Amici invitati", credits: "Crediti guadagnati" },
            howEyebrow: "How it works",
            howTitle: "Come funziona",
            steps: [
                {
                    n: "01",
                    title: "Condividi il codice",
                    body: "Manda il tuo codice o il link agli amici via email o messaggio.",
                },
                {
                    n: "02",
                    title: "L'amico prenota",
                    body:
                        "Lui usa il codice in fase di registrazione e ottiene 5€ di sconto sul primo taglio.",
                },
                {
                    n: "03",
                    title: "Riceviamo entrambi",
                    body:
                        "Quando si presenta in salone, tu ricevi 5€ di credito sul tuo portafoglio. Cumulabili.",
                },
            ],
        },
    },
    legal: {
        backHome: "← Torna alla home",
        privacy: {
            title: "Informativa sulla Privacy",
            lastUpdate: "Versione policy: 2026-05-23 · Ultimo aggiornamento: Maggio 2026",
            sections: [
                {
                    heading: "1. Titolare del trattamento",
                    body:
                        "Il titolare del trattamento è Hair Rich Olbia, con sede in Via Regina Elena 33/A, Olbia (SS). Per qualsiasi richiesta relativa ai tuoi dati personali puoi scriverci a info@hairrich.it.",
                },
                {
                    heading: "2. Base giuridica e finalità",
                    body:
                        "Trattiamo i tuoi dati personali in conformità al Regolamento UE 2016/679 (GDPR) e al Codice Privacy italiano. Le finalità sono: (a) esecuzione del contratto di servizio (gestione prenotazioni, erogazione tagli e trattamenti, ricevute) ai sensi dell'art. 6.1.b GDPR; (b) finalità ulteriori basate sul tuo consenso esplicito (art. 6.1.a), elencate al punto 3.",
                },
                {
                    heading: "3. Consensi separati e revocabili",
                    body:
                        "Al primo accesso all'area cliente ti chiediamo cinque consensi distinti, ognuno facoltativo e revocabile in qualsiasi momento da /profilo → Impostazioni. Ogni grant/revoca viene registrato nel nostro audit log immutabile con timestamp, versione policy mostrata, IP e user agent. I cinque consensi sono: (1) Marketing e promozioni — sconti, anteprime, newsletter; (2) Promemoria appuntamenti — messaggio 24h e 2h prima del taglio; (3) Foto prima/dopo — archivio visibile solo a te in area personale; (4) Profilazione comportamentale — campagne mirate basate sulla storia visite (compleanno, riattivazione); (5) Programma referral — partecipazione al passaparola.",
                },
                {
                    heading: "4. Categorie di dati trattati",
                    body:
                        "Dati identificativi (nome, cognome), contatti (email, telefono), data di nascita (solo se conferita per consenso 4), storico appuntamenti, foto pre/post (solo con consenso 3), preferenze di servizio, codici referral generati o utilizzati, consensi prestati e revocati con relative date.",
                },
                {
                    heading: "5. Conservazione dei dati",
                    body:
                        "Conserviamo i dati per la durata del rapporto e per i 10 anni successivi richiesti dalla normativa fiscale (D.P.R. 600/1973). Le foto pre/post vengono eliminate entro 24 mesi dall'ultima visita salvo richiesta del cliente di conservazione estesa. Il ledger dei consensi è conservato a tempo indeterminato come prova del consenso ai sensi dell'art. 7.1 GDPR.",
                },
                {
                    heading: "6. Destinatari e responsabili esterni",
                    body:
                        "I tuoi dati non vengono ceduti a terzi per scopi commerciali. Sono ospitati su Supabase (server UE — Francoforte) e possono essere processati da: Google Workspace (invio email transazionali), Telegram (notifiche al titolare per cancellazioni e ordini), OpenAI (solo testi anonimizzati per generazione automatica di bozze al titolare, mai PII). Tutti i fornitori sono GDPR-compliant e accessibili in sub-DPA su richiesta.",
                },
                {
                    heading: "7. Trasferimenti extra-UE",
                    body:
                        "OpenAI è basato negli Stati Uniti. Il trasferimento avviene sulla base delle Standard Contractual Clauses (SCC) della Commissione Europea ed è limitato a dati strettamente anonimizzati. Per ogni altra elaborazione, i dati restano nell'Unione Europea.",
                },
                {
                    heading: "8. I tuoi diritti GDPR",
                    body:
                        "Hai diritto a: accedere ai tuoi dati (art. 15), rettificarli (art. 16), cancellarli — diritto all'oblio (art. 17), limitarne il trattamento (art. 18), riceverli in formato portabile (art. 20 — disponibile come export JSON da /profilo → Impostazioni), opporti al trattamento (art. 21), revocare i consensi senza che ciò pregiudichi i trattamenti pregressi (art. 7.3). Puoi esercitare questi diritti scrivendo a info@hairrich.it. Hai inoltre diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).",
                },
                {
                    heading: "9. Sicurezza",
                    body:
                        "Adottiamo misure tecniche e organizzative adeguate: connessioni cifrate TLS, Row Level Security a livello database, autenticazione a due fattori per il personale, audit log immutabile di tutte le modifiche ai dati sensibili. Le password non vengono mai memorizzate in chiaro.",
                },
                {
                    heading: "10. Modifiche all'informativa",
                    body:
                        "Eventuali modifiche sostanziali ti verranno comunicate al login successivo e ti chiederemo di rinnovare i consensi sulla nuova versione. La versione corrente è indicata in alto su questa pagina.",
                },
            ],
        },
        cookie: {
            title: "Cookie Policy",
            lastUpdate: "Ultimo aggiornamento: Maggio 2026",
            sections: [
                {
                    heading: "Cosa sono i cookie?",
                    body:
                        "I cookie sono piccoli file di testo memorizzati sul tuo dispositivo per far funzionare correttamente alcune funzionalità del sito. Insieme ai cookie, su questo sito utilizziamo anche localStorage e service worker (per la modalità offline / installazione PWA).",
                },
                {
                    heading: "Cookie strettamente necessari",
                    body:
                        "Utilizziamo cookie First-Party essenziali per: (1) mantenere attiva la sessione di accesso (Supabase Auth); (2) ricordare i prodotti nel carrello; (3) salvare lo stato del booking drawer durante la prenotazione; (4) memorizzare la lingua preferita. Questi cookie non richiedono consenso preventivo (art. 6.1.b GDPR) in quanto indispensabili al servizio richiesto.",
                },
                {
                    heading: "Notifiche push del browser",
                    body:
                        "Se hai attivato le notifiche push (opt-in esplicito dal prompt del browser), salviamo un endpoint anonimo che ci permette di inviarti promemoria appuntamenti. Puoi disattivarle in qualsiasi momento dalle impostazioni del browser o da /profilo → Impostazioni.",
                },
                {
                    heading: "Cookie analitici e marketing",
                    body:
                        "Al momento NON utilizziamo Google Analytics né script di tracking terzi. Se in futuro li attiveremo, te lo chiederemo con un banner di consenso esplicito prima del loro caricamento. Non vediamo alcun cookie commerciale finché non lo abiliti.",
                },
                {
                    heading: "Come disattivarli",
                    body:
                        "Puoi cancellare i cookie e i dati locali dal pannello del tuo browser. Tieni presente che disattivando i cookie essenziali, login e carrello smettono di funzionare.",
                },
            ],
        },
        terms: {
            title: "Termini e Condizioni",
            lastUpdate: "Ultimo aggiornamento: Maggio 2026",
            sections: [
                {
                    heading: "1. Prenotazioni",
                    body:
                        "Le prenotazioni effettuate dall'area online sono vincolanti dal momento della conferma. Ti chiediamo di presentarti puntuale: in caso di ritardo superiore ai 10 minuti potremmo dover accorciare il servizio o riprogrammare l'appuntamento per non penalizzare i clienti successivi.",
                },
                {
                    heading: "2. Cancellazione e modifica",
                    body:
                        "Puoi cancellare o spostare il tuo appuntamento gratuitamente da /profilo → Appuntamenti con almeno 4 ore di preavviso (la soglia esatta è configurabile dal salone ed è sempre indicata al momento della cancellazione). Sotto la soglia minima non è possibile cancellare in autonomia: contatta il salone via telefono o WhatsApp.",
                },
                {
                    heading: "3. Mancata presentazione (no-show)",
                    body:
                        "Non utilizziamo black-list automatiche né penalità automatiche. In caso di assenza ti contatteremo personalmente, con un messaggio empatico, per capire cosa è successo e ripianificare. Una storia ripetuta di no-show senza preavviso ci darà la facoltà — a discrezione del titolare — di richiedere un acconto per le prenotazioni future.",
                },
                {
                    heading: "4. Pacchetti prepagati",
                    body:
                        "I pacchetti (es. 5 tagli) si acquistano direttamente in salone (cash, POS o bonifico). Riceverai una ricevuta digitale via email. Ogni credito ha una validità indicata nella conferma. I crediti non utilizzati alla scadenza si considerano consumati. In caso di chiusura prolungata del salone, le scadenze vengono automaticamente estese del periodo equivalente.",
                },
                {
                    heading: "5. Coupon e programmi fedeltà",
                    body:
                        "Coupon, sconti compleanno, programmi loyalty e referral sono strumenti facoltativi attivati o disattivati a discrezione del salone. Quando attivi, le condizioni d'uso specifiche (validità, importo minimo, cumulabilità) sono indicate sul singolo coupon. I crediti maturati non sono convertibili in denaro.",
                },
                {
                    heading: "6. Prezzi e pagamenti",
                    body:
                        "I prezzi indicati nel booking engine e nello shop sono in Euro (€), IVA inclusa, e sono finali. Il pagamento dei servizi avviene in salone al termine dell'erogazione tramite contanti, POS contactless o bonifico. Non gestiamo pagamenti online per i servizi.",
                },
                {
                    heading: "7. Foro competente",
                    body:
                        "Per ogni controversia derivante dall'uso del sito o dai servizi è competente in via esclusiva il Foro di Tempio Pausania. Si applica la legge italiana.",
                },
            ],
        },
    },
    notFound: {
        eyebrow: "404",
        title: "Pagina non trovata.",
        body: "La pagina che stai cercando non esiste o è stata spostata.",
        cta: "Torna alla home",
    },
    offline: {
        eyebrow: "Offline",
        title: "Sei offline.",
        body: "Non riesci a raggiungere il salone? Controlla la connessione e riprova. Le pagine già visitate restano disponibili.",
        cta: "Riprova",
    },
    languageBanner: {
        suggest: (lang) => `Visualizzare in ${lang}?`,
        switch: "Cambia",
        keep: "Resta in italiano",
    },
};
