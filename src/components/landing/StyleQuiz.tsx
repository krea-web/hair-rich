"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

const ORDER = ["taglio-classico", "barba-sartoriale", "taglio-barba"];

const COPY: Record<string, { tag: string; quick: string; cta: string }> = {
    "taglio-classico": {
        tag: "Solo capelli",
        quick: "Ascolto + esecuzione + finish. 30 minuti, finito.",
        cta: "Prenota taglio capelli",
    },
    "barba-sartoriale": {
        tag: "Solo barba",
        quick: "Rasoio classico, contorni, olio scelto sul tipo di pelle.",
        cta: "Prenota taglio barba",
    },
    "taglio-barba": {
        tag: "Combo",
        quick: "Un'ora intera. Capelli e barba in continuità.",
        cta: "Prenota combo",
    },
};

/**
 * "Build your service" lead-magnet block on /servizi. Replaces the older
 * 4-question quiz now that the catalog is just three SKUs — the quiz no
 * longer needs to "compute" a recommendation, the visitor can pick from
 * the table directly. Three big tiles, one tap to open the booking drawer
 * with the service preselected.
 */
export function StyleQuiz() {
    const [services, setServices] = useState<Service[]>([]);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        let alive = true;
        fetchServices()
            .then((rows) => {
                if (!alive) return;
                const filtered = rows
                    .filter((r) => ORDER.includes(r.slug))
                    .sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug));
                setServices(filtered);
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    const handlePick = (serviceId: string) => {
        setService(serviceId);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
        openDrawer();
    };

    return (
        <section
            id="costruisci"
            className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black-2 border-y border-line overflow-hidden"
        >
            {/* Editorial watermark */}
            <div
                aria-hidden="true"
                className="absolute -bottom-10 right-2 md:right-8 text-display-alt text-[28vw] md:text-[14vw] text-warm-white/[0.04] leading-none pointer-events-none select-none"
            >
                scegli
            </div>

            <div className="relative max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <div className="max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Costruisci il tuo servizio
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Tre opzioni. Un tap. Sei in poltrona.
                    </h2>
                    <p className="mt-4 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Taglio 20€, barba 10€, combo 30€. Scegli cosa fare oggi e
                        prenoti il prossimo slot — in 60 secondi.
                    </p>
                </div>

                <motion.ul
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
                    }}
                    className="mt-10 md:mt-14 lg:mt-16 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 lg:gap-8 xl:gap-10"
                >
                    {(services.length > 0
                        ? services
                        : (ORDER.map((slug) => ({
                              id: slug,
                              slug,
                              name:
                                  slug === "taglio-classico"
                                      ? "Taglio capelli"
                                      : slug === "barba-sartoriale"
                                        ? "Taglio barba"
                                        : "Taglio capelli + barba",
                              price_cents:
                                  slug === "taglio-classico"
                                      ? 2000
                                      : slug === "barba-sartoriale"
                                        ? 1000
                                        : 3000,
                              duration_min:
                                  slug === "taglio-classico"
                                      ? 30
                                      : slug === "barba-sartoriale"
                                        ? 30
                                        : 60,
                              badge: slug === "taglio-classico" ? "Più scelto" : null,
                          })) as unknown as Service[])
                    ).map((s, i) => {
                        const c = COPY[s.slug] ?? { tag: "", quick: "", cta: `Prenota ${s.name}` };
                        const featured = s.slug === "taglio-classico";
                        return (
                            <motion.li
                                key={s.slug}
                                variants={{
                                    hidden: { opacity: 0, y: 24 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                                className={`relative bg-carbon border rounded-[var(--radius-md)] p-6 md:p-7 flex flex-col gap-4 transition-colors ${
                                    featured
                                        ? "border-accent-warm/60 shadow-[0_18px_50px_-25px_rgba(212,165,116,0.45)]"
                                        : "border-line hover:border-silver-mid"
                                }`}
                            >
                                {s.badge && (
                                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 px-3 py-1 bg-accent-warm text-black text-[9px] uppercase tracking-[0.3em] font-body font-bold rounded-full">
                                        <span className="w-1 h-1 rounded-full bg-black" aria-hidden="true" />
                                        {s.badge}
                                    </span>
                                )}

                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-display-alt text-accent-warm text-xl tabular-nums">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                        {c.tag}
                                    </span>
                                </div>

                                <h3 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight leading-tight">
                                    {s.name}
                                </h3>

                                <p className="text-warm-white-muted text-sm leading-relaxed flex-1">
                                    {c.quick}
                                </p>

                                <div className="flex items-baseline gap-3 pt-3 border-t border-line">
                                    <span className="text-display text-3xl text-accent-warm tabular-nums leading-none">
                                        {formatPrice(s.price_cents)}
                                    </span>
                                    <span className="text-silver-dark text-xs">
                                        · {s.duration_min} min
                                    </span>
                                </div>

                                <button
                                    onClick={() => handlePick(s.id)}
                                    className="cta-shine cta-pulse group inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                >
                                    {c.cta}
                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            </div>
        </section>
    );
}
