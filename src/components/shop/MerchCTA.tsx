"use client";

import { motion } from "framer-motion";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import { SITE } from "@/lib/constants";

/**
 * Phone-only CTA for Hair Rich branded merch (T-shirt, felpe, cappellini).
 * Niente catalogo online — il merch è limitato, va richiesto direttamente
 * in salone. Stesso pattern di HomeServiceFocus: foto bg, watermark, big
 * tel: CTA. Ancorato a #merch — la card "Merchandising" nell'hero ci
 * atterra.
 */
export function MerchCTA() {
    const phoneHref = "tel:" + SITE.phone.replace(/\s+/g, "");
    return (
        <section
            id="merch"
            className="relative overflow-hidden border-y border-line"
            aria-labelledby="merch-title"
        >
            {/* Photo background — il team in salone, capi brand visibili */}
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={assetImageUrl("salone-team-staff.webp", { width: 1920, quality: 70, format: "webp" })}
                    srcSet={assetImageSrcset("salone-team-staff.webp", 70)}
                    sizes="100vw"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-black/90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/55" />
            </div>

            {/* Watermark */}
            <div
                aria-hidden="true"
                className="absolute -bottom-8 right-2 md:right-12 text-display-alt text-[28vw] md:text-[14vw] text-warm-white/[0.05] leading-none pointer-events-none select-none"
            >
                merch
            </div>

            <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-w-3xl"
                >
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/15 border border-accent-warm/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                            Edizione limitata · solo in salone
                        </span>
                    </span>

                    <h2
                        id="merch-title"
                        className="text-display text-4xl sm:text-5xl md:text-7xl text-warm-white tracking-tight mt-5 md:mt-7 leading-[0.95]"
                    >
                        Merch ufficiale
                        <br />
                        <em className="text-display-alt not-italic text-silver">Hair Rich.</em>
                    </h2>

                    <p className="mt-6 md:mt-8 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl">
                        T-shirt, felpe e cappellini brandizzati Hair Rich. Niente catalogo
                        online, pezzi limitati. Chiamaci per sapere cosa abbiamo
                        disponibile, taglie e colori — passa a ritirare in salone.
                    </p>

                    {/* Three quick facts */}
                    <dl className="mt-8 md:mt-10 grid grid-cols-3 gap-3 md:gap-6 max-w-lg">
                        {[
                            { v: "Limited", l: "Drop esclusivi" },
                            { v: "100%", l: "Cotone premium" },
                            { v: "Olbia", l: "Solo in salone" },
                        ].map((m) => (
                            <div key={m.l} className="border-l-2 border-accent-warm/60 pl-3">
                                <dt className="text-display text-2xl md:text-3xl text-warm-white tabular-nums">
                                    {m.v}
                                </dt>
                                <dd className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                    {m.l}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/* Primary phone CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-10 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                        <a
                            href={phoneHref}
                            className="cta-shine cta-pulse group inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-accent-warm text-black rounded-full text-sm md:text-base uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform shadow-[0_22px_60px_-15px_rgba(212,165,116,0.6)]"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.91.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                            </svg>
                            Chiama per richiedere
                        </a>
                        <a
                            href={phoneHref}
                            className="text-warm-white font-display text-2xl md:text-3xl tabular-nums hover:text-accent-warm transition-colors"
                        >
                            {SITE.phone}
                        </a>
                    </motion.div>

                    <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Disponibili negli orari di apertura
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
