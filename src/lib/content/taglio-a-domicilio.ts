/**
 * Contenuto della landing SEO "Barbiere a domicilio in Costa Smeralda".
 *
 * Pagina pillar dedicata ESCLUSIVAMENTE al servizio a domicilio (yacht, ville,
 * cerimonie ed eventi in Costa Smeralda). Layout e copy distinti dalla home,
 * dai componenti landing React e dalla pillar /parrucchiere-olbia, per evitare
 * contenuto near-duplicate. Server-rendered (Astro puro), localizzato per lingua
 * → il testo corretto è nell'HTML statico di ogni versione (it/en/fr/de).
 *
 * Targetta il cluster "barbiere a domicilio Olbia / Costa Smeralda / Porto Cervo,
 * taglio a domicilio yacht, taglio in villa per cerimonia/evento".
 *
 * NB: il servizio si prenota SOLO per telefono (no booking online): la copy lo
 * ribadisce e l'unica CTA è il numero del salone.
 */

import type { Locale } from "@/i18n";

export interface TdStep {
  title: string;
  body: string;
}
export interface TdTrust {
  title: string;
  body: string;
}
export interface TdFaq {
  q: string;
  a: string;
}
export interface TdAlts {
  hero: string;
  intro: string;
  step1: string;
  step2: string;
  step3: string;
  gallery1: string;
  gallery2: string;
  gallery3: string;
  gallery4: string;
  social: string;
}
export interface TdLinks {
  salone: string;
  listino: string;
  lavori: string;
  contatti: string;
}

export interface TdContent {
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbLabel: string;

  eyebrow: string;
  h1: string;
  heroKicker: string;
  heroCta: string;
  heroPhoneNote: string;

  introEyebrow: string;
  introTitle: string;
  introBody: string[];

  locationsEyebrow: string;
  locationsTitle: string;
  locationsIntro: string;
  locations: string[];
  locationsNote: string;

  stepsEyebrow: string;
  stepsTitle: string;
  steps: TdStep[];

  galleryEyebrow: string;
  galleryTitle: string;
  galleryIntro: string;
  galleryLavoriLabel: string;

  socialQuote: string;
  socialAttribution: string;

  trustEyebrow: string;
  trustTitle: string;
  trust: TdTrust[];
  trustPillarLabel: string;

  phoneEyebrow: string;
  phoneTitle: string;
  phoneBody: string;
  phoneContattiLabel: string;

  faqEyebrow: string;
  faqTitle: string;
  faq: TdFaq[];

  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;

  alts: TdAlts;
  links: TdLinks;
  marquee: string[];
}

