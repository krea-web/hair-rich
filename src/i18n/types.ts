/**
 * Types for the translation dictionary. Tutti i locali devono implementare
 * questa interfaccia, garantendo type-safety e autocomplete.
 */

export type Locale = "it" | "en" | "fr" | "de";

export const LOCALES: readonly Locale[] = ["it", "en", "fr", "de"] as const;

export const LOCALE_META: Record<
    Locale,
    { native: string; flag: string; bcp47: string }
> = {
    it: { native: "Italiano", flag: "🇮🇹", bcp47: "it-IT" },
    en: { native: "English", flag: "🇬🇧", bcp47: "en-US" },
    fr: { native: "Français", flag: "🇫🇷", bcp47: "fr-FR" },
    de: { native: "Deutsch", flag: "🇩🇪", bcp47: "de-DE" },
};

export interface Dict {
    nav: {
        about: string;
        services: string;
        gallery: string;
        pricing: string;
        booking: string;
        team: string;
        products: string;
        home: string;
        bookCta: string;
    };
    common: {
        bookNow: string;
        exploreServices: string;
        learnMore: string;
        seeAll: string;
        next: string;
        back: string;
        cancel: string;
        confirm: string;
        save: string;
        edit: string;
        delete: string;
        close: string;
        loading: string;
        error: string;
        success: string;
        copy: string;
        copied: string;
        share: string;
        followUs: string;
        scroll: string;
    };
    hero: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        body: string;
        primaryCta: string;
        secondaryCta: string;
        captionEyebrow: string;
        captionTitle: string;
        info: { open: string; phone: string; location: string };
        openHours: string;
        scrollHint: string;
        mobileScrollHint: string;
    };
    stats: {
        years: string;
        clients: string;
        styles: string;
        rating: string;
    };
    about: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        bodyP1: string;
        bodyP2: string;
        values: [string, string, string, string];
        cta: string;
        sinceLabel: string;
    };
    services: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        items: Array<{
            eyebrow: string;
            title: string;
            description: string;
            items: string[];
        }>;
        bookFromCard: string;
    };
    whyUs: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        features: Array<{ title: string; description: string }>;
    };
    team: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        featured: {
            name: string;
            role: string;
            quote: string;
            bio: string;
            specialties: string[];
            yearsLabel: string;
            yearsCaption: string;
        };
        members: Array<{
            name: string;
            role: string;
            specialties: string;
            quote: string;
            bio: string;
            tags: string[];
            yearsLabel: string;
            yearsCaption: string;
        }>;
    };
    pricing: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        groups: Array<{
            title: string;
            items: Array<{
                name: string;
                description: string;
                duration: string;
                price: string;
            }>;
        }>;
        footnote: string;
        cta: string;
        sideCardEyebrow: string;
        sideCardTitle: string;
    };
    gallery: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        filters: { all: string };
        openShot: (title: string) => string;
        close: string;
    };
    trends: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        proTipLabel: string;
        proTipBody: string;
        tips: Array<{ n: string; title: string; body: string }>;
    };
    reviews: {
        eyebrow: string;
        title: string;
        items: Array<{
            name: string;
            text: string;
            date: string;
            location: string;
        }>;
        prev: string;
        next: string;
    };
    products: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        addToCart: (name: string) => string;
        added: string;
        prev: string;
        next: string;
    };
    booking: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        contactLabels: { salon: string; phone: string; email: string };
        responseHint: string;
        steps: { serviceStaff: string; dateTime: string; confirm: string };
        stepLabels: { service: string; staff: string; date: string; time: string; details: string };
        chooseService: string;
        chooseStaff: string;
        anyStaff: string;
        chooseDate: string;
        chooseTime: string;
        details: {
            firstName: string;
            phone: string;
            email: string;
            notes: string;
            notesPlaceholder: string;
        };
        validation: {
            required: string;
            invalidEmail: string;
            invalidPhone: string;
        };
        summary: {
            title: string;
            service: string;
            staff: string;
            datetime: string;
            total: string;
            confirmCta: string;
        };
        confirmed: {
            title: string;
            body: string;
            addToCalendar: string;
            google: string;
            apple: string;
            ics: string;
        };
        savedDraft: string;
        resumeDraft: string;
        startOver: string;
    };
    instagram: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        cta: string;
    };
    map: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        cta: string;
        hoursSummary: string;
        labels: { address: string; hours: string };
    };
    footer: {
        signupEyebrow: string;
        signupTitle: string;
        signupBody: string;
        signupSubmit: string;
        signupLogin: string;
        sections: { contact: string; navigate: string; hours: string };
        days: { mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string };
        closed: string;
        legalNote: string;
        legalLinks: { privacy: string; cookie: string; terms: string };
    };
    sticky: {
        cta: string;
    };
    badges: {
        rating: string;
        certified: string;
        premium: string;
    };
    bundle: {
        eyebrow: string;
        title: string;
        save: (eur: string) => string;
        cta: string;
    };
    availability: {
        slotsLeft: (n: number) => string;
        urgentSlot: string;
    };
    socialProof: {
        weekly: (n: number) => string;
        recentBooking: (name: string, service: string) => string;
    };
    cookies: {
        title: string;
        body: string;
        accept: string;
        essentials: string;
        customize: string;
    };
    install: {
        title: string;
        body: string;
        cta: string;
        notNow: string;
    };
    auth: {
        login: {
            welcome: string;
            choose: string;
            withEmail: string;
            withPhone: string;
            or: string;
            continueGoogle: string;
            emailLabel: string;
            phoneLabel: string;
            emailPlaceholder: string;
            phonePlaceholder: string;
            emailHint: string;
            phoneHint: string;
            continue: string;
            otpTitle: string;
            otpHint: (id: string) => string;
            otpAccess: string;
            otpResend: string;
            noAccount: string;
            registerLink: string;
        };
        register: {
            title: string;
            intro: string;
            firstName: string;
            lastName: string;
            phone: string;
            email: string;
            birthdate: string;
            marketingConsent: string;
            submit: string;
            haveAccount: string;
            loginLink: string;
        };
    };
    profilo: {
        nav: { dashboard: string; appointments: string; referral: string; settings: string };
        dashboard: {
            greetingEyebrow: string;
            greetingName: (name: string) => string;
            intro: string;
            ctaNew: string;
            kpis: { wallet: string; visits: string; favoriteCut: string; trustScore: string };
            nextEyebrow: string;
            nextTitle: string;
            allAppointments: string;
            statusConfirmed: string;
            move: string;
            cancel: string;
            historyEyebrow: string;
            historyTitle: string;
            historyIntro: string;
        };
        appointments: {
            eyebrow: string;
            title: string;
            intro: string;
            new: string;
            filters: { all: string; confirmed: string; completed: string; cancelled: string };
            count: (n: number) => string;
            future: string;
            history: string;
            empty: string;
            statuses: { upcoming: string; completed: string; cancelled: string };
            rebook: string;
            edit: string;
        };
        settings: {
            eyebrow: string;
            title: string;
            intro: string;
            edit: string;
            sections: {
                notifications: { eyebrow: string; title: string };
                gdpr: { eyebrow: string; title: string };
            };
            toggles: Array<{ label: string; description: string }>;
            export: { title: string; body: string };
            deleteAccount: { title: string; body: string };
            confirmDelete: {
                eyebrow: string;
                title: string;
                body: string;
                cancel: string;
                confirm: string;
            };
        };
        referral: {
            eyebrow: string;
            title: string;
            intro: string;
            codeEyebrow: string;
            copyLink: string;
            copied: string;
            stats: { friends: string; credits: string };
            howEyebrow: string;
            howTitle: string;
            steps: Array<{ n: string; title: string; body: string }>;
        };
    };
    legal: {
        backHome: string;
        privacy: { title: string; lastUpdate: string; sections: Array<{ heading: string; body: string }> };
        cookie: { title: string; lastUpdate: string; sections: Array<{ heading: string; body: string }> };
        terms: { title: string; lastUpdate: string; sections: Array<{ heading: string; body: string }> };
    };
    notFound: {
        eyebrow: string;
        title: string;
        body: string;
        cta: string;
    };
    offline: {
        eyebrow: string;
        title: string;
        body: string;
        cta: string;
    };
    languageBanner: {
        suggest: (lang: string) => string;
        switch: string;
        keep: string;
    };
    servicesHero: {
        chip: string;
        titleA: string;
        titleB: string;
        body: string;
        cta: string;
        metrics: Array<{ v: string; l: string }>;
        footerLeft: string;
        footerRight: string;
    };
    serviceQuiz: {
        eyebrow: string;
        title: string;
        intro: string;
        watermark: string;
        items: Array<{ tag: string; quick: string; cta: string }>;
        fallbackNames: { cut: string; beard: string; combo: string };
    };
    homeService: {
        chip: string;
        titleA: string;
        titleB: string;
        body: string;
        facts: Array<{ v: string; l: string }>;
        cta: string;
        footer: string;
        watermark: string;
    };
    galleryHero: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        body: string;
        metrics: Array<{ value: string; label: string }>;
        footerLeft: string;
        footerRight: string;
    };
    salonDay: {
        eyebrow: string;
        titleA: string;
        titleB: string;
        intro: string;
        watermark: string;
        timeline: Array<{ time: string; title: string; body: string }>;
    };
    directions: {
        eyebrow: string;
        addressLine: string;
        city: string;
        intro: string;
        mapBtn: string;
        routes: Array<{ title: string; body: string; detail: string }>;
    };
    servicesPage: {
        processEyebrow: string;
        processTitle: string;
        process: Array<{ n: string; title: string; body: string }>;
        faqEyebrow: string;
        faqTitle: string;
        faq: Array<{ q: string; a: string }>;
    };
    teamPage: {
        heroEyebrow: string;
        heroBody: string;
        heroFooterLeft: string;
        heroFooterRight: string;
        valuesEyebrow: string;
        valuesTitle: string;
        values: Array<{ n: string; title: string; body: string }>;
    };
    lavoriPage: {
        featuredBadge: string;
        featuredSubtitle: string;
        featuredTitle: string;
        featuredBody: string;
        featuredMeta: Array<{ label: string; value: string }>;
    };
    productsPage: {
        faqEyebrow: string;
        faqTitle: string;
        faq: Array<{ q: string; a: string }>;
        merch: {
            chip: string;
            titleA: string;
            body: string;
            facts: Array<{ v: string; l: string }>;
            cta: string;
            footer: string;
        };
    };
    contactPage: {
        heroEyebrow: string;
        heroTitleA: string;
        heroTitleB: string;
        heroIntro: string;
        heroMetaLeft: string;
        heroMetaRight: string;
        chipCall: string;
        chipEmail: string;
        chipDirections: string;
        bookEyebrow: string;
        bookTitle: string;
        bookBody: string;
        recapitiEyebrow: string;
        recapitiTitle: string;
        phoneLabel: string;
        phoneHint: string;
        emailLabel: string;
        emailHint: string;
        salonLabel: string;
        mapBtn: string;
        formEyebrow: string;
        formTitle: string;
        formBody: string;
        formBookLink: string;
        formCallLink: string;
    };
}
