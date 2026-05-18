"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";

interface ServiceRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    price_cents: number;
    duration_min: number;
    badge: string | null;
    is_active: boolean;
    sort_order: number;
}

export default function AdminServiziPage() {
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("services")
                .select("*")
                .order("sort_order");
            if (error) throw error;
            setServices((data ?? []) as ServiceRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const updateField = async (id: string, patch: Partial<ServiceRow>) => {
        setSavingId(id);
        const supabase = createClient();
        const { error } = await supabase.from("services").update(patch).eq("id", id);
        setSavingId(null);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return false;
        }
        setServices((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        return true;
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return services;
        return services.filter(
            (s) =>
                s.name.toLowerCase().includes(q) || (s.badge ?? "").toLowerCase().includes(q)
        );
    }, [services, search]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Listino</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Servizi.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    I rituali offerti in salone. Tocca prezzo, durata o badge per modificarli
                    inline. Toggle "Attivo" li nasconde dal sito senza eliminarli.
                </p>
            </motion.div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="search"
                    placeholder="Cerca per nome…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] bg-carbon border border-line rounded-full px-4 py-2 text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                />
                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    {filtered.length} su {services.length}
                </span>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && (
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-carbon text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                <th className="text-left p-3 font-semibold">Servizio</th>
                                <th className="text-left p-3 font-semibold hidden md:table-cell">Badge</th>
                                <th className="text-right p-3 font-semibold">Prezzo</th>
                                <th className="text-right p-3 font-semibold">Durata</th>
                                <th className="text-center p-3 font-semibold">Attivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => {
                                const saving = savingId === s.id;
                                return (
                                    <tr
                                        key={s.id}
                                        className={`border-t border-line/60 transition-colors hover:bg-carbon/60 ${
                                            !s.is_active ? "opacity-50" : ""
                                        }`}
                                    >
                                        <td className="p-3">
                                            <div className="font-body text-warm-white">{s.name}</div>
                                            {s.description && (
                                                <div className="text-xs text-silver-dark mt-0.5 line-clamp-1 max-w-md">
                                                    {s.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 hidden md:table-cell">
                                            <BadgeCell
                                                value={s.badge}
                                                disabled={saving}
                                                onSave={(v) => updateField(s.id, { badge: v })}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <PriceCell
                                                value={s.price_cents}
                                                disabled={saving}
                                                onSave={(cents) => updateField(s.id, { price_cents: cents })}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <DurationCell
                                                value={s.duration_min}
                                                disabled={saving}
                                                onSave={(n) => updateField(s.id, { duration_min: n })}
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                role="switch"
                                                aria-checked={s.is_active}
                                                onClick={() => updateField(s.id, { is_active: !s.is_active })}
                                                disabled={saving}
                                                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                                                    s.is_active ? "bg-accent-warm" : "bg-line"
                                                } disabled:opacity-50`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                                                        s.is_active ? "translate-x-5" : "translate-x-0.5"
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Inline editable cells ─────────────────────────────────────────

function PriceCell({
    value,
    onSave,
    disabled,
}: {
    value: number;
    onSave: (cents: number) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => (value / 100).toFixed(2));

    useEffect(() => {
        setDraft((value / 100).toFixed(2));
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="text-accent-warm font-display tabular-nums hover:underline"
            >
                {formatPrice(value)}
            </button>
        );
    }

    const commit = () => {
        const parsed = parseFloat(draft.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
            setDraft((value / 100).toFixed(2));
            setEditing(false);
            return;
        }
        onSave(Math.round(parsed * 100));
        setEditing(false);
    };

    return (
        <input
            type="number"
            step="0.01"
            min="0"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft((value / 100).toFixed(2));
                    setEditing(false);
                }
            }}
            className="w-20 bg-black-2 border border-line rounded-md px-2 py-1 text-right text-accent-warm font-mono"
        />
    );
}

function DurationCell({
    value,
    onSave,
    disabled,
}: {
    value: number;
    onSave: (n: number) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="text-warm-white tabular-nums font-mono hover:underline"
            >
                {value} min
            </button>
        );
    }

    const commit = () => {
        const parsed = parseInt(draft, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setDraft(String(value));
            setEditing(false);
            return;
        }
        onSave(parsed);
        setEditing(false);
    };

    return (
        <input
            type="number"
            min="5"
            step="5"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(String(value));
                    setEditing(false);
                }
            }}
            className="w-16 bg-black-2 border border-line rounded-md px-2 py-1 text-right text-warm-white font-mono"
        />
    );
}

function BadgeCell({
    value,
    onSave,
    disabled,
}: {
    value: string | null;
    onSave: (v: string | null) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? "");

    useEffect(() => {
        setDraft(value ?? "");
    }, [value]);

    if (!editing) {
        return value ? (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="inline-flex px-2 py-1 bg-accent-warm/15 text-accent-warm text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full hover:bg-accent-warm/25 transition-colors"
            >
                {value}
            </button>
        ) : (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="text-silver-dark text-xs italic hover:text-warm-white transition-colors"
            >
                + aggiungi badge
            </button>
        );
    }

    const commit = () => {
        const v = draft.trim();
        onSave(v === "" ? null : v);
        setEditing(false);
    };

    return (
        <input
            type="text"
            value={draft}
            autoFocus
            placeholder="Es. Più scelto"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(value ?? "");
                    setEditing(false);
                }
            }}
            className="w-40 bg-black-2 border border-line rounded-md px-2 py-1 text-warm-white text-sm"
        />
    );
}
