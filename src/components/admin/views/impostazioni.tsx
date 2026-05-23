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
    notification_channel_priority: "Priorità canali",
    owner_telegram_chat_id: "Telegram chat ID",
    owner_telegram_extra_chat_ids: "Chat ID aggiuntivi",
    quiet_hours_start: "Inizio quiet hours",
    quiet_hours_end: "Fine quiet hours",
    timezone: "Fuso orario",
    multi_channel_critical: "Multi-channel per eventi critici",
};

const ALL_CHANNELS = ["whatsapp", "push", "email", "sms"] as const;
const CHANNEL_LABELS: Record<string, string> = {
    whatsapp: "WhatsApp",
    push: "Push web",
    email: "Email",
    sms: "SMS",
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

            {/* Notification Router config */}
            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <h2 className="text-display text-xl text-warm-white tracking-tight">
                    Notifiche & Comunicazioni
                </h2>
                <p className="text-warm-white-muted text-sm">
                    Il Notification Router usa queste impostazioni per scegliere come
                    raggiungere clienti e titolare. Cambiamento immediato — nessun deploy.
                </p>

                <Field
                    label={FIELD_LABELS.notification_channel_priority}
                    hint="Ordine con cui il Router prova i canali quando il cliente non ha preferenze specifiche."
                >
                    <ChannelPriorityEditor
                        value={draft.notification_channel_priority ?? []}
                        onChange={(v) => change("notification_channel_priority", v)}
                    />
                </Field>

                <div className="grid md:grid-cols-2 gap-4">
                    <Field
                        label={FIELD_LABELS.owner_telegram_chat_id}
                        hint="Chat ID numerico ottenuto da @BotFather + /start. Vuoto = no alert Telegram."
                    >
                        <input
                            value={draft.owner_telegram_chat_id ?? ""}
                            onChange={(e) => change("owner_telegram_chat_id", e.target.value || null)}
                            placeholder="123456789"
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field
                        label={FIELD_LABELS.owner_telegram_extra_chat_ids}
                        hint="Chat ID delegati separati da virgola (staff, partner)."
                    >
                        <input
                            value={(draft.owner_telegram_extra_chat_ids ?? []).join(", ")}
                            onChange={(e) =>
                                change(
                                    "owner_telegram_extra_chat_ids",
                                    e.target.value
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                )
                            }
                            placeholder="111, 222"
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <Field
                        label={FIELD_LABELS.quiet_hours_start}
                        hint="Le notifiche non-critiche vengono trattenute durante questa fascia."
                    >
                        <input
                            type="time"
                            value={(draft.quiet_hours_start ?? "22:00").slice(0, 5)}
                            onChange={(e) => change("quiet_hours_start", e.target.value)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.quiet_hours_end}>
                        <input
                            type="time"
                            value={(draft.quiet_hours_end ?? "08:00").slice(0, 5)}
                            onChange={(e) => change("quiet_hours_end", e.target.value)}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                    <Field label={FIELD_LABELS.timezone}>
                        <input
                            value={draft.timezone ?? "Europe/Rome"}
                            onChange={(e) => change("timezone", e.target.value || "Europe/Rome")}
                            className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </Field>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Boolean(draft.multi_channel_critical)}
                        onChange={(e) => change("multi_channel_critical", e.target.checked)}
                        className="accent-accent-warm"
                    />
                    <span className="text-warm-white text-sm">
                        {FIELD_LABELS.multi_channel_critical}
                    </span>
                    <span className="text-silver-dark text-xs">
                        — eventi time-sensitive (es. waitlist &lt;1h) fan-out su più canali
                    </span>
                </label>
            </section>

            {/* Sticky save bar — stack vertically on mobile so the dirty
                label doesn't push the buttons onto a wrapped row */}
            <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-3 md:py-4 bg-black/85 backdrop-blur-md border-t border-line flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 md:justify-end">
                {dirty && (
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold md:mr-auto">
                        · modifiche non salvate
                    </span>
                )}
                <div className="flex items-center gap-2 md:gap-3 justify-end">
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
        </div>
    );
}

function ChannelPriorityEditor({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const enabled = new Set(value);
    const ordered = [...value, ...ALL_CHANNELS.filter((c) => !enabled.has(c))];

    const move = (channel: string, direction: -1 | 1) => {
        const idx = value.indexOf(channel);
        if (idx === -1) return;
        const target = idx + direction;
        if (target < 0 || target >= value.length) return;
        const next = [...value];
        [next[idx], next[target]] = [next[target]!, next[idx]!];
        onChange(next);
    };

    const toggle = (channel: string) => {
        if (enabled.has(channel)) {
            onChange(value.filter((c) => c !== channel));
        } else {
            onChange([...value, channel]);
        }
    };

    return (
        <ul className="space-y-2">
            {ordered.map((channel) => {
                const isOn = enabled.has(channel);
                const idx = value.indexOf(channel);
                return (
                    <li
                        key={channel}
                        className={`flex items-center gap-3 p-2 bg-black-2 border rounded-md ${
                            isOn ? "border-line" : "border-line opacity-50"
                        }`}
                    >
                        <span className="w-6 text-center text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">
                            {isOn ? idx + 1 : "—"}
                        </span>
                        <span className="flex-1 text-warm-white text-sm">{CHANNEL_LABELS[channel] ?? channel}</span>
                        {isOn && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => move(channel, -1)}
                                    disabled={idx === 0}
                                    className="text-silver hover:text-warm-white px-1 disabled:opacity-30"
                                    aria-label="Sposta su"
                                >
                                    ▲
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(channel, 1)}
                                    disabled={idx === value.length - 1}
                                    className="text-silver hover:text-warm-white px-1 disabled:opacity-30"
                                    aria-label="Sposta giù"
                                >
                                    ▼
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => toggle(channel)}
                            className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1 rounded-full border ${
                                isOn
                                    ? "border-accent-warm text-accent-warm"
                                    : "border-line text-silver"
                            }`}
                        >
                            {isOn ? "Attivo" : "Off"}
                        </button>
                    </li>
                );
            })}
        </ul>
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
