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
            "Men's haircuts and beard work, in the centre of Olbia. By appointment, one client at a time, no rush — since 2017.",
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
            "Hair Rich is a barber specialised in men, in the centre of Olbia. One person at a time, all the time it takes: first we talk, then we cut.",
        bodyP2:
            "No rush and no cookie-cutter cuts. We start from the shape of your face and how much time you give your hair, for a cut that still looks good a week later.",
        values: ["Men & beard only", "By appointment", "Wash & styling included", "In central Olbia"],
        cta: "Book your cut",
        sinceLabel: "since",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "Our",
        titleB: "services.",
        intro:
            "Three services, clear prices: haircut €20, beard €10, cut + beard €30. Wash and styling always included, by appointment. We also do home haircuts in Olbia (phone only).",
        items: [
            {
                eyebrow: "€20 · 30 min",
                title: "CUT",
                description:
                    "Men's haircut: scissors or clippers, clean fades and outlines. Wash and styling included.",
                items: ["Scissors or clippers", "Fades & outlines", "Wash + styling", "By appointment"],
            },
            {
                eyebrow: "€10 · 30 min",
                title: "BEARD",
                description:
                    "Beard shaping and finishing with a hot towel, classic razor and nourishing oil.",
                items: ["Hot towel", "Classic razor", "Clean outlines", "Nourishing oil"],
            },
            {
                eyebrow: "€30 · 60 min",
                title: "COMBO",
                description:
                    "Haircut + beard in a single one-hour session. The complete Hair Rich service.",
                items: ["Cut + beard", "One dedicated hour", "Wash + styling", "Most popular"],
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
                title: "Specialised in men",
                description:
                    "We cut men's hair and beards all day, every day. The specialisation shows in the result.",
            },
            {
                title: "By appointment, no waiting",
                description:
                    "Book online in a minute or by phone. Generous slots, never overlapped: you walk in and you're straight in the chair.",
            },
            {
                title: "A cut tailored to you",
                description:
                    "We start from your face shape and lifestyle, not the trend of the month. A cut that holds up even a week later.",
            },
            {
                title: "In the centre of Olbia",
                description:
                    "At Via Regina Elena 33/A, steps from Corso Umberto. Parking nearby, open Mon–Sat 9–13 and 15–20.",
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
            quote: "We wanted a place where the cut is done calmly, one person at a time. That's Hair Rich.",
            bio:
                "Federico is the co-founder of Hair Rich, together with Riccardo, and cuts at the salon in central Olbia. He learned the craft young and has never stopped refining his technique: fades, razor cut and outlines shaped to your face. Today he cuts personally at the salon and trains his team with method and patience.",
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
                    "Cristian joined the Hair Rich team after years in salons between Rome and Cagliari. Specialised in modern cuts, texturing and beard. Light hand, real listening and just enough wit to make the session fly.",
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
            "Transparent rates, no weekend surcharge. Wash and styling always included. For home haircuts in Olbia, give us a call.",
        groups: [
            {
                title: "Pricing",
                items: [
                    { name: "Haircut", description: "Scissors or clippers, fades and outlines. Wash and styling included.", duration: "30'", price: "€20" },
                    { name: "Beard", description: "Hot towel, classic razor, nourishing oil.", duration: "30'", price: "€10" },
                    { name: "Cut + Beard", description: "Hair and beard in one hour. The full combo.", duration: "60'", price: "€30" },
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
        hoursSummary: "Mon–Sat · 9–13 / 15–20",
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
        eyebrow: "Full combo",
        title: "Cut + Beard in one hour at €30",
        save: (eur) => `Cut ${eur}`,
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
    servicesHero: {
        chip: "By appointment · Central Olbia",
        titleA: "Cuts & beards",
        titleB: "in Olbia.",
        body:
            "Haircut €20, beard €10, cut + beard €30. Book online in a minute, pay at the salon. Wash and styling always included.",
        cta: "Book now",
        metrics: [
            { v: "from €20", l: "Price list" },
            { v: "60s", l: "Book online" },
            { v: "4.6★", l: "37 reviews" },
        ],
        footerLeft: "Instant confirmation",
        footerRight: "01 / Services",
    },
    serviceQuiz: {
        eyebrow: "Build your service",
        title: "Three options. One tap. You're in the chair.",
        intro:
            "Cut €20, beard €10, combo €30. Pick what you want today and book the next slot — in 60 seconds.",
        watermark: "pick",
        items: [
            { tag: "Hair only", quick: "Listen + execute + finish. 30 minutes, done.", cta: "Book a haircut" },
            { tag: "Beard only", quick: "Classic razor, outlines, oil chosen for your skin.", cta: "Book a beard trim" },
            { tag: "Combo", quick: "A full hour. Hair and beard in one go.", cta: "Book the combo" },
        ],
        fallbackNames: { cut: "Haircut", beard: "Beard trim", combo: "Haircut + beard" },
    },
    homeService: {
        chip: "Home barber · Olbia & Costa Smeralda",
        titleA: "Home haircuts",
        titleB: "in Olbia.",
        body:
            "Hair Rich is also a home barber in Olbia and across Costa Smeralda. We come to you — at home, in a hotel, aboard a yacht or for ceremonies and weddings — in Olbia, Porto Cervo and Golfo Aranci. Same tools and same care as the salon. The home service is arranged by phone only: call us and we'll set place, time and price together.",
        facts: [
            { v: "Olbia", l: "+ Costa Smeralda" },
            { v: "Yacht", l: "Hotel · Ceremonies" },
            { v: "Phone", l: "only" },
        ],
        cta: "Call to book",
        footer: "Available during opening hours",
        watermark: "at home",
    },
    galleryHero: {
        eyebrow: "Real cuts · Olbia",
        titleA: "Cuts that walked",
        titleB: "right out of here.",
        body:
            "Every photo is a real client, shot at the end of the service. No stock, no AI, no recycled catalogue. Just what we actually do.",
        metrics: [
            { value: "4.6★", label: "37 reviews" },
            { value: "since 2017", label: "In Olbia" },
            { value: "3", label: "Services" },
        ],
        footerLeft: "Hair Rich · Olbia",
        footerRight: "02 / Work",
    },
    salonDay: {
        eyebrow: "Behind the scenes",
        titleA: "A day",
        titleB: "at the salon.",
        intro:
            "No staging. A craft done well, Monday to Saturday, from 9 to 20 with a lunch break. Here's what a day at Hair Rich looks like.",
        watermark: "09 — 20:00",
        timeline: [
            { time: "09:00", title: "We open", body: "Coffee, the day's schedule, blades ready. By the time the first client walks in, everything's in order." },
            { time: "09:30", title: "First cut", body: "We always start with the consultation, even with regulars: the head changes, the cut adapts." },
            { time: "13:00", title: "Break", body: "We really close, from 13 to 15. No \"just five minutes\": you switch off and come back sharp." },
            { time: "15:00", title: "Afternoon", body: "After-work clients: cut, beard, combo. If you're short on time you're in and out; if you want, take it slow." },
            { time: "18:00", title: "Rush hour", body: "The busiest hours: cut, beard and touch-ups. By appointment only, so nobody waits on their feet." },
            { time: "20:00", title: "We close", body: "Same respect as the morning: we close on time for tomorrow's clients, but whoever's in the chair finishes calmly. Always." },
        ],
    },
    directions: {
        eyebrow: "Getting here",
        addressLine: "Via Regina Elena 33/A,",
        city: "Olbia.",
        intro:
            "A short walk from Corso Umberto. Three different ways to get here, all under 15 minutes from wherever you are.",
        mapBtn: "Open in Maps",
        routes: [
            { title: "On foot from the Corso", body: "5 minutes from Corso Umberto. Head towards Via Regina Elena and keep straight to number 33/A.", detail: "Ideal if you parked in the centre or you're already in the pedestrian area." },
            { title: "By car", body: "Free parking on Via Regina Elena and Via Mameli. No restricted-traffic zone around the salon.", detail: "Coming from the port or the SS125, follow the signs for the Historic Centre." },
            { title: "From the airport", body: "10–15 minutes by car from Olbia Costa Smeralda airport. By taxi, rental or shuttle you arrive straight in the centre.", detail: "Handy if you've just landed: book ahead and get your cut before hotel check-in." },
        ],
    },
    servicesPage: {
        processEyebrow: "The Hair Rich service",
        processTitle: "What happens when you sit down.",
        process: [
            { n: "01", title: "Consultation · 2 minutes", body: "Before the scissors: face shape, lifestyle, how much time you can give in the morning. We decide together." },
            { n: "02", title: "Execution · scissors or razor", body: "Technique chosen for the result you want, not the trend of the month. Wash always included." },
            { n: "03", title: "Finish · the right product", body: "Styling with the product suited to your hair, so you can recreate it at home in 30 seconds." },
        ],
        faqEyebrow: "Questions about the services",
        faqTitle: "The most common ones.",
        faq: [
            { q: "How much does a haircut at Hair Rich in Olbia cost?", a: "At Hair Rich in Olbia a men's haircut is €20, a beard trim €10 and the cut + beard combo €30. Prices always include wash and styling, with no weekend surcharge. The cut takes about 30 minutes, the combo about an hour." },
            { q: "Where is Hair Rich in Olbia?", a: "Hair Rich is at Via Regina Elena 33/A, in the centre of Olbia (07026, province of Sassari), steps from Corso Umberto. There's parking nearby, and it's about ten minutes from Olbia Costa Smeralda airport." },
            { q: "Is Hair Rich open today? What are the hours?", a: "Hair Rich is open Monday to Saturday, 09:00–13:00 and 15:00–20:00, and closed on Sunday. We work by appointment only, so it's best to book before stopping by." },
            { q: "How do I book an appointment at Hair Rich?", a: "You can book at Hair Rich online in about 60 seconds with instant confirmation, or by phone at 0789 1891049 during opening hours." },
            { q: "Is there a home barber in Olbia?", a: "Yes: Hair Rich offers home haircuts in Olbia and across Costa Smeralda — Porto Cervo, Golfo Aranci — at home, in a hotel, aboard a yacht and for ceremonies and weddings. We bring the same tools and the same care as the salon right to you." },
            { q: "How much is the home haircut in Olbia and how do I book it?", a: "Hair Rich's home service is arranged by phone only: call 0789 1891049 and we'll set place, time, number of people and price together. The quote depends on location and number of heads, but the quality is the same as the salon." },
            { q: "Do you do beards with a traditional razor?", a: "Yes. The beard at Hair Rich (€10) is done with a hot towel, traditional razor, clean outlines and nourishing oil. It's also included in the €30 cut + beard combo." },
            { q: "What's the difference between a fade and a classic taper?", a: "A fade is a very gradual blend that starts almost at skin level and rises progressively; a classic taper keeps more length on the sides. At Hair Rich we do both, with scissors and razor, based on your face shape." },
            { q: "Can I add the beard to my cut during the appointment?", a: "Yes. At the initial consultation you can move from just the cut to the cut + beard combo (€30) if your face shape calls for it. The price is recalculated transparently before we start." },
            { q: "Does Hair Rich do women's cuts or colour?", a: "Hair Rich is a barber specialised in men and beards: haircut, beard and combo. We don't do colour or women's styling; for advanced unisex styling we work by dedicated appointment only." },
        ],
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
