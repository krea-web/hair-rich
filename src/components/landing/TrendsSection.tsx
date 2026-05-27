"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

const TRENDS_IMG_LARGE =
    "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=1200&auto=format&fit=crop";

export function TrendsSection() {
    const { t } = useT();
    const TIPS = t.trends.tips;
    return (
        <section
            id="tips"
            aria-label={t.trends.eyebrow}
            className="relative py-16 md:py-32 lg:py-40 xl:py-48 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 bg-black overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 lg:gap-20 xl:gap-24 items-start">
                {/* ── Left: image with sticker ─────────────────────────────── */}
                <div className="md:col-span-5 md:sticky md:top-24 lg:top-28 xl:top-32 2xl:top-40">
                    <motion.div
                        className="relative aspect-[4/5] max-h-[560px] lg:max-h-[640px] xl:max-h-[720px] 2xl:max-h-[800px] mx-auto rounded-[var(--radius-md)] overflow-hidden"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1 }}
                    >
                        <SmartImage src={TRENDS_IMG_LARGE} alt="Cura del capello a casa" className="h-full grayscale-[10%]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                        {/* Floating tip sticker */}
                        <motion.div
                            className="absolute top-6 right-6 bg-accent-warm text-black px-4 py-3 rounded-[var(--radius-md)] max-w-[180px]"
                            initial={{ opacity: 0, y: -20, rotate: 5 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 3 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                        >
                            <span className="text-display-alt text-xl">{t.trends.proTipLabel}</span>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-body font-bold leading-snug mt-1">
                                {t.trends.proTipBody}
                            </p>
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── Right: tips list ─────────────────────────────────────── */}
                <div className="md:col-span-7">
                    <EditorialHeading
                        eyebrow={t.trends.eyebrow}
                        title={
                            <>
                                {t.trends.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.trends.titleB}</em>
                            </>
                        }
                    />
                    <p className="mt-6 text-warm-white-muted text-base max-w-lg leading-relaxed">
                        {t.trends.intro}
                    </p>

                    <div className="mt-12 space-y-8">
                        {TIPS.map((tip, i) => (
                            <motion.article
                                key={tip.n}
                                className="grid grid-cols-[auto_1fr] gap-5 md:gap-7 group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: i * 0.12 }}
                            >
                                <span className="text-display text-3xl md:text-4xl text-accent-warm/80 leading-none tabular-nums group-hover:text-accent-warm transition-colors">
                                    {tip.n}
                                </span>
                                <div className="border-l border-line pl-5 md:pl-7 pb-2">
                                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                        {tip.title}
                                    </h3>
                                    <p className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-lg">
                                        {tip.body}
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
