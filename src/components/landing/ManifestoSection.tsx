"use client";

import { motion } from "framer-motion";
import { SmartImage } from "./_shared/SmartImage";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import { useT } from "@/i18n/useLang";

// Real salon photos from the asset bucket. Large card: the new landscape
// storefront shot (signage + entrance both visible). Inset: the interior
// with multiple stations and the hexagonal ceiling.
const ABOUT_LARGE = "salone-esterno.webp";
const ABOUT_SMALL = "salone-interno-postazioni.webp";

export function ManifestoSection() {
    const { t } = useT();
    return (
        <section
            id="about"
            className="relative py-16 md:py-32 px-6 md:px-12 lg:px-20 bg-black-2 overflow-hidden"
            aria-label={t.about.eyebrow}
        >
            <div className="absolute top-12 right-6 md:right-12 text-display-alt text-[20vw] md:text-[15vw] text-warm-white/[0.03] leading-none pointer-events-none select-none">
                Studio
            </div>

            <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
                <div className="md:col-span-6 relative">
                    <motion.div
                        className="relative aspect-[4/5] w-full"
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <SmartImage
                            src={assetImageUrl(ABOUT_LARGE, { width: 1200, quality: 82, format: "webp" })}
                            srcSet={assetImageSrcset(ABOUT_LARGE, 82)}
                            sizes="(min-width: 768px) 50vw, 100vw"
                            alt="Hair Rich Olbia · vetrina del salone"
                            className="h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    </motion.div>

                    <motion.div
                        className="absolute -bottom-8 -right-4 md:-right-12 w-[45%] aspect-[3/4] border-4 border-black-2 rounded-[var(--radius-md)] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.9, delay: 0.3 }}
                    >
                        <SmartImage
                            src={assetImageUrl(ABOUT_SMALL, { width: 900, quality: 82, format: "webp" })}
                            srcSet={assetImageSrcset(ABOUT_SMALL, 82)}
                            sizes="(min-width: 768px) 22vw, 45vw"
                            alt="Hair Rich Olbia · interno con le postazioni di lavoro"
                            className="h-full"
                        />
                    </motion.div>

                    <motion.div
                        className="absolute -top-6 -left-6 hidden md:flex items-center justify-center w-32 h-32 rounded-full border border-accent-warm/40"
                        initial={{ opacity: 0, rotate: -45 }}
                        whileInView={{ opacity: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        <div className="text-center">
                            <div className="text-display-alt text-xl text-accent-warm">{t.about.sinceLabel}</div>
                            <div className="text-display text-2xl text-warm-white tracking-widest">2017</div>
                        </div>
                    </motion.div>
                </div>

                <div className="md:col-span-6 md:pl-8">
                    <EditorialHeading
                        eyebrow={t.about.eyebrow}
                        title={
                            <>
                                {t.about.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.about.titleB}</em>
                            </>
                        }
                    />

                    <motion.div
                        className="mt-10 space-y-6 max-w-lg text-warm-white-muted text-base md:text-lg leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <p>{t.about.bodyP1}</p>
                        <p className="text-silver">{t.about.bodyP2}</p>
                    </motion.div>

                    <motion.ul
                        className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
                        }}
                    >
                        {t.about.values.map((val) => (
                            <motion.li
                                key={val}
                                className="flex items-center gap-3 text-warm-white text-sm font-body font-semibold"
                                variants={{
                                    hidden: { opacity: 0, x: -10 },
                                    visible: { opacity: 1, x: 0 },
                                }}
                            >
                                <span className="w-6 h-6 rounded-full border border-accent-warm flex items-center justify-center text-accent-warm flex-shrink-0">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                {val}
                            </motion.li>
                        ))}
                    </motion.ul>

                    <motion.a
                        href="/prenota"
                        className="inline-flex items-center gap-3 mt-10 text-warm-white border-b border-warm-white pb-2 text-xs uppercase tracking-[0.3em] font-body font-semibold hover:text-accent-warm hover:border-accent-warm transition-colors"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.9 }}
                    >
                        {t.about.cta}
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </motion.a>
                </div>
            </div>
        </section>
    );
}
