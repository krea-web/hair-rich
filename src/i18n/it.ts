import type { Dict } from "./types";

export const it: Dict = {
    nav: {
        about: "About",
        services: "Servizi",
        gallery: "Gallery",
        pricing: "Listino",
        booking: "Prenota",
        team: "Team",
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
            "Da otto anni la nostra missione è scolpire la tua identità. Taglio, barba e rituali esclusivi nel cuore di Olbia.",
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
            "Hair Rich nasce da una visione: trasformare il rituale del taglio in un'esperienza intima, sartoriale, irripetibile. Una poltrona, un Master Barber, mani esperte.",
        bodyP2:
            "Niente fretta. Niente standardizzazioni. Solo il tempo che serve per scolpire il tuo carattere — un fade alla volta.",
        values: [
            "Sartorialità ossessiva",
            "Materiali premium",
            "Atmosfera intima",
            "Rituale lento",
        ],
        cta: "Vivi l'esperienza",
        sinceLabel: "since",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "I nostri",
        titleB: "servizi.",
        intro:
            "Tre famiglie di trattamenti per ogni momento della tua giornata. Scegli il rituale che ti rappresenta — noi pensiamo al resto.",
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
                    "Slot ampi, mai sovrapposti. Il rituale richiede calma — ne avrai a sufficienza.",
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
                name: "Luca",
                role: "Senior Barber",
                specialties: "Taglio · Barba · Styling",
                quote: "Il taglio giusto si vede dopo una settimana, non dopo cinque minuti.",
                bio:
                    "Luca è entrato nel team Hair Rich dopo anni in saloni di Roma e Cagliari. Specializzato in tagli moderni, texturizzazioni e barba sartoriale. Mano leggera, ascolto vero, e quel pizzico di ironia che fa volare la seduta.",
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
                text: "Ambiente curato, musica perfetta, taglio impeccabile. Hair Rich è un'esperienza, non un semplice appuntamento. Il rituale della barba con asciugamani caldi è qualcosa di unico.",
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
            "Scegli servizio, barber e momento. Pochi step, zero attese al telefono. Ti confermiamo via WhatsApp.",
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
        hoursSummary: "Mar–Sab · 9:00–19:30",
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
                "Il tuo prossimo rituale è già fissato. Ecco un riepilogo veloce dei tuoi crediti e dell'attività recente.",
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
                "Gestisci le prenotazioni future o rivedi lo storico dei tuoi tagli, barba e rituali.",
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
                    description: "Ricevi sconti, anteprime nuovi prodotti e novità via email/WhatsApp",
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
            whatsapp: "WhatsApp",
            stats: { friends: "Amici invitati", credits: "Crediti guadagnati" },
            howEyebrow: "How it works",
            howTitle: "Come funziona",
            steps: [
                {
                    n: "01",
                    title: "Condividi il codice",
                    body: "Manda il tuo codice o il link agli amici, via WhatsApp o email.",
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
            lastUpdate: "Ultimo aggiornamento: Maggio 2026",
            sections: [
                {
                    heading: "1. Titolare del trattamento",
                    body:
                        "Il titolare del trattamento dei dati è Hair Rich Olbia, con sede in Via Regina Elena 33/A, Olbia (SS).",
                },
                {
                    heading: "2. Finalità del trattamento",
                    body:
                        "I dati forniti verranno utilizzati esclusivamente per la gestione delle prenotazioni, l'erogazione dei servizi richiesti e, previo consenso esplicito, per comunicazioni di marketing.",
                },
                {
                    heading: "3. Condivisione dei dati",
                    body:
                        "I tuoi dati non verranno ceduti a terzi per scopi promozionali. Potranno essere condivisi con fornitori di servizi essenziali (sistemi di prenotazione, invio SMS) rigorosamente conformi al GDPR.",
                },
                {
                    heading: "4. I tuoi diritti",
                    body:
                        "Hai il diritto di accedere, rettificare o richiedere la cancellazione dei tuoi dati ('Diritto all'Oblio') in ogni momento tramite la tua Area Personale o contattandoci via email.",
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
                        "I cookie sono piccoli file di testo che vengono salvati sul tuo dispositivo quando visiti il nostro sito Web.",
                },
                {
                    heading: "Cookie essenziali",
                    body:
                        "Utilizziamo cookie essenziali (First-Party) per mantenere attiva la tua sessione di accesso e per far funzionare correttamente il carrello e il booking engine. Questi cookie non richiedono un preventivo consenso in quanto indispensabili.",
                },
                {
                    heading: "Cookie analitici e marketing",
                    body:
                        "Potremmo utilizzare script analitici anonimizzati in futuro, per i quali chiederemo il tuo consenso esplicito prima dell'attivazione.",
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
                        "Le prenotazioni effettuate sul sito sono vincolanti. Accettando questo regolamento ti impegni a presentarti all'appuntamento all'orario stabilito.",
                },
                {
                    heading: "2. Cancellazione e No-Show",
                    body:
                        "Ti preghiamo di cancellare o modificare il tuo appuntamento con almeno 12 ore di preavviso. In caso di mancata presentazione reiterata ('No-Show') ci riserviamo il diritto di limitare le prenotazioni future o sanzionare il Trust Score del tuo account.",
                },
                {
                    heading: "3. Prezzi e pagamenti",
                    body:
                        "I prezzi indicati nel Booking Engine e nello Shop sono espressi in Euro (€) e sono finali. Il pagamento dei servizi si effettua generalmente in salone post-erogazione.",
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
