"use client";

import { motion } from "framer-motion";

interface TimelineEntry {
    time: string;
    title: string;
    body: string;
}

const TIMELINE: TimelineEntry[] = [
    {
        time: "09:00",
        title: "Si apre",
        body: "Caffè, agenda della giornata, lame pronte. Quando entra il primo cliente è già tutto in ordine.",
    },
    {
        time: "09:30",
        title: "Primo taglio",
        body: "Si parte sempre dal consulto, anche con chi viene da anni: la testa cambia, il taglio si adatta.",
    },
    {
        time: "13:00",
        title: "Pausa",
        body: "Si chiude davvero, dalle 13 alle 15. Niente \"giusto cinque minuti\": si stacca e si torna lucidi.",
    },
    {
        time: "15:00",
        title: "Pomeriggio",
        body: "Clienti dopo il lavoro: taglio, barba, combo. Chi ha poco tempo entra ed esce, chi vuole con calma se la prende.",
    },
    {
        time: "18:00",
        title: "Ora di punta",
        body: "Le ore più piene: taglio, barba e rifiniture. Si lavora solo su appuntamento, così nessuno aspetta in piedi.",
    },
    {
        time: "20:00",
        title: "Si chiude",
        body: "Stesso rispetto del mattino: si chiude in orario per chi viene domani, ma chi è in poltrona finisce con calma. Sempre.",
    },
];

/**
 * "Una giornata al salone" — narrative timeline that humanizes the team
 * page. Pure prose, no DB calls. Gives the reader a sense of pacing and
 * personality without needing to visit in person.
 */
export function SalonDay() {
    return (
        <section className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute -top-20 right-0 text-display-alt text-[32vw] md:text-[18vw] text-warm-white/[0.02] leading-none pointer-events-none select-none whitespace-nowrap"
            >
                09 — 20:00
            </div>

            <div className="relative max-w-5xl mx-auto">
                <div className="mb-14 md:mb-20 max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Dietro le quinte
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl 2xl:text-6xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Una giornata<br />
                        <em className="text-display-alt not-italic text-silver">in salone.</em>
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Nessuna messa in scena. Un mestiere fatto bene, dal lunedì al sabato,
                        dalle 9 alle 20 con la pausa pranzo. Ecco com'è una giornata da Hair Rich.
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
