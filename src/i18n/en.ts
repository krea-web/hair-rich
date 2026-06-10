import type { Dict } from "./types";

export const en: Dict = {
    nav: {
        about: "About",
        services: "Services",
        gallery: "Gallery",
        pricing: "Pricing",
        booking: "Book",
        team: "Team",
        products: "Products",
        home: "Home",
        bookCta: "Book Now",
    },
    common: {
        bookNow: "Book Now",
        exploreServices: "Explore services",
        learnMore: "Learn more",
        seeAll: "See all",
        next: "Next",
        back: "Back",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        close: "Close",
        loading: "Loading…",
        error: "Something went wrong",
        success: "Done",
        copy: "Copy",
        copied: "Copied",
        share: "Share",
        followUs: "Follow us",
        scroll: "Scroll",
    },
    hero: {
        eyebrow: "The",
        titleA: "BARBER",
        titleB: "STUDIO",
        body:
            "For eight years our mission has been to sculpt your identity. Cut, beard and exclusive treatments in the heart of Olbia.",
        primaryCta: "Book Now",
        secondaryCta: "Explore services",
        captionEyebrow: "Premium",
        captionTitle: "MASTER BARBER",
        info: { open: "Open", phone: "Phone", location: "Location" },
        openHours: "Mon–Sat",
        scrollHint: "Scroll",
        mobileScrollHint: "Scroll to discover",
    },
    stats: {
        years: "Years in business",
        clients: "Happy clients",
        styles: "Styles crafted",
        rating: "Average rating",
    },
    about: {
        eyebrow: "About",
        titleA: "Our",
        titleB: "studio.",
        bodyP1:
            "Hair Rich was born from a vision: turning the haircut into an intimate, tailored, one-of-a-kind experience. One chair, one Master Barber, expert hands.",
        bodyP2:
            "No rush. No standardisation. Just the time it takes to sculpt your character — one fade at a time.",
        values: ["Obsessive tailoring", "Premium materials", "Intimate atmosphere", "Slow craft"],
        cta: "Live the experience",
        sinceLabel: "since",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "Our",
        titleB: "services.",
        intro:
            "Three families of treatments for every moment of your day. Pick the treatment that defines you — we'll handle the rest.",
        items: [
            {
                eyebrow: "Sharp",
                title: "CUT",
                description:
                    "Classic cuts, surgical fades, razor blends. Every cut is designed for your face.",
                items: ["Classic cut", "Fade & Blends", "Razor cut", "Kids"],
            },
            {
                eyebrow: "Refined",
                title: "BEARD",
                description:
                    "Shaping, finishing, hot towels and essential oil for an impeccable shave.",
                items: ["Shaping", "Traditional shave", "Designer beard", "Hydrating treatment"],
            },
            {
                eyebrow: "Home",
                title: "AT HOME",
                description:
                    "We come to you. By appointment, for those who can't reach the salon — same tailored quality.",
                items: ["Home haircut", "Home beard", "Weddings & ceremonies", "By appointment"],
            },
        ],
        bookFromCard: "Book",
    },
    whyUs: {
        eyebrow: "What makes us",
        titleA: "Different,",
        titleB: "for real.",
        features: [
            {
                title: "Intimate atmosphere",
                description:
                    "Just a few chairs, no crowds. Every client is a guest — not a task to close.",
            },
            {
                title: "Certified Master Barbers",
                description:
                    "Years of international training. Every cut is studied on your morphology, not on passing trends.",
            },
            {
                title: "Premium tools",
                description:
                    "Japanese blades, hand-formulated products, organic cotton towels. No compromises.",
            },
            {
                title: "Dedicated time",
                description:
                    "Generous slots, never overlapped. The service demands calm — you'll have plenty of it.",
            },
        ],
    },
    team: {
        eyebrow: "Meet the",
        titleA: "Master",
        titleB: "Barber.",
        featured: {
            name: "Federico Asara",
            role: "Master Barber & Co-founder",
            quote: "Every cut is a tailoring act. No formulas, no shortcuts.",
            bio:
                "Federico is the co-founder of Hair Rich, together with Riccardo. He learned the craft young and has refined his technique ever since. Specialised in razor cut, surgical fades and shape-ups tailored to face morphology. Today he cuts personally at the salon and trains his team with a tailored method.",
            specialties: ["Razor", "Fade", "Classic", "Beard"],
            yearsLabel: "10+",
            yearsCaption: "years on the chair",
        },
        members: [
            {
                name: "Cristian",
                role: "Senior Barber",
                specialties: "Cut · Beard · Styling",
                quote: "A good cut shows after a week, not after five minutes.",
                bio:
                    "Cristian joined the Hair Rich team after years in salons in Rome and Cagliari. Specialised in modern cuts, texturing and tailored beard work. Light hand, real listening, and just enough wit to make the chair feel like a privilege.",
                tags: ["Modern", "Texture", "Beard", "Styling"],
                yearsLabel: "6+",
                yearsCaption: "years on the chair",
            },
        ],
    },
    pricing: {
        eyebrow: "Explore",
        titleA: "Pricing",
        titleB: "list.",
        intro:
            "Transparent rates, honest timing. No weekend surcharge, ever. For corporate packages and ceremonies, write us.",
        groups: [
            {
                title: "Cut",
                items: [
                    { name: "Classic cut", description: "Scissors, wash and styling", duration: "30'", price: "€20" },
                    { name: "Fade & Blend", description: "Precise blend, scissors, razor", duration: "45'", price: "€25" },
                    { name: "Razor cut", description: "Full razor work", duration: "50'", price: "€30" },
                    { name: "Kids cut", description: "Ages 0 to 12", duration: "25'", price: "€15" },
                ],
            },
            {
                title: "Beard & At Home",
                items: [
                    { name: "Tailored beard", description: "Shaping, hot towels, oil", duration: "30'", price: "€15" },
                    { name: "Traditional shave", description: "Straight razor, precise finishing", duration: "40'", price: "€25" },
                    { name: "Cut + Beard", description: "The signature combo", duration: "60'", price: "€35" },
                    { name: "Home haircut", description: "We come to you. By appointment, at your time.", duration: "60'", price: "€45" },
                ],
            },
        ],
        footnote:
            "All prices include wash, dry and styling. Payment at the counter, cash or card.",
        cta: "Book a service",
        sideCardEyebrow: "Pricing",
        sideCardTitle: "PAY AS YOU GO",
    },
    gallery: {
        eyebrow: "Gallery",
        titleA: "Our",
        titleB: "portfolio.",
        intro:
            "A small taste of our work. For the full book, follow Instagram or visit the salon.",
        filters: { all: "All" },
        openShot: (title) => `Open ${title}`,
        close: "Close",
    },
    trends: {
        eyebrow: "Tips & Tricks",
        titleA: "Hair care",
        titleB: "at home.",
        intro:
            "Four simple habits to make the cut last and keep hair and beard at their best between appointments.",
        proTipLabel: "Pro tip",
        proTipBody: "Keep the cut sharp every 4 weeks",
        tips: [
            {
                n: "01",
                title: "Wash less often",
                body: "Wash hair every 2–3 days with sulfate-free shampoo. Natural sebum is the best conditioner.",
            },
            {
                n: "02",
                title: "Smart drying",
                body: "Pat, don't rub. Warm air at 20cm. Always blow-dry in the cut's direction.",
            },
            {
                n: "03",
                title: "Pomade vs wax",
                body: "Pomade for defined, lasting looks. Wax for tousled, modular looks. Never both together.",
            },
            {
                n: "04",
                title: "Beard maintenance",
                body: "Oil once a day, balm at night. Always comb after the shower, never dry.",
            },
        ],
    },
    reviews: {
        eyebrow: "Testimonials",
        title: "Voices of those who return.",
        items: [
            {
                name: "Antonio Maricosu",
                text: "I went to this salon, the barbers are friendly and the quality of the cut is high. I'll definitely be back! The best in the area!",
                date: "2 years ago",
                location: "Google",
            },
            {
                name: "Giuseppe Depperu",
                text: "Extremely professional and skilled. Two young guys with a real passion for what they do.",
                date: "2 years ago",
                location: "Google",
            },
            {
                name: "Filippo Martino",
                text: "Had a haircut this morning and it was awesome! They were very friendly and professional, price was good and I felt taken care of. Would definitely come back.",
                date: "1 year ago",
                location: "Google",
            },
            {
                name: "Nicolò Masala",
                text: "Great haircut, very kind and helpful barber.",
                date: "7 months ago",
                location: "Google",
            },
            {
                name: "Iolanda Zampelli",
                text: "My first time here. I brought my 7-year-old son, who immediately felt at ease thanks to how friendly and kind the guys are.",
                date: "2 years ago",
                location: "Google",
            },
        ],
        prev: "Previous review",
        next: "Next review",
    },
    products: {
        eyebrow: "Curated",
        titleA: "Our",
        titleB: "line.",
        intro:
            "Premium products, picked and tested by our Master Barbers. Bring the salon experience home.",
        addToCart: (name) => `Add ${name} to cart`,
        added: "Added",
        prev: "Previous product",
        next: "Next product",
    },
    booking: {
        eyebrow: "Let's create",
        titleA: "Your",
        titleB: "style.",
        intro:
            "Pick service, barber and time. Few steps, no phone wait. Instant confirmation.",
        contactLabels: { salon: "Salon", phone: "Phone", email: "Email" },
        responseHint: "Reply within 1 hour during opening times",
        steps: { serviceStaff: "Service & Barber", dateTime: "Date & Time", confirm: "Confirm" },
        stepLabels: { service: "Service", staff: "Barber", date: "Date", time: "Time", details: "Details" },
        chooseService: "Pick a service",
        chooseStaff: "Pick a barber",
        anyStaff: "No preference",
        chooseDate: "Pick a date",
        chooseTime: "Pick a time",
        details: {
            firstName: "First name",
            phone: "Phone",
            email: "Email",
            notes: "Notes (optional)",
            notesPlaceholder: "Allergies, special requests, reference photo…",
        },
        validation: {
            required: "Required field",
            invalidEmail: "Invalid email",
            invalidPhone: "Invalid phone",
        },
        summary: {
            title: "Summary",
            service: "Service",
            staff: "Barber",
            datetime: "Date & time",
            total: "Total",
            confirmCta: "Confirm booking",
        },
        confirmed: {
            title: "Booking confirmed",
            body: "We'll see you at the salon. You'll receive a reminder 24h before.",
            addToCalendar: "Add to calendar",
            google: "Google Calendar",
            apple: "Apple Calendar",
            ics: "Download .ics",
        },
        savedDraft: "Draft saved",
        resumeDraft: "Resume booking",
        startOver: "Start over",
    },
    instagram: {
        eyebrow: "Follow us",
        titleA: "On",
        titleB: "Instagram.",
        cta: "@hair_rich_",
    },
    map: {
        eyebrow: "Find us",
        titleA: "In the heart of",
        titleB: "Olbia.",
        intro:
            "The Hair Rich studio sits in central Olbia, a short walk from Corso Umberto. Parking nearby.",
        cta: "Get directions",
        hoursSummary: "Mon–Sat · 9:00–20:00",
        labels: { address: "Address", hours: "Hours" },
    },
    footer: {
        signupEyebrow: "The Club",
        signupTitle: "Join the club.",
        signupBody:
            "Create your profile: one-tap booking, cut history, member perks and referrals.",
        signupSubmit: "Create your profile",
        signupLogin: "I already have an account",
        sections: { contact: "Contacts", navigate: "Navigate", hours: "Hours" },
        days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
        closed: "Closed",
        legalNote: "All rights reserved.",
        legalLinks: { privacy: "Privacy", cookie: "Cookie", terms: "Terms" },
    },
    sticky: { cta: "Book Now" },
    badges: {
        rating: "★ 4.6 · 37 Google reviews",
        certified: "Certified Master Barber",
        premium: "Premium products only",
    },
    bundle: {
        eyebrow: "Signature combo",
        title: "Cut + Beard at €35 instead of €40",
        save: (eur) => `Save ${eur}`,
        cta: "Book the combo",
    },
    availability: {
        slotsLeft: (n) =>
            n === 1 ? "Only 1 slot left this week" : `Only ${n} slots left this week`,
        urgentSlot: "Slot open today",
    },
    socialProof: {
        weekly: (n) => `${n} bookings this week`,
        recentBooking: (name, service) => `${name} just booked a ${service}`,
    },
    cookies: {
        title: "Cookies & Privacy",
        body:
            "We use essential cookies to make the site work and (with your consent) analytics cookies to improve it.",
        accept: "Accept all",
        essentials: "Essentials only",
        customize: "Customize",
    },
    install: {
        title: "Install Hair Rich",
        body: "Add the site to your home screen — no store, no download.",
        cta: "Install",
        notNow: "Not now",
    },
    auth: {
        login: {
            welcome: "Welcome back",
            choose: "Pick how you want to sign in.",
            withEmail: "Continue with Email",
            withPhone: "Continue with Phone",
            or: "Or",
            continueGoogle: "Continue with Google",
            emailLabel: "Email",
            phoneLabel: "Phone",
            emailPlaceholder: "name@email.com",
            phonePlaceholder: "+39 333 1234567",
            emailHint: "We'll send a magic link or a code.",
            phoneHint: "You'll receive an SMS with the access code.",
            continue: "Continue",
            otpTitle: "Code",
            otpHint: (id) => `We sent a code to ${id}.`,
            otpAccess: "Sign in",
            otpResend: "Resend",
            noAccount: "No account yet?",
            registerLink: "Sign up or book as a guest",
        },
        register: {
            title: "Join the Club",
            intro: "Create your profile for fast booking, cut history and exclusive perks.",
            firstName: "First name",
            lastName: "Last name",
            phone: "Phone",
            email: "Email",
            birthdate: "Date of birth (optional)",
            marketingConsent:
                "I consent to reminders, special offers and service messages (you can opt out from your profile).",
            submit: "Create profile",
            haveAccount: "Already have an account?",
            loginLink: "Sign in",
        },
    },
    profilo: {
        nav: { dashboard: "Dashboard", appointments: "Appointments", referral: "Referral", settings: "Settings" },
        dashboard: {
            greetingEyebrow: "Welcome back,",
            greetingName: (name) => `${name}.`,
            intro:
                "Your next appointment is already booked. Here's a quick recap of your credits and recent activity.",
            ctaNew: "New appointment",
            kpis: { wallet: "Wallet", visits: "Total visits", favoriteCut: "Favorite cut", trustScore: "Trust score" },
            nextEyebrow: "Up next",
            nextTitle: "Next appointment",
            allAppointments: "All appointments",
            statusConfirmed: "Confirmed",
            move: "Move",
            cancel: "Cancel",
            historyEyebrow: "History",
            historyTitle: "Recent activity",
            historyIntro: "Latest moves between bookings, orders and credits.",
        },
        appointments: {
            eyebrow: "Your",
            title: "Appointments.",
            intro: "Manage future bookings or review your history of cuts, beard and treatments.",
            new: "New",
            filters: { all: "All", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" },
            count: (n) => (n === 1 ? "1 appointment" : `${n} appointments`),
            future: "Upcoming",
            history: "History",
            empty: "No appointments in this category.",
            statuses: { upcoming: "Confirmed", completed: "Completed", cancelled: "Cancelled" },
            rebook: "Book again",
            edit: "Edit",
        },
        settings: {
            eyebrow: "Manage your",
            title: "Settings.",
            intro: "Profile, notifications, privacy. Everything about your account in one place.",
            edit: "Edit",
            sections: {
                notifications: { eyebrow: "Notifications", title: "Communications" },
                gdpr: { eyebrow: "Privacy", title: "GDPR rights" },
            },
            toggles: [
                {
                    label: "Marketing & promos",
                    description: "Receive deals, new product previews and news via email",
                },
                {
                    label: "Appointment reminders",
                    description: "We remind you 24h before via SMS",
                },
                { label: "Post-visit reviews", description: "We ask for feedback after each service" },
            ],
            export: { title: "Export my data", body: "Download a JSON file with your full history" },
            deleteAccount: {
                title: "Delete account",
                body: "Right to be forgotten. This action cannot be reversed.",
            },
            confirmDelete: {
                eyebrow: "Attention",
                title: "Delete the account?",
                body:
                    "All future appointments, history and credits will be lost forever. This action cannot be undone.",
                cancel: "Cancel",
                confirm: "Yes, delete",
            },
        },
        referral: {
            eyebrow: "Word of mouth",
            title: "Referral.",
            intro:
                "Invite a friend, you both earn 5€. Them on the first cut, you in salon credit.",
            codeEyebrow: "Your invite code",
            copyLink: "Copy link",
            copied: "Copied",
            stats: { friends: "Friends invited", credits: "Credits earned" },
            howEyebrow: "How it works",
            howTitle: "How it works",
            steps: [
                {
                    n: "01",
                    title: "Share the code",
                    body: "Send your code or link to friends, by email or message.",
                },
                {
                    n: "02",
                    title: "Friend books",
                    body: "They use the code on signup and get 5€ off the first cut.",
                },
                {
                    n: "03",
                    title: "We both win",
                    body: "When they show up at the salon, you receive 5€ in credit. Stackable.",
                },
            ],
        },
    },
    legal: {
        backHome: "← Back home",
        privacy: {
            title: "Privacy Policy",
            lastUpdate: "Policy version: 2026-05-23 · Last update: May 2026",
            sections: [
                {
                    heading: "1. Data controller",
                    body:
                        "The data controller is Hair Rich Olbia, based at Via Regina Elena 33/A, Olbia (SS), Italy. For any request related to your personal data, write to info@hairrich.it.",
                },
                {
                    heading: "2. Legal basis and purpose",
                    body:
                        "We process your personal data in compliance with EU Regulation 2016/679 (GDPR) and the Italian Privacy Code. Purposes: (a) execution of the service contract (booking management, haircut and treatment delivery, receipts) under Art. 6.1.b GDPR; (b) further purposes based on your explicit consent (Art. 6.1.a), listed in section 3.",
                },
                {
                    heading: "3. Separate, revocable consents",
                    body:
                        "On your first login to the customer area we ask five distinct consents, each optional and revocable at any time from /profilo → Settings. Every grant/revoke is recorded in our immutable audit ledger with timestamp, policy version shown, IP and user agent. The five consents: (1) Marketing & promotions — offers, previews, newsletter; (2) Appointment reminders — message 24h and 2h before; (3) Before/after photos — archive visible only to you in your personal area; (4) Behavioral profiling — targeted campaigns based on visit history (birthday, reactivation); (5) Referral program — participation in word-of-mouth.",
                },
                {
                    heading: "4. Data categories",
                    body:
                        "Identification data (first name, last name), contact (email, phone), date of birth (only if provided under consent 4), appointment history, before/after photos (only with consent 3), service preferences, referral codes generated or used, consents granted and revoked with timestamps.",
                },
                {
                    heading: "5. Data retention",
                    body:
                        "We retain data for the duration of the relationship and for the 10 following years required by tax regulations (D.P.R. 600/1973). Before/after photos are deleted within 24 months of last visit unless extended retention is requested. The consents ledger is retained indefinitely as proof of consent under Art. 7.1 GDPR.",
                },
                {
                    heading: "6. Recipients and external processors",
                    body:
                        "Your data is not sold to third parties for commercial purposes. It is hosted on Supabase (EU servers — Frankfurt) and may be processed by: Google Workspace (transactional email), Telegram (notifications to the owner for cancellations and orders), OpenAI (only anonymized text for owner-facing AI drafts, never PII). All providers are GDPR-compliant; sub-DPAs available on request.",
                },
                {
                    heading: "7. Non-EU transfers",
                    body:
                        "OpenAI is US-based. Transfer relies on the European Commission's Standard Contractual Clauses (SCC) and is limited to strictly anonymized data. For every other processing, data stays within the European Union.",
                },
                {
                    heading: "8. Your GDPR rights",
                    body:
                        "You have the right to: access your data (Art. 15), correct it (Art. 16), erase it — right to be forgotten (Art. 17), restrict processing (Art. 18), receive it in portable format (Art. 20 — available as JSON export from /profilo → Settings), object to processing (Art. 21), revoke consents without affecting prior processing (Art. 7.3). To exercise these rights write to info@hairrich.it. You also have the right to lodge a complaint with the Italian Data Protection Authority (www.garanteprivacy.it).",
                },
                {
                    heading: "9. Security",
                    body:
                        "We adopt appropriate technical and organizational measures: TLS-encrypted connections, Row Level Security at the database level, two-factor authentication for staff, immutable audit log of all changes to sensitive data. Passwords are never stored in plaintext.",
                },
                {
                    heading: "10. Policy changes",
                    body:
                        "Material changes will be communicated at next login and we will ask you to renew consents on the new version. Current version is shown at the top of this page.",
                },
            ],
        },
        cookie: {
            title: "Cookie Policy",
            lastUpdate: "Last update: May 2026",
            sections: [
                {
                    heading: "What are cookies?",
                    body:
                        "Cookies are small text files stored on your device to enable certain site functionality. Alongside cookies, this site also uses localStorage and service workers (for offline mode / PWA install).",
                },
                {
                    heading: "Strictly necessary cookies",
                    body:
                        "We use essential first-party cookies to: (1) keep your login session active (Supabase Auth); (2) remember items in your cart; (3) save booking drawer state during checkout; (4) store your preferred language. These cookies don't require prior consent (Art. 6.1.b GDPR) as they are indispensable to the requested service.",
                },
                {
                    heading: "Browser push notifications",
                    body:
                        "If you enable push notifications (explicit browser opt-in), we store an anonymous endpoint allowing us to send appointment reminders. You can disable them anytime from browser settings or /profilo → Settings.",
                },
                {
                    heading: "Analytics & marketing cookies",
                    body:
                        "We currently do NOT use Google Analytics or third-party tracking scripts. If we enable them in the future we will ask via an explicit consent banner before loading. No commercial cookie is set until you enable it.",
                },
                {
                    heading: "How to disable them",
                    body:
                        "You can clear cookies and local data from your browser panel. Note that disabling essential cookies breaks login and cart.",
                },
            ],
        },
        terms: {
            title: "Terms & Conditions",
            lastUpdate: "Last update: May 2026",
            sections: [
                {
                    heading: "1. Bookings",
                    body:
                        "Bookings made online are binding from the moment of confirmation. Please be punctual: if you arrive more than 10 minutes late we may need to shorten the service or reschedule to avoid penalizing later clients.",
                },
                {
                    heading: "2. Cancellation and rescheduling",
                    body:
                        "You can cancel or move your appointment for free from /profilo → Appointments with at least 4 hours' notice (the exact threshold is salon-configurable and always shown at cancel time). Under the minimum window self-service cancellation is disabled: contact the salon by phone or WhatsApp.",
                },
                {
                    heading: "3. No-show",
                    body:
                        "We do not use automatic blacklists or automatic penalties. In case of absence we will contact you personally with an empathetic message to understand what happened and reschedule. A repeated no-show history without notice gives us the right — at owner's discretion — to request a deposit for future bookings.",
                },
                {
                    heading: "4. Prepaid packages",
                    body:
                        "Packages (e.g. 5 cuts) are purchased directly in salon (cash, card or wire transfer). You receive a digital receipt by email. Each credit has a validity shown in the confirmation. Unused credits at expiry are considered consumed. In case of extended salon closure, expiries are automatically extended by the equivalent period.",
                },
                {
                    heading: "5. Coupons and loyalty programs",
                    body:
                        "Coupons, birthday discounts, loyalty and referral programs are optional features enabled or disabled at the salon's discretion. When active, specific use conditions (validity, minimum spend, combinability) are shown on each coupon. Accrued credits are not convertible to cash.",
                },
                {
                    heading: "6. Prices and payment",
                    body:
                        "Prices shown in the booking engine and shop are in Euro (€), VAT included, and final. Service payment is made in salon at the end of delivery via cash, contactless card or wire transfer. We do not handle online payment for services.",
                },
                {
                    heading: "7. Competent court",
                    body:
                        "For any dispute arising from use of the site or services, the Court of Tempio Pausania has exclusive jurisdiction. Italian law applies.",
                },
            ],
        },
    },
    notFound: {
        eyebrow: "404",
        title: "Page not found.",
        body: "The page you're looking for doesn't exist or has moved.",
        cta: "Back to home",
    },
    offline: {
        eyebrow: "Offline",
        title: "You're offline.",
        body:
            "Can't reach the salon? Check your connection and retry. Pages you've already visited remain available.",
        cta: "Retry",
    },
    languageBanner: {
        suggest: (lang) => `View in ${lang}?`,
        switch: "Switch",
        keep: "Stay in English",
    },
};
