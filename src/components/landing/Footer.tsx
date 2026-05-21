"use client";

import { SITE } from "@/lib/constants";
import { useT } from "@/i18n/useLang";
import { useBookingDrawer } from "@/lib/store";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";

const HOURS_RAW = [
    { dayKey: "mon" as const, hours: "closed" as const },
    { dayKey: "tue" as const, hours: "09:00 – 13:00 · 14:30 – 19:30" },
    { dayKey: "wed" as const, hours: "09:00 – 13:00 · 14:30 – 19:30" },
    { dayKey: "thu" as const, hours: "09:00 – 13:00 · 14:30 – 19:30" },
    { dayKey: "fri" as const, hours: "09:00 – 13:00 · 14:30 – 19:30" },
    { dayKey: "sat" as const, hours: "09:00 – 13:00 · 14:30 – 19:30" },
    { dayKey: "sun" as const, hours: "closed" as const },
];

const NAV_LINKS = [
    { href: "/servizi", label: "Servizi" },
    { href: "/lavori", label: "Portfolio" },
    { href: "/team", label: "Team" },
    { href: "/prodotti", label: "Shop" },
    { href: "/contatti", label: "Contatti" },
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
                        src={assetImageUrl("salone-esterno.webp", { width: 1920, quality: 75, format: "webp" })}
                        srcSet={assetImageSrcset("salone-esterno.webp", 75)}
                        sizes="100vw"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/55" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
                </div>

                {/* Decorative editorial watermark */}
                <div
                    aria-hidden="true"
                    className="absolute -bottom-10 right-2 md:right-8 text-display-alt text-[28vw] md:text-[14vw] text-warm-white/[0.05] leading-none pointer-events-none select-none"
                >
                    rich
                </div>

                <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-40 flex items-center justify-center min-h-[55vh] md:min-h-[65vh]">
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
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
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

            {/* ── BLOCK 3 · NAV + SEGUI ───────────────────────────────────────── */}
            <div className="border-b border-line">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start">
                    <div className="md:col-span-3">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                            Naviga
                        </span>
                        <ul className="mt-4 space-y-2.5 text-base">
                            {NAV_LINKS.map((l) => (
                                <li key={l.href}>
                                    <a
                                        href={l.href}
                                        className="text-warm-white font-body hover:text-accent-warm transition-colors"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                            Segui
                        </span>
                        <ul className="mt-4 space-y-2.5 text-base">
                            <li>
                                <a
                                    href={SITE.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-warm-white font-body hover:text-accent-warm transition-colors"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                        <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                    </svg>
                                    @hair_rich_
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="md:col-span-6">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                            Hair Rich · Dal 2017
                        </span>
                        <p className="mt-4 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-md">
                            Barbiere sartoriale a Olbia. Lavoriamo capelli e barba con la stessa cura
                            con cui un sarto cuce un capo: una persona alla volta, una testa alla
                            volta. Sempre su prenotazione.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── BLOCK 4 · BOTTOM BAR ────────────────────────────────────────── */}
            {/* pb extra on mobile so the legal links clear the fixed
               MobileBottomBar (≈70-80px including safe-area). Desktop
               keeps the normal padding since no bar there. */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:pb-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
