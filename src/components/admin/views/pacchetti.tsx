"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

interface ServicePackage {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    total_price_cents: number;
    credits: number;
    eligible_service_ids: string[];
    validity_days: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

interface ServiceLite {
    id: string;
    name: string;
}

const slugify = (s: string) =>
    s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

export default function AdminPacchettiPage() {
    const [rows, setRows] = useState<ServicePackage[]>([]);
    const [services, setServices] = useState<ServiceLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [editing, setEditing] = useState<Partial<ServicePackage> | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const [{ data: pkgs }, { data: svc }, { data: salon }] = await Promise.all([
                supabase
                    .from("service_packages")
                    .select("*")
                    .order("sort_order", { ascending: true }),
                supabase.from("services").select("id, name").eq("is_active", true),
                supabase.from("salon_settings").select("packages_enabled").limit(1).maybeSingle(),
            ]);
            setRows((pkgs ?? []) as ServicePackage[]);
            setServices((svc ?? []) as ServiceLite[]);
            setEnabled(Boolean(salon?.packages_enabled));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        if (!editing) return;
        const supabase = createClient();
        const payload = {
            name: editing.name?.trim() ?? "",
            slug: editing.slug?.trim() || slugify(editing.name ?? ""),
            description: editing.description ?? null,
            total_price_cents: Math.max(0, Math.round(Number(editing.total_price_cents) || 0)),
            credits: Math.max(1, Math.round(Number(editing.credits) || 1)),
            validity_days: Math.max(1, Math.round(Number(editing.validity_days) || 180)),
            eligible_service_ids: editing.eligible_service_ids ?? [],
            is_active: editing.is_active ?? true,
            sort_order: Math.round(Number(editing.sort_order) || 0),
        };
        if (!payload.name) {
            addToast("Nome richiesto", "warning");
            return;
        }
        const { error } = editing.id
            ? await supabase.from("service_packages").update(payload).eq("id", editing.id)
            : await supabase.from("service_packages").insert(payload);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        addToast("Pacchetto salvato", "success");
        setEditing(null);
        load();
    };

    const toggleActive = async (p: ServicePackage) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("service_packages")
            .update({ is_active: !p.is_active })
            .eq("id", p.id);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        load();
    };

    const toggleMaster = async () => {
        const supabase = createClient();
        const { error } = await supabase
            .from("salon_settings")
            .update({ packages_enabled: !enabled })
            .eq("is_singleton", true);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        addToast(enabled ? "Feature disattivata" : "Feature attivata", "success");
        setEnabled(!enabled);
    };

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
            <header className="mb-8 flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                        Vendite · pacchetti
                    </p>
                    <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1">
                        Pacchetti prepagati
                    </h1>
                    <p className="mt-2 text-sm text-silver max-w-2xl">
                        Bundle vendibili in salone (cash/POS/bonifico/omaggio).
                        Il cliente vede il credito al momento della prenotazione
                        e brucia uno slot per appuntamento.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-black-2 border border-line cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabled === true}
                            onChange={toggleMaster}
                            className="accent-accent-warm"
                        />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver font-body font-semibold">
                            Feature {enabled ? "attiva" : "disattiva"}
                        </span>
                    </label>
                    <button
                        onClick={() => setEditing({ is_active: true, credits: 5, validity_days: 180, sort_order: rows.length })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                    >
                        + Nuovo pacchetto
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="text-silver-dark text-center py-10">Carico...</div>
            ) : rows.length === 0 ? (
                <div className="text-silver-dark text-center py-10">
                    Nessun pacchetto. Creane uno per iniziare a vendere bundle.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rows.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-5 rounded-[var(--radius-md)] border ${p.is_active ? "bg-carbon border-line" : "bg-black-2 border-line/50 opacity-60"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-display text-xl text-warm-white tracking-tight">{p.name}</h3>
                                    {p.description && (
                                        <p className="text-sm text-silver mt-1">{p.description}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-display text-2xl text-warm-white">
                                        {formatPrice(p.total_price_cents)}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                        {p.credits} crediti
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 text-[11px] text-silver-dark space-y-0.5">
                                <div>Validità: {p.validity_days} giorni</div>
                                <div>
                                    Per credito: {formatPrice(Math.round(p.total_price_cents / p.credits))}
                                </div>
                                <div>
                                    Servizi: {p.eligible_service_ids.length === 0
                                        ? "Tutti"
                                        : p.eligible_service_ids
                                              .map((id) => services.find((s) => s.id === id)?.name)
                                              .filter(Boolean)
                                              .join(", ")}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-3">
                                <button
                                    onClick={() => toggleActive(p)}
                                    className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                                >
                                    {p.is_active ? "Disattiva" : "Attiva"}
                                </button>
                                <button
                                    onClick={() => setEditing(p)}
                                    className="text-[10px] uppercase tracking-[0.3em] text-accent-warm hover:text-warm-white font-body font-semibold"
                                >
                                    Modifica →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {editing && (
                    <PackageEditorModal
                        services={services}
                        draft={editing}
                        setDraft={setEditing}
                        onClose={() => setEditing(null)}
                        onSave={save}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface EditorProps {
    services: ServiceLite[];
    draft: Partial<ServicePackage>;
    setDraft: (d: Partial<ServicePackage> | null) => void;
    onClose: () => void;
    onSave: () => void;
}

function PackageEditorModal({ services, draft, setDraft, onClose, onSave }: EditorProps) {
    const toggleService = (id: string) => {
        const current = draft.eligible_service_ids ?? [];
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        setDraft({ ...draft, eligible_service_ids: next });
    };
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-carbon border border-line rounded-[var(--radius-lg)] p-6 max-h-[90dvh] overflow-y-auto"
            >
                <h2 className="text-display text-2xl text-warm-white">
                    {draft.id ? "Modifica pacchetto" : "Nuovo pacchetto"}
                </h2>
                <div className="mt-4 space-y-3">
                    <Field
                        label="Nome"
                        value={draft.name ?? ""}
                        onChange={(v) => setDraft({ ...draft, name: v })}
                    />
                    <Field
                        label="Descrizione"
                        value={draft.description ?? ""}
                        onChange={(v) => setDraft({ ...draft, description: v })}
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <Field
                            label="Prezzo (€)"
                            type="number"
                            value={String((draft.total_price_cents ?? 0) / 100)}
                            onChange={(v) => setDraft({ ...draft, total_price_cents: Math.round(Number(v) * 100) })}
                        />
                        <Field
                            label="Crediti"
                            type="number"
                            value={String(draft.credits ?? 5)}
                            onChange={(v) => setDraft({ ...draft, credits: Number(v) })}
                        />
                        <Field
                            label="Validità (gg)"
                            type="number"
                            value={String(draft.validity_days ?? 180)}
                            onChange={(v) => setDraft({ ...draft, validity_days: Number(v) })}
                        />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            Servizi ammessi (vuoto = tutti)
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {services.map((s) => {
                                const on = (draft.eligible_service_ids ?? []).includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => toggleService(s.id)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-body font-semibold transition-colors ${
                                            on
                                                ? "bg-accent-warm text-black"
                                                : "bg-black-2 border border-line text-silver"
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={onSave}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold"
                    >
                        Salva
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white font-body text-sm focus:outline-none focus:border-accent-warm"
            />
        </label>
    );
}
