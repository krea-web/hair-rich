/**
 * Contenuto della landing SEO locale "Parrucchiere a Olbia".
 *
 * Pagina pillar dedicata, distinta dalla home (che presidia "barbiere Olbia")
 * e dai componenti landing React: qui il testo è server-rendered (Astro puro)
 * e localizzato per lingua, così il contenuto corretto è nell'HTML statico di
 * ogni versione (it/en/fr/de). Targetta il cluster "parrucchiere uomo Olbia".
 *
 * SERVIZI: solo 3 reali — Taglio capelli (20€), Taglio barba (10€),
 * Taglio capelli + Barba (30€). Nessun altro servizio.
 */

import type { Locale } from "@/i18n";

export interface PoServiceItem {
  name: string;
  duration: string;
  price: string;
  desc: string;
}
export interface PoFaq {
  q: string;
  a: string;
}
export interface PoReview {
  name: string;
  text: string;
}
export interface PoWhy {
  title: string;
  body: string;
}
export interface PoHours {
  day: string;
  time: string;
}

export interface PoContent {
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbLabel: string;
  eyebrow: string;
  h1: string;
  heroKicker: string;
  intro: string[];
  trust: string[];
  servicesTitle: string;
  servicesIntro: string;
  services: PoServiceItem[];
  whyTitle: string;
  why: PoWhy[];
  locationTitle: string;
  location: string[];
  directionsLabel: string;
  hoursTitle: string;
  hoursNote: string;
  hours: PoHours[];
  areaTitle: string;
  area: string;
  reviewsTitle: string;
  reviews: PoReview[];
  faqTitle: string;
  faq: PoFaq[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  callLabel: string;
  contactTitle: string;
  homeCta: string;
  marquee: string[];
}

export const PARRUCCHIERE_OLBIA: Record<Locale, PoContent> = {
  it: {
    metaTitle: "Parrucchiere Uomo a Olbia | Hair Rich — Taglio, Barba & Combo in centro",
    metaDescription:
      "Cerchi un parrucchiere uomo a Olbia? Hair Rich è il barber studio in Via Regina Elena 33/A: taglio capelli 20€, barba 10€, taglio + barba 30€. Su prenotazione, aperto lun–sab 9–20.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Parrucchiere Olbia",
    eyebrow: "Parrucchiere uomo · Olbia",
    h1: "Parrucchiere uomo a Olbia",
    heroKicker: "Barber studio nel centro di Olbia · dal 2017",
    intro: [
      "Cerchi un parrucchiere uomo a Olbia che tratti i capelli come un sarto tratta un tessuto? Hair Rich è un barber studio nel centro di Olbia, in Via Regina Elena 33/A, specializzato nel taglio maschile e nella barba.",
      "Lavoriamo solo su prenotazione, una persona alla volta, senza fretta. Ogni taglio parte da un consulto — forma del viso, stile di vita, quanto tempo dedichi ai capelli — e da lì costruiamo un look che funziona davvero anche dopo una settimana.",
    ],
    trust: ["Dal 2017", "★ 4,6 · 37 recensioni Google", "Solo su prenotazione", "Centro di Olbia"],
    servicesTitle: "I nostri servizi",
    servicesIntro:
      "Tre servizi essenziali, fatti bene. Listino chiaro, nessun sovrapprezzo nel weekend, lavaggio e styling sempre inclusi.",
    services: [
      {
        name: "Taglio capelli",
        duration: "30 min",
        price: "20€",
        desc: "Forbice o macchinetta, sfumatura e contorni curati al millimetro. Lavaggio e styling inclusi.",
      },
      {
        name: "Taglio barba",
        duration: "30 min",
        price: "10€",
        desc: "Modellatura e rifinitura della barba con asciugamano caldo, rasoio classico e olio nutriente.",
      },
      {
        name: "Taglio capelli + Barba",
        duration: "60 min",
        price: "30€",
        desc: "Capelli e barba in continuità, in un'unica seduta da un'ora. Il servizio completo Hair Rich.",
      },
    ],
    whyTitle: "Perché scegliere Hair Rich a Olbia",
    why: [
      {
        title: "Specializzati sull'uomo",
        body: "Non siamo un salone generico: tagliamo capelli e barba maschili tutto il giorno, ogni giorno. La specializzazione si vede nel risultato.",
      },
      {
        title: "Su prenotazione, niente attese",
        body: "Prenoti online in un minuto o per telefono. Slot ampi, mai sovrapposti: entri e sei subito sulla poltrona.",
      },
      {
        title: "Tecnica e strumenti premium",
        body: "Forbici e rasoi professionali, prodotti selezionati. Capelli e barba sfumati e rifiniti sulla morfologia del tuo viso.",
      },
      {
        title: "Nel cuore di Olbia",
        body: "In Via Regina Elena 33/A, a due passi dal Corso Umberto, con parcheggio nelle vicinanze.",
      },
    ],
    locationTitle: "Dove trovarci a Olbia",
    location: [
      "Il nostro salone è in Via Regina Elena 33/A, 07026 Olbia (SS), nel centro città. Dal Corso Umberto sono cinque minuti a piedi; in auto trovi parcheggio nelle vie limitrofe; dall'aeroporto di Olbia Costa Smeralda sei da noi in circa dieci minuti.",
    ],
    directionsLabel: "Apri in Google Maps",
    hoursTitle: "Orari di apertura",
    hoursNote: "Si lavora solo su prenotazione.",
    hours: [
      { day: "Lunedì – Sabato", time: "09:00 – 13:00 · 15:00 – 20:00" },
      { day: "Domenica", time: "Chiuso" },
    ],
    areaTitle: "Taglio a domicilio a Olbia e in Costa Smeralda",
    area: "Non puoi raggiungere il salone? Veniamo noi da te. Offriamo il taglio a domicilio in tutta Olbia e nella Costa Smeralda — Porto Cervo, Golfo Aranci — anche a bordo di yacht e per cerimonie. La stessa cura del salone, a casa tua o dove preferisci. Il servizio a domicilio si organizza esclusivamente per telefono: chiamaci e definiamo insieme luogo, orario e dettagli.",
    homeCta: "Chiama per il domicilio",
    marquee: ["Parrucchiere uomo", "Olbia centro", "Taglio sartoriale", "Barba", "Su appuntamento", "Dal 2017"],
    reviewsTitle: "Cosa dicono i clienti",
    reviews: [
      { name: "Antonio Maricosu", text: "I barbieri simpatici e la qualità del taglio elevata, tornerò sicuramente! Il migliore nella zona!" },
      { name: "Giuseppe Depperu", text: "Estremamente professionali e competenti. Due ragazzi giovani con una grande passione per la professione." },
      { name: "Nicolò Masala", text: "Ottimo taglio, parrucchiere molto gentile e disponibile." },
    ],
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Qual è la differenza fra un parrucchiere e un barbiere?",
        a: "Il barbiere è specializzato nel taglio maschile e nella barba; il parrucchiere tradizionalmente lavora anche su acconciature e colore. Hair Rich unisce la cura del parrucchiere alla specializzazione del barbiere sull'uomo: taglio capelli, barba e il combo taglio + barba.",
      },
      {
        q: "Quanto costa un taglio da Hair Rich a Olbia?",
        a: "Il taglio capelli costa 20€, il taglio barba 10€, il combo taglio + barba 30€. Listino trasparente, nessun sovrapprezzo nel weekend, lavaggio e styling inclusi.",
      },
      {
        q: "Serve prenotare?",
        a: "Sì, lavoriamo solo su appuntamento per garantirti tutto il tempo necessario. Puoi prenotare online dal sito o chiamare lo 0789 1891049.",
      },
      {
        q: "Fate il colore o servizi da parrucchiere donna?",
        a: "Siamo specializzati sull'uomo: taglio capelli, barba e combo. Per styling unisex avanzato lavoriamo solo su prenotazione dedicata.",
      },
      {
        q: "Dove si trova il salone?",
        a: "In Via Regina Elena 33/A, nel centro di Olbia, a pochi passi dal Corso Umberto. Aperto dal lunedì al sabato, 09:00–13:00 e 15:00–20:00.",
      },
    ],
    ctaTitle: "Prenota il tuo taglio a Olbia",
    ctaText: "Scegli servizio, barbiere e orario in meno di un minuto. Conferma immediata, niente attese al telefono.",
    ctaButton: "Prenota ora",
    callLabel: "Oppure chiama",
    contactTitle: "Vieni a trovarci",
  },

  en: {
    metaTitle: "Men's Hairdresser & Barber in Olbia | Hair Rich — Cut, Beard & Combo",
    metaDescription:
      "Looking for a men's hairdresser or barber in Olbia, Sardinia? Hair Rich, Via Regina Elena 33/A: haircut €20, beard €10, cut + beard €30. By appointment, open Mon–Sat 9–20.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Hairdresser Olbia",
    eyebrow: "Men's hairdresser · Olbia",
    h1: "Men's hairdresser & barber in Olbia",
    heroKicker: "Barber studio in central Olbia · since 2017",
    intro: [
      "Looking for a men's hairdresser in Olbia who treats hair the way a tailor treats cloth? Hair Rich is a barber studio in central Olbia, at Via Regina Elena 33/A, focused on men's cuts and beard work.",
      "We work by appointment only, one client at a time, no rush. Every cut starts with a consultation — face shape, lifestyle, how much time you give your hair — and from there we build a look that still works a week later.",
    ],
    trust: ["Since 2017", "★ 4.6 · 37 Google reviews", "By appointment only", "Central Olbia"],
    servicesTitle: "Our services",
    servicesIntro:
      "Three essential services, done well. Clear pricing, no weekend surcharge, wash and styling always included.",
    services: [
      {
        name: "Haircut",
        duration: "30 min",
        price: "€20",
        desc: "Scissors or clipper, fades and outlines finished to the millimetre. Wash and styling included.",
      },
      {
        name: "Beard trim",
        duration: "30 min",
        price: "€10",
        desc: "Beard shaping and finishing with hot towel, classic razor and nourishing oil.",
      },
      {
        name: "Haircut + Beard",
        duration: "60 min",
        price: "€30",
        desc: "Hair and beard in one continuous one-hour session. The complete Hair Rich service.",
      },
    ],
    whyTitle: "Why choose Hair Rich in Olbia",
    why: [
      { title: "Focused on men", body: "We're not a generic salon: we cut men's hair and beards all day, every day. The specialisation shows in the result." },
      { title: "By appointment, no waiting", body: "Book online in a minute or by phone. Generous slots, never overlapped: you sit down right away." },
      { title: "Premium technique & tools", body: "Professional scissors and razors, selected products. Hair and beard faded and finished to your face shape." },
      { title: "In the heart of Olbia", body: "At Via Regina Elena 33/A, steps from Corso Umberto, with parking nearby." },
    ],
    locationTitle: "Where to find us in Olbia",
    location: [
      "Our salon is at Via Regina Elena 33/A, 07026 Olbia (SS), in the city centre. It's a five-minute walk from Corso Umberto; by car you'll find parking on the nearby streets; from Olbia Costa Smeralda airport you're here in about ten minutes.",
    ],
    directionsLabel: "Open in Google Maps",
    hoursTitle: "Opening hours",
    hoursNote: "By appointment only.",
    hours: [
      { day: "Monday – Saturday", time: "09:00 – 13:00 · 15:00 – 20:00" },
      { day: "Sunday", time: "Closed" },
    ],
    areaTitle: "Home haircuts in Olbia and the Costa Smeralda",
    area: "Can't reach the salon? We come to you. We offer home haircuts across Olbia and the Costa Smeralda — Porto Cervo, Golfo Aranci — including aboard yachts and for ceremonies. The same salon care, at your place or wherever suits you. The home service is arranged by phone only: call us and we'll sort out location, time and details together.",
    homeCta: "Call for home service",
    marquee: ["Men's hairdresser", "Olbia", "Cut & Beard", "By appointment", "Since 2017", "City centre"],
    reviewsTitle: "What clients say",
    reviews: [
      { name: "Antonio Maricosu", text: "Friendly barbers and high-quality cuts, I'll definitely be back! The best in the area!" },
      { name: "Giuseppe Depperu", text: "Extremely professional and skilled. Two young guys with a real passion for what they do." },
      { name: "Filippo Martino", text: "Had a haircut this morning and it was awesome! Very friendly and professional, good price, I felt taken care of." },
    ],
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "What's the difference between a hairdresser and a barber?", a: "A barber specialises in men's cuts and beard; a hairdresser traditionally also does styling and colour. Hair Rich combines a hairdresser's care with a barber's focus on men: haircut, beard and the cut + beard combo." },
      { q: "How much does a haircut cost at Hair Rich in Olbia?", a: "A haircut is €20, a beard trim €10, the cut + beard combo €30. Transparent pricing, no weekend surcharge, wash and styling included." },
      { q: "Do I need to book?", a: "Yes, we work by appointment only so we can give you the time you need. Book online on the site or call 0789 1891049." },
      { q: "Do you do colour or women's hairdressing?", a: "We specialise in men: haircut, beard and combo. For advanced unisex styling we work by dedicated appointment only." },
      { q: "Where is the salon?", a: "At Via Regina Elena 33/A, in central Olbia, steps from Corso Umberto. Open Monday to Saturday, 09:00–13:00 and 15:00–20:00." },
    ],
    ctaTitle: "Book your haircut in Olbia",
    ctaText: "Choose service, barber and time in under a minute. Instant confirmation, no phone wait.",
    ctaButton: "Book now",
    callLabel: "Or call us",
    contactTitle: "Come and find us",
  },

  fr: {
    metaTitle: "Coiffeur homme & barbier à Olbia | Hair Rich — Coupe, Barbe & Combo",
    metaDescription:
      "Coiffeur homme ou barbier à Olbia, en Sardaigne ? Hair Rich, Via Regina Elena 33/A : coupe 20€, barbe 10€, coupe + barbe 30€. Sur rendez-vous, ouvert du lun. au sam. 9–20.",
    breadcrumbHome: "Accueil",
    breadcrumbLabel: "Coiffeur Olbia",
    eyebrow: "Coiffeur homme · Olbia",
    h1: "Coiffeur homme & barbier à Olbia",
    heroKicker: "Barber studio au centre d'Olbia · depuis 2017",
    intro: [
      "Vous cherchez un coiffeur homme à Olbia qui traite les cheveux comme un tailleur traite un tissu ? Hair Rich est un barber studio au centre d'Olbia, Via Regina Elena 33/A, spécialisé dans la coupe masculine et la barbe.",
      "Nous travaillons uniquement sur rendez-vous, un client à la fois, sans précipitation. Chaque coupe commence par une consultation — forme du visage, mode de vie, temps consacré aux cheveux — et nous construisons un look qui tient vraiment, même une semaine plus tard.",
    ],
    trust: ["Depuis 2017", "★ 4,6 · 37 avis Google", "Sur rendez-vous", "Centre d'Olbia"],
    servicesTitle: "Nos services",
    servicesIntro:
      "Trois services essentiels, bien faits. Tarifs clairs, jamais de supplément le week-end, lavage et coiffage toujours inclus.",
    services: [
      {
        name: "Coupe homme",
        duration: "30 min",
        price: "20€",
        desc: "Ciseaux ou tondeuse, dégradés et contours soignés au millimètre. Lavage et coiffage inclus.",
      },
      {
        name: "Taille de barbe",
        duration: "30 min",
        price: "10€",
        desc: "Modelage et finition de la barbe avec serviette chaude, rasoir classique et huile nourrissante.",
      },
      {
        name: "Coupe + Barbe",
        duration: "60 min",
        price: "30€",
        desc: "Cheveux et barbe en continuité, en une seule séance d'une heure. Le service complet Hair Rich.",
      },
    ],
    whyTitle: "Pourquoi choisir Hair Rich à Olbia",
    why: [
      { title: "Spécialistes de l'homme", body: "Nous ne sommes pas un salon généraliste : nous coupons cheveux et barbes masculins toute la journée, chaque jour. La spécialisation se voit dans le résultat." },
      { title: "Sur rendez-vous, sans attente", body: "Réservez en ligne en une minute ou par téléphone. Créneaux larges, jamais superposés : vous êtes tout de suite installé." },
      { title: "Technique et outils premium", body: "Ciseaux et rasoirs professionnels, produits sélectionnés. Cheveux et barbe dégradés et finis selon la morphologie de votre visage." },
      { title: "Au cœur d'Olbia", body: "Via Regina Elena 33/A, à deux pas du Corso Umberto, avec parking à proximité." },
    ],
    locationTitle: "Où nous trouver à Olbia",
    location: [
      "Notre salon est Via Regina Elena 33/A, 07026 Olbia (SS), au centre-ville. À cinq minutes à pied du Corso Umberto ; en voiture, vous trouverez du stationnement dans les rues voisines ; depuis l'aéroport d'Olbia Costa Smeralda, vous êtes chez nous en une dizaine de minutes.",
    ],
    directionsLabel: "Ouvrir dans Google Maps",
    hoursTitle: "Horaires d'ouverture",
    hoursNote: "Uniquement sur rendez-vous.",
    hours: [
      { day: "Lundi – Samedi", time: "09h00 – 13h00 · 15h00 – 20h00" },
      { day: "Dimanche", time: "Fermé" },
    ],
    areaTitle: "Coupe à domicile à Olbia et en Costa Smeralda",
    area: "Vous ne pouvez pas venir au salon ? Nous venons à vous. Nous proposons la coupe à domicile dans tout Olbia et la Costa Smeralda — Porto Cervo, Golfo Aranci — y compris à bord de yachts et pour les cérémonies. Le même soin qu'au salon, chez vous ou là où vous préférez. Le service à domicile s'organise uniquement par téléphone : appelez-nous et nous fixons ensemble lieu, horaire et détails.",
    homeCta: "Appelez pour le domicile",
    marquee: ["Coiffeur homme", "Olbia", "Coupe & Barbe", "Sur rendez-vous", "Depuis 2017", "Centre-ville"],
    reviewsTitle: "Ce que disent les clients",
    reviews: [
      { name: "Antonio Maricosu", text: "Des barbiers sympathiques et une coupe de grande qualité, j'y retournerai sans hésiter ! Le meilleur du coin !" },
      { name: "Giuseppe Depperu", text: "Extrêmement professionnels et compétents. Deux jeunes avec une vraie passion pour leur métier." },
      { name: "Nicolò Masala", text: "Excellente coupe, barbier très gentil et disponible." },
    ],
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Quelle différence entre un coiffeur et un barbier ?", a: "Le barbier est spécialisé dans la coupe masculine et la barbe ; le coiffeur travaille traditionnellement aussi la coiffure et la couleur. Hair Rich allie le soin du coiffeur à la spécialisation du barbier sur l'homme : coupe, barbe et le combo coupe + barbe." },
      { q: "Combien coûte une coupe chez Hair Rich à Olbia ?", a: "La coupe coûte 20€, la taille de barbe 10€, le combo coupe + barbe 30€. Tarifs transparents, sans supplément le week-end, lavage et coiffage inclus." },
      { q: "Faut-il réserver ?", a: "Oui, nous travaillons uniquement sur rendez-vous pour vous garantir tout le temps nécessaire. Réservez en ligne sur le site ou appelez le 0789 1891049." },
      { q: "Faites-vous la couleur ou la coiffure femme ?", a: "Nous sommes spécialisés sur l'homme : coupe, barbe et combo. Pour un styling unisexe avancé, uniquement sur rendez-vous dédié." },
      { q: "Où se trouve le salon ?", a: "Via Regina Elena 33/A, au centre d'Olbia, à deux pas du Corso Umberto. Ouvert du lundi au samedi, 09h00–13h00 et 15h00–20h00." },
    ],
    ctaTitle: "Réservez votre coupe à Olbia",
    ctaText: "Choisissez service, barbier et horaire en moins d'une minute. Confirmation immédiate, sans attente au téléphone.",
    ctaButton: "Réserver",
    callLabel: "Ou appelez-nous",
    contactTitle: "Venez nous voir",
  },

  de: {
    metaTitle: "Herrenfriseur & Barbier in Olbia | Hair Rich — Schnitt, Bart & Combo",
    metaDescription:
      "Herrenfriseur oder Barbier in Olbia, Sardinien? Hair Rich, Via Regina Elena 33/A: Haarschnitt 20€, Bart 10€, Schnitt + Bart 30€. Auf Termin, Mo–Sa 9–20 geöffnet.",
    breadcrumbHome: "Startseite",
    breadcrumbLabel: "Friseur Olbia",
    eyebrow: "Herrenfriseur · Olbia",
    h1: "Herrenfriseur & Barbier in Olbia",
    heroKicker: "Barber Studio im Zentrum von Olbia · seit 2017",
    intro: [
      "Suchst du einen Herrenfriseur in Olbia, der Haare behandelt wie ein Schneider den Stoff? Hair Rich ist ein Barber Studio im Zentrum von Olbia, in der Via Regina Elena 33/A, spezialisiert auf Herrenschnitt und Bart.",
      "Wir arbeiten nur auf Termin, ein Kunde nach dem anderen, ohne Hektik. Jeder Schnitt beginnt mit einer Beratung — Gesichtsform, Lebensstil, wie viel Zeit du für die Haare hast — und daraus bauen wir einen Look, der auch nach einer Woche noch sitzt.",
    ],
    trust: ["Seit 2017", "★ 4,6 · 37 Google-Bewertungen", "Nur auf Termin", "Zentrum Olbia"],
    servicesTitle: "Unsere Leistungen",
    servicesIntro:
      "Drei wesentliche Leistungen, gut gemacht. Klare Preise, kein Wochenendzuschlag, Waschen und Styling immer inklusive.",
    services: [
      {
        name: "Haarschnitt",
        duration: "30 Min.",
        price: "20€",
        desc: "Schere oder Maschine, Verläufe und Konturen millimetergenau. Waschen und Styling inklusive.",
      },
      {
        name: "Bartschnitt",
        duration: "30 Min.",
        price: "10€",
        desc: "Formen und Finish des Barts mit heißem Tuch, klassischem Rasiermesser und pflegendem Öl.",
      },
      {
        name: "Haarschnitt + Bart",
        duration: "60 Min.",
        price: "30€",
        desc: "Haare und Bart in einem durchgehenden, einstündigen Termin. Der komplette Hair-Rich-Service.",
      },
    ],
    whyTitle: "Warum Hair Rich in Olbia",
    why: [
      { title: "Spezialisiert auf Männer", body: "Wir sind kein allgemeiner Salon: Wir schneiden den ganzen Tag, jeden Tag, Männerhaare und Bärte. Die Spezialisierung zeigt sich im Ergebnis." },
      { title: "Auf Termin, ohne Warten", body: "Buche online in einer Minute oder telefonisch. Großzügige Slots, nie überschnitten: Du sitzt sofort im Stuhl." },
      { title: "Premium-Technik & -Werkzeug", body: "Professionelle Scheren und Rasiermesser, ausgewählte Produkte. Haare und Bart verlaufend und passend zur Gesichtsform finisht." },
      { title: "Im Herzen von Olbia", body: "Via Regina Elena 33/A, wenige Schritte vom Corso Umberto, mit Parkplätzen in der Nähe." },
    ],
    locationTitle: "So findest du uns in Olbia",
    location: [
      "Unser Salon ist in der Via Regina Elena 33/A, 07026 Olbia (SS), im Stadtzentrum. Vom Corso Umberto sind es fünf Minuten zu Fuß; mit dem Auto findest du Parkplätze in den umliegenden Straßen; vom Flughafen Olbia Costa Smeralda bist du in etwa zehn Minuten bei uns.",
    ],
    directionsLabel: "In Google Maps öffnen",
    hoursTitle: "Öffnungszeiten",
    hoursNote: "Nur auf Termin.",
    hours: [
      { day: "Montag – Samstag", time: "09:00 – 13:00 · 15:00 – 20:00" },
      { day: "Sonntag", time: "Geschlossen" },
    ],
    areaTitle: "Haarschnitt zu Hause in Olbia und an der Costa Smeralda",
    area: "Du kannst nicht in den Salon kommen? Wir kommen zu dir. Wir bieten den Haarschnitt zu Hause in ganz Olbia und an der Costa Smeralda — Porto Cervo, Golfo Aranci — auch an Bord von Yachten und für Feiern. Dieselbe Sorgfalt wie im Salon, bei dir zu Hause oder wo es dir passt. Der Hausservice wird ausschließlich telefonisch vereinbart: Ruf uns an und wir klären gemeinsam Ort, Zeit und Details.",
    homeCta: "Anrufen für Hausbesuch",
    marquee: ["Herrenfriseur", "Olbia", "Schnitt & Bart", "Auf Termin", "Seit 2017", "Stadtzentrum"],
    reviewsTitle: "Das sagen unsere Kunden",
    reviews: [
      { name: "Antonio Maricosu", text: "Sympathische Barbiere und ein hochwertiger Schnitt, ich komme auf jeden Fall wieder! Der Beste in der Gegend!" },
      { name: "Giuseppe Depperu", text: "Äußerst professionell und kompetent. Zwei junge Männer mit echter Leidenschaft für ihren Beruf." },
      { name: "Nicolò Masala", text: "Ausgezeichneter Schnitt, sehr freundlicher und hilfsbereiter Barbier." },
    ],
    faqTitle: "Häufige Fragen",
    faq: [
      { q: "Was ist der Unterschied zwischen Friseur und Barbier?", a: "Der Barbier ist auf Herrenschnitt und Bart spezialisiert; der Friseur macht traditionell auch Styling und Farbe. Hair Rich verbindet die Sorgfalt des Friseurs mit der Spezialisierung des Barbiers auf Männer: Haarschnitt, Bart und das Combo Schnitt + Bart." },
      { q: "Was kostet ein Haarschnitt bei Hair Rich in Olbia?", a: "Der Haarschnitt kostet 20€, der Bartschnitt 10€, das Combo Schnitt + Bart 30€. Transparente Preise, kein Wochenendzuschlag, Waschen und Styling inklusive." },
      { q: "Muss ich einen Termin buchen?", a: "Ja, wir arbeiten nur auf Termin, damit wir uns die nötige Zeit nehmen können. Buche online auf der Website oder ruf 0789 1891049 an." },
      { q: "Macht ihr Farbe oder Damenfriseur?", a: "Wir sind auf Männer spezialisiert: Haarschnitt, Bart und Combo. Für fortgeschrittenes Unisex-Styling nur auf gesonderten Termin." },
      { q: "Wo ist der Salon?", a: "In der Via Regina Elena 33/A, im Zentrum von Olbia, wenige Schritte vom Corso Umberto. Montag bis Samstag geöffnet, 09:00–13:00 und 15:00–20:00." },
    ],
    ctaTitle: "Buche deinen Haarschnitt in Olbia",
    ctaText: "Wähle Service, Barbier und Uhrzeit in unter einer Minute. Sofortige Bestätigung, kein Warten am Telefon.",
    ctaButton: "Jetzt buchen",
    callLabel: "Oder ruf uns an",
    contactTitle: "Komm vorbei",
  },
};
