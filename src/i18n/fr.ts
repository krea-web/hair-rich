import type { Dict } from "./types";

export const fr: Dict = {
    nav: {
        about: "À propos",
        services: "Services",
        gallery: "Galerie",
        pricing: "Tarifs",
        booking: "Réserver",
        team: "Équipe",
        products: "Produits",
        home: "Accueil",
        bookCta: "Réserver",
    },
    common: {
        bookNow: "Réserver",
        exploreServices: "Découvrir les services",
        learnMore: "En savoir plus",
        seeAll: "Voir tout",
        next: "Suivant",
        back: "Retour",
        cancel: "Annuler",
        confirm: "Confirmer",
        save: "Enregistrer",
        edit: "Modifier",
        delete: "Supprimer",
        close: "Fermer",
        loading: "Chargement…",
        error: "Une erreur est survenue",
        success: "Terminé",
        copy: "Copier",
        copied: "Copié",
        share: "Partager",
        followUs: "Suivez-nous",
        scroll: "Scroll",
    },
    hero: {
        eyebrow: "The",
        titleA: "BARBER",
        titleB: "STUDIO",
        body:
            "Depuis huit ans, notre mission est de sculpter votre identité. Coupe, barbe et soins exclusifs au cœur d'Olbia.",
        primaryCta: "Réserver",
        secondaryCta: "Découvrir les services",
        captionEyebrow: "Premium",
        captionTitle: "MASTER BARBER",
        info: { open: "Ouvert", phone: "Téléphone", location: "Adresse" },
        openHours: "Mar–Sam",
        scrollHint: "Scroll",
        mobileScrollHint: "Faites défiler pour découvrir",
    },
    stats: {
        years: "Années d'activité",
        clients: "Clients satisfaits",
        styles: "Styles réalisés",
        rating: "Note moyenne",
    },
    about: {
        eyebrow: "À propos",
        titleA: "Notre",
        titleB: "studio.",
        bodyP1:
            "Hair Rich est né d'une vision : transformer le service de la coupe en une expérience intime, sur mesure, unique. Un fauteuil, un Master Barber, des mains expertes.",
        bodyP2:
            "Pas de précipitation. Aucune standardisation. Juste le temps qu'il faut pour sculpter votre caractère — un fade à la fois.",
        values: ["Sur-mesure obsessionnel", "Matériaux premium", "Atmosphère intime", "Soin lent"],
        cta: "Vivez l'expérience",
        sinceLabel: "depuis",
    },
    services: {
        eyebrow: "Lovely",
        titleA: "Nos",
        titleB: "services.",
        intro:
            "Trois familles de soins pour chaque moment de votre journée. Choisissez le service qui vous représente — on s'occupe du reste.",
        items: [
            {
                eyebrow: "Sharp",
                title: "COUPE",
                description:
                    "Coupes classiques, fades chirurgicaux, dégradés au rasoir. Chaque coupe est dessinée pour votre visage.",
                items: ["Coupe classique", "Fade & Dégradés", "Razor cut", "Enfant"],
            },
            {
                eyebrow: "Refined",
                title: "BARBE",
                description:
                    "Modelage, finition, serviettes chaudes et huile essentielle pour un rasage impeccable.",
                items: ["Modelage", "Rasage traditionnel", "Designer beard", "Soin hydratant"],
            },
            {
                eyebrow: "Home",
                title: "À DOMICILE",
                description:
                    "Nous venons chez vous. Sur rendez-vous, pour qui ne peut pas se déplacer — même qualité sur mesure.",
                items: ["Coupe à domicile", "Barbe à domicile", "Mariages & cérémonies", "Sur rendez-vous"],
            },
        ],
        bookFromCard: "Réserver",
    },
    whyUs: {
        eyebrow: "What makes us",
        titleA: "Différents,",
        titleB: "vraiment.",
        features: [
            {
                title: "Atmosphère intime",
                description:
                    "Quelques fauteuils seulement, jamais de foule. Chaque client est un invité — pas un dossier à fermer.",
            },
            {
                title: "Master Barbers certifiés",
                description:
                    "Des années de formation internationale. Chaque coupe est étudiée sur votre morphologie, pas sur les modes passagères.",
            },
            {
                title: "Outils premium",
                description:
                    "Lames japonaises, produits formulés à la main, serviettes coton bio. Aucun compromis.",
            },
            {
                title: "Temps dédié",
                description:
                    "Créneaux généreux, jamais superposés. Le soin demande du calme — vous en aurez à profusion.",
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
            quote: "Chaque coupe est un acte de couture. Pas de formules, pas de raccourcis.",
            bio:
                "Federico est le fondateur de Hair Rich. Il a appris le métier très jeune et n'a jamais cessé d'affiner sa technique. Spécialisé en razor cut, fade chirurgical et shape-up adaptés à la morphologie du visage. Aujourd'hui il coupe personnellement au salon et forme son équipe avec une méthode sur mesure.",
            specialties: ["Razor", "Fade", "Classic", "Beard"],
            yearsLabel: "10+",
            yearsCaption: "années de métier",
        },
        members: [
            {
                name: "Cristian",
                role: "Senior Barber",
                specialties: "Coupe · Barbe · Styling",
                quote: "Une bonne coupe se voit après une semaine, pas après cinq minutes.",
                bio:
                    "Cristian a rejoint l'équipe Hair Rich après plusieurs années dans des salons à Rome et Cagliari. Spécialisé en coupes modernes, texturisation et barbe sur mesure. Main légère, écoute vraie, et juste ce qu'il faut d'humour pour faire de la séance un plaisir.",
                tags: ["Modern", "Texture", "Beard", "Styling"],
                yearsLabel: "6+",
                yearsCaption: "années de métier",
            },
        ],
    },
    pricing: {
        eyebrow: "Explore",
        titleA: "Liste",
        titleB: "des prix.",
        intro:
            "Tarifs transparents, durées honnêtes. Pas de supplément week-end, jamais. Pour les forfaits entreprise et les cérémonies, écrivez-nous.",
        groups: [
            {
                title: "Coupe",
                items: [
                    { name: "Coupe classique", description: "Ciseaux, lavage et coiffage", duration: "30'", price: "20€" },
                    { name: "Fade & Dégradé", description: "Dégradé précis, ciseaux, rasoir", duration: "45'", price: "25€" },
                    { name: "Razor cut", description: "Travail intégral au rasoir", duration: "50'", price: "30€" },
                    { name: "Coupe enfant", description: "De 0 à 12 ans", duration: "25'", price: "15€" },
                ],
            },
            {
                title: "Barbe & Domicile",
                items: [
                    { name: "Barbe sur mesure", description: "Modelage, serviettes chaudes, huile", duration: "30'", price: "15€" },
                    { name: "Rasage traditionnel", description: "Rasoir à main libre, finition précise", duration: "40'", price: "25€" },
                    { name: "Coupe + Barbe", description: "Le combo signature", duration: "60'", price: "35€" },
                    { name: "Coupe à domicile", description: "Nous venons chez vous. Sur rendez-vous.", duration: "60'", price: "45€" },
                ],
            },
        ],
        footnote:
            "Tous les tarifs incluent lavage, séchage et coiffage. Paiement en caisse, espèces ou carte.",
        cta: "Réserver un service",
        sideCardEyebrow: "Pricing",
        sideCardTitle: "PAY AS YOU GO",
    },
    gallery: {
        eyebrow: "Galerie",
        titleA: "Notre",
        titleB: "portfolio.",
        intro:
            "Un petit aperçu de notre travail. Pour le book complet, suivez Instagram ou venez au salon.",
        filters: { all: "Tous" },
        openShot: (title) => `Ouvrir ${title}`,
        close: "Fermer",
    },
    trends: {
        eyebrow: "Tips & Tricks",
        titleA: "Hair care",
        titleB: "à la maison.",
        intro:
            "Quatre habitudes simples pour faire durer la coupe et garder cheveux et barbe au mieux entre deux rendez-vous.",
        proTipLabel: "Pro tip",
        proTipBody: "Gardez la coupe nette toutes les 4 semaines",
        tips: [
            {
                n: "01",
                title: "Lavage moins fréquent",
                body:
                    "Lavez les cheveux tous les 2-3 jours avec un shampoing sans sulfates. Le sébum naturel est le meilleur après-shampoing.",
            },
            {
                n: "02",
                title: "Séchage intelligent",
                body:
                    "Tamponnez, ne frottez pas. Air tiède à 20cm. Séchez toujours dans le sens de la coupe.",
            },
            {
                n: "03",
                title: "Pomade vs cire",
                body:
                    "Pomade pour des looks définis et durables. Cire pour des looks souples et modulables. Jamais les deux ensemble.",
            },
            {
                n: "04",
                title: "Entretien de la barbe",
                body:
                    "Huile une fois par jour, baume le soir. Toujours peigner après la douche, jamais à sec.",
            },
        ],
    },
    reviews: {
        eyebrow: "Testimonials",
        title: "Les voix de ceux qui reviennent.",
        items: [
            {
                name: "Alessandro M.",
                text: "Le meilleur barbier d'Olbia, sans aucun doute. Marco a un talent incroyable pour le fade — il écoute vraiment et propose des solutions sur mesure. J'y retourne tous les mois.",
                date: "Avril 2025",
                location: "Olbia",
            },
            {
                name: "Francesco R.",
                text: "Cadre soigné, musique parfaite, coupe impeccable. Hair Rich est une expérience, pas un simple rendez-vous. Le soin barbe avec serviettes chaudes est unique.",
                date: "Mars 2025",
                location: "Cagliari",
            },
            {
                name: "Giovanni P.",
                text: "Enfin un endroit où l'on sait écouter. J'ai montré une photo et le résultat a même été meilleur. Très recommandé pour qui cherche une qualité sur-mesure.",
                date: "Février 2025",
                location: "Sassari",
            },
            {
                name: "Luigi B.",
                text: "Le souci du détail est impressionnant. Du lavage à la finition, chaque geste est étudié. La coupe tient vraiment un mois et se modèle parfaitement.",
                date: "Janvier 2025",
                location: "Olbia",
            },
        ],
        prev: "Avis précédent",
        next: "Avis suivant",
    },
    products: {
        eyebrow: "Curated",
        titleA: "Notre",
        titleB: "ligne.",
        intro:
            "Produits premium, choisis et testés par nos Master Barbers. Pour ramener l'expérience du salon à la maison.",
        addToCart: (name) => `Ajouter ${name} au panier`,
        added: "Ajouté",
        prev: "Produit précédent",
        next: "Produit suivant",
    },
    booking: {
        eyebrow: "Let's create",
        titleA: "Votre",
        titleB: "style.",
        intro:
            "Choisissez service, barber et créneau. Quelques étapes, zéro attente au téléphone. Confirmation immédiate.",
        contactLabels: { salon: "Salon", phone: "Téléphone", email: "Email" },
        responseHint: "Réponse sous 1h aux horaires d'ouverture",
        steps: { serviceStaff: "Service & Barber", dateTime: "Date & heure", confirm: "Confirmer" },
        stepLabels: { service: "Service", staff: "Barbier", date: "Date", time: "Heure", details: "Détails" },
        chooseService: "Choisissez un service",
        chooseStaff: "Choisissez un barber",
        anyStaff: "Aucune préférence",
        chooseDate: "Choisissez un jour",
        chooseTime: "Choisissez une heure",
        details: {
            firstName: "Prénom",
            phone: "Téléphone",
            email: "Email",
            notes: "Notes (facultatif)",
            notesPlaceholder: "Allergies, demandes particulières, photo de référence…",
        },
        validation: {
            required: "Champ obligatoire",
            invalidEmail: "Email invalide",
            invalidPhone: "Téléphone invalide",
        },
        summary: {
            title: "Récapitulatif",
            service: "Service",
            staff: "Barber",
            datetime: "Date & heure",
            total: "Total",
            confirmCta: "Confirmer la réservation",
        },
        confirmed: {
            title: "Réservation confirmée",
            body:
                "On vous attend au salon. Vous recevrez un rappel 24h avant.",
            addToCalendar: "Ajouter au calendrier",
            google: "Google Calendar",
            apple: "Apple Calendar",
            ics: "Télécharger .ics",
        },
        savedDraft: "Brouillon enregistré",
        resumeDraft: "Reprendre la réservation",
        startOver: "Recommencer",
    },
    instagram: {
        eyebrow: "Follow us",
        titleA: "Sur",
        titleB: "Instagram.",
        cta: "@hair_rich_",
    },
    map: {
        eyebrow: "Où nous trouver",
        titleA: "Au cœur d'",
        titleB: "Olbia.",
        intro:
            "Le studio Hair Rich se trouve au centre d'Olbia, à deux pas du Corso Umberto. Parking à proximité.",
        cta: "Itinéraire",
        hoursSummary: "Mar–Sam · 9h00–19h30",
        labels: { address: "Adresse", hours: "Horaires" },
    },
    footer: {
        signupEyebrow: "Le Club",
        signupTitle: "Rejoignez le club.",
        signupBody:
            "Créez votre profil : réservation en un clic, historique des coupes, avantages membres et parrainage.",
        signupSubmit: "Créer mon profil",
        signupLogin: "J'ai déjà un compte",
        sections: { contact: "Contacts", navigate: "Naviguer", hours: "Horaires" },
        days: { mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim" },
        closed: "Fermé",
        legalNote: "Tous droits réservés.",
        legalLinks: { privacy: "Confidentialité", cookie: "Cookies", terms: "Conditions" },
    },
    sticky: { cta: "Réserver" },
    badges: {
        rating: "★ 4.9 · 247 avis Google",
        certified: "Master Barber certifié",
        premium: "Produits premium uniquement",
    },
    bundle: {
        eyebrow: "Combo signature",
        title: "Coupe + Barbe à 35€ au lieu de 40€",
        save: (eur) => `Économisez ${eur}`,
        cta: "Réserver le combo",
    },
    availability: {
        slotsLeft: (n) =>
            n === 1 ? "Plus qu'1 créneau cette semaine" : `Plus que ${n} créneaux cette semaine`,
        urgentSlot: "Créneau libre aujourd'hui",
    },
    socialProof: {
        weekly: (n) => `${n} réservations cette semaine`,
        recentBooking: (name, service) => `${name} vient de réserver un ${service}`,
    },
    cookies: {
        title: "Cookies & confidentialité",
        body:
            "Nous utilisons des cookies essentiels au fonctionnement du site et (avec votre consentement) des cookies analytiques pour l'améliorer.",
        accept: "Tout accepter",
        essentials: "Essentiels uniquement",
        customize: "Personnaliser",
    },
    install: {
        title: "Installer Hair Rich",
        body: "Ajoutez le site à votre écran d'accueil — sans store, sans téléchargement.",
        cta: "Installer",
        notNow: "Plus tard",
    },
    auth: {
        login: {
            welcome: "Bon retour",
            choose: "Choisissez votre méthode de connexion.",
            withEmail: "Continuer avec Email",
            withPhone: "Continuer avec Téléphone",
            or: "Ou",
            continueGoogle: "Continuer avec Google",
            emailLabel: "Email",
            phoneLabel: "Téléphone",
            emailPlaceholder: "nom@email.com",
            phonePlaceholder: "+39 333 1234567",
            emailHint: "Nous vous enverrons un lien magique ou un code.",
            phoneHint: "Vous recevrez un SMS avec le code d'accès.",
            continue: "Continuer",
            otpTitle: "Code",
            otpHint: (id) => `Nous avons envoyé un code à ${id}.`,
            otpAccess: "Se connecter",
            otpResend: "Renvoyer",
            noAccount: "Pas encore de compte ?",
            registerLink: "Inscrivez-vous ou réservez en invité",
        },
        register: {
            title: "Rejoignez le Club",
            intro: "Créez votre profil pour des réservations rapides, l'historique des coupes et des avantages exclusifs.",
            firstName: "Prénom",
            lastName: "Nom",
            phone: "Téléphone",
            email: "Email",
            birthdate: "Date de naissance (facultatif)",
            marketingConsent:
                "J'accepte de recevoir rappels, offres spéciales et communications de service (vous pouvez vous désabonner depuis votre profil).",
            submit: "Créer le profil",
            haveAccount: "Vous avez déjà un compte ?",
            loginLink: "Connexion",
        },
    },
    profilo: {
        nav: { dashboard: "Tableau de bord", appointments: "Rendez-vous", referral: "Parrainage", settings: "Paramètres" },
        dashboard: {
            greetingEyebrow: "Bon retour,",
            greetingName: (name) => `${name}.`,
            intro:
                "Votre prochain soin est déjà fixé. Voici un récap rapide de vos crédits et de votre activité récente.",
            ctaNew: "Nouveau rendez-vous",
            kpis: { wallet: "Portefeuille", visits: "Visites", favoriteCut: "Coupe favorite", trustScore: "Trust score" },
            nextEyebrow: "Up next",
            nextTitle: "Prochain rendez-vous",
            allAppointments: "Tous les rendez-vous",
            statusConfirmed: "Confirmé",
            move: "Déplacer",
            cancel: "Annuler",
            historyEyebrow: "History",
            historyTitle: "Activité récente",
            historyIntro: "Derniers mouvements entre rendez-vous, commandes et crédits.",
        },
        appointments: {
            eyebrow: "Vos",
            title: "Rendez-vous.",
            intro: "Gérez les réservations futures ou consultez l'historique de vos coupes, barbes et soins.",
            new: "Nouveau",
            filters: { all: "Tous", confirmed: "Confirmés", completed: "Terminés", cancelled: "Annulés" },
            count: (n) => (n === 1 ? "1 rendez-vous" : `${n} rendez-vous`),
            future: "À venir",
            history: "Historique",
            empty: "Aucun rendez-vous dans cette catégorie.",
            statuses: { upcoming: "Confirmé", completed: "Terminé", cancelled: "Annulé" },
            rebook: "Réserver à nouveau",
            edit: "Modifier",
        },
        settings: {
            eyebrow: "Gérer vos",
            title: "Paramètres.",
            intro: "Profil, notifications, confidentialité. Tout ce qui concerne votre compte au même endroit.",
            edit: "Modifier",
            sections: {
                notifications: { eyebrow: "Notifications", title: "Communications" },
                gdpr: { eyebrow: "Confidentialité", title: "Droits RGPD" },
            },
            toggles: [
                {
                    label: "Marketing & promos",
                    description: "Recevez offres, avant-premières produits et nouveautés par email",
                },
                {
                    label: "Rappels de rendez-vous",
                    description: "Rappel par SMS 24h avant",
                },
                { label: "Avis post-visite", description: "Nous demandons votre avis après chaque service" },
            ],
            export: { title: "Exporter mes données", body: "Téléchargez un fichier JSON avec tout votre historique" },
            deleteAccount: {
                title: "Supprimer le compte",
                body: "Droit à l'oubli. Cette action est irréversible.",
            },
            confirmDelete: {
                eyebrow: "Attention",
                title: "Supprimer le compte ?",
                body:
                    "Tous les rendez-vous futurs, l'historique et les crédits seront perdus à jamais. Cette action ne peut être annulée.",
                cancel: "Annuler",
                confirm: "Oui, supprimer",
            },
        },
        referral: {
            eyebrow: "Word of mouth",
            title: "Parrainage.",
            intro:
                "Invitez un ami, vous gagnez tous deux 5€. Lui sur la première coupe, vous en crédit salon.",
            codeEyebrow: "Votre code de parrainage",
            copyLink: "Copier le lien",
            copied: "Copié",
            stats: { friends: "Amis invités", credits: "Crédits gagnés" },
            howEyebrow: "How it works",
            howTitle: "Comment ça marche",
            steps: [
                {
                    n: "01",
                    title: "Partagez le code",
                    body: "Envoyez votre code ou lien aux amis, par email ou message.",
                },
                {
                    n: "02",
                    title: "L'ami réserve",
                    body: "Il utilise le code à l'inscription et obtient 5€ de réduction sur la première coupe.",
                },
                {
                    n: "03",
                    title: "Tout le monde gagne",
                    body: "Quand il vient au salon, vous recevez 5€ en crédit. Cumulables.",
                },
            ],
        },
    },
    legal: {
        backHome: "← Retour à l'accueil",
        privacy: {
            title: "Politique de confidentialité",
            lastUpdate: "Dernière mise à jour : Mai 2026",
            sections: [
                {
                    heading: "1. Responsable du traitement",
                    body:
                        "Le responsable du traitement est Hair Rich Olbia, situé Via Regina Elena 33/A, Olbia (SS), Italie.",
                },
                {
                    heading: "2. Finalité du traitement",
                    body:
                        "Les données fournies seront utilisées exclusivement pour la gestion des réservations, la prestation des services demandés et, avec consentement explicite, pour des communications marketing.",
                },
                {
                    heading: "3. Partage des données",
                    body:
                        "Vos données ne seront pas cédées à des tiers à des fins promotionnelles. Elles peuvent être partagées avec des prestataires essentiels (systèmes de réservation, envoi de SMS) strictement conformes au RGPD.",
                },
                {
                    heading: "4. Vos droits",
                    body:
                        "Vous avez le droit d'accéder, de rectifier ou de demander la suppression de vos données ('Droit à l'oubli') à tout moment via votre Espace Personnel ou en nous contactant par email.",
                },
            ],
        },
        cookie: {
            title: "Politique de cookies",
            lastUpdate: "Dernière mise à jour : Mai 2026",
            sections: [
                {
                    heading: "Que sont les cookies ?",
                    body:
                        "Les cookies sont de petits fichiers texte enregistrés sur votre appareil lorsque vous visitez notre site Web.",
                },
                {
                    heading: "Cookies essentiels",
                    body:
                        "Nous utilisons des cookies essentiels (First-Party) pour maintenir votre session active et faire fonctionner le panier et le moteur de réservation. Ils ne nécessitent pas de consentement préalable car ils sont indispensables.",
                },
                {
                    heading: "Cookies analytiques et marketing",
                    body:
                        "Nous pourrions utiliser à l'avenir des scripts analytiques anonymisés, pour lesquels nous demanderons votre consentement explicite avant activation.",
                },
            ],
        },
        terms: {
            title: "Conditions générales",
            lastUpdate: "Dernière mise à jour : Mai 2026",
            sections: [
                {
                    heading: "1. Réservations",
                    body:
                        "Les réservations effectuées sur le site sont contraignantes. En acceptant ce règlement, vous vous engagez à vous présenter à l'heure convenue.",
                },
                {
                    heading: "2. Annulation et No-Show",
                    body:
                        "Merci d'annuler ou de modifier votre rendez-vous au moins 12 heures à l'avance. En cas de 'No-Show' répété, nous nous réservons le droit de limiter les réservations futures ou de pénaliser le Trust Score de votre compte.",
                },
                {
                    heading: "3. Prix et paiements",
                    body:
                        "Les prix indiqués dans le moteur de réservation et la boutique sont en euros (€) et finaux. Le paiement des services s'effectue généralement en caisse après prestation.",
                },
            ],
        },
    },
    notFound: {
        eyebrow: "404",
        title: "Page introuvable.",
        body: "La page que vous cherchez n'existe pas ou a été déplacée.",
        cta: "Retour à l'accueil",
    },
    offline: {
        eyebrow: "Hors ligne",
        title: "Vous êtes hors ligne.",
        body:
            "Impossible de joindre le salon ? Vérifiez votre connexion et réessayez. Les pages déjà visitées restent disponibles.",
        cta: "Réessayer",
    },
    languageBanner: {
        suggest: (lang) => `Afficher en ${lang} ?`,
        switch: "Changer",
        keep: "Rester en français",
    },
};
