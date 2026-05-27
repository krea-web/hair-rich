"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

interface Route {
    icon: React.ReactNode;
    title: string;
    body: string;
    detail?: string;
}

const ROUTES: Route[] = [
    {
        title: "A piedi dal Corso",
        body: "5 minuti da Corso Umberto. Esci verso Via Regina Elena, prosegui dritto fino al civico 33/A.",
        detail: "Ideale se hai parcheggiato in centro o sei già nella zona pedonale.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="13" cy="4" r="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21l2-4 2-3 4 4 3-3M7 14l3-4 3 2" />
            </svg>
        ),
    },
    {
        title: "In auto",
        body: "Parcheggi liberi su Via Regina Elena e Via Mameli. ZTL non attiva nella zona del salone.",
        detail: "Se arrivi dal porto o dalla SS125, segui le indicazioni per Centro Storico.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 17V8l2-3h10l2 3v9M5 17h14M5 17v2a1 1 0 001 1h2a1 1 0 001-1v-2M15 17v2a1 1 0 001 1h2a1 1 0 001-1v-2" />
                <circle cx="8" cy="13" r="1" />
                <circle cx="16" cy="13" r="1" />
            </svg>
        ),
    },
    {
        title: "Dall'aeroporto",
        body: "10 minuti in auto da Olbia–Costa Smeralda. Taxi diretto al centro, costo medio 12–15€.",
        detail: "Pratico per chi atterra: prenota con anticipo e fai il taglio prima del check-in hotel.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 16v-2l-8.5-5V3.5a1.5 1.5 0 00-3 0V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z" />
            </svg>
        ),
    },
];

const mapsHref =
    "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(SITE.address);

export function GettingHere() {
    return (
        <section className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 md:mb-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                            Come arrivare
                        </span>
                        <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                            Via Regina Elena 33/A,<br />
                            <em className="text-display-alt not-italic text-silver">Olbia.</em>
                        </h2>
                    </div>
                    <div className="md:text-right">
                        <p className="text-warm-white-muted text-base md:text-lg leading-relaxed max-w-md md:ml-auto">
                            A due passi da Corso Umberto. Tre modi diversi per arrivare,
                            tutti in meno di 15 minuti dal punto in cui sei.
                        </p>
                        <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-accent-warm text-black text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                        >
                            Apri in Maps
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-[var(--radius-md)] overflow-hidden">
                    {ROUTES.map((r, i) => (
                        <motion.article
                            key={r.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="bg-black p-7 md:p-9"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-warm/10 border border-accent-warm/30 flex items-center justify-center text-accent-warm">
                                    {r.icon}
                                </div>
                                <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                    {r.title}
                                </h3>
                            </div>
                            <p className="mt-5 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                {r.body}
                            </p>
                            {r.detail && (
                                <p className="mt-3 text-silver-dark text-xs leading-relaxed italic">
                                    {r.detail}
                                </p>
                            )}
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
