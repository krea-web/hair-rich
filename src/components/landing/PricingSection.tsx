"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

interface PriceItem {
    name: string;
    description: string;
    duration: string;
    price: string;
    popular?: boolean;
    seasonal?: boolean;
}

// Indici (gi, i) dei prezzi che hanno tag speciali — dipende dall'ordine nel dizionario
const POPULAR_KEYS = new Set(["0-1", "1-2"]); // Fade & Sfumatura · Taglio + Barba
const SEASONAL_KEYS = new Set(["1-3"]); // Taglio a domicilio (highlight come "novità")

const PRICE_GROUPS: { title: string; items: PriceItem[] }[] = [
    {
        title: "Taglio",
        items: [
            { name: "Taglio classico", description: "Forbice, lavaggio e styling", duration: "30'", price: "€20" },
            { name: "Fade & Sfumatura", description: "Sfumatura precisa, forbice, rasoio", duration: "45'", price: "€25", popular: true },
            { name: "Razor cut", description: "Lavorazione completa al rasoio", duration: "50'", price: "€30" },
            { name: "Taglio bambino", description: "Da 0 a 12 anni", duration: "25'", price: "€15" },
        ],
    },
    {
        title: "Barba & Servizi",
        items: [
            { name: "Barba sartoriale", description: "Modellatura, asciugamani caldi, olio", duration: "30'", price: "€15" },
            { name: "Rasatura tradizionale", description: "Rasoio a mano libera, servizio completo", duration: "40'", price: "€25" },
            { name: "Taglio + Barba", description: "Il combo signature", duration: "60'", price: "€35", popular: true },
            { name: "Taglio a domicilio", description: "Veniamo noi. Su prenotazione, in orari concordati.", duration: "60'", price: "€45", seasonal: true },
        ],
    },
];

const ASIDE_IMG =
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=900&auto=format&fit=crop";

export function PricingSection() {
    const { t } = useT();
    const PRICE_GROUPS = t.pricing.groups;
    return (
        <section
            id="prezzi"
            aria-label={t.pricing.titleA + " " + t.pricing.titleB}
            className="relative py-16 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden"
        >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
                {/* ── Left aside image + intro ─────────────────────────────── */}
                <div className="md:col-span-4 md:sticky md:top-24 self-start">
                    <EditorialHeading
                        eyebrow={t.pricing.eyebrow}
                        title={
                            <>
                                {t.pricing.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.pricing.titleB}</em>
                            </>
                        }
                    />
                    <p className="mt-6 text-warm-white-muted text-base leading-relaxed">
                        {t.pricing.intro}
                    </p>

                    <motion.div
                        className="mt-10 relative aspect-[4/5] rounded-[var(--radius-md)] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9 }}
                    >
                        <SmartImage src={ASIDE_IMG} alt="Forbici e strumenti del barber" className="h-full grayscale-[15%]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <span className="text-display-alt text-2xl text-accent-warm">{t.pricing.sideCardEyebrow}</span>
                            <p className="text-display text-lg text-warm-white tracking-widest mt-1">{t.pricing.sideCardTitle}</p>
                        </div>
                    </motion.div>
                </div>

                {/* ── Right pricing list ───────────────────────────────────── */}
                <div className="md:col-span-8 space-y-16 md:space-y-20">
                    {PRICE_GROUPS.map((group, gi: number) => (
                        <motion.div
                            key={group.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.8, delay: gi * 0.1 }}
                        >
                            <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-line">
                                <h3 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">
                                    {group.title}
                                </h3>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    0{gi + 1}
                                </span>
                            </div>

                            <ul className="space-y-6 md:space-y-8">
                                {group.items.map((item, i: number) => {
                                    const key = `${gi}-${i}`;
                                    const popular = POPULAR_KEYS.has(key);
                                    const seasonal = SEASONAL_KEYS.has(key);
                                    return (
                                    <motion.li
                                        key={item.name}
                                        className="grid grid-cols-[1fr_auto] gap-x-4 items-baseline group cursor-pointer"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.5, delay: i * 0.06 }}
                                    >
                                        <div className="flex items-baseline gap-3 min-w-0">
                                            <h4 className="text-display text-base md:text-lg text-warm-white tracking-wider whitespace-nowrap group-hover:text-accent-warm transition-colors flex items-center gap-2">
                                                {item.name}
                                                {popular && (
                                                    <span className="cta-shine cta-pulse text-[8px] md:text-[9px] uppercase tracking-[0.2em] bg-accent-warm text-black px-1.5 py-0.5 rounded-full font-body font-bold normal-case whitespace-nowrap">
                                                        Top
                                                    </span>
                                                )}
                                                {seasonal && (
                                                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] bg-error/20 text-error border border-error/40 px-1.5 py-0.5 rounded-full font-body font-bold normal-case whitespace-nowrap">
                                                        🔥
                                                    </span>
                                                )}
                                            </h4>
                                            <span
                                                aria-hidden="true"
                                                className="flex-1 border-b border-dotted border-silver-dark/40 mx-2 translate-y-[-3px]"
                                            />
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold whitespace-nowrap">
                                                {item.duration}
                                            </span>
                                        </div>
                                        <span className="text-display text-xl md:text-2xl text-accent-warm tabular-nums">
                                            {item.price}
                                        </span>
                                        <p className="col-span-2 text-warm-white-muted text-sm mt-1 max-w-md">
                                            {item.description}
                                        </p>
                                    </motion.li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    ))}

                    <motion.div
                        className="pt-10 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-warm-white-muted text-sm max-w-md">
                            {t.pricing.footnote}
                        </p>
                        <a
                            href="/prenota"
                            className="inline-flex items-center gap-3 px-7 py-3.5 bg-warm-white text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm transition-colors"
                        >
                            {t.pricing.cta}
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
