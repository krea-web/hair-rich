"use client";

import { motion } from "framer-motion";

interface TimelineEntry {
    time: string;
    title: string;
    body: string;
}

const TIMELINE: TimelineEntry[] = [
    {
        time: "08:30",
        title: "Apertura porta",
        body: "Espresso, mood board della settimana, controllo agenda. Le 15 minute prima del primo cliente sono sacre — niente fretta.",
    },
    {
        time: "09:00",
        title: "Primo cliente",
        body: "Si parte sempre dalla consulenza, anche per chi viene da anni. Quello che ha funzionato l'ultima volta non funziona automaticamente questa.",
    },
    {
        time: "12:30",
        title: "Pausa pranzo",
        body: "Chiudiamo davvero. Niente improvvisate, niente \"giusto cinque minuti\". Mangiare bene è parte del mestiere.",
    },
    {
        time: "15:00",
        title: "Riapertura",
        body: "Pomeriggio = clienti dopo-lavoro. Tagli più rapidi, focus su mantenimento. La macchinetta lavora di più del rasoio in questo turno.",
    },
    {
        time: "17:00",
        title: "Slot premium",
        body: "Le ore d'oro. Razor cut, barba sartoriale, combo. Qui i clienti chiedono il tempo per il servizio completo.",
    },
    {
        time: "19:00",
        title: "Chiusura",
        body: "Stesso rispetto del mattino: chiudiamo in orario per chi viene dopo, ma chi è dentro finisce con calma. Sempre.",
    },
];

/**
 * "Una giornata al salone" — narrative timeline that humanizes the team
 * page. Pure prose, no DB calls. Gives the reader a sense of pacing and
 * personality without needing to visit in person.
 */
export function SalonDay() {
    return (
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute -top-20 right-0 text-display-alt text-[32vw] md:text-[18vw] text-warm-white/[0.02] leading-none pointer-events-none select-none whitespace-nowrap"
            >
                09 — 19:00
            </div>

            <div className="relative max-w-5xl mx-auto">
                <div className="mb-14 md:mb-20 max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Dietro le quinte
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Una giornata<br />
                        <em className="text-display-alt not-italic text-silver">in salone.</em>
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Niente coreografia, niente "esperienza". Un mestiere, fatto bene, dalle
                        otto e mezza alle sette e mezza, dal martedì al sabato.
                    </p>
                </div>

                <ol className="relative space-y-0">
                    {/* Vertical line */}
                    <div
                        aria-hidden="true"
                        className="absolute left-[68px] md:left-[88px] top-2 bottom-2 w-px bg-gradient-to-b from-line via-line to-transparent"
                    />

                    {TIMELINE.map((entry, i) => (
                        <motion.li
                            key={entry.time}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                            className="relative grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] gap-5 md:gap-8 py-6 md:py-8 border-b border-line/40 last:border-b-0"
                        >
                            <div className="flex items-start">
                                <span className="font-mono text-sm md:text-base text-accent-warm tabular-nums">
                                    {entry.time}
                                </span>
                            </div>
                            <div className="relative pl-5 md:pl-8">
                                {/* Dot */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-accent-warm ring-4 ring-black-2"
                                />
                                <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                    {entry.title}
                                </h3>
                                <p className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-2xl">
                                    {entry.body}
                                </p>
                            </div>
                        </motion.li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
