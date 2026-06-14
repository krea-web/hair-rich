"use client";

import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { Wordmark } from "./_shared/Wordmark";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";
import { useT } from "@/i18n/useLang";
import { assetImageUrlRatio, assetImageSrcsetRatio } from "@/lib/supabase/queries";

// Foto reale del salone (barbiere al lavoro) — bucket `asset/`, servita come
// webp dal transform Supabase. Sostituisce il vecchio render forbici+rosa
// statico (`/hero-seq/frame_001.webp`).
const HERO_IMG = "hero-home.webp";
const HERO_SIZES = "(min-width:1280px) 50vw, (min-width:768px) 42vw, 100vw";
const HERO_ALT =
    "Barbiere di Hair Rich mentre rifinisce il taglio di un cliente nel salone di Olbia";

// Token easing del brand (mirror dei CSS custom properties --ease-*).
const EASE_CINEMA = [0.7, 0, 0.3, 1] as const;
const EASE_SOFT = [0.25, 0.1, 0.25, 1] as const;

const H1_TAGLINE: Record<string, string> = {
    it: "Barbiere a Olbia",
    en: "Barbershop in Olbia, Sardinia",
    fr: "Barbier à Olbia, Sardaigne",
    de: "Barbier in Olbia, Sardinien",
};

