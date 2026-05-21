"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchServices } from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

type Context = "office" | "creative" | "outdoor" | "social";
type Texture = "straight" | "wavy" | "curly" | "thin";
type Styling = "zero" | "five" | "ten";
type BeardChoice = "full" | "trim" | "none";

interface QuizAnswers {
    context?: Context;
    texture?: Texture;
    styling?: Styling;
    beard?: BeardChoice;
}

interface QuizOption<V> {
    value: V;
    label: string;
    desc: string;
    icon: React.ReactNode;
}

interface Question {
    key: "context" | "texture" | "styling" | "beard";
    prompt: string;
    sub: string;
    options: QuizOption<any>[];
}

const QUESTIONS: Question[] = [
    {
        key: "context",
        prompt: "In quale contesto ti vedono di più?",
        sub: "L'ambiente che frequenti condiziona il taglio che funziona meglio.",
        options: [
            {
                value: "office",
                label: "Ufficio · formale",
                desc: "Business, consulenza, sale riunioni",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v4" />
                    </svg>
                ),
            },
            {
                value: "creative",
                label: "Creativo · casual",
                desc: "Agenzia, freelance, startup, arte",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                        <circle cx="5" cy="12" r="1.5" />
                    </svg>
                ),
            },
            {
                value: "outdoor",
                label: "Sportivo · attivo",
                desc: "Sport, lavori manuali, all'aperto",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 4 8-8M14 8h6v6" />
                    </svg>
                ),
            },
            {
                value: "social",
                label: "Pubblico · sociale",
                desc: "Hospitality, eventi, commerciale",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="9" cy="9" r="3" />
                        <circle cx="17" cy="11" r="2.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4-3.5s4 1.5 4 3.5" />
                    </svg>
                ),
            },
        ],
    },
    {
        key: "texture",
        prompt: "Che capelli hai?",
        sub: "Texture diverse chiedono tecniche diverse — non esiste taglio universale.",
        options: [
            {
                value: "straight",
                label: "Lisci",
                desc: "Cadono dritti, possono sembrare piatti",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16M12 4v16M18 4v16" />
                    </svg>
                ),
            },
            {
                value: "wavy",
                label: "Mossi",
                desc: "Onda naturale, movimento spontaneo",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
                    </svg>
                ),
            },
            {
                value: "curly",
                label: "Ricci",
                desc: "Boccoli, riccio definito",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="7" cy="8" r="2.5" />
                        <circle cx="14" cy="6" r="2.5" />
                        <circle cx="17" cy="13" r="2.5" />
                        <circle cx="9" cy="16" r="2.5" />
                    </svg>
                ),
            },
            {
                value: "thin",
                label: "Fini / radi",
                desc: "Sottili, magari diradati sull'attaccatura",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h4M11 8h2M17 8h3M4 12h2M9 12h3M16 12h4M4 16h3M10 16h2M15 16h3" />
                    </svg>
                ),
            },
        ],
    },
    {
        key: "styling",
        prompt: "Quanto tempo dedichi al mattino al look?",
        sub: "La risposta sincera, non quella che ti farebbe figura.",
        options: [
            {
                value: "zero",
                label: "Niente o quasi",
                desc: "Lavo, asciugo, esco. Niente prodotto.",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v-2" />
                    </svg>
                ),
            },
            {
                value: "five",
                label: "5 minuti",
                desc: "Un po' di cera, mani tra i capelli, via.",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l4-2" />
                    </svg>
                ),
            },
            {
                value: "ten",
                label: "10+ minuti",
                desc: "Mi piace fare lo styling, prodotti più di uno.",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l5 3" />
                    </svg>
                ),
            },
        ],
    },
    {
        key: "beard",
        prompt: "E la barba?",
        sub: "Possiamo modellare, rifinire o lasciar perdere — di base.",
        options: [
            {
                value: "full",
                label: "Modellatura completa",
                desc: "Rasoio classico, oli, lavorazione a tempo",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 6c2 7 3 12 5 12s3-5 5-12M10 5v3m4-3v3" />
                    </svg>
                ),
            },
            {
                value: "trim",
                label: "Solo rifinitura",
                desc: "Pulizia contorni veloce, niente lavorazione",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M8 8l-3 4 3 4M16 8l3 4-3 4" />
                    </svg>
                ),
            },
            {
                value: "none",
                label: "Niente barba",
                desc: "Solo capelli oggi",
                icon: (
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="9" r="4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c1-3 4-5 7-5s6 2 7 5" />
                    </svg>
                ),
            },
        ],
    },
];

/**
 * Pick one of the three real bookable services based on the answers.
 * Catalog is now intentionally minimal: cut, beard, or the combo.
 * - beard full/trim + any haircut intent → combo (taglio-barba)
 * - beard full, no haircut intent (zero context care) → standalone beard
 * - everything else → straight haircut
 */
function pickService(a: QuizAnswers): string {
    const wantsBeard = a.beard === "full" || a.beard === "trim";

    // The combo is the default winner whenever beard work is requested
    // alongside a haircut: visitor saves money vs two separate services.
    if (wantsBeard) return "taglio-barba";

    // Otherwise — single haircut. There's only one cut SKU now.
    return "taglio-classico";
}

/**
 * Produce a 1-sentence rationale calibrated to the user's actual answers.
 * Reads more like a barber-to-client recap than a generic blurb.
 */
