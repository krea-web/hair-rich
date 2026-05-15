"use client";

import { SITE } from "@/lib/constants";
import { useT } from "@/i18n/useLang";

const HOURS_RAW = [
    { dayKey: "mon" as const, hours: "closed" as const },
    { dayKey: "tue" as const, hours: "9:00–12:30 · 15:00–19:30" },
    { dayKey: "wed" as const, hours: "9:00–19:30" },
    { dayKey: "thu" as const, hours: "9:00–12:30 · 15:00–19:30" },
    { dayKey: "fri" as const, hours: "9:00–19:30" },
    { dayKey: "sat" as const, hours: "9:00–13:00 · 14:00–18:00" },
    { dayKey: "sun" as const, hours: "closed" as const },
];

export function Footer() {
    const { t, lang } = useT();
    const currentYear = new Date().getFullYear();
    const signupHref = lang === "it" ? "/registrazione" : `/${lang}/registrazione`;

    const QUICK_LINKS = [
        { href: "/servizi", label: t.nav.services },
        { href: "/lavori", label: t.nav.gallery },
        { href: "/team", label: t.nav.team },
        { href: "/contatti", label: t.nav.about },
        { href: "/prenota", label: t.nav.booking },
    ];

    const HOURS = HOURS_RAW.map((h) => ({
        day: t.footer.days[h.dayKey],
        hours: h.hours === "closed" ? t.footer.closed : h.hours,
    }));

    return (
        <footer className="relative border-t border-line bg-black overflow-hidden">
            {/* Big wordmark image faded as watermark */}
            <img
                src="/hairrich-logoesteso.png"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="pointer-events-none select-none absolute -bottom-6 md:-bottom-12 left-1/2 -translate-x-1/2 w-[120%] md:w-[90%] max-w-none opacity-[0.05]"
            />

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28">
                {/* Join the club — sign-up CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pb-16 border-b border-line items-end">
                    <div>
                        <span className="text-display-alt text-3xl text-accent-warm">
                            {t.footer.signupEyebrow}
                        </span>
                        <h2 className="text-display text-3xl md:text-5xl text-warm-white mt-2 leading-[1]">
                            {t.footer.signupTitle}
                        </h2>
                        <p className="mt-4 text-warm-white-muted text-base max-w-md">
                            {t.footer.signupBody}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 self-end">
                        <a
                            href={signupHref}
                            className="group inline-flex items-center justify-center gap-3 bg-accent-warm text-black px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all"
                        >
                            <span>{t.footer.signupSubmit}</span>
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </a>
                        <a
                            href={lang === "it" ? "/login" : `/${lang}/login`}
                            className="inline-flex items-center justify-center gap-2 border border-line text-warm-white px-7 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] hover:border-warm-white hover:bg-warm-white/5 transition-colors"
                        >
                            {t.footer.signupLogin}
                        </a>
                    </div>
                </div>

                {/* Main columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mt-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <img
                            src="/logo-icona.png"
                            alt="Hair Rich"
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-auto select-none pointer-events-none -ml-2"
                        />
                        <p className="text-[10px] tracking-[0.3em] uppercase text-accent-warm mt-3 font-body font-semibold">
                            Olbia · Sardegna
                        </p>
                        <p className="mt-6 text-warm-white-muted text-sm leading-relaxed max-w-xs">
                            Barbiere premium dal 2017. Sartoria del capello, rituali esclusivi e ascolto vero.
                        </p>
                        <a
                            href={SITE.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-6 text-silver hover:text-accent-warm transition-colors text-sm"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                            @hair_rich_
                        </a>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {t.footer.sections.contact}
                        </h4>
                        <address className="not-italic text-sm text-warm-white-muted mt-4 space-y-3 leading-relaxed">
                            <p>{SITE.address}</p>
                            <p>
                                <span className="block">{SITE.phone}</span>
                                <span className="block mt-1">{SITE.email}</span>
                            </p>
                        </address>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {t.footer.sections.navigate}
                        </h4>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {QUICK_LINKS.map((l) => (
                                <li key={l.href}>
                                    <a
                                        href={l.href}
                                        className="text-warm-white-muted hover:text-accent-warm transition-colors"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Hours */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {t.footer.sections.hours}
                        </h4>
                        <dl className="mt-4 text-sm space-y-1.5">
                            {HOURS.map((h) => (
                                <div key={h.day} className="flex justify-between gap-3">
                                    <dt className="text-warm-white-muted font-semibold">{h.day}</dt>
                                    <dd
                                        className={
                                            h.hours === t.footer.closed ? "text-silver-dark" : "text-warm-white-muted"
                                        }
                                    >
                                        {h.hours}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-20 pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <p className="text-xs text-silver-dark">
                        © {currentYear} Hair Rich Olbia. {t.footer.legalNote}
                    </p>
                    <nav className="flex flex-wrap gap-6 text-xs text-silver-dark" aria-label="Legal">
                        <a href="/privacy" className="hover:text-warm-white transition-colors">{t.footer.legalLinks.privacy}</a>
                        <a href="/cookie" className="hover:text-warm-white transition-colors">{t.footer.legalLinks.cookie}</a>
                        <a href="/termini" className="hover:text-warm-white transition-colors">{t.footer.legalLinks.terms}</a>
                    </nav>
                </div>
            </div>

            {/* JSON-LD LocalBusiness */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BarberShop",
                        name: SITE.name,
                        image: `${SITE.url}/og-image.png`,
                        telephone: SITE.phone,
                        email: SITE.email,
                        address: {
                            "@type": "PostalAddress",
                            streetAddress: "Via Regina Elena 33/A",
                            addressLocality: "Olbia",
                            addressRegion: "SS",
                            postalCode: "07026",
                            addressCountry: "IT",
                        },
                        url: SITE.url,
                        sameAs: [SITE.instagram],
                        openingHoursSpecification: [
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "12:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "15:00", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "12:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "15:00", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "14:00", closes: "18:00" },
                        ],
                        priceRange: "€€",
                        geo: {
                            "@type": "GeoCoordinates",
                            latitude: 40.923,
                            longitude: 9.498,
                        },
                        aggregateRating: {
                            "@type": "AggregateRating",
                            ratingValue: "4.9",
                            reviewCount: "247",
                            bestRating: "5",
                            worstRating: "1",
                        },
                        review: [
                            {
                                "@type": "Review",
                                author: { "@type": "Person", name: "Alessandro M." },
                                datePublished: "2025-04-15",
                                reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
                                reviewBody:
                                    "Il miglior barbiere di Olbia, senza dubbio. Marco ha un talento incredibile per il fade.",
                            },
                            {
                                "@type": "Review",
                                author: { "@type": "Person", name: "Francesco R." },
                                datePublished: "2025-03-08",
                                reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
                                reviewBody:
                                    "Hair Rich è un'esperienza, non un semplice appuntamento.",
                            },
                            {
                                "@type": "Review",
                                author: { "@type": "Person", name: "Giovanni P." },
                                datePublished: "2025-02-20",
                                reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
                                reviewBody:
                                    "Finalmente un posto dove sanno ascoltare. Risultato anche meglio del previsto.",
                            },
                        ],
                        hasOfferCatalog: {
                            "@type": "OfferCatalog",
                            name: "Servizi Hair Rich",
                            itemListElement: [
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Taglio classico",
                                        description: "Forbice, lavaggio e styling",
                                    },
                                    price: "20",
                                    priceCurrency: "EUR",
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Fade & Sfumatura",
                                        description: "Sfumatura precisa, forbice, rasoio",
                                    },
                                    price: "25",
                                    priceCurrency: "EUR",
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Razor cut",
                                        description: "Lavorazione completa al rasoio",
                                    },
                                    price: "30",
                                    priceCurrency: "EUR",
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Taglio + Barba",
                                        description: "Il combo signature",
                                    },
                                    price: "35",
                                    priceCurrency: "EUR",
                                },
                                {
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: "Taglio a domicilio",
                                        description: "Servizio su prenotazione, ovunque a Olbia",
                                    },
                                    price: "45",
                                    priceCurrency: "EUR",
                                },
                            ],
                        },
                    }),
                }}
            />
        </footer>
    );
}