function HeroTextBlock() {
    const { t, lang } = useT();
    const reduce = useReducedMotion();
    // In reduced-motion ogni variante diventa solo dissolvenza (niente y/scale/clip).
    const v = (full: Variants): Variants =>
        reduce ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } } : full;

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
    const eyebrow = v({
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const headlineContainer = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } } };
    const headlineLine = v({
        hidden: { opacity: 0, y: 48, clipPath: "inset(100% 0 0 0)" },
        show: { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", transition: { duration: 0.85, ease: EASE_CINEMA } },
    });
    const tagline = v({
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SOFT, delay: 0.1 } },
    });
    const body = v({
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const ctaWrap = v({
        hidden: { opacity: 0, y: 18, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE_SOFT } },
    });
    const meta = v({
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SOFT, delay: 0.05 } },
    });

    return (
        <motion.div
            className="flex flex-col justify-center items-center text-center md:items-start md:text-left"
            initial="hidden"
            animate="show"
            variants={container}
        >
            <Wordmark
                variant="mark"
                size="lg"
                className="mb-4 md:mb-7 [&>img]:h-24 lg:[&>img]:h-28 opacity-95 drop-shadow-[0_0_24px_rgba(212,165,116,0.22)]"
                animated
            />

            <motion.span className="text-display-alt text-2xl md:text-3xl text-accent-warm mb-1" variants={eyebrow}>
                The
            </motion.span>

            <motion.h1 className="text-display text-warm-white leading-[0.9] tracking-tight" variants={headlineContainer}>
                {["BARBER", "STUDIO"].map((word, i) => (
                    <span key={word} className="block overflow-hidden">
                        <motion.span
                            className="block text-[15vw] md:text-[9vw] lg:text-[6.2vw] xl:text-[5.4vw] 2xl:text-[5vw]"
                            variants={headlineLine}
                        >
                            {i === 1 ? <em className="text-display-alt not-italic text-silver">{word}</em> : word}
                        </motion.span>
                    </span>
                ))}
                <motion.span
                    className="block font-body text-sm md:text-base lg:text-lg uppercase tracking-[0.35em] text-accent-warm mt-4 md:mt-5"
                    variants={tagline}
                >
                    {H1_TAGLINE[lang] ?? H1_TAGLINE.it}
                </motion.span>
            </motion.h1>

            <motion.p
                className="mt-6 lg:mt-7 max-w-md lg:max-w-lg text-warm-white-muted text-sm md:text-base lg:text-lg leading-relaxed font-body"
                variants={body}
            >
                {t.hero.body}
            </motion.p>

            <motion.div className="mt-8 flex items-center justify-center md:justify-start" variants={ctaWrap}>
                <BookingCtaButton label={t.hero.primaryCta} />
            </motion.div>

            <motion.div
                className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold"
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

function HeroPhoto({ mobile = false }: { mobile?: boolean }) {
    const { t } = useT();
    const reduce = useReducedMotion();

    // Parallax desktop, solo se non reduced-motion + puntatore fine + lg+.
    const { scrollY } = useScroll();
    const rawY = useTransform(scrollY, [0, 700], [0, -20]);
    const [enableParallax, setEnableParallax] = useState(false);
    useEffect(() => {
        if (reduce || mobile) return;
        const mq = window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:1024px)");
        const update = () => setEnableParallax(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, [reduce, mobile]);

    const frameV = reduce
        ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }
        : {
              hidden: { opacity: 0, clipPath: "inset(0 0 0 14%)" },
              show: {
                  opacity: 1,
                  clipPath: "inset(0 0 0 0%)",
                  transition: { duration: 1.0, ease: EASE_CINEMA, delay: 0.2 },
              },
          };
    const captionV = reduce
        ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4, delay: 0.6 } } }
        : {
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SOFT, delay: 1.0 } },
          };

    return (
        <motion.div
            className={`overflow-hidden [clip-path:inset(0)] vignette ${
                mobile
                    ? "md:hidden relative w-full aspect-[3/2]"
                    : "hidden md:block md:flex-1 w-full lg:rounded-l-[var(--radius-lg)]"
            }`}
            initial="hidden"
            animate="show"
            variants={frameV}
        >
            <motion.div className="absolute inset-0" style={{ y: enableParallax ? rawY : 0 }}>
                <img
                    src={assetImageUrlRatio(HERO_IMG, mobile ? 800 : 1280, 3 / 2, 80)}
                    srcSet={assetImageSrcsetRatio(HERO_IMG, 3 / 2, 80)}
                    sizes={HERO_SIZES}
                    width={1280}
                    height={853}
                    alt={HERO_ALT}
                    className={`absolute inset-0 w-full h-full object-cover select-none scale-[1.08] ${
                        mobile
                            ? "[object-position:55%_45%]"
                            : "[object-position:60%_45%] lg:[object-position:58%_42%] xl:[object-position:55%_42%]"
                    }`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                />
            </motion.div>

            {/* Scrim: leggibilità caption + raccordo col nero della sezione sotto */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            {!mobile && (
                <div className="absolute inset-y-0 left-0 w-1/3 pointer-events-none bg-gradient-to-r from-black/55 to-transparent" />
            )}

            {/* Caption chip */}
            <motion.div
                className={`absolute z-20 bg-black/65 backdrop-blur-md border border-line rounded-[var(--radius-md)] px-4 py-3 max-w-[220px] ${
                    mobile ? "left-3 bottom-3" : "left-4 bottom-6 lg:left-6 lg:bottom-8"
                }`}
                variants={captionV}
            >
                <span className="text-display-alt text-lg text-accent-warm leading-none">{t.hero.captionEyebrow}</span>
                <p className="text-display text-[11px] text-warm-white tracking-[0.25em] mt-1">{t.hero.captionTitle}</p>
            </motion.div>

            {!mobile && (
                <span className="absolute right-3 top-6 z-20 text-[10px] tracking-[0.5em] uppercase text-silver-dark font-body font-semibold [writing-mode:vertical-rl] rotate-180 select-none pointer-events-none">
                    EST. 2017
                </span>
            )}
        </motion.div>
    );
}

export function HeroSection() {
    return (
        <section className="relative bg-black isolate overflow-hidden" aria-label="Hero">
            <div className="relative grid grid-cols-1 md:grid-cols-12 md:min-h-[90dvh] lg:min-h-[88dvh] xl:min-h-[90dvh] max-w-[1920px] mx-auto pt-[max(env(safe-area-inset-top,0px),88px)] md:pt-0">
                {/* Colonna testo */}
                <div className="md:col-span-7 xl:col-span-6 relative z-10 flex flex-col justify-center px-6 md:pl-12 lg:pl-16 xl:pl-20 2xl:pl-24 md:pr-8 lg:pr-12 xl:pr-16 md:pt-28 lg:pt-32 xl:pt-36 pb-12 md:pb-20">
                    <HeroTextBlock />
                </div>

                {/* Colonna foto: a destra su desktop (sfonda fino al top sotto l'header
                   fisso), sotto il testo su mobile (a tutta larghezza, formato scena). */}
                <div className="md:col-span-5 xl:col-span-6 relative md:flex md:flex-col mt-4 md:mt-0">
                    <HeroPhoto />
                    <HeroPhoto mobile />
                </div>
            </div>
        </section>
    );
}
