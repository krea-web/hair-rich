"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    fetchAvailableSlots,
    fetchServices,
    portfolioImageUrl,
    portfolioImageSrcset,
    assetImageUrl,
    assetImageSrcset,
} from "@/lib/supabase/queries";
import type { AvailableSlot, Service } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { SmartImage } from "./_shared/SmartImage";

interface ServiceEnrichment {
    poetic: string;
    persona: string;
    tools: string[];
    /** Storage path inside the bucket. */
    coverImage: string;
    /** Defaults to "portfolio". Set to "asset" for real salon shots. */
    coverBucket?: "portfolio" | "asset";
}

const ENRICHMENT: Record<string, ServiceEnrichment> = {
    "taglio-classico": {
        poetic: "Forbice, controllo, niente fronzoli. La scuola italiana al millimetro.",
        persona: "Per chi sa cosa vuole e lo vuole eseguito bene.",
        tools: ["Forbice Joewell 5.5\"", "Shampoo dedicato", "Spazzolata finale"],
        coverImage: "salone-team-staff.webp",
        coverBucket: "asset",
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
        coverImage: "salone-vista-completa.webp",
        coverBucket: "asset",
    },
    "taglio-domicilio": {
        poetic: "Veniamo noi. Stessa attrezzatura, stessa cura. A casa, in albergo, in barca.",
        persona: "Per chi viaggia, per occasioni speciali, per la clientela VIP.",
        tools: ["Sopralluogo 24h prima", "Setup completo", "Aftercare via messaggio"],
        coverImage: "provvisorio/IMG_2549.jpeg",
    },
};

function coverUrl(en: ServiceEnrichment, width: number) {
    return en.coverBucket === "asset"
        ? assetImageUrl(en.coverImage, { width, quality: 80, format: "webp" })
        : portfolioImageUrl(en.coverImage, { width, quality: 80, format: "webp" });
}

function coverSrcset(en: ServiceEnrichment) {
    return en.coverBucket === "asset"
        ? assetImageSrcset(en.coverImage, 80)
        : portfolioImageSrcset(en.coverImage, 80);
}

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

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const toggleExpand = (id: string) => {
        setExpandedId((cur) => (cur === id ? null : id));
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
                                                    src={coverUrl(enrich, 1200)}
                                                    srcSet={coverSrcset(enrich)}
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
                                                onClick={() => toggleExpand(s.id)}
                                                className="inline-flex items-center gap-2 px-5 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform whitespace-nowrap"
                                                aria-expanded={expandedId === s.id}
                                            >
                                                {expandedId === s.id ? "Chiudi" : "Prenota"}
                                                <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 transition-transform ${expandedId === s.id ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Inline quick-book: next 3 available slots fetched on expand */}
                                        <AnimatePresence>
                                            {expandedId === s.id && (
                                                <InlineQuickBook
                                                    serviceId={s.id}
                                                    onSlotPick={(date, time) => {
                                                        useBookingStore.getState().setService(s.id);
                                                        useBookingStore.getState().setDate(date);
                                                        useBookingStore.getState().setTime(time);
                                                        useBookingStore.getState().setStep(2);
                                                        openDrawer();
                                                    }}
                                                    onFullWizard={() => handleBook(s.id)}
                                                />
                                            )}
                                        </AnimatePresence>
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

interface InlineQuickBookProps {
    serviceId: string;
    onSlotPick: (date: string, time: string) => void;
    onFullWizard: () => void;
}

interface QuickSlot {
    date: string;
    time: string;
    dayLabel: string;
}

/**
 * Scans the next 14 days, picks the first 3 slots available. Rendered
 * inside an AnimatePresence so the height transitions smoothly. Tapping a
 * slot pre-fills the booking store (service + date + time) and jumps the
 * drawer straight to the Confirm step.
 */
function InlineQuickBook({ serviceId, onSlotPick, onFullWizard }: InlineQuickBookProps) {
    const [slots, setSlots] = useState<QuickSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            const out: QuickSlot[] = [];
            try {
                for (let i = 0; i < 14 && out.length < 3; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    if (d.getDay() === 0 || d.getDay() === 1) continue;
                    const dateStr = d.toISOString().split("T")[0]!;
                    const rows: AvailableSlot[] = await fetchAvailableSlots({
                        date: dateStr,
                        serviceId,
                    });
                    const uniqueTimes = Array.from(
                        new Set(rows.map((r) => r.slot_time.slice(0, 5)))
                    ).sort();
                    for (const t of uniqueTimes) {
                        if (out.length >= 3) break;
                        out.push({
                            date: dateStr,
                            time: t,
                            dayLabel: d.toLocaleDateString("it-IT", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            }),
                        });
                    }
                }
            } catch {
                /* ignore */
            }
            if (alive) {
                setSlots(out);
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [serviceId]);

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
        >
            <div className="mt-6 pt-6 border-t border-line">
                <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                    Prossimi 3 slot disponibili
                </span>
                {loading ? (
                    <div className="mt-3 flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-16 flex-1 bg-black-2 border border-line rounded-[var(--radius-sm)] animate-pulse" />
                        ))}
                    </div>
                ) : slots.length === 0 ? (
                    <p className="mt-3 text-warm-white-muted text-sm">
                        Nessuno slot libero nei prossimi 14 giorni. Tocca <button onClick={onFullWizard} className="underline text-accent-warm">scegli giorno e barber</button> per esplorare l'agenda completa.
                    </p>
                ) : (
                    <>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {slots.map((s) => (
                                <button
                                    key={`${s.date}-${s.time}`}
                                    onClick={() => onSlotPick(s.date, s.time)}
                                    className="flex flex-col items-start gap-1 p-3 bg-black-2 border border-line rounded-[var(--radius-sm)] hover:border-accent-warm hover:bg-accent-warm/5 transition-colors active:scale-95"
                                >
                                    <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                        {s.dayLabel}
                                    </span>
                                    <span className="text-warm-white text-base font-mono tabular-nums">
                                        {s.time}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={onFullWizard}
                            className="mt-4 text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                        >
                            Oppure scegli giorno e barber →
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
