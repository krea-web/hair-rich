"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

interface EnrichedService extends Service {
    longDescription: string;
    includes: string[];
}

const SERVICE_ENRICHMENT: Record<string, { longDescription: string; includes: string[] }> = {
    "taglio-classico": {
        longDescription:
            "Per chi ha già il proprio stile e vuole solo che venga eseguito al millimetro. Forbice, tecnica, controllo. Trent'anni di scuola italiana del taglio, applicata sulla tua testa con la stessa cura che mettiamo nei tagli editorial.",
        includes: [
            "Consulto iniziale di 2 minuti",
            "Shampoo professionale e massaggio cuoio capelluto",
            "Taglio a forbice + rifinitura",
            "Styling finale con prodotto adatto",
            "Spazzolata a manopola finale",
        ],
    },
    "fade-sfumatura": {
        longDescription:
            "La sfumatura chirurgica che ridefinisce il volto. Macchinetta su tre lunghezze diverse, rifinitura a rasoio sulle aree critiche. È il servizio più richiesto perché è quello in cui si vede di più la differenza tra un barber qualunque e uno di Hair Rich.",
        includes: [
            "Consulto + studio della forma del viso",
            "Shampoo + maschera mineralizzante",
            "Fade tecnico con 3 lunghezze graduate",
            "Rifinitura a rasoio su tempie e nuca",
            "Styling con pomata o cera a scelta",
        ],
    },
    "razor-cut": {
        longDescription:
            "Lavorazione completa con rasoio per dare movimento, texture e leggerezza al capello. Tecnica usata sui set editoriali — il risultato è naturale, non costruito, ma sotto c'è una mappa precisa di asportazioni millimetriche.",
        includes: [
            "Consulto sulla direzione naturale del capello",
            "Shampoo nutriente",
            "Razor cut a mano libera",
            "Texturizzazione con forbice-trama",
            "Asciugatura morbida e styling finale",
        ],
    },
    "barba-sartoriale": {
        longDescription:
            "La barba come elemento sartoriale del volto, non come ricrescita da gestire. Modellatura ad asciugamano caldo, lavorazione a rasoio e finitura con olio personalizzato sulla base del tuo tipo di pelle.",
        includes: [
            "Asciugamano caldo pre-trattamento",
            "Pre-shave oil e schiuma artigianale",
            "Rasatura/modellatura a rasoio classico",
            "Rifinitura forbice sui contorni",
            "Olio post-shave specifico per la tua pelle",
        ],
    },
    "taglio-barba": {
        longDescription:
            "Il combo signature di Hair Rich. Un'ora intera per uscire trasformato: taglio personalizzato + modellatura barba completa, con una pausa relax in mezzo. Risparmi 5€ rispetto al singolo e ottieni continuità stilistica tra capelli e barba.",
        includes: [
            "Tutto quello che è incluso nel taglio scelto",
            "Tutto quello che è incluso nella barba sartoriale",
            "Pausa relax di 5 minuti con bevanda calda",
            "Continuità stilistica tra capelli e barba",
            "Foto del risultato finale (su richiesta)",
        ],
    },
    "taglio-domicilio": {
        longDescription:
            "Hair Rich a casa tua, in ufficio, in albergo, in barca. Stesso rigore, stessi strumenti, stesso master barber — solo che ci spostiamo noi. Pensato per chi viaggia, per occasioni speciali (matrimoni, eventi) e per la nostra clientela VIP.",
        includes: [
            "Sopralluogo telefonico 24h prima",
            "Trasferta in tutta Olbia inclusa",
            "Stessa attrezzatura del salone",
            "Servizio completo come in salone",
            "Aftercare check via messaggio nei 7 giorni",
        ],
    },
};

export function ServiceCatalog() {
    const [services, setServices] = useState<EnrichedService[]>([]);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        let alive = true;
        fetchServices()
            .then((rows) => {
                if (!alive) return;
                setServices(
                    rows.map((r) => ({
                        ...r,
                        ...(SERVICE_ENRICHMENT[r.slug] ?? {
                            longDescription: r.description ?? "",
                            includes: [],
                        }),
                    }))
                );
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
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 md:mb-24 max-w-3xl">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        Catalogo completo
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Sei servizi, niente menu gonfiato di varianti.
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Ognuno con una sua identità precisa, un suo perché. Sotto trovi la versione lunga di
                        ogni rituale: cosa include davvero, quanto dura, e per chi è fatto.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-12">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-72 bg-black-2 border border-line rounded-[var(--radius-md)] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <ol className="space-y-px bg-line border-y border-line">
                        {services.map((s, i) => (
                            <motion.li
                                key={s.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                                className="relative bg-black"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr_300px] gap-6 lg:gap-12 py-10 md:py-14 px-2 md:px-4">
                                    {/* Number */}
                                    <div>
                                        <span className="text-display-alt text-6xl md:text-7xl text-accent-warm/80 leading-none">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <div className="flex items-baseline gap-4 flex-wrap">
                                            <h3 className="text-display text-2xl md:text-4xl text-warm-white tracking-tight">
                                                {s.name}
                                            </h3>
                                            {s.badge && (
                                                <span className="inline-flex px-3 py-1 bg-accent-warm/15 text-accent-warm text-[10px] uppercase tracking-[0.25em] font-body font-bold rounded-full">
                                                    {s.badge}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-4 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-2xl">
                                            {s.longDescription}
                                        </p>

                                        {s.includes.length > 0 && (
                                            <div className="mt-6">
                                                <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                                    Cosa include
                                                </span>
                                                <ul className="mt-3 space-y-2 max-w-xl">
                                                    {s.includes.map((inc, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-sm text-warm-white-muted">
                                                            <span
                                                                aria-hidden="true"
                                                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent-warm mt-2"
                                                            />
                                                            <span>{inc}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pricing card */}
                                    <div className="lg:sticky lg:top-32 self-start">
                                        <div className="bg-gradient-to-br from-carbon to-black-2 border border-accent-warm/25 rounded-[var(--radius-md)] p-6">
                                            <div className="flex items-baseline justify-between gap-3 pb-4 border-b border-line">
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Prezzo
                                                </span>
                                                <span className="text-display text-3xl md:text-4xl text-accent-warm tabular-nums">
                                                    {formatPrice(s.price_cents)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 py-4 border-b border-line text-sm">
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Durata
                                                </span>
                                                <span className="text-warm-white font-body">{s.duration_min} min</span>
                                            </div>
                                            <button
                                                onClick={() => handleBook(s.id)}
                                                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                            >
                                                Prenota questo
                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                )}
            </div>
        </section>
    );
}
