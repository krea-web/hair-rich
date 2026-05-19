"use client";

import { motion } from "framer-motion";
import { Wordmark } from "./_shared/Wordmark";
import { AvailabilityPulse } from "./_shared/AvailabilityPulse";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";
import { NextSlotWidget } from "./NextSlotWidget";
import { OpenNowBadge } from "./_shared/OpenNowBadge";
import { useT } from "@/i18n/useLang";

const HERO_PHOTO = "/hero-seq/frame_001.webp";

function HeroTextBlock({ withWordmark = true }: { withWordmark?: boolean }) {
    const { t } = useT();
    return (
        <div className="flex flex-col justify-center">
            {withWordmark && (
                <Wordmark
                    variant="wordmark"
                    size="lg"
                    className="mb-4 -ml-2 md:mb-10 [&>img]:h-16 md:[&>img]:h-36 lg:[&>img]:h-44 opacity-90 drop-shadow-[0_0_20px_rgba(212,165,116,0.18)]"
                    animated
                />
            )}

            <motion.span
                className="text-display-alt text-2xl md:text-4xl text-accent-warm mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
            >
                The
            </motion.span>

            <motion.h1
                className="text-display text-warm-white leading-[0.95] md:leading-[0.85] tracking-tight"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
                }}
            >
                {["BARBER", "STUDIO"].map((word, i) => (
                    <motion.span
                        key={word}
                        className="block text-[13vw] md:text-[8.5vw] lg:text-[7.5vw]"
                        variants={{
                            hidden: { opacity: 0, y: 60, clipPath: "inset(100% 0 0 0)" },
                            visible: {
                                opacity: 1,
                                y: 0,
                                clipPath: "inset(0% 0 0 0)",
                                transition: { duration: 1, ease: [0.7, 0, 0.3, 1] },
                            },
                        }}
                    >
                        {i === 1 ? <em className="text-display-alt not-italic text-silver">{word}</em> : word}
                    </motion.span>
                ))}
            </motion.h1>

            <motion.p
                className="mt-6 md:mt-8 max-w-md text-warm-white-muted text-sm md:text-lg leading-relaxed font-body"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                Da otto anni la nostra missione è scolpire la tua identità. Taglio, barba e rituali esclusivi
                nel cuore di Olbia.
            </motion.p>

            <motion.div
                className="mt-7 md:mt-10 flex flex-wrap items-center gap-4 md:gap-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                <BookingCtaButton label={t.hero.primaryCta} />
                {/* Secondary inline link su mobile (no button), bordo su desktop */}
                <a
                    href="/servizi"
                    className="hidden md:inline-flex items-center gap-3 border border-line text-warm-white px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] transition-colors hover:border-warm-white hover:bg-warm-white/5"
                >
                    {t.hero.secondaryCta}
                </a>
                <a
                    href="/servizi"
                    className="md:hidden inline-flex items-center gap-2 text-silver underline underline-offset-4 text-xs uppercase tracking-[0.25em] font-body font-semibold"
                >
                    {t.hero.secondaryCta}
                </a>
            </motion.div>

            {/* Prossimo slot disponibile (live da Supabase) */}
            <div className="mt-5 md:mt-6 flex flex-wrap items-center gap-3">
                <NextSlotWidget />
                <OpenNowBadge />
            </div>

            {/* Trust badges (rating + certified + premium) — hidden mobile */}
            <motion.div
                className="hidden md:flex mt-12 flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.95 }}
            >
                <a
                    href="#recensioni"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-black/30 backdrop-blur-md hover:border-accent-warm transition-colors group"
                    aria-label={t.badges.rating}
                >
                    <span className="text-accent-warm" aria-hidden="true">★</span>
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-body font-semibold text-warm-white whitespace-nowrap">
                        {t.badges.rating}
                    </span>
                </a>
                <span
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-black/30 backdrop-blur-md"
                    aria-label={t.badges.certified}
                >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3 6-6m1.5-2.25c0 5-7.5 9-7.5 9s-7.5-4-7.5-9V5.25l7.5-2.5 7.5 2.5v2.25Z" />
                    </svg>
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-body font-semibold text-warm-white whitespace-nowrap">
                        {t.badges.certified}
                    </span>
                </span>
                <AvailabilityPulse variant="ribbon" />
            </motion.div>

            <motion.dl
                className="hidden md:grid mt-12 grid-cols-3 gap-8 max-w-md"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 1.4 }}
            >
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.open}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">{t.hero.openHours}</dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.phone}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">0789·1891049</dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.location}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">Via Regina Elena</dd>
                </div>
            </motion.dl>
        </div>
    );
}

export function HeroSection() {
    return (
        <section className="relative bg-black overflow-hidden" aria-label="Hero">
            {/* Nav globale: vive in SiteHeader (fisso, persistente) — non più
               dentro l'hero. */}

            {/* Hero content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 lg:gap-12 px-6 md:px-12 lg:px-20 pt-20 md:pt-32 pb-12 md:pb-20 min-h-[70dvh] md:min-h-[100dvh]">
                <div className="md:col-span-7 flex flex-col justify-center">
                    <HeroTextBlock />
                </div>

                {/* Static photo (PC only). On mobile the intro sequence already
                   delivered the visual; we keep the hero text-only for breathing
                   room. */}
                <div className="hidden md:block md:col-span-5 relative">
                    <motion.div
                        className="sticky top-32 aspect-[4/5] w-full"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                    >
                        <img
                            src={HERO_PHOTO}
                            alt="Hair Rich · forbici e rosa, simbolo del barber studio"
                            className="absolute inset-0 w-full h-full object-contain select-none"
                            draggable={false}
                            loading="eager"
                            decoding="async"
                        />
                        {/* Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

                        {/* Caption */}
                        <motion.div
                            className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md border border-line rounded-[var(--radius-md)] p-4 max-w-[220px]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                        >
                            <span className="text-display-alt text-lg text-accent-warm">Premium</span>
                            <p className="text-display text-xs text-warm-white tracking-widest mt-0.5">
                                MASTER BARBER
                            </p>
                        </motion.div>

                        <span className="absolute right-1 top-2 text-[10px] tracking-[0.5em] uppercase text-silver-dark font-body font-semibold rotate-180 [writing-mode:vertical-rl]">
                            EST. 2017
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
