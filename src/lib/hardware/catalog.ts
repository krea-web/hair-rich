// Hair Rich · Hardware catalog
//
// Catalogo dei dispositivi hardware (POS, casse fiscali, stampanti, scanner)
// che il gestionale può integrare. Prezzi pubblici al netto di sconti
// commerciali — quanto paga il salone direttamente al provider, senza
// ricarichi nostri.
//
// Stato per dispositivo:
//   • 'available' — plugin pronto, attivabile subito
//   • 'in_development' — plugin in roadmap
//   • 'on_request' — lo realizziamo se un cliente lo chiede

export type HardwareCategory = 'pos' | 'rt' | 'printer' | 'scanner' | 'other';

export type HardwareStatus = 'available' | 'in_development' | 'on_request';

export type ConnectionType =
    | 'bluetooth'
    | 'wifi'
    | 'usb'
    | 'cloud'
    | 'smartphone_only'
    | 'serial';

export interface HardwareDevice {
    id: string;
    category: HardwareCategory;
    name: string;
    brand: string;
    /**
     * Manufacturer-hosted product image. Best-effort; if it breaks, the
     * UI falls back to a brand-colored styled placeholder. To replace
     * with a local image, upload to Supabase storage bucket `hardware/`
     * and put the public URL here.
     */
    imageUrl: string | null;
    /** Brand accent color for the styled fallback when imageUrl is null */
    brandColor: string;
    icon: string;
    /** Connection type for the gestionale plugin */
    connection: ConnectionType;
    /** One-time hardware cost in euros */
    setupCostEur: number;
    /** Recurring cost in euros per month */
    monthlyEur: number;
    /** Per-transaction fee description (e.g. "1,69%") or null */
    transactionFee: string | null;
    /** Compatible browsers / platforms */
    platforms: ('chrome' | 'edge' | 'safari' | 'android' | 'ios' | 'desktop_only')[];
    status: HardwareStatus;
    pros: string[];
    cons: string[];
    /** Italian description, 2-3 sentences */
    descriptionIT: string;
    /** Link to manufacturer page for the salon owner to read more */
    learnMoreUrl: string | null;
    /** Skill key in skills_config that controls activation, if any */
    skillKey?: string;
}

