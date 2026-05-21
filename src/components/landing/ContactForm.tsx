"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

type Purpose = "collaborazione" | "stampa" | "fornitore" | "altro";

interface FormData {
    name: string;
    email: string;
    phone: string;
    purpose: Purpose;
    company: string;
    message: string;
}

const PURPOSE_LABELS: Record<Purpose, string> = {
    collaborazione: "Collaborazione / Partnership",
    stampa: "Stampa / Media",
    fornitore: "Proposta fornitore",
    altro: "Altro",
};

/**
 * Generic outreach form for non-booking inquiries: collaborations, press,
 * supplier pitches. For a haircut appointment customers should use the
 * booking drawer — the /contatti page makes that explicit above this
 * form so we don't pollute contact_messages with mis-routed bookings.
 */
export function ContactForm() {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({ defaultValues: { purpose: "collaborazione" } });

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        setError(null);
        try {
            const subjectLabel = PURPOSE_LABELS[data.purpose];
            const subject = data.company
                ? `${subjectLabel} · ${data.company}`
                : subjectLabel;
            const supabase = createClient();
            const { error: insertErr } = await supabase.from("contact_messages").insert({
                name: data.name,
                email: data.email || null,
                phone: data.phone || null,
                subject,
                message: data.message,
                source: "contact_page",
                user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            });
            if (insertErr) throw insertErr;
            setSubmitted(true);
            reset();
            addToast("Richiesta inviata. Ti rispondiamo entro 24h.", "success");
        } catch (e: any) {
            setError(e?.message ?? "Errore nell'invio del messaggio");
            addToast("Errore nell'invio", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 md:p-10 bg-gradient-to-br from-carbon to-black-2 border border-accent-warm/40 rounded-[var(--radius-md)] text-center"
            >
                <div className="mx-auto w-16 h-16 rounded-full bg-success/15 border border-success/40 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-success" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-display text-2xl md:text-3xl text-warm-white mt-5 tracking-tight">
                    Richiesta ricevuta
                </h3>
                <p className="mt-3 text-warm-white-muted text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    Grazie. Ti rispondiamo entro 24h al recapito che hai lasciato.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    Invia un'altra richiesta
                </button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Motivo del contatto">
                <select
                    {...register("purpose", { required: true })}
                    className={`${inputClass} appearance-none cursor-pointer`}
                >
                    {(Object.keys(PURPOSE_LABELS) as Purpose[]).map((k) => (
                        <option key={k} value={k}>
                            {PURPOSE_LABELS[k]}
                        </option>
                    ))}
                </select>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome e cognome" error={errors.name?.message}>
                    <input
                        {...register("name", { required: "Inserisci il tuo nome", minLength: { value: 2, message: "Minimo 2 caratteri" } })}
                        placeholder="Mario Rossi"
                        className={inputClass}
                    />
                </Field>
                <Field label="Azienda / Testata (opzionale)">
                    <input
                        {...register("company")}
                        placeholder="Es. Vogue Italia, L'Oréal"
                        className={inputClass}
                    />
                </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email" error={errors.email?.message}>
                    <input
                        {...register("email", {
                            required: "Email richiesta",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email non valida" },
                        })}
                        type="email"
                        placeholder="mario@email.com"
                        className={inputClass}
                    />
                </Field>
                <Field label="Telefono (opzionale)" error={errors.phone?.message}>
                    <input
                        {...register("phone", { pattern: { value: /^\+?[0-9\s]{8,15}$/, message: "Numero non valido" } })}
                        type="tel"
                        placeholder="+39 333 1234567"
                        className={inputClass}
                    />
                </Field>
            </div>

            <Field label="Messaggio" error={errors.message?.message}>
                <textarea
                    {...register("message", { required: "Scrivici qualcosa", minLength: { value: 10, message: "Minimo 10 caratteri" } })}
                    rows={5}
                    placeholder="Raccontaci cosa hai in mente: progetto, tempistiche, link al portfolio…"
                    className={`${inputClass} resize-none`}
                />
            </Field>

            {error && (
                <div className="text-xs text-error bg-error/10 border border-error/30 rounded-[var(--radius-sm)] px-3 py-2">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="cta-shine cta-pulse w-full inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {submitting ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                ) : (
                    <>
                        Invia richiesta
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </>
                )}
            </button>
            <p className="text-[10px] text-silver-dark text-center">
                Inviando il modulo accetti la nostra <a href="/privacy" className="underline hover:text-warm-white">privacy policy</a>.
            </p>
        </form>
    );
}

const inputClass =
    "mt-1.5 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors";

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </label>
            {children}
            {error && <p className="text-error text-xs mt-1">{error}</p>}
        </div>
    );
}
