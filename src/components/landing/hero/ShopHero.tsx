"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProducts, assetImageUrl } from "@/lib/supabase/queries";

/**
 * Editorial hero for /prodotti. Storefront photo darkened in the bg, two
 * featured product cards in a mini contact-sheet on the right, big title
 * + Click & Collect badge on the left. The product cards open the global
 * ProductDrawer on tap — same interaction as the catalog below.
 */
const CATEGORY_CARDS: {
    /** Either a real ProductCategory slug (drives the live count) or a
     *  pseudo-key like "merch" for non-catalog entries. */
    key: string;
    label: string;
    blurb: string;
    /** Anchor target inside /prodotti. Catalog categories jump to the
     *  catalog grid; "merch" jumps to the dedicated MerchCTA section. */
    href: string;
    /** When false, the live product count is suppressed (the card is
     *  promotional, not a filter). */
    showCount?: boolean;
    icon: (props: { className?: string }) => React.JSX.Element;
}[] = [
    {
        key: "hair",
        label: "Capelli",
        blurb: "Pomate, cere, polveri",
        href: "#catalog",
        showCount: true,
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V11l7-7 7 7v10M9 21v-6h6v6" />
            </svg>
        ),
    },
    {
        key: "beard",
        label: "Barba",
        blurb: "Oli, balsami, mousse",
        href: "#catalog",
        showCount: true,
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a4 4 0 014 4v3a8 8 0 11-8 0V7a4 4 0 014-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 13v3a4 4 0 008 0v-3" />
            </svg>
        ),
    },
    {
        key: "shave",
        label: "Rasatura",
        blurb: "Dopobarba, pre-shave",
        href: "#catalog",
        showCount: true,
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h13l3-3v6l-3-3M3 6v12" />
            </svg>
        ),
    },
    {
        key: "merch",
        label: "Merchandising",
        blurb: "T-shirt, felpe, capi brand",
        href: "#merch",
        // Phone-only request — no online catalog yet.
        icon: ({ className = "" }) => (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l3 2 3-1 3 1 3-2 3 4-3 2v11H6V9L3 7l3-4z" />
            </svg>
        ),
    },
];

export function ShopHero() {
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        let alive = true;
        fetchProducts()
            .then((rows) => {
                if (!alive) return;
                const c: Record<string, number> = {};
                for (const p of rows) c[p.category] = (c[p.category] ?? 0) + 1;
                setCounts(c);
            })
            .catch(() => {
                /* fail silently — counts fall back to "—" */
            });
        return () => {
            alive = false;
        };
    }, []);

    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Background: blurred storefront photo */}
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={assetImageUrl("salone-esterno.webp", { width: 1920, quality: 65, format: "webp" })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-black/60" />
            </div>

            {/* Watermark numeral */}
            <div
                aria-hidden="true"
                className="absolute -bottom-8 left-3 md:left-6 text-display-alt text-[35vw] md:text-[18vw] text-warm-white/[0.04] leading-none pointer-events-none select-none"
            >
                06
            </div>

            <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36 pb-12 md:pb-16 lg:pb-20 xl:pb-24 min-h-[70vh] md:min-h-[75vh] lg:min-h-[52vh] xl:min-h-[48vh] 2xl:min-h-[45vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
                    {/* Title block */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-7"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/15 border border-accent-warm/40 mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                Click & Collect · Olbia
                            </span>
                        </div>

                        <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-warm-white tracking-tight leading-[0.92]">
                            Quello che usiamo
                            <br />
                            <em className="text-display-alt not-italic text-silver">
                                in salone.
                            </em>
                        </h1>

                        <p className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Pomate, cere, oli barba e shampoo selezionati uno per uno. Prenoti
                            online, paghi al ritiro. Niente spedizioni, niente sorprese.
                        </p>

                        {/* Three pillar value-props */}
                        <motion.dl
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
                            }}
                            className="mt-8 md:mt-12 grid grid-cols-3 gap-4 max-w-md"
                        >
                            {[
                                { value: "15+", label: "Prodotti curati" },
                                { value: "7gg", label: "Tempo ritiro" },
                                { value: "0€", label: "Spese spedizione" },
                            ].map((m) => (
                                <motion.div
                                    key={m.label}
                                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                    className="border-l-2 border-accent-warm/60 pl-3"
                                >
                                    <dt className="text-display text-2xl md:text-3xl text-warm-white tabular-nums">
                                        {m.value}
                                    </dt>
                                    <dd className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                        {m.label}
                                    </dd>
                                </motion.div>
                            ))}
                        </motion.dl>

                        {/* Primary CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="mt-8 md:mt-12"
                        >
                            <a
                                href="#catalog"
                                className="cta-shine cta-pulse group inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent-warm text-black rounded-full text-sm uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform shadow-[0_18px_50px_-12px_rgba(212,165,116,0.55)]"
                            >
                                Esplora il catalogo
                                <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* Right column — four category cards. No product photos
                        here (the catalog below already shows them all); these
                        are conceptual jump-points: tap a category to land on
                        the catalog already filtered. */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
                        }}
                        className="lg:col-span-5 grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 xl:gap-8"
                    >
                        {CATEGORY_CARDS.map((c, i) => {
                            const count = counts[c.key];
                            return (
                                <motion.a
                                    key={c.key}
                                    variants={{
                                        hidden: { opacity: 0, y: 24 },
                                        visible: { opacity: 1, y: 0 },
                                    }}
                                    href={c.href}
                                    className={`group relative aspect-square rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-carbon to-black-2 overflow-hidden flex flex-col items-start justify-between p-4 md:p-5 hover:border-accent-warm/40 transition-colors ${
                                        i === 0 || i === 3 ? "lg:translate-y-6" : ""
                                    }`}
                                >
                                    {/* Big watermark numeral behind */}
                                    <span
                                        aria-hidden="true"
                                        className="absolute -top-3 -right-3 text-display-alt text-7xl md:text-8xl text-warm-white/[0.05] leading-none pointer-events-none select-none"
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span className="relative inline-flex w-10 h-10 rounded-full border border-accent-warm/40 bg-accent-warm/10 items-center justify-center text-accent-warm">
                                        <c.icon className="w-5 h-5" />
                                    </span>
                                    <div className="relative">
                                        <span className="block text-warm-white font-body font-semibold text-sm md:text-base leading-tight">
                                            {c.label}
                                        </span>
                                        <span className="block text-silver-dark text-[10px] md:text-xs uppercase tracking-[0.25em] font-body font-semibold mt-1">
                                            {c.blurb}
                                        </span>
                                        {c.showCount && typeof count === "number" && count > 0 && (
                                            <span className="block mt-2 text-accent-warm text-xs md:text-sm font-display tabular-nums">
                                                {count} {count === 1 ? "prodotto" : "prodotti"}
                                            </span>
                                        )}
                                    </div>
                                </motion.a>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Bottom meta */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-12 md:mt-16 flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Ritiro entro 7 giorni
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        06 / Prodotti
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
