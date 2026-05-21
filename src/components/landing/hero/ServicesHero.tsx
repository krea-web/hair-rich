"use client";

import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";

const SERVICES = [
    { num: "01", name: "Taglio capelli", time: "30 min · 20€" },
    { num: "02", name: "Taglio barba", time: "30 min · 10€" },
    { num: "03", name: "Taglio capelli + barba", time: "60 min · 30€" },
    { num: "04", name: "Taglio a domicilio", time: "solo telefono" },
];

/**
 * "Editorial index" hero for /servizi. Big watermark numeral on the right
 * (the brand's 01 / 04 ordinal) intersects the title. A service ledger
 * occupies the lower half — four lines, each numbered, that act as both
 * a tease of the catalogue below and a scannable answer to "cosa offrite".
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

                {/* Service index */}
                <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
                    }}
                    className="mt-10 md:mt-14 divide-y divide-line/40 border-y border-line/40"
                >
                    {SERVICES.map((r) => (
                        <motion.li
                            key={r.num}
                            variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 },
                            }}
                            className="flex items-baseline gap-4 md:gap-6 py-3 md:py-4 group cursor-default"
                        >
                            <span className="text-display-alt text-accent-warm text-xl md:text-3xl tabular-nums shrink-0">
                                {r.num}
                            </span>
                            <span className="flex-1 text-display text-warm-white text-lg md:text-2xl lg:text-3xl tracking-tight">
                                {r.name}
                            </span>
                            <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-silver-dark font-body font-semibold shrink-0">
                                {r.time}
                            </span>
                        </motion.li>
                    ))}
                </motion.ul>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="mt-6 md:mt-8 flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Consulto · 60 secondi
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        01 / Trova il tuo
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