export const HARDWARE_CATALOG: HardwareDevice[] = [
    // ──────────────────────── POS / PAGAMENTI ────────────────────────
    {
        id: 'sumup_air',
        category: 'pos',
        name: 'SumUp Air',
        brand: 'SumUp',
        imageUrl: 'https://help.sumup.com/hc/article_attachments/360010783778/Air.png',
        brandColor: '#0070BA',
        icon: '💳',
        connection: 'bluetooth',
        setupCostEur: 50,
        monthlyEur: 0,
        transactionFee: '1,69% per transazione',
        platforms: ['chrome', 'edge', 'android'],
        status: 'in_development',
        pros: [
            'Costo iniziale basso',
            'Pairing rapido via Bluetooth',
            'Diffusissimo tra parrucchieri italiani',
            'Conforme RT (può sostituire la cassa)',
        ],
        cons: ['Non funziona su iPhone (no Safari)', 'Solo carte, no contanti'],
        descriptionIT:
            'POS Bluetooth tascabile, la soluzione più diffusa tra i piccoli esercenti italiani. Si collega al tablet o telefono Android tramite Bluetooth, accetta carte e wallet. Nessun canone mensile, paghi solo la commissione sulla transazione.',
        learnMoreUrl: 'https://sumup.it/scopri-prodotti/lettore-carte/air/',
        skillKey: 'pos_sumup_air',
    },
    {
        id: 'sumup_solo',
        category: 'pos',
        name: 'SumUp Solo',
        brand: 'SumUp',
        imageUrl: 'https://help.sumup.com/hc/article_attachments/360011336977/Solo.png',
        brandColor: '#0070BA',
        icon: '💳',
        connection: 'wifi',
        setupCostEur: 100,
        monthlyEur: 0,
        transactionFee: '1,69% per transazione',
        platforms: ['desktop_only'],
        status: 'on_request',
        pros: [
            'Stand-alone: ha il suo schermo, non serve telefono',
            'WiFi + SIM dati inclusa',
            'Stampa scontrini opzionale con add-on',
        ],
        cons: ['Costo doppio rispetto al SumUp Air', 'UX limitata dallo schermo piccolo'],
        descriptionIT:
            'Versione autonoma del SumUp Air: ha un suo display touch e si connette via WiFi/4G senza bisogno di un telefono abbinato. Più costoso ma indipendente, ottimo se vuoi un POS sempre acceso alla reception.',
        learnMoreUrl: 'https://sumup.it/scopri-prodotti/lettore-carte/solo/',
        skillKey: 'pos_sumup_air',
    },
    {
        id: 'stripe_reader_m2',
        category: 'pos',
        name: 'Stripe Reader M2',
        brand: 'Stripe',
        imageUrl: 'https://b.stripecdn.com/docs-statics-srv/assets/docs-terminal-readers-m2.png',
        brandColor: '#635BFF',
        icon: '💳',
        connection: 'bluetooth',
        setupCostEur: 60,
        monthlyEur: 0,
        transactionFee: '1,4% + €0,25 per transazione',
        platforms: ['chrome', 'edge', 'android', 'ios'],
        status: 'in_development',
        pros: [
            'Commissioni più basse di SumUp sopra ~€15/transazione',
            'Funziona anche su iPhone (Stripe SDK)',
            'Dashboard Stripe completa per reportistica',
            'Internazionale (utile per clienti turisti)',
        ],
        cons: ['Setup contratto Stripe Italia richiede ~3-5 giorni', 'Non include RT compliance'],
        descriptionIT:
            'POS Bluetooth di Stripe, leader globale dei pagamenti online. Costa qualche euro in più del SumUp ma le commissioni sono più basse sulle transazioni medie e funziona su tutte le piattaforme inclusi iPhone. Non è un registratore telematico — serve per pagare, non per emettere scontrini fiscali.',
        learnMoreUrl: 'https://stripe.com/it/terminal',
        skillKey: 'pos_stripe_terminal',
    },
    {
        id: 'nexi_softpos',
        category: 'pos',
        name: 'Nexi SoftPOS',
        brand: 'Nexi',
        imageUrl: null,
        brandColor: '#FF6900',
        icon: '📱',
        connection: 'smartphone_only',
        setupCostEur: 0,
        monthlyEur: 5,
        transactionFee: 'Da contratto Nexi (variabile)',
        platforms: ['android'],
        status: 'on_request',
        pros: [
            'Nessun hardware aggiuntivo: usi il telefono come POS',
            'Setup veloce se hai già conto Intesa/Nexi',
            'Compliance fiscale italiana inclusa',
        ],
        cons: [
            'Solo Android (Tap-to-Pay iPhone serve app diversa)',
            'Commissioni più alte di SumUp/Stripe',
            'Richiede convenzione bancaria',
        ],
        descriptionIT:
            'Soluzione "softPOS": il telefono Android del dipendente diventa il POS, niente hardware in più. Funziona se hai già un conto Nexi/Intesa Sanpaolo. Le commissioni sono spesso più alte ma il setup è immediato.',
        learnMoreUrl: 'https://www.nexi.it/it/business/accetta-pagamenti/softpos.html',
        skillKey: 'pos_nexi_softpos',
    },

    // ──────────────────────── CASSE FISCALI (RT) ────────────────────────
    {
        id: 'mycassa_cloud',
        category: 'rt',
        name: 'MyCassa Cloud',
        brand: 'Daxon',
        imageUrl: null,
        brandColor: '#1AAB52',
        icon: '🧾',
        connection: 'cloud',
        setupCostEur: 99,
        monthlyEur: 30,
        transactionFee: null,
        platforms: ['chrome', 'edge', 'safari', 'android', 'ios'],
        status: 'on_request',
        pros: [
            'Nessun hardware fiscale da acquistare',
            'Emette scontrini conformi Agenzia Entrate',
            'API REST documentata, integrazione pulita',
            'Funziona da qualsiasi browser',
        ],
        cons: [
            'Costo mensile fisso',
            'Dipendenza da provider esterno per la compliance',
        ],
        descriptionIT:
            'Servizio cloud che fa da Registratore Telematico virtuale. Il gestionale invia la transazione a MyCassa, MyCassa emette lo scontrino e lo trasmette all\'Agenzia Entrate. Niente cassa fisica, niente carta termica, nessuna manutenzione.',
        learnMoreUrl: 'https://www.daxon.it/mycassa',
        skillKey: 'rt_mycassa',
    },
    {
        id: 'cassanova_cloud',
        category: 'rt',
        name: 'Cassanova',
        brand: 'Cassa in cloud',
        imageUrl: null,
        brandColor: '#0080FF',
        icon: '🧾',
        connection: 'cloud',
        setupCostEur: 0,
        monthlyEur: 25,
        transactionFee: '€0,02 per scontrino',
        platforms: ['chrome', 'edge', 'safari', 'android', 'ios'],
        status: 'on_request',
        pros: [
            'Setup gratuito',
            'Pay-per-use sugli scontrini emessi',
            'Conforme Agenzia Entrate',
        ],
        cons: [
            'Costo variabile poco prevedibile per saloni ad alto volume',
            'API meno documentata di MyCassa',
        ],
        descriptionIT:
            'Alternativa cloud a MyCassa con modello pay-per-use: paghi €0,02 per ogni scontrino emesso oltre al canone base. Conviene a saloni con volume di scontrini medio-basso (sotto 800/mese).',
        learnMoreUrl: 'https://www.cassanova.it',
        skillKey: 'rt_cassanova',
    },
    {
        id: 'custom_q3x',
        category: 'rt',
        name: 'Custom Q3X / KP202',
        brand: 'Custom',
        imageUrl: null,
        brandColor: '#E30613',
        icon: '🧾',
        connection: 'wifi',
        setupCostEur: 800,
        monthlyEur: 0,
        transactionFee: null,
        platforms: ['chrome', 'edge', 'safari', 'android'],
        status: 'on_request',
        pros: [
            'Acquisto una tantum, niente canone',
            'API REST locale ben documentata',
            'Stampa scontrini fisici (richiesta da molti clienti)',
            'Compliance Agenzia Entrate gestita dal dispositivo',
        ],
        cons: [
            'Costo iniziale alto',
            'Carta termica da ricomprare periodicamente',
            'Manutenzione hardware annuale richiesta per legge',
        ],
        descriptionIT:
            'Registratore Telematico fisico: una vera "cassa". Si collega in rete locale, il gestionale invia le transazioni via REST API. È la soluzione tradizionale che molti titolari preferiscono perché stampa lo scontrino di carta che il cliente porta via.',
        learnMoreUrl: 'https://www.custom.biz/it/prodotti/registratori-telematici',
        skillKey: 'rt_custom',
    },

    // ──────────────────────── STAMPANTI TERMICHE ────────────────────────
    {
        id: 'star_tsp143',
        category: 'printer',
        name: 'Star TSP143IIIBI',
        brand: 'Star Micronics',
        imageUrl: 'https://www.starmicronics.com/sites/default/files/Products/TSP143IIIBI_3qtr_clay.png',
        brandColor: '#00529C',
        icon: '🖨️',
        connection: 'bluetooth',
        setupCostEur: 200,
        monthlyEur: 0,
        transactionFee: null,
        platforms: ['chrome', 'edge', 'android'],
        status: 'on_request',
        pros: [
            'Web Bluetooth nativo, niente driver',
            'Compatibile cassetto contante (cavo RJ-11)',
            'Velocità 250mm/sec, silenziosa',
            'Carta 80mm standard',
        ],
        cons: ['Solo per scontrini NON-fiscali (ricevute cortesia)', 'Niente Safari iOS'],
        descriptionIT:
            'Stampante termica Bluetooth per ricevute di cortesia, pre-conti, ordini in cucina o lista clienti del giorno. Non è una cassa fiscale: non emette scontrini validi per l\'Agenzia Entrate.',
        learnMoreUrl: 'https://www.starmicronics.com/products/tsp143iiibi',
        skillKey: 'thermal_printer',
    },
    {
        id: 'epson_tmm30',
        category: 'printer',
        name: 'Epson TM-m30III',
        brand: 'Epson',
        imageUrl: 'https://files.support.epson.com/pubs/POS/TMm30III/img/main.jpg',
        brandColor: '#0033A0',
        icon: '🖨️',
        connection: 'wifi',
        setupCostEur: 280,
        monthlyEur: 0,
        transactionFee: null,
        platforms: ['chrome', 'edge', 'safari', 'android', 'ios'],
        status: 'on_request',
        pros: [
            'WiFi + Ethernet, multi-postazione',
            'API ePOS-Device JS funziona ovunque inclusi iPad',
            'Costruita per uso intensivo',
            'Tagliacarta automatico',
        ],
        cons: ['Costa più della Star', 'Setup WiFi un po\' fastidioso la prima volta'],
        descriptionIT:
            'Stampante termica di fascia alta, WiFi nativa. Funziona da qualsiasi dispositivo compresi iPad (a differenza della Star che richiede Bluetooth). Consigliata se in salone hai più postazioni che stampano sullo stesso ticket.',
        learnMoreUrl: 'https://www.epson.it/it/it/printers/sd/inkjet/business-printers/tm-m30iii',
        skillKey: 'thermal_printer',
    },

    // ──────────────────────── SCANNER / ALTRO ────────────────────────
    {
        id: 'usb_barcode_scanner',
        category: 'scanner',
        name: 'Scanner barcode USB',
        brand: 'Generico (Netum, Eyoyo, simili)',
        imageUrl: null,
        brandColor: '#444444',
        icon: '📷',
        connection: 'usb',
        setupCostEur: 35,
        monthlyEur: 0,
        transactionFee: null,
        platforms: ['chrome', 'edge', 'safari', 'desktop_only'],
        status: 'on_request',
        pros: [
            'Plug-and-play: si comporta come una tastiera',
            'Velocissimo per inventario prodotti',
            'Costa pochissimo',
        ],
        cons: ['Solo USB cablato, no smartphone'],
        descriptionIT:
            'Lettore di codici a barre USB economico. Lo colleghi al computer della reception e quando scansioni un codice il prodotto si aggiunge alla lista come se l\'avessi digitato. Utile per inventario prodotti e magazzino.',
        learnMoreUrl: null,
        skillKey: 'barcode_scanner',
    },
    {
        id: 'nfc_loyalty',
        category: 'other',
        name: 'Tessera fedeltà NFC',
        brand: 'Generico',
        imageUrl: null,
        brandColor: '#FFB800',
        icon: '🎫',
        connection: 'smartphone_only',
        setupCostEur: 100,
        monthlyEur: 0,
        transactionFee: '€0,80 per tessera stampata',
        platforms: ['android'],
        status: 'on_request',
        pros: [
            'Esperienza fisica della carta fedeltà',
            'Il cliente appoggia la tessera al telefono del dipendente',
            'Nessuna app da scaricare',
        ],
        cons: ['Solo Android (Safari iOS non supporta Web NFC)', 'Costo per stampare le tessere'],
        descriptionIT:
            'Tessere plastiche con chip NFC. Il cliente le appoggia al telefono del dipendente e si apre la sua scheda nel gestionale. Approccio "vecchia scuola" che alcuni clienti apprezzano perché tangibile.',
        learnMoreUrl: null,
        skillKey: 'nfc_loyalty_cards',
    },
];

export const CATEGORY_LABELS: Record<HardwareCategory, string> = {
    pos: 'POS / Pagamenti',
    rt: 'Casse Fiscali (RT)',
    printer: 'Stampanti termiche',
    scanner: 'Scanner',
    other: 'Altro',
};

export const CATEGORY_ICONS: Record<HardwareCategory, string> = {
    pos: '💳',
    rt: '🧾',
    printer: '🖨️',
    scanner: '📷',
    other: '🎫',
};

export const STATUS_LABELS: Record<HardwareStatus, string> = {
    available: 'Pronto',
    in_development: 'In sviluppo',
    on_request: 'Su richiesta',
};
