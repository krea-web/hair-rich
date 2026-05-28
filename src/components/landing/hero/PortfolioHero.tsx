"use client";

import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";

const TEASER_IMAGES = [
    "tagli/taper-fade-01.jpeg",
    "tagli/burst-fade-01.jpeg",
    "tagli/french-crop-01.jpeg",
    "tagli/mid-fade-01.jpeg",
    "tagli/buzz-cut-01.jpeg",
];

/**
 * "Mosaic gallery" hero for /lavori. Left column: editorial title +
 * archive metrics. Right column: an offset 2-column mosaic of real
 * portfolio teasers with subtle parallax staggers, each tagged with a
 * tiny ordinal so the eye reads the page as a contact sheet.
 */
export function PortfolioHero() {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36 pb-12 md:pb-16 lg:pb-20 xl:pb-24 min-h-[70vh] md:min-h-[75vh] lg:min-h-[62vh] xl:min-h-[58vh] 2xl:min-h-[55vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
                    {/* Left column — text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-7"
                    >
                        <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                            Contact sheet · 2024–2026
                        </span>
                        <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] text-warm-white tracking-tight mt-3 md:mt-5 leading-[0.92]">
                            Tagli che
                            <br />
                            hanno{" "}
                            <em className="text-display-alt not-italic text-silver">
                                camminato
                            </em>
                            <br />
                            fuori da qui.
                        </h1>
                        <p className="mt-5 md:mt-7 max-w-md text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Ogni foto è un cliente vero, scattata a fine servizio. Niente stock,
                            niente IA, niente catalogo riciclato. Solo quello che facciamo davvero.
                        </p>

                        {/* Metrics row */}
                        <motion.dl
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
                            }}
                            className="mt-8 md:mt-12 grid grid-cols-3 gap-4 max-w-md"
                        >
                            {[
                                { value: "240+", label: "Tagli archiviati" },
                                { value: "12", label: "Mesi attivi" },
                                { value: "4.9★", label: "Media recensioni" },
                            ].map((m) => (
                                <motion.div
                                    key={m.label}
                                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                    className="border-l-2 border-accent-warm/60 pl-3"
                                >
                                    <dt className="text-display text-2xl md:text-3xl text-warm-white tabular-nums">
                                        {m.value}
                                    </dt>
                                    <dd className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                        {m.label}
                                    </dd>
                                </motion.div>
                            ))}
                        </motion.dl>
                    </motion.div>

                    {/* Right column — square contact-sheet mosaic. Same square
                        tile shape as the rest of the site (gallery grid),
                        photos fill the tile via object-cover. Alternating
                        parallax offset on desktop keeps the editorial feel. */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
                        }}
                        className="lg:col-span-5 grid grid-cols-2 gap-2 md:gap-3 lg:gap-5 xl:gap-6"
                    >
                        {TEASER_IMAGES.slice(0, 4).map((path, i) => {
                            const offsetClass = i % 2 === 0 ? "lg:translate-y-6" : "";
                            return (
                                <motion.figure
                                    key={path}
                                    variants={{
                                        hidden: { opacity: 0, y: 24 },
                                        visible: { opacity: 1, y: 0 },
                                    }}
                                    className={`relative aspect-square rounded-[var(--radius-md)] overflow-hidden border border-line group ${offsetClass}`}
                                >
                                    <img
                                        src={portfolioImageUrl(path, {
                                            width: 600,
                                            height: 600,
                                            resize: "cover",
                                            quality: 75,
                                            format: "webp",
                                        })}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                        loading="eager"
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-[0.3em] text-warm-white font-body font-semibold tabular-nums">
                                        #{String(i + 1).padStart(3, "0")}
                                    </span>
                                </motion.figure>
                            );
                        })}
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="absolute left-6 md:left-12 lg:left-20 right-6 md:right-12 lg:right-20 bottom-6 md:bottom-8 flex items-end justify-between gap-4 pointer-events-none"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Archive 2024 — 2026
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        02 / Lavori
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
