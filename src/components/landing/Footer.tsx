"use client";

import { SITE } from "@/lib/constants";
import { useT } from "@/i18n/useLang";
import { useBookingDrawer } from "@/lib/store";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";

const HOURS_RAW = [
    { dayKey: "mon" as const, hours: "closed" as const },
    { dayKey: "tue" as const, hours: "09:00 – 12:30 · 15:00 – 19:00" },
    { dayKey: "wed" as const, hours: "09:00 – 12:30 · 15:00 – 19:00" },
    { dayKey: "thu" as const, hours: "09:00 – 12:30 · 15:00 – 19:00" },
    { dayKey: "fri" as const, hours: "09:00 – 12:30 · 15:00 – 19:00" },
    { dayKey: "sat" as const, hours: "09:00 – 12:30 · 15:00 – 19:00" },
    { dayKey: "sun" as const, hours: "closed" as const },
];

const NAV_LINKS: {
    href: string;
    label: string;
    blurb: string;
    icon: (props: { className?: string }) => React.JSX.Element;
}[] = [
    {
        href: "/servizi",
        label: "Servizi",
        blurb: "Listino + booking",
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121 18 18m-3.879-3.879a3 3 0 1 0-4.242-4.242 3 3 0 0 0 4.242 4.242ZM18 6 6 18M6 6l4.879 4.879" />
            </svg>
        ),
    },
    {
        href: "/lavori",
        label: "Portfolio",
        blurb: "Archivio tagli",
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V6.75Zm6 6.75 2.25 2.25L15 9m-12 8.25 4.5-4.5 3 3 3.75-3.75 4.5 4.5" />
            </svg>
        ),
    },
    {
        href: "/team",
        label: "Team",
        blurb: "Federico, Cristian",
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
        ),
    },
    {
        href: "/prodotti",
        label: "Shop",
        blurb: "Click & collect",
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
        ),
    },
    {
        href: "/contatti",
        label: "Contatti",
        blurb: "Mappa + telefono",
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
        ),
    },
];

const LEGAL_LINKS = [
    { href: "/privacy", label: "Privacy" },
    { href: "/cookie", label: "Cookie" },
    { href: "/termini", label: "Termini" },
];

const mapsHref =
    "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(SITE.address);
const phoneHref = "tel:" + SITE.phone.replace(/\s+/g, "");
const mailHref = "mailto:" + SITE.email;

