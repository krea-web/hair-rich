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

function pickService(a: QuizAnswers): string {
    if (a.vibe === "editorial" && a.beard === "yes") return "barba-sartoriale";
    if (a.vibe === "editorial") return "razor-cut";
    if (a.beard === "yes") return "taglio-barba";
    if (a.vibe === "modern" && a.maintenance === "low") return "fade-sfumatura";
    if (a.vibe === "classic" && a.maintenance === "high") return "taglio-classico";
    return "fade-sfumatura";
}

interface QuizOption<V> {
    value: V;
    label: string;
    desc: string;
    icon: React.ReactNode;
}

interface Question {
    key: "vibe" | "maintenance" | "beard";
    prompt: string;
    sub: string;
    options: QuizOption<any>[];
}

const QUESTIONS: Question[] = [
    {
        key: "vibe",
        prompt: "Quale stile ti rappresenta?",
        sub: "Scegli l'estetica che senti più tua.",
        options: [
            {
                value: "classic",
                label: "Classico",
                desc: "Pulito, intramontabile, da gentleman",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8c0-3 3-5 7-5s7 2 7 5v8a3 3 0 01-3 3H8a3 3 0 01-3-3V8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6" />
                    </svg>
                ),
            },
            {
                value: "modern",
                label: "Moderno",
                desc: "Lineare, tecnico, definito",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />
                    </svg>
                ),
            },
            {
                value: "editorial",
                label: "Editorial",
                desc: "Lavorato, naturale, espressivo",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4c4 0 8 4 8 8s4 8 8 8M4 12c4-4 8 0 8 4M12 4c-4 4 0 8 4 8" />
                    </svg>
                ),
            },
        ],
    },
    {
        key: "maintenance",
        prompt: "Quanto tempo dedichi al mattino?",
        sub: "Più sei sincero, più il rituale sarà calibrato.",
        options: [
            {
                value: "low",
                label: "Zero o poco",
                desc: "Lavo e vado, niente prodotto",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                    </svg>
                ),
            },
            {
                value: "medium",
                label: "5 minuti",
                desc: "Un po' di cera e via",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l4-2" />
                    </svg>
                ),
            },
            {
                value: "high",
                label: "10+ minuti",
                desc: "Mi piace fare lo styling",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l5 3" />
                    </svg>
                ),
            },
        ],
    },
    {
        key: "beard",
        prompt: "Includiamo anche la barba?",
        sub: "Il combo dà continuità stilistica al volto.",
        options: [
            {
                value: "yes",
                label: "Sì, lavoriamola",
                desc: "Modellatura completa con rasoio",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8c2 6 3 9 5 9s3-3 5-9M9 7v3m6-3v3" />
                    </svg>
                ),
            },
            {
                value: "no",
                label: "Solo capelli",
                desc: "Niente barba oggi, grazie",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9c2-4 5-6 7-6s5 2 7 6c1 2 1 4 0 6-1 1-3 1-3 1H8s-2 0-3-1c-1-2-1-4 0-6z" />
                    </svg>
                ),
            },
        ],
    },
];

