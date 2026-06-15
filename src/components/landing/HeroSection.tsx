"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";
import { Wordmark } from "./_shared/Wordmark";
import { useT } from "@/i18n/useLang";
import type { Locale } from "@/i18n/types";
import { assetImageUrlRatio, assetImageSrcsetRatio } from "@/lib/supabase/queries";

// Foto reale del salone (barbiere al lavoro) — bucket `asset/`, full-bleed.
const HERO_IMG = "hero-home.webp";
const HERO_RATIO = 3 / 2;
const HERO_ALT =
    "Barbiere di Hair Rich mentre rifinisce il taglio di un cliente nel salone di Olbia";

const EASE_CINEMA = [0.7, 0, 0.3, 1] as const;
const EASE_SOFT = [0.25, 0.1, 0.25, 1] as const;

// Headline = intento di ricerca "Barbiere a Olbia". `lead` grande in Cinzel,
// `tail` come accento corsivo Italiana oro.
const HEADLINE: Record<Locale, { lead: string; tail: string }> = {
    it: { lead: "Barbiere", tail: "a Olbia" },
    en: { lead: "Barbershop", tail: "in Olbia · Sardinia" },
    fr: { lead: "Barbier", tail: "à Olbia" },
    de: { lead: "Barbier", tail: "in Olbia" },
};

function HeroContent() {
    const { t, lang } = useT();
    const reduce = useReducedMotion();
    const h = HEADLINE[lang];

    const v = (full: Variants): Variants =>
        reduce ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } } : full;

    const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } } };
    const kicker = v({
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const headlineContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
    const line = v({
        hidden: { opacity: 0, y: 56, clipPath: "inset(100% 0 0 0)" },
        show: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", transition: { duration: 0.9, ease: EASE_CINEMA } },
    });
    const tail = v({
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_SOFT } },
    });
    const body = v({
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const cta = v({
        hidden: { opacity: 0, y: 18, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const meta = v({
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SOFT } },
    });

    return (
        <motion.div
            className="flex flex-col items-center text-center md:items-start md:text-left max-w-2xl"
            initial="hidden"
            animate="show"
            variants={container}
        >
            <motion.div variants={kicker}>
                <Wordmark
                    variant="mark"
                    size="xl"
                    className="[&>img]:h-28 md:[&>img]:h-32 lg:[&>img]:h-40 drop-shadow-[0_4px_28px_rgba(0,0,0,0.7)]"
                />
            </motion.div>

            <motion.h1 className="mt-5 text-display text-warm-white leading-[0.92] tracking-tight" variants={headlineContainer}>
                <span className="block overflow-hidden">
                    <motion.span
                        className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                        variants={line}
                    >
                        {h.lead}
                    </motion.span>
                </span>
                <motion.span
                    className="block text-display-alt text-accent-warm text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-1"
                    variants={tail}
                >
                    {h.tail}
                </motion.span>
            </motion.h1>

            <motion.p
                className="mt-6 max-w-md text-warm-white-muted text-sm md:text-base lg:text-lg leading-relaxed font-body mx-auto md:mx-0"
                variants={body}
            >
                {t.hero.body}
            </motion.p>

            <motion.div className="mt-8 flex justify-center md:justify-start" variants={cta}>
                <BookingCtaButton label={t.hero.primaryCta} />
            </motion.div>

            <motion.div
                className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold justify-center md:justify-start"
                variants={meta}
            >
                <span>EST. 2017</span>
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-line-strong" />
                <span>Olbia</span>
                <span aria-hidden="true" className="w-1 h-1 rounded-full bg-line-strong" />
                <span>{t.hero.openHours}</span>
            </motion.div>
        </motion.div>
    );
}

export function HeroSection() {
    const reduce = useReducedMotion();
    return (
        <section
            className="relative w-full min-h-[100svh] md:min-h-[100dvh] bg-black overflow-hidden isolate"
            aria-label="Hero"
        >
            {/* Foto reale a tutto schermo (Ken Burns sottile in entrata) */}
            <motion.img
                src={assetImageUrlRatio(HERO_IMG, 1920, HERO_RATIO, 80)}
                srcSet={assetImageSrcsetRatio(HERO_IMG, HERO_RATIO, 80)}
                sizes="100vw"
                width={1920}
                height={1280}
                alt={HERO_ALT}
                className="absolute inset-0 w-full h-full object-cover select-none [object-position:46%_48%] md:[object-position:60%_40%]"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ duration: reduce ? 0.6 : 1.6, ease: EASE_CINEMA }}
            />

            {/* Scrim: leggibilità testo (basso + sinistra) + raccordo header in alto */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-black/45 to-black/15" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-black/55 to-transparent" />

            {/* Contenuto in basso-sinistra */}
            <div className="relative z-10 flex min-h-[100svh] md:min-h-[100dvh] flex-col justify-end max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-[max(env(safe-area-inset-top,0px),96px)] pb-[max(env(safe-area-inset-bottom,0px),104px)] md:pb-20 lg:pb-24">
                <HeroContent />
            </div>

            {/* Scroll cue (desktop) */}
            <motion.div
                className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex-col items-center gap-2 text-silver-dark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
            >
                <span className="text-[10px] tracking-[0.4em] uppercase font-body font-semibold">Scroll</span>
                <span className="w-px h-10 bg-gradient-to-b from-silver to-transparent" />
            </motion.div>
        </section>
    );
}
