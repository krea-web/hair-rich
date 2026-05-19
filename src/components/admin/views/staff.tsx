"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { persistSortOrder } from "@/lib/sortOrder";

interface StaffRow {
    id: string;
    slug: string;
    name: string;
    role: string;
    bio: string | null;
    is_active: boolean;
    sort_order: number;
}

interface StaffStats {
    nextAppt: string | null;
    completedThisMonth: number;
}

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<StaffRow[]>([]);
    const [stats, setStats] = useState<Record<string, StaffStats>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Staff list
            const { data: staffData, error: staffErr } = await supabase
                .from("staff")
                .select("*")
                .order("sort_order");
            if (staffErr) throw staffErr;
            setStaff((staffData ?? []) as StaffRow[]);

            // Stats per staff: next appointment + completed this month
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);

            const { data: apptData, error: apptErr } = await supabase
                .from("appointments")
                .select("staff_id, status, start_at")
                .gte("start_at", monthStart.toISOString());
            if (apptErr) throw apptErr;

            const now = Date.now();
            const map: Record<string, StaffStats> = {};
            for (const row of ((apptData ?? []) as any[])) {
                const id = row.staff_id;
                if (!id) continue;
                const entry = map[id] ?? { nextAppt: null, completedThisMonth: 0 };
                if (row.status === "completed") entry.completedThisMonth += 1;
                if (
                    (row.status === "booked" || row.status === "confirmed") &&
                    new Date(row.start_at).getTime() > now
                ) {
                    if (!entry.nextAppt || row.start_at < entry.nextAppt) {
                        entry.nextAppt = row.start_at;
                    }
                }
                map[id] = entry;
            }
            setStats(map);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const updateField = async (id: string, patch: Partial<StaffRow>) => {
        setSavingId(id);
        const supabase = createClient();
        const { error } = await supabase.from("staff").update(patch).eq("id", id);
        setSavingId(null);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return false;
        }
        setStaff((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        return true;
    };

    const move = async (id: string, dir: -1 | 1) => {
        const i = staff.findIndex((s) => s.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= staff.length) return;
        const next = [...staff];
        [next[i], next[j]] = [next[j]!, next[i]!];
        setStaff(next);
        try {
            await persistSortOrder("staff", next.map((s) => s.id));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
            setStaff(staff);
        }
    };

    const totals = useMemo(
        () => ({
            total: staff.length,
            active: staff.filter((s) => s.is_active).length,
        }),
        [staff]
    );

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Squadra</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Staff.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Tocca ruolo o bio per modificarli. Toggle "Attivo" sospende la disponibilità
                    nel booking — utile per ferie, permessi o pausa lavorativa.
                </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-md">
                {[
                    { label: "Totale staff", value: totals.total },
                    { label: "Attivi ora", value: totals.active },
                ].map((s) => (
                    <div key={s.label} className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {s.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-40 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && (
                <div className="space-y-4">
                    {staff.map((s, idx) => {
                        const saving = savingId === s.id;
                        const personStats = stats[s.id] ?? { nextAppt: null, completedThisMonth: 0 };
                        return (
                            <article
                                key={s.id}
                                className={`bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 transition-opacity ${
                                    !s.is_active ? "opacity-60" : ""
                                }`}
                            >
                                <div className="flex items-start gap-5">
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button
                                            onClick={() => move(s.id, -1)}
                                            disabled={idx === 0}
                                            aria-label="Su"
                                            className="text-silver-dark hover:text-warm-white disabled:opacity-20 transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M18 15l-6-6-6 6" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => move(s.id, 1)}
                                            disabled={idx === staff.length - 1}
                                            aria-label="Giù"
                                            className="text-silver-dark hover:text-warm-white disabled:opacity-20 transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl font-display text-warm-white">
                                            {s.name.charAt(0)}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-display text-2xl text-warm-white tracking-tight">
                                                {s.name}
                                            </h3>
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
                                            <span className="text-[10px] uppercase tracking-[0.25em] font-body font-semibold text-silver-dark">
                                                {s.is_active ? "Disponibile per il booking" : "Sospeso"}
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <RoleCell
                                                value={s.role}
                                                disabled={saving}
                                                onSave={(v) => updateField(s.id, { role: v })}
                                            />
                                        </div>

                                        <div className="mt-3">
                                            <BioCell
                                                value={s.bio}
                                                disabled={saving}
                                                onSave={(v) => updateField(s.id, { bio: v })}
                                            />
                                        </div>

                                        {/* Stats row */}
                                        <div className="mt-5 grid grid-cols-2 gap-3 max-w-lg">
                                            <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Tagli completati · mese
                                                </span>
                                                <p className="mt-1 text-warm-white text-xl tabular-nums">
                                                    {personStats.completedThisMonth}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Prossimo appt
                                                </span>
                                                <p className="mt-1 text-warm-white text-sm font-body">
                                                    {personStats.nextAppt
                                                        ? new Date(personStats.nextAppt).toLocaleString("it-IT", {
                                                              day: "numeric",
                                                              month: "short",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                          })
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function RoleCell({
    value,
    onSave,
    disabled,
}: {
    value: string;
    onSave: (v: string) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold border border-accent-warm/40 px-2.5 py-1 rounded-full hover:bg-accent-warm/10 transition-colors"
            >
                {value}
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </button>
        );
    }

    const commit = () => {
        const v = draft.trim();
        if (v.length === 0) {
            setDraft(value);
            setEditing(false);
            return;
        }
        onSave(v);
        setEditing(false);
    };

    return (
        <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(value);
                    setEditing(false);
                }
            }}
            className="w-56 bg-black-2 border border-accent-warm/40 rounded-full px-3 py-1 text-sm text-warm-white"
        />
    );
}

function BioCell({
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
                className="text-warm-white-muted text-sm leading-relaxed text-left hover:text-warm-white transition-colors w-full max-w-2xl"
            >
                {value}
                <span className="ml-2 text-accent-warm text-xs">modifica</span>
            </button>
        ) : (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="text-silver-dark text-sm italic hover:text-warm-white transition-colors"
            >
                + aggiungi bio
            </button>
        );
    }

    const commit = () => {
        const v = draft.trim();
        onSave(v === "" ? null : v);
        setEditing(false);
    };

    return (
        <textarea
            value={draft}
            rows={3}
            autoFocus
            placeholder="Una frase su questa persona…"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    setDraft(value ?? "");
                    setEditing(false);
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    commit();
                }
            }}
            className="w-full max-w-2xl bg-black-2 border border-line rounded-[var(--radius-sm)] px-3 py-2 text-warm-white text-sm leading-relaxed resize-none"
        />
    );
}
