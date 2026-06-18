"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { StepServiceStaff } from "./StepServiceStaff";
import { StepDateTime } from "./StepDateTime";
import { StepConfirm } from "./StepConfirm";

const STEPS = [
    { id: 0, label: "Servizio & Barber" },
    { id: 1, label: "Data & Ora" },
    { id: 2, label: "Conferma" },
];

export function BookingWizard() {
    const { step, setStep, reset } = useBookingStore();

    // Niente persistenza/ripristino del wizard in localStorage: ogni apertura
    // del drawer parte pulita. Il reset dello store avviene alla CHIUSURA del
    // drawer (BookingDrawer), così l'eventuale pre-selezione di servizio/slot
    // fatta dalle CTA subito prima dell'apertura resta valida. Questo elimina
    // il bug "chiudo il sito → riapro → resto bloccato allo step 3".
    const handleReset = () => {
        reset();
    };

    const stepIdx = Math.min(step, 2);

    const announce =
        stepIdx === 0
            ? "Step 1 di 3: Servizio e Barber"
            : stepIdx === 1
                ? "Step 2 di 3: Data e Ora"
                : "Step 3 di 3: Conferma";

    return (
        <div className="w-full">
            {/* Live region for screen readers */}
            <span className="sr-only" aria-live="polite">{announce}</span>

            {/* Stepper */}
            <div className="flex items-center justify-between gap-2 mb-8 px-1" role="list">
                {STEPS.map((s, i) => {
                    const done = i < stepIdx;
                    const active = i === stepIdx;
                    return (
                        <button
                            key={s.id}
                            onClick={() => i < stepIdx && setStep(i)}
                            disabled={i > stepIdx}
                            className={`flex-1 flex flex-col items-center gap-2 group min-h-[44px] ${i <= stepIdx ? "cursor-pointer" : "cursor-not-allowed"}`}
                            role="listitem"
                            aria-current={active ? "step" : undefined}
                        >
                            <div className="flex items-center w-full gap-2">
                                <div
                                    className={`flex-shrink-0 w-8 h-8 md:w-7 md:h-7 rounded-full border flex items-center justify-center text-xs font-body font-semibold transition-colors ${
                                        active
                                            ? "bg-accent-warm border-accent-warm text-black"
                                            : done
                                                ? "bg-accent-warm/20 border-accent-warm text-accent-warm"
                                                : "bg-black-2 border-line text-silver-dark"
                                    }`}
                                >
                                    {done ? (
                                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-px transition-colors ${
                                            done ? "bg-accent-warm" : "bg-line"
                                        }`}
                                    />
                                )}
                            </div>
                            <span
                                className={`text-[11px] md:text-xs uppercase tracking-[0.18em] font-body font-semibold w-full text-left leading-tight ${
                                    active ? "text-warm-white" : done ? "text-silver" : "text-silver-dark"
                                }`}
                            >
                                {s.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Step viewport */}
            <div className="relative min-h-[460px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stepIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        {stepIdx === 0 && <StepServiceStaff onNext={() => setStep(1)} />}
                        {stepIdx === 1 && (
                            <StepDateTime onNext={() => setStep(2)} onBack={() => setStep(0)} />
                        )}
                        {stepIdx === 2 && <StepConfirm onBack={() => setStep(1)} onDone={handleReset} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
