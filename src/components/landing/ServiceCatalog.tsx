"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchServices, portfolioImageUrl, portfolioImageSrcset } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { SmartImage } from "./_shared/SmartImage";

interface ServiceEnrichment {
    poetic: string;
    persona: string;
    tools: string[];
    coverImage: string; // storage_path in portfolio bucket
}

const ENRICHMENT: Record<string, ServiceEnrichment> = {
    "taglio-classico": {
        poetic: "Forbice, controllo, niente fronzoli. La scuola italiana al millimetro.",
        persona: "Per chi sa cosa vuole e lo vuole eseguito bene.",
        tools: ["Forbice Joewell 5.5\"", "Shampoo dedicato", "Spazzolata finale"],
        coverImage: "provvisorio/IMG_1200.jpeg",
    },
    "fade-sfumatura": {
        poetic: "Tre lunghezze graduate, transizione invisibile, contorni a rasoio.",
        persona: "Per chi vuole un risultato che si nota — anche se non sa come si chiama.",
        tools: ["Macchinetta · 3 lunghezze", "Rasoio per contorni", "Pomata finale"],
        coverImage: "provvisorio/IMG_2090.jpeg",
    },
    "razor-cut": {
        poetic: "Rasoio sulle punte, texture viva, niente forme rigide.",
        persona: "Per chi ha capelli che chiedono movimento, non struttura.",
        tools: ["Rasoio a mano libera", "Forbice-trama", "Asciugatura morbida"],
        coverImage: "provvisorio/IMG_1208.jpeg",
    },
    "barba-sartoriale": {
        poetic: "Asciugamano caldo, rasoio classico, olio sulla pelle.",
        persona: "Per chi cura il volto come un capo d'abbigliamento.",
        tools: ["Asciugamano caldo", "Rasoio classico", "Olio post-shave"],
        coverImage: "provvisorio/IMG_2143.jpeg",
    },
    "taglio-barba": {
        poetic: "Un'ora intera. Capelli e barba in continuità, niente dettaglio lasciato indietro.",
        persona: "Per chi viene da noi una volta al mese e vuole tutto.",
        tools: ["Tutto il taglio classico", "Tutta la barba sartoriale", "Pausa relax"],
        coverImage: "provvisorio/IMG_2374.jpeg",
    },
    "taglio-domicilio": {
        poetic: "Veniamo noi. Stessa attrezzatura, stessa cura. A casa, in albergo, in barca.",
        persona: "Per chi viaggia, per occasioni speciali, per la clientela VIP.",
        tools: ["Sopralluogo 24h prima", "Setup completo", "Aftercare via messaggio"],
        coverImage: "provvisorio/IMG_2549.jpeg",
    },
};

export function ServiceCatalog() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        let alive = true;
        fetchServices()
            .then((rows) => {
                if (!alive) return;
                setServices(rows);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    const handleBook = (serviceId: string) => {
        setService(serviceId);
        openDrawer();
    };

    return (
        <section className="relative bg-black overflow-hidden">
            {/* Section intro */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-20 md:pt-28 pb-12 md:pb-16">
                <div className="max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Tutti i rituali · 06
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Esplora ogni rituale.
                    </h2>
                    <p className="mt-4 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Sei servizi, sei filosofie diverse. Ogni rituale ha la sua tecnica,
                        i suoi tempi, la sua persona di riferimento.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pb-20 space-y-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[480px] bg-black-2 border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="border-t border-line">
                    {services.map((s, i) => {
                        const enrich = ENRICHMENT[s.slug];
                        const reverse = i % 2 === 1;
                        return (
                            <motion.article
                                key={s.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                                className="relative border-b border-line"
                            >
                                <div className={`grid grid-cols-1 md:grid-cols-12 ${reverse ? "md:[direction:rtl]" : ""}`}>
                                    {/* Photo column */}
                                    <div className="md:col-span-7 relative overflow-hidden md:[direction:ltr]">
                                        <div className="relative aspect-[4/3] md:aspect-auto md:h-[640px]">
                                            {enrich?.coverImage && (
                                                <SmartImage
                                                    src={portfolioImageUrl(enrich.coverImage, { width: 1200, quality: 80, format: "webp" })}
                                                    srcSet={portfolioImageSrcset(enrich.coverImage, 80)}
                                                    sizes="(min-width: 768px) 58vw, 100vw"
                                                    alt={s.name}
                                                    className="h-full grayscale-[10%]"
                                                />
                                            )}
                                            {/* Gradient ramp */}
                                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/70 via-black/10 to-transparent pointer-events-none" />

                                            {/* Numero rituale top-left */}
                                            <div className="absolute top-5 left-5 md:top-8 md:left-8 flex items-baseline gap-3 text-warm-white">
                                                <span className="text-display-alt text-4xl md:text-6xl leading-none text-accent-warm">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-[0.4em] font-body font-semibold opacity-70">
                                                    Rituale
                                                </span>
                                            </div>

                                            {s.badge && (
                                                <div className="absolute top-5 right-5 md:top-8 md:right-8 inline-flex items-center px-3 py-1.5 bg-accent-warm text-black text-[9px] uppercase tracking-[0.3em] font-body font-bold rounded-full">
                                                    {s.badge}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Body column */}
                                    <div className="md:col-span-5 md:[direction:ltr] flex flex-col justify-center px-6 md:px-10 lg:px-14 py-10 md:py-12 bg-black">
                                        <h3 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight leading-[1.05]">
                                            {s.name}
                                        </h3>

                                        {enrich?.poetic && (
                                            <p className="mt-4 text-display-alt text-lg md:text-2xl text-silver italic leading-snug">
                                                {enrich.poetic}
                                            </p>
                                        )}

                                        {enrich?.persona && (
                                            <div className="mt-6 pl-4 border-l-2 border-accent-warm/40">
                                                <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                                                    Per chi
                                                </span>
                                                <p className="mt-1 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                                    {enrich.persona}
                                                </p>
                                            </div>
                                        )}

                                        {enrich?.tools && enrich.tools.length > 0 && (
                                            <div className="mt-6">
                                                <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                                    Strumenti
                                                </span>
                                                <ul className="mt-3 flex flex-wrap gap-2">
                                                    {enrich.tools.map((t) => (
                                                        <li
                                                            key={t}
                                                            className="inline-flex items-center px-3 py-1.5 rounded-full border border-line text-warm-white-muted text-xs font-body"
                                                        >
                                                            {t}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Pricing + CTA row */}
                                        <div className="mt-8 pt-6 border-t border-line flex items-center justify-between gap-4">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Da
                                                </span>
                                                <div className="flex items-baseline gap-3 mt-1">
                                                    <span className="text-display text-3xl md:text-4xl text-accent-warm tabular-nums">
                                                        {formatPrice(s.price_cents)}
                                                    </span>
                                                    <span className="text-warm-white-muted text-sm">
                                                        · {s.duration_min} min
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleBook(s.id)}
                                                className="inline-flex items-center gap-2 px-5 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform whitespace-nowrap"
                                            >
                                                Prenota
                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
