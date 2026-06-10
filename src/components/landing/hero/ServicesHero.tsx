"use client";

import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";

/**
 * Hero for /servizi. Photo backdrop, watermark numeral, hero claim + CTA
 * + 3 trust metrics. Il listino dettagliato vive in StyleQuiz più sotto,
 * qui in alto solo il pitch e la conferma di velocità del booking.
 */
export function ServicesHero() {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={portfolioImageUrl("tagli/mid-fade-01.jpeg", {
                        width: 1920,
                        quality: 70,
                        format: "webp",
                    })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/30" />
            </div>

            {/* Giant ordinal — sits behind the CTA */}
            <div
                aria-hidden="true"
                className="absolute right-2 md:right-8 top-16 md:top-12 text-display-alt text-[35vw] md:text-[20vw] lg:text-[15vw] text-accent-warm/[0.07] leading-none pointer-events-none select-none"
            >
                01
            </div>

            <div className="relative max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36 pb-16 md:pb-24 lg:pb-32 min-h-[65vh] md:min-h-[70vh] lg:min-h-[48vh] xl:min-h-[44vh] 2xl:min-h-[42vh] flex flex-col items-center justify-end text-center">
                {/* Eyebrow live-availability chip */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/15 border border-accent-warm/40 mb-6 md:mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                        Su prenotazione · Olbia centro
                    </span>
                </motion.div>

                {/* Hero claim */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
                    className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-warm-white tracking-tight leading-[0.92] max-w-3xl"
                >
                    Taglio e barba
                    <br />
                    <em className="text-display-alt not-italic text-silver">a Olbia.</em>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.45 }}
                    className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed"
                >
                    Taglio capelli 20€, barba 10€, taglio + barba 30€. Prenoti online in un minuto,
                    paghi in salone. Lavaggio e styling sempre inclusi.
                </motion.p>

                {/* Primary CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-8 md:mt-10"
                >
                    <BookingCtaButton label="Prenota ora" />
                </motion.div>

                {/* Trust metrics — non duplicano il listino, parlano di flusso */}
                <motion.dl
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.85 } },
                    }}
                    className="mt-10 md:mt-14 lg:mt-16 grid grid-cols-3 gap-4 md:gap-8 lg:gap-12 xl:gap-16 max-w-xl lg:max-w-2xl xl:max-w-3xl"
                >
                    {[
                        { v: "da 20€", l: "Listino" },
                        { v: "60s", l: "Prenoti online" },
                        { v: "4,6★", l: "37 recensioni" },
                    ].map((m) => (
                        <motion.div
                            key={m.l}
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                            className="text-left border-l-2 border-accent-warm/60 pl-3"
                        >
                            <dt className="text-display text-2xl md:text-3xl text-warm-white tabular-nums">
                                {m.v}
                            </dt>
                            <dd className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                {m.l}
                            </dd>
                        </motion.div>
                    ))}
                </motion.dl>

                {/* Footer meta */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="mt-10 md:mt-14 w-full flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Conferma immediata
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        01 / Servizi
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
