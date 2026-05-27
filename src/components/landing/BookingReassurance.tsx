"use client";

import { motion } from "framer-motion";

interface Promise {
    icon: React.ReactNode;
    title: string;
    body: string;
}

const PROMISES: Promise[] = [
    {
        title: "Disponibilità verificata",
        body: "Lo slot che vedi è davvero libero. Niente over-booking, niente telefonate per spostarti.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6" />
            </svg>
        ),
    },
    {
        title: "Cancellazione fino a 2h prima",
        body: "Cambio piani? Annulli o sposti gratis fino a 2 ore prima. Sotto, un colpo di telefono.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM9 14l6 6m0-6l-6 6" />
            </svg>
        ),
    },
    {
        title: "Niente pagamento online",
        body: "Si salda solo in salone, post-servizio. Contanti, bancomat, tutte le carte principali.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="2" y="6" width="20" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 11h20" />
            </svg>
        ),
    },
    {
        title: "Promemoria a -24h",
        body: "Email di conferma immediata + promemoria 24 ore prima. Difficile dimenticare.",
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
        ),
    },
];

const TRUST = [
    { label: "Risposta media", value: "< 1h" },
    { label: "Recensioni 5★", value: "247" },
    { label: "Anni attivi", value: "8+" },
    { label: "Master barber", value: "2" },
];

/**
 * Single combined "what to expect" section for /prenota. Replaces the two
 * sequential ProcessSteps blocks (come funziona + politiche) with a more
 * scannable 2-col promise grid + a trust banner. Reads in 15 seconds
 * instead of 60.
 */
export function BookingReassurance() {
    return (
        <section className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 md:mb-16 max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Quattro promesse
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Cosa ti aspetta dopo il tap.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line rounded-[var(--radius-md)] overflow-hidden">
                    {PROMISES.map((p, i) => (
                        <motion.div
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
                            className="bg-black p-7 md:p-9"
                        >
                            <div className="flex items-start gap-5">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-warm/10 border border-accent-warm/30 flex items-center justify-center text-accent-warm">
                                    {p.icon}
                                </div>
                                <div>
                                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                        {p.title}
                                    </h3>
                                    <p className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                        {p.body}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust banner */}
                <motion.dl
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-[var(--radius-md)] overflow-hidden"
                >
                    {TRUST.map((t) => (
                        <div key={t.label} className="bg-black px-5 py-7 md:py-9 text-center">
                            <dd className="text-display text-3xl md:text-4xl text-accent-warm tabular-nums">
                                {t.value}
                            </dd>
                            <dt className="mt-1 text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                {t.label}
                            </dt>
                        </div>
                    ))}
                </motion.dl>
            </div>
        </section>
    );
}
