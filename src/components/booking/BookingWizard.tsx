"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore, useToastStore } from "@/lib/store";
import { StepServiceStaff } from "./StepServiceStaff";
import { StepDateTime } from "./StepDateTime";
import { StepConfirm } from "./StepConfirm";

const STEPS = [
    { id: 0, label: "Servizio & Barber" },
    { id: 1, label: "Data & Ora" },
    { id: 2, label: "Conferma" },
];

const STORAGE_KEY = "hr-booking-draft";

interface PersistedDraft {
    serviceId: string | null;
    staffId: string | null;
    date: string | null;
    time: string | null;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    notes: string;
    step: number;
    savedAt: number;
}

export function BookingWizard() {
    const store = useBookingStore();
    const addToast = useToastStore((s) => s.addToast);
    const { step, setStep, reset } = store;

    // Autosave (Wave 3.17): persiste lo stato a ogni cambio
    useEffect(() => {
        if (typeof window === "undefined") return;
        const draft: PersistedDraft = {
            serviceId: store.serviceId,
            staffId: store.staffId,
            date: store.date,
            time: store.time,
            contactName: store.contactName,
            contactPhone: store.contactPhone,
            contactEmail: store.contactEmail,
            notes: store.notes,
            step: store.step,
            savedAt: Date.now(),
        };
        // Salva solo se l'utente ha iniziato (step > 0 o serviceId)
        const hasContent = !!(draft.serviceId || draft.date || draft.contactPhone);
        if (hasContent) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
            } catch {
                /* ignore */
            }
        }
    }, [
        store.serviceId,
        store.staffId,
        store.date,
        store.time,
        store.contactName,
        store.contactPhone,
        store.contactEmail,
        store.notes,
        store.step,
    ]);

    // Restore draft on mount (se < 24h)
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const draft: PersistedDraft = JSON.parse(raw);
            const valid =
                draft &&
                typeof draft.savedAt === "number" &&
                Number.isFinite(draft.savedAt) &&
                Date.now() - draft.savedAt < 24 * 60 * 60 * 1000;
            if (!valid) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            // Restore solo se store ancora vuoto (evita conflitti hydration multi-island)
            if (!store.serviceId && draft.serviceId) {
                store.setService(draft.serviceId);
                if (draft.staffId) store.setStaff(draft.staffId);
                if (draft.date) store.setDate(draft.date);
                if (draft.time) store.setTime(draft.time);
                if (draft.contactName || draft.contactPhone)
                    store.setContact({
                        name: draft.contactName ?? "",
                        phone: draft.contactPhone ?? "",
                        email: draft.contactEmail ?? "",
                    });
                if (draft.notes) store.setNotes(draft.notes);
                if (typeof draft.step === "number") {
                    store.setStep(Math.max(0, Math.min(2, draft.step)));
                }
                addToast("Bozza ripresa", "info");
            }
        } catch {
            // Draft corrotto: pulisci e prosegui
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {
                /* ignore */
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReset = () => {
        reset();
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* ignore */
        }
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
