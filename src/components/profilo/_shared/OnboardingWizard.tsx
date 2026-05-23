"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import {
    recordOnboardingConsents,
    CONSENT_LABELS,
    type ConsentType,
} from "@/lib/profilo/consents";

interface OnboardingWizardProps {
    customerId: string;
    initialFirstName?: string | null;
    initialLastName?: string | null;
    initialPhone?: string | null;
    initialBirthdate?: string | null;
    onComplete: () => void;
}

const STEPS = ["profilo", "compleanno", "consensi", "fatto"] as const;
type Step = (typeof STEPS)[number];

const REQUIRED_CONSENTS: ConsentType[] = ["appointment_reminders"];
const OPTIONAL_CONSENTS: ConsentType[] = [
    "marketing",
    "photos_pre_post",
    "profiling",
    "referral_program",
];

export function OnboardingWizard({
    customerId,
    initialFirstName,
    initialLastName,
    initialPhone,
    initialBirthdate,
    onComplete,
}: OnboardingWizardProps) {
    const [step, setStep] = useState<Step>("profilo");
    const [firstName, setFirstName] = useState(initialFirstName ?? "");
    const [lastName, setLastName] = useState(initialLastName ?? "");
    const [phone, setPhone] = useState(initialPhone ?? "");
    const [birthdate, setBirthdate] = useState(initialBirthdate ?? "");
    const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
        marketing: true,
        appointment_reminders: true,
        photos_pre_post: true,
        profiling: false,
        referral_program: true,
    });
    const [saving, setSaving] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const stepIndex = STEPS.indexOf(step);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    const next = () => {
        const idx = STEPS.indexOf(step);
        if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    };

    const prev = () => {
        const idx = STEPS.indexOf(step);
        if (idx > 0) setStep(STEPS[idx - 1]);
    };

    const skipAll = () => {
        // Skipping still records the required (and explicit) consents so the
        // onboarding marker is set — otherwise the wizard would re-prompt.
        void finalize();
    };

    const finalize = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const profilePatch: Record<string, unknown> = {};
            if (firstName.trim()) profilePatch.first_name = firstName.trim();
            if (lastName.trim()) profilePatch.last_name = lastName.trim();
            if (phone.trim()) profilePatch.phone = phone.trim();
            if (birthdate) profilePatch.birthdate = birthdate;
            // Mirror the marketing checkbox onto the legacy column for
            // backwards-compat with older code paths that still read it.
            profilePatch.marketing_consent = Boolean(consents.marketing);

            if (Object.keys(profilePatch).length > 0) {
                const { error } = await supabase
                    .from("customers")
                    .update(profilePatch)
                    .eq("id", customerId);
                if (error) throw error;
            }

            await recordOnboardingConsents(customerId, consents);

            addToast("Benvenuto! Onboarding completato", "success");
            onComplete();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl bg-carbon border border-line rounded-[var(--radius-lg)] overflow-hidden"
            >
                {/* Progress bar */}
                <div className="h-1 bg-black-2 relative">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-accent-warm"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <div className="p-6 md:p-8 space-y-5">
                    <header>
                        <span className="text-display-alt text-lg text-accent-warm">
                            Step {stepIndex + 1} di {STEPS.length}
                        </span>
                        <h2 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                            {step === "profilo" && "Ciao, raccontaci di te."}
                            {step === "compleanno" && "Quando è il tuo compleanno?"}
                            {step === "consensi" && "Come possiamo restare in contatto?"}
                            {step === "fatto" && "Tutto pronto!"}
                        </h2>
                    </header>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {step === "profilo" && (
                                <>
                                    <p className="text-warm-white-muted text-sm">
                                        Pochi dati per personalizzare la tua esperienza. Puoi saltare e
                                        completare quando vuoi.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Nome" required>
                                            <input
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                                                autoFocus
                                            />
                                        </Field>
                                        <Field label="Cognome">
                                            <input
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Telefono" hint="Per i promemoria e in caso di emergenza">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+39 …"
                                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                                        />
                                    </Field>
                                </>
                            )}

                            {step === "compleanno" && (
                                <>
                                    <p className="text-warm-white-muted text-sm">
                                        Il giorno del tuo compleanno hai un piccolo regalo da noi. 🎂
                                        Inserire la data è opzionale.
                                    </p>
                                    <Field label="Data di nascita">
                                        <input
                                            type="date"
                                            value={birthdate}
                                            onChange={(e) => setBirthdate(e.target.value)}
                                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                                        />
                                    </Field>
                                </>
                            )}

                            {step === "consensi" && (
                                <>
                                    <p className="text-warm-white-muted text-sm">
                                        I tuoi diritti GDPR — scegli cosa ti va. Puoi cambiare tutto in
                                        qualsiasi momento dalle Impostazioni.
                                    </p>
                                    <div className="space-y-2">
                                        {REQUIRED_CONSENTS.map((k) => (
                                            <ConsentRow
                                                key={k}
                                                label={CONSENT_LABELS[k].title}
                                                description={CONSENT_LABELS[k].description}
                                                value={consents[k]}
                                                onChange={(v) => setConsents((c) => ({ ...c, [k]: v }))}
                                                required
                                            />
                                        ))}
                                        {OPTIONAL_CONSENTS.map((k) => (
                                            <ConsentRow
                                                key={k}
                                                label={CONSENT_LABELS[k].title}
                                                description={CONSENT_LABELS[k].description}
                                                value={consents[k]}
                                                onChange={(v) => setConsents((c) => ({ ...c, [k]: v }))}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {step === "fatto" && (
                                <div className="text-center py-4">
                                    <div className="text-6xl mb-4">✂️</div>
                                    <p className="text-warm-white-muted">
                                        Conferma e iniziamo. Da ora vedrai il tuo profilo personalizzato.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <footer className="flex items-center gap-2 pt-2 border-t border-line">
                        <button
                            onClick={skipAll}
                            disabled={saving}
                            className="text-[10px] uppercase tracking-[0.25em] text-silver-dark hover:text-warm-white font-body font-semibold"
                        >
                            Salta tutto
                        </button>
                        <div className="flex-1" />
                        {stepIndex > 0 && step !== "fatto" && (
                            <button
                                onClick={prev}
                                disabled={saving}
                                className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em]"
                            >
                                Indietro
                            </button>
                        )}
                        {step !== "fatto" ? (
                            <button
                                onClick={next}
                                disabled={saving || (step === "profilo" && !firstName.trim())}
                                className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-40"
                            >
                                Avanti
                            </button>
                        ) : (
                            <button
                                onClick={finalize}
                                disabled={saving}
                                className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-40"
                            >
                                {saving ? "Salvataggio…" : "Inizia"}
                            </button>
                        )}
                    </footer>
                </div>
            </motion.div>
        </div>
    );
}

function Field({
    label,
    children,
    hint,
    required,
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
                {required && <span className="text-accent-warm ml-1">*</span>}
            </span>
            <div className="mt-1">{children}</div>
            {hint && <p className="text-xs text-silver-dark mt-1">{hint}</p>}
        </label>
    );
}

function ConsentRow({
    label,
    description,
    value,
    onChange,
    required,
}: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
    required?: boolean;
}) {
    return (
        <label className="flex items-start gap-3 p-3 bg-black-2 rounded-md cursor-pointer hover:bg-black-2/70 transition-colors">
            <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={required}
                className="mt-1 accent-accent-warm"
            />
            <div className="flex-1">
                <div className="text-warm-white text-sm font-body font-semibold">
                    {label}
                    {required && (
                        <span className="text-[10px] uppercase tracking-[0.25em] text-accent-warm ml-2">
                            consigliato
                        </span>
                    )}
                </div>
                <p className="text-silver-dark text-xs mt-0.5">{description}</p>
            </div>
        </label>
    );
}
