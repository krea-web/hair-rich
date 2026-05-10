import type { Dict } from "./types";

export const en: Dict = {
    nav: {
        about: "About",
        services: "Services",
        gallery: "Gallery",
        pricing: "Pricing",
        booking: "Book",
        team: "Team",
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
            "For eight years our mission has been to sculpt your identity. Cut, beard and exclusive rituals in the heart of Olbia.",
        primaryCta: "Book Now",
        secondaryCta: "Explore services",
        captionEyebrow: "Premium",
        captionTitle: "MASTER BARBER",
        info: { open: "Open", phone: "Phone", location: "Location" },
        openHours: "Tue–Sat",
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
            "Hair Rich was born from a vision: turning the haircut ritual into an intimate, tailored, one-of-a-kind experience. One chair, one Master Barber, expert hands.",
        bodyP2:
            "No rush. No standardisation. Just the time it takes to sculpt your character — one fade at a time.",
        values: ["Obsessive tailoring", "Premium materials", "Intimate atmosphere", "Slow ritual"],
        cta: "Live the experience",
        sinceLabel: "since",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "Our",
        titleB: "services.",
        intro:
            "Three families of treatments for every moment of your day. Pick the ritual that defines you — we'll handle the rest.",
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
                    "Generous slots, never overlapped. The ritual demands calm — you'll have plenty of it.",
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
            quote: "Every cut is a tailoring act. No formulas, no shortcuts.",
            bio:
                "Federico is the founder of Hair Rich. He learned the craft young and has refined his technique ever since. Specialised in razor cut, surgical fades and shape-ups tailored to face morphology. Today he cuts personally at the salon and trains his team with a tailored method.",
            specialties: ["Razor", "Fade", "Classic", "Beard"],
            yearsLabel: "10+",
            yearsCaption: "years on the chair",
        },
        members: [
            { name: "Luca", role: "Senior Barber", specialties: "Cut · Beard · Styling" },
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
                name: "Alessandro M.",
                text: "The best barber in Olbia, no doubt. Marco has incredible talent for fades — he truly listens and proposes tailored solutions. I come back every month.",
                date: "April 2025",
                location: "Olbia",
            },
            {
                name: "Francesco R.",
                text: "Curated atmosphere, perfect music, impeccable cut. Hair Rich is an experience, not a simple appointment. The hot-towel beard ritual is something unique.",
                date: "March 2025",
                location: "Cagliari",
            },
            {
                name: "Giovanni P.",
                text: "Finally a place where they truly listen. I showed a photo and the result was even better. Highly recommended for anyone seeking tailored quality.",
                date: "February 2025",
                location: "Sassari",
            },
            {
                name: "Luigi B.",
                text: "The attention to detail is impressive. From wash to finish, every gesture is considered. The cut really lasts a month and styles beautifully.",
                date: "January 2025",
                location: "Olbia",
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
            "Pick service, barber and time. Few steps, no phone wait. We confirm on WhatsApp.",
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
    footer: {
        newsletterEyebrow: "Newsletter",
        newsletterTitle: "Stay sharp.",
        newsletterBody:
            "One email a month: new cuts, product previews, private events. No spam, ever.",
        newsletterPlaceholder: "your@email.com",
        newsletterSubmit: "Subscribe",
        newsletterSuccess: "Subscribed. You'll hear from us soon.",
        sections: { contact: "Contacts", navigate: "Navigate", hours: "Hours" },
        days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
        closed: "Closed",
        legalNote: "All rights reserved.",
        legalLinks: { privacy: "Privacy", cookie: "Cookie", terms: "Terms" },
    },
    sticky: { cta: "Book Now" },
    badges: {
        rating: "★ 4.9 · 247 Google reviews",
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
                "Your next ritual is already booked. Here's a quick recap of your credits and recent activity.",
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
            intro: "Manage future bookings or review your history of cuts, beard and rituals.",
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
                    description: "Receive deals, new product previews and news via email/WhatsApp",
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
            whatsapp: "WhatsApp",
            stats: { friends: "Friends invited", credits: "Credits earned" },
            howEyebrow: "How it works",
            howTitle: "How it works",
            steps: [
                {
                    n: "01",
                    title: "Share the code",
                    body: "Send your code or link to friends, on WhatsApp or email.",
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
            lastUpdate: "Last update: May 2026",
            sections: [
                {
                    heading: "1. Data controller",
                    body:
                        "The data controller is Hair Rich Olbia, based at Via Regina Elena 33/A, Olbia (SS), Italy.",
                },
                {
                    heading: "2. Purpose of processing",
                    body:
                        "Provided data will be used exclusively to manage bookings, deliver requested services and, with explicit consent, for marketing communications.",
                },
                {
                    heading: "3. Data sharing",
                    body:
                        "Your data won't be sold to third parties for promotional purposes. They may be shared with essential service providers (booking systems, SMS delivery) strictly GDPR-compliant.",
                },
                {
                    heading: "4. Your rights",
                    body:
                        "You can access, correct or request deletion of your data ('Right to be forgotten') at any time via your Personal Area or by contacting us by email.",
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
                        "Cookies are small text files saved on your device when you visit our website.",
                },
                {
                    heading: "Essential cookies",
                    body:
                        "We use first-party essential cookies to keep your login session active and to make the cart and booking engine work. They don't require prior consent as they are indispensable.",
                },
                {
                    heading: "Analytics & marketing cookies",
                    body:
                        "We may use anonymized analytics scripts in the future, for which we'll ask explicit consent before activation.",
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
                        "Bookings made on the site are binding. Accepting these terms commits you to attend the appointment at the agreed time.",
                },
                {
                    heading: "2. Cancellation & No-Show",
                    body:
                        "Please cancel or change your appointment at least 12 hours in advance. In case of repeated 'No-Show', we reserve the right to limit future bookings or impact your account's Trust Score.",
                },
                {
                    heading: "3. Prices & payments",
                    body:
                        "Prices in the Booking Engine and Shop are in Euro (€) and final. Payment for services is generally made at the counter after delivery.",
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
