"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchSalonSettings } from "@/lib/supabase/queries";
import type { SalonSettings } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";

type EditableSettings = Omit<SalonSettings, "id" | "updated_at" | "onboarding_completed_at">;

const FIELD_LABELS: Record<keyof EditableSettings, string> = {
    display_name: "Nome salone",
    phone: "Telefono",
    email: "Email",
    address: "Indirizzo",
    city: "Città",
    province: "Provincia",
    postal_code: "CAP",
    lat: "Latitudine",
    lng: "Longitudine",
    booking_lead_time_min: "Anticipo minimo (minuti)",
    booking_lead_time_max_days: "Massimo giorni avanti",
    cancel_min_hours: "Cancellazione minima (ore)",
    no_show_threshold: "Soglia no-show",
    slot_step_min: "Step slot (minuti)",
};

export default function AdminImpostazioniPage() {
    const [row, setRow] = useState<SalonSettings | null>(null);
    const [draft, setDraft] = useState<EditableSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSalonSettings();
            setRow(data);
            if (data) {
                const { id, updated_at, onboarding_completed_at, ...rest } = data;
                void id;
                void updated_at;
                void onboarding_completed_at;
                setDraft(rest);
            }
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const change = <K extends keyof EditableSettings>(key: K, value: EditableSettings[K]) => {
        setDraft((d) => (d ? { ...d, [key]: value } : d));
    };

    const save = async () => {
        if (!row || !draft || saving) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("salon_settings").update(draft).eq("id", row.id);
            if (error) throw error;
            addToast("Impostazioni salvate", "success");
            await load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        if (!row) return;
        const { id, updated_at, onboarding_completed_at, ...rest } = row;
        void id;
        void updated_at;
        void onboarding_completed_at;
        setDraft(rest);
    };

    const dirty = (() => {
        if (!row || !draft) return false;
        for (const key of Object.keys(draft) as (keyof EditableSettings)[]) {
            if ((row as any)[key] !== draft[key]) return true;
        }
        return false;
    })();

    if (loading || !draft) {
        return (
            <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-32 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Configurazione</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Impostazioni salone.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Info di contatto e policy di prenotazione. Il sito pubblico legge da qui:
                    cambia il telefono o l'indirizzo e si aggiorna ovunque senza deploy.
                </p>
            </motion.div>

            {/* Brand info */}
            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <h2 className="text-display text-xl text-warm-white tracking-tight">Identità</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label={FIELD_LABELS.display_name} required>
                        <input
                            value={draft.display_name}
                            onChange={(e) => change("display_name", e.target.value)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.phone}>
                        <input
                            value={draft.phone ?? ""}
                            onChange={(e) => change("phone", e.target.value || null)}
                            placeholder="+39 …"
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.email}>
                        <input
                            type="email"
                            value={draft.email ?? ""}
                            onChange={(e) => change("email", e.target.value || null)}
                            placeholder="info@…"
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                </div>
            </section>

            {/* Location */}
            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <h2 className="text-display text-xl text-warm-white tracking-tight">Indirizzo</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <Field label={FIELD_LABELS.address} className="md:col-span-3">
                        <input
                            value={draft.address ?? ""}
                            onChange={(e) => change("address", e.target.value || null)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.city}>
                        <input
                            value={draft.city ?? ""}
                            onChange={(e) => change("city", e.target.value || null)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.province}>
                        <input
                            value={draft.province ?? ""}
                            onChange={(e) => change("province", e.target.value || null)}
                            maxLength={2}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white uppercase"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.postal_code}>
                        <input
                            value={draft.postal_code ?? ""}
                            onChange={(e) => change("postal_code", e.target.value || null)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.lat}>
                        <input
                            type="number"
                            step="0.000001"
                            value={draft.lat ?? ""}
                            onChange={(e) =>
                                change("lat", e.target.value === "" ? null : Number(e.target.value))
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.lng}>
                        <input
                            type="number"
                            step="0.000001"
                            value={draft.lng ?? ""}
                            onChange={(e) =>
                                change("lng", e.target.value === "" ? null : Number(e.target.value))
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                </div>
            </section>

            {/* Policy */}
            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <h2 className="text-display text-xl text-warm-white tracking-tight">
                    Policy prenotazione
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <Field
                        label={FIELD_LABELS.booking_lead_time_min}
                        hint="Quanti minuti minimi devono passare tra ora e l'inizio dello slot prenotabile."
                    >
                        <input
                            type="number"
                            min={0}
                            step={5}
                            value={draft.booking_lead_time_min}
                            onChange={(e) =>
                                change("booking_lead_time_min", parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field
                        label={FIELD_LABELS.booking_lead_time_max_days}
                        hint="Massimo numero di giorni nel futuro entro cui si può prenotare."
                    >
                        <input
                            type="number"
                            min={1}
                            max={365}
                            value={draft.booking_lead_time_max_days}
                            onChange={(e) =>
                                change("booking_lead_time_max_days", parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field
                        label={FIELD_LABELS.cancel_min_hours}
                        hint="Ore minime di preavviso per cancellare senza penale."
                    >
                        <input
                            type="number"
                            min={0}
                            max={72}
                            value={draft.cancel_min_hours}
                            onChange={(e) =>
                                change("cancel_min_hours", parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field
                        label={FIELD_LABELS.no_show_threshold}
                        hint="Numero di no-show prima che il cliente debba lasciare un acconto."
                    >
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={draft.no_show_threshold}
                            onChange={(e) =>
                                change("no_show_threshold", parseInt(e.target.value, 10) || 1)
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field
                        label={FIELD_LABELS.slot_step_min}
                        hint="Step di slot del booking engine (15/30/60 min)."
                    >
                        <select
                            value={draft.slot_step_min}
                            onChange={(e) =>
                                change("slot_step_min", parseInt(e.target.value, 10) as any)
                            }
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        >
                            <option value={15}>15 minuti</option>
                            <option value={30}>30 minuti</option>
                            <option value={60}>60 minuti</option>
                        </select>
                    </Field>
                </div>
            </section>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-4 bg-black/85 backdrop-blur-md border-t border-line flex flex-wrap items-center gap-3 justify-end">
                {dirty && (
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold mr-auto">
                        · modifiche non salvate
                    </span>
                )}
                <button
                    onClick={cancel}
                    disabled={!dirty || saving}
                    className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon transition-colors disabled:opacity-40"
                >
                    Annulla
                </button>
                <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-40"
                >
                    {saving ? "Salvataggio…" : "Salva impostazioni"}
                </button>
            </div>
        </div>
    );
}

function Field({
    label,
    children,
    hint,
    required,
    className = "",
}: {
    label: string;
    children: React.ReactNode;
    hint?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
                {required && <span className="text-accent-warm ml-1">*</span>}
            </span>
            <div className="mt-1">{children}</div>
            {hint && <p className="text-xs text-silver-dark mt-1">{hint}</p>}
        </label>
    );
}