export function Footer() {
    const { t, lang } = useT();
    const currentYear = new Date().getFullYear();
    const openDrawer = useBookingDrawer((s) => s.open);

    const isToday = (dayKey: string) => {
        const dow = new Date().getDay(); // 0=Sun, 1=Mon, ...
        const map: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
        return map[dayKey] === dow;
    };

    return (
        <footer className="relative bg-black border-t border-line overflow-hidden">
            {/* ── BLOCK 1 · CINEMATIC CTA WITH STOREFRONT BG ──────────────────── */}
            <div className="relative border-b border-line overflow-hidden">
                {/* Full-bleed storefront photo, darkened for legibility */}
                <div className="absolute inset-0" aria-hidden="true">
                    <img
                        src={assetImageUrl("salone-esterno.webp", { width: 1920, quality: 78, format: "webp" })}
                        srcSet={assetImageSrcset("salone-esterno.webp", 78)}
                        sizes="100vw"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-[center_55%]"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Lighter bottom-fade only — keeps the storefront sign legible
                        while still landing the eye on the CTA button below. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />
                </div>

                {/* Decorative editorial watermark */}
                <div
                    aria-hidden="true"
                    className="absolute -bottom-10 right-2 md:right-8 text-display-alt text-[28vw] md:text-[14vw] lg:text-[12vw] xl:text-[10vw] 2xl:text-[9vw] text-warm-white/[0.05] leading-none pointer-events-none select-none"
                >
                    rich
                </div>

                {/* Button anchored to the BOTTOM of the storefront photo
                    — never centred. The min-height keeps the photo readable
                    while the CTA sits in its lower-third so the eye lands on
                    "salone visibile" first, then on "Prenota ora". */}
                <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-20 pt-20 md:pt-24 lg:pt-28 xl:pt-32 pb-10 md:pb-12 flex items-end justify-center min-h-[42vh] md:min-h-[48vh] lg:min-h-[44vh] xl:min-h-[42vh]">
                    <button
                        onClick={openDrawer}
                        className="cta-shine cta-pulse group inline-flex items-center justify-center gap-3 md:gap-4 px-10 md:px-14 py-5 md:py-6 bg-accent-warm text-black rounded-full text-sm md:text-lg uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.03] transition-transform shadow-[0_24px_70px_-15px_rgba(212,165,116,0.65)]"
                    >
                        Prenota ora
                        <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── BLOCK 2 · DOVE + ORARI ──────────────────────────────────────── */}
            <div className="border-b border-line">
                <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-10 md:py-14 lg:py-16 xl:py-20 2xl:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 xl:gap-24">
                    {/* Dove */}
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Dove siamo
                        </span>
                        <p className="text-display text-2xl md:text-4xl text-warm-white tracking-tight mt-4 leading-[1.1]">
                            Via Regina Elena 33/A<br />
                            Olbia (SS) · 07026
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            <a
                                href={mapsHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-line text-warm-white text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                Indicazioni
                            </a>
                            <a
                                href={mailHref}
                                className="text-warm-white-muted text-sm font-body hover:text-warm-white transition-colors break-all"
                            >
                                {SITE.email}
                            </a>
                        </div>
                    </div>

                    {/* Orari */}
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Orari di apertura
                        </span>
                        <dl className="mt-4 divide-y divide-line border-y border-line">
                            {HOURS_RAW.map((h) => {
                                const closed = h.hours === "closed";
                                const today = isToday(h.dayKey);
                                return (
                                    <div
                                        key={h.dayKey}
                                        className={`flex items-center justify-between gap-3 py-3 ${
                                            closed ? "opacity-45" : ""
                                        } ${today ? "bg-accent-warm/[0.04] -mx-2 px-2" : ""}`}
                                    >
                                        <dt
                                            className={`text-[11px] uppercase tracking-[0.25em] font-body font-semibold flex items-center gap-2 ${
                                                today ? "text-accent-warm" : "text-silver"
                                            }`}
                                        >
                                            {today && (
                                                <span
                                                    aria-hidden="true"
                                                    className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse"
                                                />
                                            )}
                                            {t.footer.days[h.dayKey]}
                                        </dt>
                                        <dd
                                            className={`text-sm font-body tabular-nums ${
                                                closed ? "text-silver-dark" : today ? "text-warm-white" : "text-warm-white-muted"
                                            }`}
                                        >
                                            {closed ? t.footer.closed : h.hours}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                </div>
            </div>

            {/* ── BLOCK 3 · INDEX EDITORIAL ──────────────────────────────────── */}
            <div className="relative border-b border-line overflow-hidden">
                {/* Watermark behind the index */}
                <div
                    aria-hidden="true"
                    className="absolute -bottom-12 -right-4 md:-right-10 text-display-alt text-[40vw] md:text-[18vw] lg:text-[15vw] xl:text-[13vw] 2xl:text-[11vw] text-warm-white/[0.035] leading-none pointer-events-none select-none tracking-tighter"
                >
                    naviga
                </div>

                <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-10 md:py-14 lg:py-16 xl:py-20 2xl:py-24">
                    {/* Header — eyebrow + brand blurb side by side on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-14 xl:gap-16 mb-10 md:mb-14 lg:mb-20">
                        <div className="md:col-span-5">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                Indice
                            </span>
                            <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                                Cinque{" "}
                                <em className="text-display-alt not-italic text-silver">strade</em>,
                                <br />
                                una sola poltrona.
                            </h2>
                        </div>
                        <div className="md:col-span-6 md:col-start-7 flex md:items-end">
                            <p className="text-warm-white-muted text-sm md:text-base leading-relaxed max-w-md">
                                Barbiere sartoriale a Olbia dal 2017. Lavoriamo capelli e barba con
                                la stessa cura con cui un sarto cuce un capo: una persona alla
                                volta, una testa alla volta. Sempre su prenotazione.
                            </p>
                        </div>
                    </div>

                    {/* Big editorial index — 5 numbered cards */}
                    <nav aria-label="Pagine del sito" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4 xl:gap-5">
                        {NAV_LINKS.map((l, i) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="group relative flex flex-col justify-between gap-6 p-5 md:p-6 min-h-[160px] md:min-h-[200px] rounded-[var(--radius-md)] border border-line bg-carbon/40 hover:bg-carbon hover:border-accent-warm/50 transition-all overflow-hidden"
                            >
                                {/* Big watermark ordinal behind */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -top-4 -right-3 md:-top-6 md:-right-4 text-display-alt text-7xl md:text-[7rem] text-warm-white/[0.06] leading-none pointer-events-none select-none tabular-nums transition-colors group-hover:text-accent-warm/20"
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>

                                <div className="relative flex items-center justify-between gap-3">
                                    <span className="inline-flex w-10 h-10 rounded-full border border-accent-warm/40 bg-accent-warm/10 items-center justify-center text-accent-warm transition-colors group-hover:bg-accent-warm group-hover:text-black">
                                        <l.icon className="w-5 h-5" />
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </div>

                                <div className="relative">
                                    <span className="block text-display text-2xl md:text-3xl text-warm-white tracking-tight leading-none">
                                        {l.label}
                                    </span>
                                    <span className="mt-2 flex items-center justify-between gap-2">
                                        <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                            {l.blurb}
                                        </span>
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-warm-white transition-all duration-300 group-hover:text-accent-warm group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                </div>
                            </a>
                        ))}
                    </nav>

                    {/* Segui IG — full-width bar below the index */}
                    <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 md:pt-8 border-t border-line">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                                Segui
                            </span>
                            <span className="w-px h-4 bg-line" aria-hidden="true" />
                            <a
                                href={SITE.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 text-warm-white font-body text-base hover:text-accent-warm transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                    <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                                @hair_rich_
                            </a>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Reel, backstage, taglio in tempo reale
                        </span>
                    </div>
                </div>
            </div>

            {/* ── BLOCK 4 · BOTTOM BAR ────────────────────────────────────────── */}
            {/* pb extra on mobile so the legal links clear the fixed
               MobileBottomBar (≈70-80px including safe-area). Desktop
               keeps the normal padding since no bar there. */}
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:pb-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    © {currentYear} Hair Rich Olbia · P.IVA 0000000000
                </p>
                <nav className="flex flex-wrap gap-5 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold" aria-label="Legal">
                    {LEGAL_LINKS.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="hover:text-warm-white transition-colors"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>
            </div>

            {/* JSON-LD LocalBusiness (unchanged) */}
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
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Tuesday", opens: "14:30", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Wednesday", opens: "14:30", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Thursday", opens: "14:30", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "14:30", closes: "19:30" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "13:00" },
                            { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "14:30", closes: "19:30" },
                        ],
                        priceRange: "€€",
                        geo: { "@type": "GeoCoordinates", latitude: 40.923, longitude: 9.498 },
                        aggregateRating: {
                            "@type": "AggregateRating",
                            ratingValue: "4.9",
                            reviewCount: "247",
                            bestRating: "5",
                            worstRating: "1",
                        },
                        hasOfferCatalog: {
                            "@type": "OfferCatalog",
                            name: "Servizi Hair Rich",
                            itemListElement: [
                                { "@type": "Offer", price: "20", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Taglio classico" } },
                                { "@type": "Offer", price: "25", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Fade & Sfumatura" } },
                                { "@type": "Offer", price: "30", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Razor cut" } },
                                { "@type": "Offer", price: "15", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Barba sartoriale" } },
                                { "@type": "Offer", price: "35", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Taglio + Barba" } },
                                { "@type": "Offer", price: "45", priceCurrency: "EUR", itemOffered: { "@type": "Service", name: "Taglio a domicilio" } },
                            ],
                        },
                    }),
                }}
            />
        </footer>
    );
}