function buildRationale(serviceSlug: string, a: QuizAnswers): string {
    const ctx: Record<Context, string> = {
        office: "lavori in un contesto formale",
        creative: "ti muovi in un ambiente creativo",
        outdoor: "stai molto all'aperto / fai sport",
        social: "lavori a contatto con il pubblico",
    };
    const tex: Record<Texture, string> = {
        straight: "capelli lisci",
        wavy: "capelli mossi",
        curly: "capelli ricci",
        thin: "capelli fini",
    };
    const sty: Record<Styling, string> = {
        zero: "niente styling al mattino",
        five: "cinque minuti di styling",
        ten: "ti piace fare lo styling con calma",
    };
    const beardCue: Record<BeardChoice, string> = {
        full: " + barba lavorata",
        trim: " + rifinitura barba",
        none: "",
    };

    const ctxPart = a.context ? ctx[a.context] : "";
    const texPart = a.texture ? tex[a.texture] : "";
    const styPart = a.styling ? sty[a.styling] : "";
    const beardPart = a.beard ? beardCue[a.beard] : "";

    const profile = [ctxPart, texPart, styPart].filter(Boolean).join(" · ");

    const recipe: Record<string, string> = {
        "taglio-classico":
            "Il taglio capelli: 30 minuti, ascolto + esecuzione + finish. 20€, niente sovrastrutture.",
        "taglio-barba":
            "Il combo taglio capelli + barba: un'ora intera, continuità stilistica al volto e risparmi sul singolo. 30€.",
        "barba-sartoriale":
            "Solo barba: rasoio classico sui contorni, olio scelto sul tipo di pelle. 30 minuti, 10€.",
    };

    const why = recipe[serviceSlug] ?? "";
    return `${profile}${beardPart}. ${why}`;
}

export function StyleQuiz() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [services, setServices] = useState<Service[]>([]);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        fetchServices().then(setServices).catch(() => undefined);
    }, []);

    const handleAnswer = (key: keyof QuizAnswers, value: any) => {
        const next = { ...answers, [key]: value };
        setAnswers(next);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
        if (step < QUESTIONS.length - 1) {
            setTimeout(() => setStep((s) => s + 1), 220);
        } else {
            setTimeout(() => setStep(QUESTIONS.length), 220);
        }
    };

    const reset = () => {
        setAnswers({});
        setStep(0);
    };

    const slug = Object.keys(answers).length === QUESTIONS.length ? pickService(answers) : null;
    const result = slug ? services.find((s) => s.slug === slug) : null;
    const rationale = slug ? buildRationale(slug, answers) : "";

    const handleBookResult = () => {
        if (result) {
            setService(result.id);
            openDrawer();
        }
    };

    return (
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute -top-20 left-1/2 -translate-x-1/2 text-display-alt text-[40vw] md:text-[22vw] text-warm-white/[0.018] leading-none pointer-events-none select-none whitespace-nowrap"
            >
                Consulto
            </div>

            <div className="relative max-w-3xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Consulto · 90 secondi
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        Costruiamo<br />
                        <em className="text-display-alt not-italic text-silver">il tuo servizio.</em>
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                        Quattro domande sul tuo contesto, capelli e abitudini. Alla fine ti diciamo
                        quale dei nostri sei servizi è davvero calibrato su di te — con la
                        spiegazione del perché.
                    </p>
                </div>

                {/* Progress dots */}
                {step < QUESTIONS.length && (
                    <div className="flex items-center justify-center gap-2 mb-10 md:mb-12">
                        {QUESTIONS.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1 rounded-full transition-all duration-500 ${
                                    i < step
                                        ? "w-7 bg-accent-warm"
                                        : i === step
                                            ? "w-12 bg-accent-warm"
                                            : "w-7 bg-line"
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
                                <h3 className="text-display text-2xl md:text-4xl text-warm-white tracking-tight mt-3 leading-tight">
                                    {QUESTIONS[step]!.prompt}
                                </h3>
                                <p className="mt-2 text-warm-white-muted text-sm md:text-base max-w-md mx-auto">
                                    {QUESTIONS[step]!.sub}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {QUESTIONS[step]!.options.map((opt, idx) => {
                                    const active =
                                        (answers as any)[QUESTIONS[step]!.key] === opt.value;
                                    return (
                                        <motion.button
                                            key={opt.value}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            onClick={() =>
                                                handleAnswer(QUESTIONS[step]!.key, opt.value)
                                            }
                                            className={`w-full text-left p-4 md:p-5 rounded-[var(--radius-md)] border-2 transition-all flex items-center gap-4 min-h-[80px] ${
                                                active
                                                    ? "bg-accent-warm/10 border-accent-warm shadow-[0_8px_30px_-12px_rgba(212,165,116,0.4)]"
                                                    : "bg-black-2 border-line hover:bg-carbon hover:border-silver-mid"
                                            }`}
                                        >
                                            <div
                                                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                                    active
                                                        ? "bg-accent-warm text-black"
                                                        : "bg-black border border-line text-silver"
                                                }`}
                                            >
                                                {opt.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-body font-semibold text-warm-white text-base md:text-lg block leading-tight">
                                                    {opt.label}
                                                </span>
                                                <span className="text-warm-white-muted text-xs md:text-sm leading-snug">
                                                    {opt.desc}
                                                </span>
                                            </div>
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
                            <div className="relative overflow-hidden bg-gradient-to-br from-carbon via-black to-black border border-accent-warm/40 rounded-[var(--radius-md)] p-6 md:p-10">
                                <div
                                    aria-hidden="true"
                                    className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-accent-warm/15 blur-3xl pointer-events-none"
                                />

                                <div className="relative">
                                    <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                                        Il tuo servizio, calibrato
                                    </span>
                                    <h3 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                                        {result.name}
                                    </h3>

                                    {/* Sintesi profilo + perché */}
                                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-xl">
                                        {rationale}
                                    </p>

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
                                            className="cta-shine cta-pulse inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                        >
                                            Prenota questo servizio
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
                                Vuoi vedere tutti i sei servizi? Scorri sotto ↓
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
