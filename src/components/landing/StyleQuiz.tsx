"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

type Vibe = "classic" | "modern" | "editorial";
type Maintenance = "low" | "medium" | "high";
type WithBeard = "yes" | "no";

interface QuizAnswers {
    vibe?: Vibe;
    maintenance?: Maintenance;
    beard?: WithBeard;
}

/**
 * Maps the 3 quiz answers to a service slug. Keeps the logic explicit and
 * easy to tune without ML — barbers can shift the rules in <5min if
 * preferences change.
 */
function pickService(a: QuizAnswers): string {
    if (a.vibe === "editorial" && a.beard === "yes") return "barba-sartoriale";
    if (a.vibe === "editorial") return "razor-cut";
    if (a.beard === "yes") return "taglio-barba";
    if (a.vibe === "modern" && a.maintenance === "low") return "fade-sfumatura";
    if (a.vibe === "classic" && a.maintenance === "high") return "taglio-classico";
    return "fade-sfumatura";
}

const QUESTIONS = [
    {
        key: "vibe" as const,
        prompt: "Che vibe vuoi trasmettere?",
        options: [
            { value: "classic" as Vibe, label: "Classico", desc: "Pulito, intramontabile, da gentleman" },
            { value: "modern" as Vibe, label: "Moderno", desc: "Lineare, tecnico, definito" },
            { value: "editorial" as Vibe, label: "Editorial", desc: "Lavorato, naturale, espressivo" },
        ],
    },
    {
        key: "maintenance" as const,
        prompt: "Quanto tempo dedichi al mattino?",
        options: [
            { value: "low" as Maintenance, label: "Zero/poco", desc: "Lavo e vado, niente prodotto" },
            { value: "medium" as Maintenance, label: "5 minuti", desc: "Un po' di cera e via" },
            { value: "high" as Maintenance, label: "10+ minuti", desc: "Mi piace fare lo styling" },
        ],
    },
    {
        key: "beard" as const,
        prompt: "Vuoi includere la barba?",
        options: [
            { value: "yes" as WithBeard, label: "Sì, lavorala", desc: "Sì, voglio anche la modellatura" },
            { value: "no" as WithBeard, label: "Solo capelli", desc: "Solo i capelli per oggi" },
        ],
    },
];

export function StyleQuiz() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [services, setServices] = useState<Service[]>([]);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        fetchServices().then(setServices).catch(() => undefined);
    }, []);

    const handleAnswer = (key: "vibe" | "maintenance" | "beard", value: any) => {
        const next = { ...answers, [key]: value };
        setAnswers(next);
        if (step < QUESTIONS.length - 1) {
            setTimeout(() => setStep((s) => s + 1), 200);
        } else {
            setTimeout(() => setStep(QUESTIONS.length), 200);
        }
    };

    const reset = () => {
        setAnswers({});
        setStep(0);
    };

    const result =
        Object.keys(answers).length === QUESTIONS.length
            ? services.find((s) => s.slug === pickService(answers))
            : null;

    const handleBookResult = () => {
        if (result) {
            setService(result.id);
            openDrawer();
        }
    };

    return (
        <section className="relative py-20 md:py-28 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-black-2 via-black to-black-2 border-y border-line overflow-hidden">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 md:mb-14">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        3 domande, 30 secondi
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Che servizio fa per te?
                    </h2>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {QUESTIONS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i < step
                                    ? "w-6 bg-accent-warm"
                                    : i === step
                                        ? "w-10 bg-accent-warm"
                                        : "w-6 bg-line"
                            }`}
                            aria-hidden="true"
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step < QUESTIONS.length && QUESTIONS[step] && (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h3 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight text-center mb-8">
                                {QUESTIONS[step]!.prompt}
                            </h3>
                            <div className="space-y-3">
                                {QUESTIONS[step]!.options.map((opt) => {
                                    const active =
                                        (answers as any)[QUESTIONS[step]!.key] === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() =>
                                                handleAnswer(QUESTIONS[step]!.key, opt.value)
                                            }
                                            className={`w-full text-left p-5 md:p-6 rounded-[var(--radius-md)] border transition-all ${
                                                active
                                                    ? "bg-accent-warm/10 border-accent-warm"
                                                    : "bg-black-2 border-line hover:bg-carbon hover:border-silver-mid"
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                                                        active
                                                            ? "border-accent-warm bg-accent-warm"
                                                            : "border-line"
                                                    } flex items-center justify-center`}
                                                >
                                                    {active && (
                                                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-body font-semibold text-warm-white text-lg md:text-xl block">
                                                        {opt.label}
                                                    </span>
                                                    <span className="text-warm-white-muted text-sm">
                                                        {opt.desc}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {step === QUESTIONS.length && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                            className="text-center"
                        >
                            <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                Il tuo match
                            </span>
                            <h3 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                                {result.name}
                            </h3>
                            {result.description && (
                                <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                                    {result.description}
                                </p>
                            )}
                            <div className="mt-6 inline-flex items-center gap-5 px-6 py-3 bg-black-2 border border-line rounded-full">
                                <span className="text-display text-xl text-accent-warm">
                                    {formatPrice(result.price_cents)}
                                </span>
                                <span className="text-warm-white-muted text-sm">·</span>
                                <span className="text-warm-white text-sm">{result.duration_min} min</span>
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    onClick={handleBookResult}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                >
                                    Prenota questo servizio
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                                <button
                                    onClick={reset}
                                    className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                                >
                                    Rifai il quiz
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