export const TAGLIO_DOMICILIO: Record<Locale, TdContent> = {
  it: {
    metaTitle: "Barbiere a domicilio Costa Smeralda | Hair Rich",
    metaDescription:
      "Barbiere a domicilio in Costa Smeralda: taglio e barba su yacht, in villa e per eventi. Porto Cervo, Olbia, Arzachena. Solo su prenotazione telefonica.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Barbiere a domicilio",

    eyebrow: "Barbiere a domicilio · Costa Smeralda",
    h1: "Barbiere a domicilio in Costa Smeralda",
    heroKicker:
      "Taglio e barba su yacht, in villa e per eventi — Porto Cervo, Olbia e tutta la Costa Smeralda",
    heroCta: "Chiama per prenotare",
    heroPhoneNote: "Servizio solo su prenotazione telefonica",

    introEyebrow: "Il servizio",
    introTitle: "Il barbiere viene da te, ovunque tu sia",
    introBody: [
      "Hair Rich porta il salone fuori dal salone. Veniamo noi da te — nella tua villa, a bordo del tuo yacht, in hotel o sul posto di un evento — con gli stessi strumenti e la stessa cura del nostro barber studio a Olbia.",
      "È il servizio pensato per chi vive la Costa Smeralda senza tempo da perdere: ti prepari per una cena a Porto Cervo, una cerimonia in villa o una giornata in mare e il taglio è pronto quando lo sei tu. Niente sale d'attesa, niente spostamenti — solo taglio capelli e barba di livello, dove ti trovi.",
    ],

    locationsEyebrow: "01 — Zone",
    locationsTitle: "Dove arriviamo",
    locationsIntro:
      "Operiamo a Olbia e in tutta la Costa Smeralda. Raggiungiamo ville, residence, hotel e yacht ormeggiati nei principali porti della costa.",
    locations: [
      "Porto Cervo",
      "Porto Rotondo",
      "Olbia",
      "Golfo Aranci",
      "Arzachena",
      "Cannigione",
      "San Teodoro",
      "Costa Smeralda",
    ],
    locationsNote: "La tua località non è in elenco? Chiamaci: valutiamo ogni spostamento lungo la costa.",

    stepsEyebrow: "02 — Come funziona",
    stepsTitle: "Tre passi, zero pensieri",
    steps: [
      {
        title: "Chiama e prenota",
        body: "Chiami lo 0789 1891049 e concordiamo insieme luogo, data, orario e numero di persone. Nessuna app, nessuna attesa: parli direttamente con noi.",
      },
      {
        title: "Veniamo da te",
        body: "Raggiungiamo la tua villa, il tuo yacht o la location dell'evento in tutta la Costa Smeralda, con tutta l'attrezzatura professionale del salone. Puntualità e discrezione garantite.",
      },
      {
        title: "Taglio premium sul posto",
        body: "Taglio e barba con la stessa cura del salone, mentre ti rilassi a casa tua o in mare. Ti rialzi pronto per la serata, l'evento o lo shooting.",
      },
    ],

    galleryEyebrow: "03 — In villa",
    galleryTitle: "Una sessione a Porto Cervo",
    galleryIntro:
      "Scatti reali di un servizio a domicilio in villa: postazione allestita sotto la pergola, taglio in corso e risultato finale, al tramonto sulla Costa Smeralda.",
    galleryLavoriLabel: "Guarda altri nostri lavori",

    socialQuote:
      "Una clientela internazionale e nomi noti della Costa Smeralda ci scelgono per una ragione semplice: lo stesso taglio del salone, portato dove serve, con discrezione assoluta.",
    socialAttribution: "Hair Rich · servizio a domicilio in villa, Porto Cervo",

    trustEyebrow: "04 — Qualità",
    trustTitle: "La stessa qualità del salone, a casa tua",
    trust: [
      {
        title: "Strumenti professionali",
        body: "Forbici, rasoi e macchinette del salone, sempre igienizzati. Niente kit improvvisati.",
      },
      {
        title: "Discrezione e puntualità",
        body: "Arriviamo all'orario concordato e lavoriamo con riservatezza, anche per ospiti ed eventi privati.",
      },
      {
        title: "Taglio e barba",
        body: "Lo stesso servizio del nostro barber studio a Olbia: taglio capelli, barba o il completo taglio + barba.",
      },
      {
        title: "Portiamo tutto noi",
        body: "Postazione, strumenti e prodotti li portiamo noi. A te basta uno spazio e una presa di corrente nelle vicinanze.",
      },
    ],
    trustPillarLabel: "Scopri il nostro salone, barbiere uomo a Olbia",

    phoneEyebrow: "05 — Prenotazione",
    phoneTitle: "Perché solo su prenotazione telefonica",
    phoneBody:
      "Il servizio a domicilio non si prenota online: ogni uscita va organizzata su misura — località, numero di persone, orario, accesso alla villa o allo yacht. Per questo preferiamo definirlo al telefono e sistemare ogni dettaglio insieme.",
    phoneContattiLabel: "Scrivici o trova la mappa nei contatti",

    faqEyebrow: "06 — FAQ",
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Fate il barbiere a domicilio in Costa Smeralda?",
        a: "Sì. Hair Rich offre il servizio di barbiere a domicilio in tutta la Costa Smeralda — Porto Cervo, Porto Rotondo, Golfo Aranci, Olbia, Cannigione, Arzachena e San Teodoro — con taglio capelli e barba eseguiti dove ti trovi: in villa, a bordo di uno yacht o durante un evento.",
      },
      {
        q: "Come si prenota il taglio a domicilio?",
        a: "Il servizio a domicilio si prenota esclusivamente tramite chiamata telefonica anticipata al numero 0789 1891049. Non è disponibile la prenotazione online per questo servizio, perché concordiamo di persona luogo, orario e numero di persone.",
      },
      {
        q: "Venite a tagliare i capelli a bordo di uno yacht?",
        a: "Sì. Raggiungiamo yacht ormeggiati a Porto Cervo, Porto Rotondo e nei principali porti della Costa Smeralda, portando a bordo gli stessi strumenti professionali del salone per taglio e barba.",
      },
      {
        q: "Il servizio a domicilio ha la stessa qualità del salone?",
        a: "Sì. Usiamo le stesse forbici, gli stessi rasoi e gli stessi prodotti professionali del salone di Olbia. Cambia solo il luogo: la cura, la tecnica e il risultato sono identici.",
      },
      {
        q: "Fate il taglio a domicilio per cerimonie ed eventi?",
        a: "Sì. Curiamo lo sposo e gli invitati per matrimoni, eventi privati e cerimonie in villa, organizzando l'orario in base al programma della giornata.",
      },
      {
        q: "In quali zone arrivate per il taglio a domicilio?",
        a: "Operiamo a Olbia e in tutta la Costa Smeralda: Porto Cervo, Porto Rotondo, Golfo Aranci, Cannigione, Arzachena e San Teodoro. Per località fuori zona, chiamaci e verifichiamo la disponibilità.",
      },
      {
        q: "Quanto costa il barbiere a domicilio?",
        a: "Il prezzo del servizio a domicilio si definisce al telefono in base alla località, al numero di persone e all'orario richiesto. Chiama lo 0789 1891049 per un preventivo immediato.",
      },
      {
        q: "Con quanto anticipo bisogna prenotare?",
        a: "Consigliamo di chiamare con il maggior anticipo possibile, soprattutto in alta stagione sulla Costa Smeralda, così da bloccare lo slot e organizzare lo spostamento.",
      },
    ],

    ctaTitle: "Prenota il barbiere a domicilio",
    ctaBody:
      "Una chiamata e organizziamo tutto: taglio e barba dove vuoi, in tutta la Costa Smeralda.",
    ctaButton: "Chiama ora",

    alts: {
      hero: "Barbiere a domicilio in villa a Porto Cervo, Costa Smeralda — postazione sotto la pergola al tramonto",
      intro: "Barbiere Hair Rich esegue un taglio a domicilio a un cliente con mantellina, in villa a Porto Cervo",
      step1: "Arrivo del barbiere a domicilio in villa sulla Costa Smeralda con l'attrezzatura del salone",
      step2: "Postazione barber allestita a domicilio: sedia e specchio, taglio in corso in villa",
      step3: "Risultato del taglio a domicilio al tramonto, taglio maschile mosso in Costa Smeralda",
      gallery1: "Postazione del barbiere a domicilio con strumenti professionali, villa a Porto Cervo",
      gallery2: "Cliente con mantellina durante il taglio a domicilio in villa, Costa Smeralda",
      gallery3: "Nuca con taglio maschile finito, servizio a domicilio in giardino al tramonto",
      gallery4: "Taglio capelli a domicilio in corso, barbiere al lavoro in Costa Smeralda",
      social: "Barbiere a domicilio in villa a Porto Cervo al tramonto, Costa Smeralda",
    },
    links: {
      salone: "barbiere uomo a Olbia",
      listino: "taglio, barba e combo in salone",
      lavori: "archivio dei nostri tagli",
      contatti: "contatti e mappa",
    },
    marquee: [
      "Su yacht",
      "In villa",
      "Cerimonie & eventi",
      "Porto Cervo",
      "Costa Smeralda",
      "Su prenotazione",
    ],
  },

  en: {
    metaTitle: "Mobile Barber Costa Smeralda | Hair Rich Olbia",
    metaDescription:
      "Mobile barber across the Costa Smeralda: haircut & beard on your yacht, villa or event. Porto Cervo, Olbia, Arzachena. By phone booking only.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Mobile barber",

    eyebrow: "Mobile barber · Costa Smeralda",
    h1: "Mobile barber in the Costa Smeralda",
    heroKicker:
      "Haircut & beard on your yacht, in your villa and for events — Porto Cervo, Olbia and the whole Costa Smeralda",
    heroCta: "Call to book",
    heroPhoneNote: "Service by phone booking only",

    introEyebrow: "The service",
    introTitle: "The barber comes to you, wherever you are",
    introBody: [
      "Hair Rich takes the salon out of the salon. We come to you — to your villa, aboard your yacht, to your hotel or to an event — with the same tools and the same care as our barber studio in Olbia.",
      "It's the service for those who live the Costa Smeralda with no time to waste: you're getting ready for dinner in Porto Cervo, a villa ceremony or a day at sea, and the cut is ready when you are. No waiting rooms, no travel — just a top-level haircut and beard, right where you are.",
    ],

    locationsEyebrow: "01 — Areas",
    locationsTitle: "Where we come",
    locationsIntro:
      "We operate in Olbia and across the whole Costa Smeralda. We reach villas, residences, hotels and yachts moored in the coast's main harbours.",
    locations: [
      "Porto Cervo",
      "Porto Rotondo",
      "Olbia",
      "Golfo Aranci",
      "Arzachena",
      "Cannigione",
      "San Teodoro",
      "Costa Smeralda",
    ],
    locationsNote: "Your location isn't listed? Call us — we consider every trip along the coast.",

    stepsEyebrow: "02 — How it works",
    stepsTitle: "Three steps, zero hassle",
    steps: [
      {
        title: "Call and book",
        body: "Call 0789 1891049 and we'll agree on place, date, time and number of people. No app, no waiting: you talk directly with us.",
      },
      {
        title: "We come to you",
        body: "We reach your villa, your yacht or the event location across the Costa Smeralda, with all the salon's professional equipment. Punctuality and discretion guaranteed.",
      },
      {
        title: "Premium cut on location",
        body: "Haircut and beard with the same care as the salon, while you relax at home or at sea. You get up ready for the evening, the event or the shoot.",
      },
    ],

    galleryEyebrow: "03 — At the villa",
    galleryTitle: "A session in Porto Cervo",
    galleryIntro:
      "Real shots of a home service at a villa: station set up under the pergola, the cut in progress and the final result, at sunset over the Costa Smeralda.",
    galleryLavoriLabel: "See more of our work",

    socialQuote:
      "An international clientele and well-known names on the Costa Smeralda choose us for one simple reason: the same cut as the salon, brought to where it's needed, with absolute discretion.",
    socialAttribution: "Hair Rich · home service at a villa, Porto Cervo",

    trustEyebrow: "04 — Quality",
    trustTitle: "The same salon quality, at your place",
    trust: [
      {
        title: "Professional tools",
        body: "The salon's scissors, razors and clippers, always sanitised. No improvised kits.",
      },
      {
        title: "Discretion and punctuality",
        body: "We arrive at the agreed time and work discreetly, including for guests and private events.",
      },
      {
        title: "Haircut and beard",
        body: "The same service as our barber studio in Olbia: haircut, beard or the full cut + beard.",
      },
      {
        title: "We bring everything",
        body: "We bring the station, tools and products. All you need is some space and a power outlet nearby.",
      },
    ],
    trustPillarLabel: "Discover our salon, men's barber in Olbia",

    phoneEyebrow: "05 — Booking",
    phoneTitle: "Why phone booking only",
    phoneBody:
      "The home service can't be booked online: every visit is arranged to measure — location, number of people, time, access to the villa or yacht. That's why we prefer to settle it by phone and sort out every detail together.",
    phoneContattiLabel: "Write to us or find the map in contacts",

    faqEyebrow: "06 — FAQ",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Do you do mobile barber service in the Costa Smeralda?",
        a: "Yes. Hair Rich offers a mobile barber service across the whole Costa Smeralda — Porto Cervo, Porto Rotondo, Golfo Aranci, Olbia, Cannigione, Arzachena and San Teodoro — with haircut and beard done where you are: at a villa, aboard a yacht or during an event.",
      },
      {
        q: "How do I book the home haircut?",
        a: "The home service is booked exclusively by advance phone call to 0789 1891049. Online booking isn't available for this service, because we agree on location, time and number of people in person.",
      },
      {
        q: "Do you come to cut hair aboard a yacht?",
        a: "Yes. We reach yachts moored in Porto Cervo, Porto Rotondo and the main harbours of the Costa Smeralda, bringing aboard the same professional tools as the salon for haircut and beard.",
      },
      {
        q: "Does the home service have the same quality as the salon?",
        a: "Yes. We use the same scissors, razors and professional products as the salon in Olbia. Only the place changes: the care, the technique and the result are identical.",
      },
      {
        q: "Do you do home haircuts for ceremonies and events?",
        a: "Yes. We take care of the groom and the guests for weddings, private events and villa ceremonies, arranging the timing around the day's schedule.",
      },
      {
        q: "Which areas do you reach for the home haircut?",
        a: "We operate in Olbia and across the whole Costa Smeralda: Porto Cervo, Porto Rotondo, Golfo Aranci, Cannigione, Arzachena and San Teodoro. For locations outside the area, call us and we'll check availability.",
      },
      {
        q: "How much does the mobile barber cost?",
        a: "The price of the home service is set by phone based on location, number of people and the requested time. Call 0789 1891049 for an instant quote.",
      },
      {
        q: "How far in advance should I book?",
        a: "We recommend calling as far ahead as possible, especially in high season on the Costa Smeralda, so we can lock the slot and organise the trip.",
      },
    ],

    ctaTitle: "Book the mobile barber",
    ctaBody:
      "One call and we organise everything: haircut and beard wherever you want, across the whole Costa Smeralda.",
    ctaButton: "Call now",

    alts: {
      hero: "Mobile barber at a villa in Porto Cervo, Costa Smeralda — station under the pergola at sunset",
      intro: "Hair Rich barber giving a home haircut to a client in a cape, at a villa in Porto Cervo",
      step1: "Mobile barber arriving at a villa on the Costa Smeralda with the salon's equipment",
      step2: "Mobile barber station set up: chair and mirror, cut in progress at a villa",
      step3: "Result of the home haircut at sunset, textured men's cut on the Costa Smeralda",
      gallery1: "Mobile barber station with professional tools, villa in Porto Cervo",
      gallery2: "Client in a cape during the home haircut at a villa, Costa Smeralda",
      gallery3: "Back of a finished men's cut, home service in a garden at sunset",
      gallery4: "Home haircut in progress, barber at work on the Costa Smeralda",
      social: "Mobile barber at a villa in Porto Cervo at sunset, Costa Smeralda",
    },
    links: {
      salone: "men's barber in Olbia",
      listino: "haircut, beard and combo at the salon",
      lavori: "archive of our cuts",
      contatti: "contacts and map",
    },
    marquee: [
      "On yachts",
      "At villas",
      "Ceremonies & events",
      "Porto Cervo",
      "Costa Smeralda",
      "By appointment",
    ],
  },

  fr: {
    metaTitle: "Barbier à domicile Costa Smeralda | Hair Rich",
    metaDescription:
      "Barbier à domicile en Costa Smeralda : coupe et barbe sur yacht, en villa, pour événements. Porto Cervo, Olbia. Réservation par téléphone uniquement.",
    breadcrumbHome: "Accueil",
    breadcrumbLabel: "Barbier à domicile",

    eyebrow: "Barbier à domicile · Costa Smeralda",
    h1: "Barbier à domicile en Costa Smeralda",
    heroKicker:
      "Coupe et barbe sur yacht, en villa et pour événements — Porto Cervo, Olbia et toute la Costa Smeralda",
    heroCta: "Appelez pour réserver",
    heroPhoneNote: "Service uniquement sur réservation téléphonique",

    introEyebrow: "Le service",
    introTitle: "Le barbier vient à vous, où que vous soyez",
    introBody: [
      "Hair Rich sort le salon du salon. Nous venons à vous — dans votre villa, à bord de votre yacht, à l'hôtel ou sur le lieu d'un événement — avec les mêmes outils et le même soin que notre barber studio à Olbia.",
      "C'est le service pensé pour ceux qui vivent la Costa Smeralda sans temps à perdre : vous vous préparez pour un dîner à Porto Cervo, une cérémonie en villa ou une journée en mer, et la coupe est prête quand vous l'êtes. Pas de salle d'attente, pas de déplacement — juste une coupe et une barbe de haut niveau, là où vous êtes.",
    ],

    locationsEyebrow: "01 — Zones",
    locationsTitle: "Où nous venons",
    locationsIntro:
      "Nous opérons à Olbia et dans toute la Costa Smeralda. Nous rejoignons villas, résidences, hôtels et yachts amarrés dans les principaux ports de la côte.",
    locations: [
      "Porto Cervo",
      "Porto Rotondo",
      "Olbia",
      "Golfo Aranci",
      "Arzachena",
      "Cannigione",
      "San Teodoro",
      "Costa Smeralda",
    ],
    locationsNote: "Votre localité n'est pas dans la liste ? Appelez-nous : nous étudions chaque déplacement le long de la côte.",

    stepsEyebrow: "02 — Comment ça marche",
    stepsTitle: "Trois étapes, zéro souci",
    steps: [
      {
        title: "Appelez et réservez",
        body: "Vous appelez le 0789 1891049 et nous convenons ensemble du lieu, de la date, de l'heure et du nombre de personnes. Pas d'appli, pas d'attente : vous parlez directement avec nous.",
      },
      {
        title: "Nous venons à vous",
        body: "Nous rejoignons votre villa, votre yacht ou le lieu de l'événement dans toute la Costa Smeralda, avec tout l'équipement professionnel du salon. Ponctualité et discrétion garanties.",
      },
      {
        title: "Coupe premium sur place",
        body: "Coupe et barbe avec le même soin qu'au salon, pendant que vous vous détendez chez vous ou en mer. Vous vous relevez prêt pour la soirée, l'événement ou le shooting.",
      },
    ],

    galleryEyebrow: "03 — En villa",
    galleryTitle: "Une séance à Porto Cervo",
    galleryIntro:
      "Photos réelles d'un service à domicile en villa : poste installé sous la pergola, coupe en cours et résultat final, au coucher du soleil sur la Costa Smeralda.",
    galleryLavoriLabel: "Voir d'autres réalisations",

    socialQuote:
      "Une clientèle internationale et des noms connus de la Costa Smeralda nous choisissent pour une raison simple : la même coupe qu'au salon, apportée là où il le faut, en toute discrétion.",
    socialAttribution: "Hair Rich · service à domicile en villa, Porto Cervo",

    trustEyebrow: "04 — Qualité",
    trustTitle: "La même qualité qu'au salon, chez vous",
    trust: [
      {
        title: "Outils professionnels",
        body: "Les ciseaux, rasoirs et tondeuses du salon, toujours désinfectés. Pas de kit improvisé.",
      },
      {
        title: "Discrétion et ponctualité",
        body: "Nous arrivons à l'heure convenue et travaillons avec discrétion, y compris pour les invités et les événements privés.",
      },
      {
        title: "Coupe et barbe",
        body: "Le même service que notre barber studio à Olbia : coupe, barbe ou le complet coupe + barbe.",
      },
      {
        title: "Nous apportons tout",
        body: "Poste, outils et produits, c'est nous qui apportons tout. Il vous suffit d'un espace et d'une prise de courant à proximité.",
      },
    ],
    trustPillarLabel: "Découvrez notre salon, barbier homme à Olbia",

    phoneEyebrow: "05 — Réservation",
    phoneTitle: "Pourquoi uniquement par téléphone",
    phoneBody:
      "Le service à domicile ne se réserve pas en ligne : chaque sortie s'organise sur mesure — lieu, nombre de personnes, horaire, accès à la villa ou au yacht. C'est pourquoi nous préférons le définir par téléphone et régler chaque détail ensemble.",
    phoneContattiLabel: "Écrivez-nous ou trouvez la carte dans les contacts",

    faqEyebrow: "06 — FAQ",
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Faites-vous le barbier à domicile en Costa Smeralda ?",
        a: "Oui. Hair Rich propose un service de barbier à domicile dans toute la Costa Smeralda — Porto Cervo, Porto Rotondo, Golfo Aranci, Olbia, Cannigione, Arzachena et San Teodoro — avec coupe et barbe réalisées là où vous êtes : en villa, à bord d'un yacht ou pendant un événement.",
      },
      {
        q: "Comment réserver la coupe à domicile ?",
        a: "Le service à domicile se réserve exclusivement par appel téléphonique anticipé au 0789 1891049. La réservation en ligne n'est pas disponible pour ce service, car nous convenons en personne du lieu, de l'horaire et du nombre de personnes.",
      },
      {
        q: "Venez-vous couper les cheveux à bord d'un yacht ?",
        a: "Oui. Nous rejoignons les yachts amarrés à Porto Cervo, Porto Rotondo et dans les principaux ports de la Costa Smeralda, en apportant à bord les mêmes outils professionnels que le salon pour la coupe et la barbe.",
      },
      {
        q: "Le service à domicile a-t-il la même qualité qu'au salon ?",
        a: "Oui. Nous utilisons les mêmes ciseaux, rasoirs et produits professionnels que le salon d'Olbia. Seul le lieu change : le soin, la technique et le résultat sont identiques.",
      },
      {
        q: "Faites-vous la coupe à domicile pour cérémonies et événements ?",
        a: "Oui. Nous nous occupons du marié et des invités pour mariages, événements privés et cérémonies en villa, en organisant l'horaire selon le programme de la journée.",
      },
      {
        q: "Dans quelles zones venez-vous pour la coupe à domicile ?",
        a: "Nous opérons à Olbia et dans toute la Costa Smeralda : Porto Cervo, Porto Rotondo, Golfo Aranci, Cannigione, Arzachena et San Teodoro. Pour les localités hors zone, appelez-nous et nous vérifions la disponibilité.",
      },
      {
        q: "Combien coûte le barbier à domicile ?",
        a: "Le prix du service à domicile se définit par téléphone selon le lieu, le nombre de personnes et l'horaire demandé. Appelez le 0789 1891049 pour un devis immédiat.",
      },
      {
        q: "Combien de temps à l'avance faut-il réserver ?",
        a: "Nous conseillons d'appeler le plus tôt possible, surtout en haute saison sur la Costa Smeralda, afin de bloquer le créneau et d'organiser le déplacement.",
      },
    ],

    ctaTitle: "Réservez le barbier à domicile",
    ctaBody:
      "Un appel et nous organisons tout : coupe et barbe où vous voulez, dans toute la Costa Smeralda.",
    ctaButton: "Appelez maintenant",

    alts: {
      hero: "Barbier à domicile dans une villa à Porto Cervo, Costa Smeralda — poste sous la pergola au coucher du soleil",
      intro: "Barbier Hair Rich réalisant une coupe à domicile à un client en cape, dans une villa à Porto Cervo",
      step1: "Arrivée du barbier à domicile dans une villa de la Costa Smeralda avec l'équipement du salon",
      step2: "Poste de barbier installé à domicile : chaise et miroir, coupe en cours en villa",
      step3: "Résultat de la coupe à domicile au coucher du soleil, coupe homme texturée en Costa Smeralda",
      gallery1: "Poste du barbier à domicile avec outils professionnels, villa à Porto Cervo",
      gallery2: "Client en cape pendant la coupe à domicile en villa, Costa Smeralda",
      gallery3: "Nuque avec coupe homme terminée, service à domicile dans un jardin au coucher du soleil",
      gallery4: "Coupe à domicile en cours, barbier au travail en Costa Smeralda",
      social: "Barbier à domicile dans une villa à Porto Cervo au coucher du soleil, Costa Smeralda",
    },
    links: {
      salone: "barbier homme à Olbia",
      listino: "coupe, barbe et combo au salon",
      lavori: "archives de nos coupes",
      contatti: "contacts et carte",
    },
    marquee: [
      "Sur yacht",
      "En villa",
      "Cérémonies & événements",
      "Porto Cervo",
      "Costa Smeralda",
      "Sur rendez-vous",
    ],
  },

  de: {
    metaTitle: "Mobiler Barbier Costa Smeralda | Hair Rich",
    metaDescription:
      "Mobiler Barbier an der Costa Smeralda: Schnitt & Bart auf Yacht, Villa, Event. Porto Cervo, Olbia. Nur telefonische Buchung.",
    breadcrumbHome: "Startseite",
    breadcrumbLabel: "Mobiler Barbier",

    eyebrow: "Mobiler Barbier · Costa Smeralda",
    h1: "Mobiler Barbier an der Costa Smeralda",
    heroKicker:
      "Schnitt & Bart auf der Yacht, in der Villa und für Events — Porto Cervo, Olbia und die ganze Costa Smeralda",
    heroCta: "Anrufen und buchen",
    heroPhoneNote: "Service nur auf telefonische Buchung",

    introEyebrow: "Der Service",
    introTitle: "Der Barbier kommt zu dir, wo immer du bist",
    introBody: [
      "Hair Rich holt den Salon aus dem Salon. Wir kommen zu dir — in deine Villa, an Bord deiner Yacht, ins Hotel oder zum Event — mit demselben Werkzeug und derselben Sorgfalt wie in unserem Barber Studio in Olbia.",
      "Es ist der Service für alle, die die Costa Smeralda ohne Zeitverlust leben: Du machst dich bereit für ein Dinner in Porto Cervo, eine Feier in der Villa oder einen Tag auf See, und der Schnitt ist fertig, wenn du es bist. Keine Wartezimmer, keine Wege — nur ein erstklassiger Haarschnitt und Bart, genau dort, wo du bist.",
    ],

    locationsEyebrow: "01 — Gebiete",
    locationsTitle: "Wohin wir kommen",
    locationsIntro:
      "Wir arbeiten in Olbia und an der ganzen Costa Smeralda. Wir erreichen Villen, Residenzen, Hotels und in den wichtigsten Häfen der Küste vertäute Yachten.",
    locations: [
      "Porto Cervo",
      "Porto Rotondo",
      "Olbia",
      "Golfo Aranci",
      "Arzachena",
      "Cannigione",
      "San Teodoro",
      "Costa Smeralda",
    ],
    locationsNote: "Dein Ort ist nicht aufgeführt? Ruf uns an — wir prüfen jede Fahrt entlang der Küste.",

    stepsEyebrow: "02 — So funktioniert es",
    stepsTitle: "Drei Schritte, null Aufwand",
    steps: [
      {
        title: "Anrufen und buchen",
        body: "Du rufst 0789 1891049 an und wir vereinbaren gemeinsam Ort, Datum, Uhrzeit und Personenzahl. Keine App, kein Warten: Du sprichst direkt mit uns.",
      },
      {
        title: "Wir kommen zu dir",
        body: "Wir erreichen deine Villa, deine Yacht oder den Event-Ort an der ganzen Costa Smeralda, mit der gesamten professionellen Ausstattung des Salons. Pünktlichkeit und Diskretion garantiert.",
      },
      {
        title: "Premium-Schnitt vor Ort",
        body: "Schnitt und Bart mit derselben Sorgfalt wie im Salon, während du dich zu Hause oder auf See entspannst. Du stehst bereit auf für den Abend, das Event oder das Shooting.",
      },
    ],

    galleryEyebrow: "03 — In der Villa",
    galleryTitle: "Eine Session in Porto Cervo",
    galleryIntro:
      "Echte Aufnahmen eines Hausservices in einer Villa: Station unter der Pergola aufgebaut, Schnitt im Gange und Endergebnis, bei Sonnenuntergang über der Costa Smeralda.",
    galleryLavoriLabel: "Mehr unserer Arbeiten ansehen",

    socialQuote:
      "Eine internationale Klientel und bekannte Namen der Costa Smeralda wählen uns aus einem einfachen Grund: derselbe Schnitt wie im Salon, dorthin gebracht, wo er gebraucht wird, mit absoluter Diskretion.",
    socialAttribution: "Hair Rich · Hausservice in einer Villa, Porto Cervo",

    trustEyebrow: "04 — Qualität",
    trustTitle: "Dieselbe Salonqualität, bei dir zu Hause",
    trust: [
      {
        title: "Professionelles Werkzeug",
        body: "Scheren, Rasiermesser und Maschinen des Salons, stets desinfiziert. Keine improvisierten Kits.",
      },
      {
        title: "Diskretion und Pünktlichkeit",
        body: "Wir kommen zur vereinbarten Zeit und arbeiten diskret, auch für Gäste und private Events.",
      },
      {
        title: "Schnitt und Bart",
        body: "Derselbe Service wie in unserem Barber Studio in Olbia: Haarschnitt, Bart oder das komplette Schnitt + Bart.",
      },
      {
        title: "Wir bringen alles mit",
        body: "Station, Werkzeug und Produkte bringen wir mit. Du brauchst nur etwas Platz und eine Steckdose in der Nähe.",
      },
    ],
    trustPillarLabel: "Entdecke unseren Salon, Herrenbarbier in Olbia",

    phoneEyebrow: "05 — Buchung",
    phoneTitle: "Warum nur telefonische Buchung",
    phoneBody:
      "Der Hausservice lässt sich nicht online buchen: Jeder Einsatz wird maßgeschneidert organisiert — Ort, Personenzahl, Uhrzeit, Zugang zur Villa oder Yacht. Deshalb klären wir ihn lieber am Telefon und regeln jedes Detail gemeinsam.",
    phoneContattiLabel: "Schreib uns oder finde die Karte in den Kontakten",

    faqEyebrow: "06 — FAQ",
    faqTitle: "Häufige Fragen",
    faq: [
      {
        q: "Bietet ihr mobilen Barbier an der Costa Smeralda an?",
        a: "Ja. Hair Rich bietet einen mobilen Barbier-Service an der ganzen Costa Smeralda — Porto Cervo, Porto Rotondo, Golfo Aranci, Olbia, Cannigione, Arzachena und San Teodoro — mit Haarschnitt und Bart dort, wo du bist: in der Villa, an Bord einer Yacht oder während eines Events.",
      },
      {
        q: "Wie buche ich den Haarschnitt zu Hause?",
        a: "Der Hausservice wird ausschließlich per telefonischer Voranmeldung unter 0789 1891049 gebucht. Eine Online-Buchung ist für diesen Service nicht verfügbar, da wir Ort, Uhrzeit und Personenzahl persönlich vereinbaren.",
      },
      {
        q: "Kommt ihr zum Haareschneiden an Bord einer Yacht?",
        a: "Ja. Wir erreichen in Porto Cervo, Porto Rotondo und den wichtigsten Häfen der Costa Smeralda vertäute Yachten und bringen dasselbe professionelle Werkzeug wie im Salon für Schnitt und Bart an Bord.",
      },
      {
        q: "Hat der Hausservice dieselbe Qualität wie der Salon?",
        a: "Ja. Wir verwenden dieselben Scheren, Rasiermesser und professionellen Produkte wie der Salon in Olbia. Nur der Ort ändert sich: Sorgfalt, Technik und Ergebnis sind identisch.",
      },
      {
        q: "Macht ihr Haarschnitte zu Hause für Feiern und Events?",
        a: "Ja. Wir kümmern uns um den Bräutigam und die Gäste bei Hochzeiten, privaten Events und Villa-Feiern und organisieren die Zeit nach dem Tagesprogramm.",
      },
      {
        q: "In welche Gebiete kommt ihr für den Haarschnitt zu Hause?",
        a: "Wir arbeiten in Olbia und an der ganzen Costa Smeralda: Porto Cervo, Porto Rotondo, Golfo Aranci, Cannigione, Arzachena und San Teodoro. Für Orte außerhalb des Gebiets ruf uns an und wir prüfen die Verfügbarkeit.",
      },
      {
        q: "Was kostet der mobile Barbier?",
        a: "Der Preis des Hausservices wird telefonisch nach Ort, Personenzahl und gewünschter Uhrzeit festgelegt. Ruf 0789 1891049 an für ein sofortiges Angebot.",
      },
      {
        q: "Wie weit im Voraus sollte ich buchen?",
        a: "Wir empfehlen, so früh wie möglich anzurufen, besonders in der Hochsaison an der Costa Smeralda, damit wir den Slot sichern und die Fahrt organisieren können.",
      },
    ],

    ctaTitle: "Buche den mobilen Barbier",
    ctaBody:
      "Ein Anruf und wir organisieren alles: Schnitt und Bart, wo du willst, an der ganzen Costa Smeralda.",
    ctaButton: "Jetzt anrufen",

    alts: {
      hero: "Mobiler Barbier in einer Villa in Porto Cervo, Costa Smeralda — Station unter der Pergola bei Sonnenuntergang",
      intro: "Hair-Rich-Barbier beim Haarschnitt zu Hause an einem Kunden mit Umhang, in einer Villa in Porto Cervo",
      step1: "Ankunft des mobilen Barbiers in einer Villa an der Costa Smeralda mit der Salonausstattung",
      step2: "Aufgebaute Barbier-Station zu Hause: Stuhl und Spiegel, Schnitt im Gange in der Villa",
      step3: "Ergebnis des Haarschnitts zu Hause bei Sonnenuntergang, texturierter Herrenschnitt an der Costa Smeralda",
      gallery1: "Station des mobilen Barbiers mit professionellem Werkzeug, Villa in Porto Cervo",
      gallery2: "Kunde mit Umhang während des Haarschnitts zu Hause in der Villa, Costa Smeralda",
      gallery3: "Nacken mit fertigem Herrenschnitt, Hausservice im Garten bei Sonnenuntergang",
      gallery4: "Haarschnitt zu Hause im Gange, Barbier bei der Arbeit an der Costa Smeralda",
      social: "Mobiler Barbier in einer Villa in Porto Cervo bei Sonnenuntergang, Costa Smeralda",
    },
    links: {
      salone: "Herrenbarbier in Olbia",
      listino: "Schnitt, Bart und Combo im Salon",
      lavori: "Archiv unserer Schnitte",
      contatti: "Kontakte und Karte",
    },
    marquee: [
      "Auf Yachten",
      "In Villen",
      "Feiern & Events",
      "Porto Cervo",
      "Costa Smeralda",
      "Auf Termin",
    ],
  },
};
