"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

const CATEGORY_IMAGES = [
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=900&auto=format&fit=crop",
];
const HIGHLIGHT_INDEX = 1;

export function ServicesSection() {
    const { t } = useT();
    return (
        <section
            id="servizi"
            aria-label="Servizi"
            className="relative py-16 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
                    <EditorialHeading
                        eyebrow={t.services.eyebrow}
                        title={
                            <>
                                {t.services.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.services.titleB}</em>
                            </>
                        }
                    />
                    <motion.p
                        className="md:max-w-md text-warm-white-muted text-base leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {t.services.intro}
                    </motion.p>
                </div>

                {/* ── Bundle banner ──────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className="relative overflow-hidden rounded-[var(--radius-lg)] mb-12 md:mb-16 border border-accent-warm/40 bg-gradient-to-r from-accent-warm/15 via-carbon to-black-2"
                >
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 md:gap-8 items-center p-5 md:p-7">
                        <span className="cta-shine cta-pulse inline-flex items-center gap-2 px-3 py-1.5 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-bold whitespace-nowrap self-start md:self-auto w-fit">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                                <path d="M12 2.5l2.4 5.6L20.5 9l-4.5 4 1.2 6.4L12 16.4l-5.2 3 1.2-6.4-4.5-4 6.1-.9L12 2.5z" />
                            </svg>
                            {t.bundle.eyebrow}
                        </span>
                        <div>
                            <p className="text-display text-lg md:text-2xl text-warm-white tracking-tight leading-tight">
                                {t.bundle.title}
                            </p>
                            <p className="text-accent-warm text-xs md:text-sm uppercase tracking-[0.25em] font-body font-semibold mt-1.5">
                                {t.bundle.save("€5")}
                            </p>
                        </div>
                        <a
                            href="/prenota"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-warm-white text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm transition-colors active:scale-95 self-start md:self-auto whitespace-nowrap"
                        >
                            {t.bundle.cta}
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </a>
                    </div>
                </motion.div>

                {/* ── 3 Categorie ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {t.services.items.map((cat, i) => {
                        const highlight = i === HIGHLIGHT_INDEX;
                        const image = CATEGORY_IMAGES[i] ?? CATEGORY_IMAGES[0]!;
                        return (
                            <motion.article
                                key={cat.title}
                                className={`group relative overflow-hidden rounded-[var(--radius-lg)] border ${highlight ? "bg-warm-white text-black border-warm-white md:-translate-y-6" : "bg-carbon text-warm-white border-line"}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: highlight ? -24 : 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <div className="absolute inset-0 transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-110">
                                        <SmartImage
                                            src={image}
                                            alt={`${cat.title} — Hair Rich Olbia`}
                                            className="h-full grayscale-[15%]"
                                        />
                                    </div>
                                    <div
                                        className={`absolute inset-0 ${highlight ? "bg-gradient-to-t from-warm-white/90 via-warm-white/30 to-transparent" : "bg-gradient-to-t from-carbon via-carbon/30 to-transparent"}`}
                                    />
                                    <span className={`absolute top-5 left-5 text-display text-xl tracking-widest ${highlight ? "text-black/60" : "text-silver-dark"}`}>
                                        0{i + 1}
                                    </span>
                                </div>

                                <div className="p-7 md:p-8">
                                    <span className={`text-display-alt text-2xl ${highlight ? "text-black/70" : "text-accent-warm"}`}>
                                        {cat.eyebrow}
                                    </span>
                                    <h3 className="text-display text-3xl md:text-4xl mt-1 tracking-tight">
                                        {cat.title}
                                    </h3>
                                    <p className={`mt-3 text-sm leading-relaxed ${highlight ? "text-black/70" : "text-warm-white-muted"}`}>
                                        {cat.description}
                                    </p>

                                    <ul className={`mt-6 space-y-2 text-sm font-body ${highlight ? "text-black/80" : "text-silver"}`}>
                                        {cat.items.map((it) => (
                                            <li key={it} className="flex items-center gap-2">
                                                <span className={`w-1 h-1 rounded-full ${highlight ? "bg-black" : "bg-accent-warm"}`} aria-hidden="true" />
                                                {it}
                                            </li>
                                        ))}
                                    </ul>

                                    <a
                                        href="/prenota"
                                        className={`mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-semibold border-b pb-1 transition-colors ${highlight ? "border-black hover:text-black/70" : "border-warm-white text-warm-white hover:text-accent-warm hover:border-accent-warm"}`}
                                    >
                                        {t.services.bookFromCard}
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </a>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
