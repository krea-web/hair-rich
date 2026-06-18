"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useBookingStore, useToastStore } from "@/lib/store";
import { addDaysStr } from "@/lib/time";

interface Props {
    /** ISO date (yyyy-mm-dd) the user was looking at when no slots showed up. */
    fallbackDate: string;
}

/**
 * Surfaced inside StepDateTime when the selected day has 0 free slots
 * (or, optionally, when the whole 12-day strip is fully booked).
 *
 * Honours `salon_settings.waitlist_enabled` — when the master flag is
 * off, the CTA never mounts. When on, it asks the customer for a
 * flexible window (defaults: same day → +14 giorni) plus optional time
 * preference, then writes a row in `waitlist` and lets the matcher
 * cron do the rest.
 */
export function WaitlistOptIn({ fallbackDate }: Props) {
    const { serviceId, staffId, contactName, contactPhone, contactEmail } = useBookingStore();
    const addToast = useToastStore((s) => s.addToast);

    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [dateTo, setDateTo] = useState<string>(() => addDaysStr(fallbackDate, 14));
    const [preferredStart, setPreferredStart] = useState<string>("");
    const [preferredEnd, setPreferredEnd] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // Probe the master flag once on mount. Hidden when off.
    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("salon_settings")
            .select("waitlist_enabled")
            .limit(1)
            .maybeSingle()
            .then(({ data }) => setEnabled(Boolean(data?.waitlist_enabled)));
    }, []);

    if (!enabled || done) {
        return done ? (
            <div className="mt-6 p-5 rounded-[var(--radius-md)] bg-accent-warm/10 border border-accent-warm/40">
                <p className="text-sm text-warm-white font-body">
                    ✅ Sei in lista. Appena si libera uno slot ti scrivo subito —
                    avrai un link per confermare.
                </p>
            </div>
        ) : null;
    }

    const handleSubmit = async () => {
        if (!serviceId) {
            addToast("Seleziona prima un servizio", "warning");
            return;
        }

        setSubmitting(true);
        const supabase = createClient();

        const { data: auth } = await supabase.auth.getUser();
        let customerId: string | null = null;

        if (auth.user) {
            const { data: c } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", auth.user.id)
                .maybeSingle();
            customerId = c?.id ?? null;
        }

        if (!customerId) {
            // Guest: create or reuse a customer row keyed by phone/email so
            // the matcher has a recipient to message.
            if (!contactPhone && !contactEmail) {
                addToast("Inserisci telefono o email per la lista d'attesa", "warning");
                setSubmitting(false);
                return;
            }
            const { data: existing } = await supabase
                .from("customers")
                .select("id")
                .or(
                    [
                        contactEmail ? `email.ilike.${contactEmail}` : null,
                        contactPhone ? `phone.eq.${contactPhone}` : null,
                    ]
                        .filter(Boolean)
                        .join(","),
                )
                .limit(1)
                .maybeSingle();
            if (existing?.id) {
                customerId = existing.id;
            } else {
                const { data: inserted, error: insErr } = await supabase
                    .from("customers")
                    .insert({
                        first_name: contactName || "Cliente",
                        email: contactEmail || null,
                        phone: contactPhone || null,
                        is_guest: true,
                    })
                    .select("id")
                    .single();
                if (insErr || !inserted) {
                    addToast("Errore creazione cliente: " + (insErr?.message ?? ""), "error");
                    setSubmitting(false);
                    return;
                }
                customerId = inserted.id;
            }
        }

        const { error } = await supabase.from("waitlist").insert({
            customer_id: customerId,
            service_id: serviceId,
            staff_id: staffId,
            date_from: fallbackDate,
            date_to: dateTo,
            preferred_time_start: preferredStart || null,
            preferred_time_end: preferredEnd || null,
            source: "app",
        });

        setSubmitting(false);
        if (error) {
            addToast("Errore: " + error.message, "error");
            return;
        }

        addToast("Ti ho messo in lista d'attesa", "success");
        setDone(true);
    };

    return (
        <div className="mt-6 p-5 rounded-[var(--radius-md)] bg-black-2 border border-line">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold mb-2">
                        Lista d'attesa
                    </p>
                    <h4 className="text-display text-lg text-warm-white tracking-tight">
                        Niente slot? Te lo trovo io.
                    </h4>
                    <p className="mt-2 text-sm text-silver">
                        Se qualcuno cancella, ti mando un messaggio con un link
                        per prendere lo slot al volo (prima viene, prima va).
                    </p>
                </div>
                {!expanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold bg-accent-warm text-black hover:scale-[1.02] active:scale-95 transition-transform"
                    >
                        Entra in lista
                    </button>
                )}
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Sono disponibile fino a
                                </span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    min={fallbackDate}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-carbon border border-line rounded-[var(--radius-sm)] text-warm-white font-body text-sm focus:outline-none focus:border-accent-warm"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="block">
                                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                        Dalle (opz.)
                                    </span>
                                    <input
                                        type="time"
                                        value={preferredStart}
                                        onChange={(e) => setPreferredStart(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-carbon border border-line rounded-[var(--radius-sm)] text-warm-white font-mono text-sm focus:outline-none focus:border-accent-warm"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                        Alle (opz.)
                                    </span>
                                    <input
                                        type="time"
                                        value={preferredEnd}
                                        onChange={(e) => setPreferredEnd(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 bg-carbon border border-line rounded-[var(--radius-sm)] text-warm-white font-mono text-sm focus:outline-none focus:border-accent-warm"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setExpanded(false)}
                                className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                disabled={submitting}
                                onClick={handleSubmit}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {submitting ? "..." : "Confermo"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
