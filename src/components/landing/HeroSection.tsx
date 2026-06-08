"use client";

import { motion } from "framer-motion";
import { Wordmark } from "./_shared/Wordmark";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";
import { useT } from "@/i18n/useLang";

const HERO_PHOTO = "/hero-seq/frame_001.webp";

// Hero pulita: Wordmark + "The" + BARBER STUDIO + payoff + 1 sola CTA.
// Trust badges, metric cards, NextSlot, OpenNow, secondary CTA sono
// stati rimossi perché su PC creavano un'accozzaglia che la utente non
// voleva. La booking CTA resta unica e dominante; gli altri segnali
// (open now, rating, indirizzo) vivono in sezioni dedicate più sotto.
const H1_TAGLINE: Record<string, string> = {
    it: "Barbiere a Olbia",
    en: "Barbershop in Olbia, Sardinia",
    fr: "Barbier à Olbia, Sardaigne",
    de: "Barbier in Olbia, Sardinien",
};

function HeroTextBlock({ withWordmark = true }: { withWordmark?: boolean }) {
    const { t, lang } = useT();
    return (
        <div className="flex flex-col justify-center items-center text-center md:items-start md:text-left">
            {withWordmark && (
                <Wordmark
                    variant="mark"
                    size="lg"
                    className="mb-4 md:mb-8 [&>img]:h-32 md:[&>img]:h-48 lg:[&>img]:h-56 xl:[&>img]:h-64 opacity-95 drop-shadow-[0_0_24px_rgba(212,165,116,0.22)]"
                    animated
                />
            )}

            <motion.span
                className="text-display-alt text-2xl md:text-3xl lg:text-2xl xl:text-3xl text-accent-warm mb-1"
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
                        className="block text-[13vw] md:text-[8.5vw] lg:text-[4vw] xl:text-[3.5vw] 2xl:text-[3.2vw]"
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
                <motion.span
                    className="block font-body text-sm md:text-base lg:text-base xl:text-lg uppercase tracking-[0.35em] text-accent-warm mt-4 md:mt-5"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
                    }}
                >
                    {H1_TAGLINE[lang] ?? H1_TAGLINE.it}
                </motion.span>
            </motion.h1>

            <motion.p
                className="mt-5 md:mt-6 lg:mt-7 max-w-md lg:max-w-lg xl:max-w-xl mx-auto md:mx-0 text-warm-white-muted text-sm md:text-base lg:text-base xl:text-lg leading-relaxed font-body"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                Da otto anni la nostra missione è scolpire la tua identità. Taglio, barba e trattamenti esclusivi
                nel cuore di Olbia.
            </motion.p>

            <motion.div
                className="mt-6 md:mt-8 flex items-center justify-center md:justify-start"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                <BookingCtaButton label={t.hero.primaryCta} />
            </motion.div>
        </div>
    );
}

export function HeroSection() {
    return (
        <section className="relative bg-black overflow-hidden" aria-label="Hero">
            {/* Nav globale: vive in SiteHeader (fisso, persistente) — non più
               dentro l'hero. */}

            {/* Hero content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 lg:gap-12 xl:gap-16 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-12 md:pb-16 lg:pb-18 xl:pb-20 min-h-[70dvh] md:min-h-[85dvh] lg:min-h-[50vh] xl:min-h-[46vh] 2xl:min-h-[42vh] max-w-[1920px] mx-auto">
                <div className="md:col-span-7 flex flex-col justify-center">
                    <HeroTextBlock />
                </div>

                {/* Static photo (PC only). On mobile the intro sequence already
                   delivered the visual; we keep the hero text-only for breathing
                   room. */}
                <div className="hidden md:block md:col-span-5 relative">
                    <motion.div
                        className="sticky top-24 lg:top-20 xl:top-24 2xl:top-28 aspect-[4/5] lg:aspect-[5/6] xl:aspect-[4/5] w-full max-h-[440px] lg:max-h-[500px] xl:max-h-[560px] 2xl:max-h-[600px] mx-auto"
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