const RATIONALE: Record<string, (a: QuizAnswers) => string> = {
    "barba-sartoriale": () =>
        "Stile editorial + barba lavorata = il nostro servizio più specifico per chi vuole un volto definito senza compromessi.",
    "razor-cut": () =>
        "Lo stile editorial chiede texture naturale. Il rasoio ammorbidisce le punte e crea movimento — perfetto per il tuo brief.",
    "taglio-barba": (a) =>
        a.vibe === "classic"
            ? "Classico con barba = il combo signature. Continuità stilistica tra capelli e volto, un'ora intera dedicata a te."
            : "Combo completo: capelli + barba in continuità. Risparmi 5€ rispetto al singolo e ottieni un risultato armonico.",
    "fade-sfumatura": (a) =>
        a.vibe === "modern"
            ? "Stile moderno + manutenzione veloce = il Fade è perfetto. Pulito, ridefinito, sta bene per 2-3 settimane senza ritocchi."
            : "Sfumatura tecnica con macchinetta + rifinitura a rasoio. Il servizio più richiesto perché è quello che cambia di più.",
    "taglio-classico": () =>
        "Stile classico + cura nel quotidiano = forbice e tecnica italiana. Niente fronzoli, solo controllo millimetrico.",
};

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
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
        if (step < QUESTIONS.length - 1) {
            setTimeout(() => setStep((s) => s + 1), 240);
        } else {
            setTimeout(() => setStep(QUESTIONS.length), 240);
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
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            {/* Editorial backdrop */}
            <div
                aria-hidden="true"
                className="absolute -top-20 left-1/2 -translate-x-1/2 text-display-alt text-[40vw] md:text-[22vw] text-warm-white/[0.018] leading-none pointer-events-none select-none whitespace-nowrap"
            >
                Consulto
            </div>

            <div className="relative max-w-3xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Consulto · 60 secondi
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Costruiamo<br />
                        <em className="text-display-alt not-italic text-silver">il tuo rituale.</em>
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                        Tre domande, una raccomandazione tagliata su misura. Senza listino, senza
                        sceglier al buio: ti diciamo noi qual è il rituale che fa per te.
                    </p>
                </div>

                {/* Progress dots */}
                {step < QUESTIONS.length && (
                    <div className="flex items-center justify-center gap-2 mb-12">
                        {QUESTIONS.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1 rounded-full transition-all duration-500 ${
                                    i < step
                                        ? "w-8 bg-accent-warm"
                                        : i === step
                                            ? "w-14 bg-accent-warm"
                                            : "w-8 bg-line"
                                }`}
                                aria-hidden="true"
                            />
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step < QUESTIONS.length && QUESTIONS[step] && (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <div className="text-center mb-8 md:mb-10">
                                <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                                    Domanda {step + 1} di {QUESTIONS.length}
                                </span>
                                <h3 className="text-display text-2xl md:text-4xl text-warm-white tracking-tight mt-3">
                                    {QUESTIONS[step]!.prompt}
                                </h3>
                                <p className="mt-2 text-warm-white-muted text-sm md:text-base">
                                    {QUESTIONS[step]!.sub}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {QUESTIONS[step]!.options.map((opt, idx) => {
                                    const active =
                                        (answers as any)[QUESTIONS[step]!.key] === opt.value;
                                    return (
                                        <motion.button
                                            key={opt.value}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: idx * 0.07 }}
                                            onClick={() =>
                                                handleAnswer(QUESTIONS[step]!.key, opt.value)
                                            }
                                            className={`w-full text-left p-5 md:p-6 rounded-[var(--radius-md)] border-2 transition-all flex items-center gap-4 md:gap-5 ${
                                                active
                                                    ? "bg-accent-warm/10 border-accent-warm shadow-[0_8px_30px_-12px_rgba(212,165,116,0.4)]"
                                                    : "bg-black-2 border-line hover:bg-carbon hover:border-silver-mid"
                                            }`}
                                        >
                                            <div
                                                className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors ${
                                                    active
                                                        ? "bg-accent-warm text-black"
                                                        : "bg-black border border-line text-silver"
                                                }`}
                                            >
                                                {opt.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-body font-semibold text-warm-white text-lg md:text-xl block">
                                                    {opt.label}
                                                </span>
                                                <span className="text-warm-white-muted text-sm">
                                                    {opt.desc}
                                                </span>
                                            </div>
                                            <span
                                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    active
                                                        ? "border-accent-warm bg-accent-warm"
                                                        : "border-line"
                                                }`}
                                                aria-hidden="true"
                                            >
                                                {active && (
                                                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {step === QUESTIONS.length && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                            {/* Sartorial result card */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-carbon via-black to-black border border-accent-warm/40 rounded-[var(--radius-md)] p-6 md:p-10">
                                {/* Glow accent */}
                                <div
                                    aria-hidden="true"
                                    className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-accent-warm/15 blur-3xl pointer-events-none"
                                />

                                <div className="relative">
                                    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                                        Il tuo rituale, calibrato
                                    </span>
                                    <h3 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                                        {result.name}
                                    </h3>

                                    {/* Rationale — "perché questo" */}
                                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl">
                                        {(RATIONALE[result.slug] ?? (() => result.description ?? ""))(answers)}
                                    </p>

                                    {/* Sartorial price line — non "listino" ma "per te" */}
                                    <div className="mt-8 md:mt-10 pt-6 border-t border-line grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Per te
                                            </span>
                                            <span className="block text-display text-3xl md:text-4xl text-accent-warm tabular-nums mt-1">
                                                {formatPrice(result.price_cents)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Durata
                                            </span>
                                            <span className="block text-warm-white text-xl md:text-2xl font-body mt-1">
                                                {result.duration_min} min
                                            </span>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Personalizzabile
                                            </span>
                                            <span className="block text-warm-white text-sm font-body mt-1 leading-tight">
                                                Aggiustiamo i dettagli al consulto in salone
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <button
                                            onClick={handleBookResult}
                                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                        >
                                            Prenota questo rituale
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={reset}
                                            className="inline-flex items-center justify-center text-[11px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors px-4 py-3"
                                        >
                                            Rifai il consulto
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Vuoi vedere tutti i sei rituali? Scorri sotto ↓
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
