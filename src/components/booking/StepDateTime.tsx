"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useBookingStore } from "@/lib/store";

const today = new Date();
const dates = Array.from({ length: 14 })
    .map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    })
    .filter((d) => d.getDay() !== 0 && d.getDay() !== 1)
    .slice(0, 8);

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:30", "15:00", "15:30", "16:00", "17:00", "17:30", "18:00", "18:30"];

function takenSlotsForDate(d: Date): Set<string> {
    const seed = d.getDate() + d.getMonth() * 31;
    const taken = new Set<string>();
    SLOTS.forEach((s, i) => {
        if ((seed * 7 + i * 13) % 7 < 3) taken.add(s);
    });
    return taken;
}

export function StepDateTime({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const { date, time, setDate, setTime } = useBookingStore();
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(date || null);

    const handleNext = () => {
        if (selectedDateStr && time) {
            setDate(selectedDateStr);
            onNext();
        }
    };

    const taken = selectedDateStr ? takenSlotsForDate(new Date(selectedDateStr)) : new Set<string>();

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-display-alt text-xl text-accent-warm">02</span>
                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1">
                        Data &amp; Ora
                    </h3>
                    <p className="mt-2 text-warm-white-muted text-sm">
                        Disponibilità aggiornata in tempo reale.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Indietro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 lg:gap-12">
                <div className="md:w-56">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                        Giorno
                    </h4>
                    <div className="md:max-h-[400px] md:overflow-y-auto md:pr-2 grid grid-cols-2 md:grid-cols-1 gap-2 scrollbar-hide">
                        {dates.map((d, i) => {
                            const dayStr = d.toISOString().split("T")[0]!;
                            const active = selectedDateStr === dayStr;
                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => {
                                        setSelectedDateStr(dayStr);
                                        setTime("");
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-colors ${
                                        active
                                            ? "bg-accent-warm/10 border-accent-warm text-warm-white"
                                            : "bg-black-2 border-line text-silver hover:bg-carbon hover:border-silver-dark"
                                    }`}
                                    aria-pressed={active}
                                >
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                            {new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(d)}
                                        </div>
                                        <div className="text-display text-lg leading-none mt-0.5">
                                            {d.getDate()}{" "}
                                            <span className="text-xs text-silver-dark">
                                                {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d)}
                                            </span>
                                        </div>
                                    </div>
                                    {active && (
                                        <span className="w-5 h-5 rounded-full bg-accent-warm text-black flex items-center justify-center" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Orario
                        </h4>
                        {selectedDateStr && (
                            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                {SLOTS.length - taken.size} slot liberi
                            </span>
                        )}
                    </div>

                    {selectedDateStr ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {SLOTS.map((s) => {
                                const isTaken = taken.has(s);
                                const active = time === s;
                                return (
                                    <button
                                        key={s}
                                        disabled={isTaken}
                                        onClick={() => setTime(s)}
                                        className={`relative px-3 py-3 rounded-[var(--radius-sm)] border text-center font-mono text-sm tracking-wider transition-colors ${
                                            isTaken
                                                ? "bg-black-2 border-line text-silver-dark/40 line-through cursor-not-allowed"
                                                : active
                                                    ? "bg-accent-warm border-accent-warm text-black"
                                                    : "bg-carbon border-line text-warm-white hover:border-silver-mid"
                                        }`}
                                        aria-pressed={active}
                                        aria-label={isTaken ? `${s} occupato` : `${s} disponibile`}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center p-6 bg-black-2 border border-line border-dashed rounded-[var(--radius-md)]">
                            <span className="text-sm text-silver-dark text-center">
                                Seleziona un giorno per vedere gli orari.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                    onClick={onBack}
                    className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    ← Indietro
                </button>
                <button
                    disabled={!selectedDateStr || !time}
                    onClick={handleNext}
                    className="inline-flex items-center gap-3 px-7 py-3 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white"
                >
                    Continua
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
