"use client";

import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";

/**
 * Slim hero for /servizi. Big watermark numeral behind the headline,
 * a short body line, and a flat strip of price pills (3 bookable +
 * 1 phone-only home anchor). The detailed service cards live below
 * in StyleQuiz so this header doesn't repeat the catalog.
 */
export function ServicesHero() {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={portfolioImageUrl("provvisorio/IMG_2090.jpeg", {
                        width: 1920,
                        quality: 70,
                        format: "webp",
                    })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                    loading="eager"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/30" />
            </div>

            {/* Giant ordinal — sits behind the headline */}
            <div
                aria-hidden="true"
                className="absolute right-2 md:right-8 top-16 md:top-12 text-display-alt text-[35vw] md:text-[20vw] lg:text-[15vw] text-accent-warm/[0.07] leading-none pointer-events-none select-none"
            >
                01
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-28 md:pt-44 pb-12 md:pb-20 min-h-[80vh] md:min-h-[90vh] flex flex-col justify-end">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-3xl"
                >
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        I servizi · L'indice
                    </span>
                    <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight mt-3 md:mt-5 leading-[0.95]">
                        Listino chiaro.
                        <br />
                        <em className="text-display-alt not-italic text-silver">
                            Niente sorprese.
                        </em>
                    </h1>
                    <p className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Tre servizi prenotabili online in 60 secondi. Un quarto su misura
                        — il taglio a domicilio — si organizza solo per telefono.
                    </p>
                </motion.div>

                {/* Quick at-a-glance pricing strip — three pills, no full
                    index here (the catalog block below shows everything in
                    detail). Plus a phone-only home-service teaser. */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
                    }}
                    className="mt-10 md:mt-14 flex flex-wrap gap-2 md:gap-3"
                >
                    {[
                        { label: "Taglio capelli", price: "20€" },
                        { label: "Taglio barba", price: "10€" },
                        { label: "Capelli + barba", price: "30€" },
                    ].map((p) => (
                        <motion.span
                            key={p.label}
                            variants={{
                                hidden: { opacity: 0, y: 12 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-black/40 backdrop-blur-md"
                        >
                            <span className="text-[10px] uppercase tracking-[0.25em] text-warm-white font-body font-semibold">
                                {p.label}
                            </span>
                            <span className="text-accent-warm font-display text-sm tabular-nums">
                                {p.price}
                            </span>
                        </motion.span>
                    ))}
                    <motion.a
                        variants={{
                            hidden: { opacity: 0, y: 12 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        href="#taglio-a-domicilio"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-accent-warm/40 bg-accent-warm/10 hover:bg-accent-warm/20 transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.91.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-accent-warm font-body font-semibold">
                            A domicilio · solo telefono
                        </span>
                    </motion.a>
                </motion.div>
            </div>
        </section>
    );
}
