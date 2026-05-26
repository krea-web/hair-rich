"use client";

import { motion, AnimatePresence } from "framer-motion";
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
    const [hoursEditor, setHoursEditor] = useState<{ id: string; name: string } | null>(null);
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
                                            <button
                                                onClick={() => setHoursEditor({ id: s.id, name: s.name })}
                                                className="ml-auto text-[10px] uppercase tracking-[0.25em] text-accent-warm hover:text-warm-white font-body font-semibold border border-accent-warm/40 rounded-full px-3 py-1.5 transition-colors"
                                            >
                                                Orari settimana
                                            </button>
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

            <AnimatePresence>
                {hoursEditor && (
                    <WeeklyHoursModal
                        staffId={hoursEditor.id}
                        staffName={hoursEditor.name}
                        onClose={() => setHoursEditor(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface WeeklyHoursRow {
    weekday: number;
    start_time: string;
    end_time: string;
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function WeeklyHoursModal({
    staffId,
    staffName,
    onClose,
}: {
    staffId: string;
    staffName: string;
    onClose: () => void;
}) {
    // 7-slot array: index 0 = Monday (weekday=1), ... 6 = Sunday (weekday=0)
    // DB stores weekday 0-6 with Sun=0 historically; we present Mon-first.
    // We'll map: idx 0..6 → weekday (1,2,3,4,5,6,0)
    const idxToWeekday = (i: number) => (i === 6 ? 0 : i + 1);
    const weekdayToIdx = (w: number) => (w === 0 ? 6 : w - 1);

    const [rows, setRows] = useState<(WeeklyHoursRow | null)[]>([null, null, null, null, null, null, null]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("working_hours")
                    .select("weekday, start_time, end_time")
                    .eq("staff_id", staffId);
                if (error) throw error;
                const next: (WeeklyHoursRow | null)[] = [null, null, null, null, null, null, null];
                for (const r of (data ?? []) as WeeklyHoursRow[]) {
                    next[weekdayToIdx(r.weekday)] = {
                        weekday: r.weekday,
                        start_time: r.start_time.slice(0, 5),
                        end_time: r.end_time.slice(0, 5),
                    };
                }
                setRows(next);
            } catch (e: any) {
                addToast(`Errore: ${e?.message ?? "?"}`, "error");
            } finally {
                setLoading(false);
            }
        })();
    }, [staffId, addToast]);

    const toggleDay = (idx: number) => {
        setRows((prev) => {
            const next = [...prev];
            if (next[idx]) {
                next[idx] = null;
            } else {
                next[idx] = {
                    weekday: idxToWeekday(idx),
                    start_time: "09:00",
                    end_time: "19:00",
                };
            }
            return next;
        });
    };

    const updateTime = (idx: number, field: "start_time" | "end_time", value: string) => {
        setRows((prev) => {
            const next = [...prev];
            const cur = next[idx];
            if (!cur) return prev;
            next[idx] = { ...cur, [field]: value };
            return next;
        });
    };

    const save = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const supabase = createClient();
            await supabase.from("working_hours").delete().eq("staff_id", staffId);

            const toInsert = rows
                .filter((r): r is WeeklyHoursRow => r !== null)
                .map((r) => ({
                    staff_id: staffId,
                    weekday: r.weekday,
                    start_time: r.start_time,
                    end_time: r.end_time,
                }));

            if (toInsert.length > 0) {
                const { error } = await supabase.from("working_hours").insert(toInsert);
                if (error) throw error;
            }
            addToast("Orari salvati", "success");
            onClose();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setBusy(false);
        }
    };

    const applyMondayToAll = () => {
        const mon = rows[0];
        if (!mon) {
            addToast("Imposta prima il lunedì", "info");
            return;
        }
        setRows((prev) =>
            prev.map((_, i) => ({
                weekday: idxToWeekday(i),
                start_time: mon.start_time,
                end_time: mon.end_time,
            })),
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 max-w-xl w-full max-h-[90dvh] overflow-y-auto space-y-4"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-display-alt text-lg text-accent-warm">Orari settimana</span>
                        <h3 className="text-display text-2xl text-warm-white tracking-tight">{staffName}</h3>
                        <p className="text-xs text-warm-white-muted mt-1">
                            Solo i giorni attivi sono prenotabili. Bottone "Copia da lunedì" replica
                            gli stessi orari su tutta la settimana.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-silver-dark hover:text-warm-white text-xl px-2"
                        aria-label="Chiudi"
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-14 bg-black-2 border border-line rounded-md animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {rows.map((row, idx) => {
                                const active = row !== null;
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                                            active
                                                ? "bg-black-2 border-line"
                                                : "bg-black-2/30 border-line/50"
                                        }`}
                                    >
                                        <button
                                            onClick={() => toggleDay(idx)}
                                            className={`w-12 text-[10px] uppercase tracking-[0.2em] font-body font-semibold py-1.5 rounded-full border ${
                                                active
                                                    ? "bg-accent-warm text-black border-accent-warm"
                                                    : "border-line text-silver"
                                            }`}
                                        >
                                            {WEEKDAY_LABELS[idx]}
                                        </button>
                                        {active && row ? (
                                            <>
                                                <input
                                                    type="time"
                                                    value={row.start_time}
                                                    onChange={(e) => updateTime(idx, "start_time", e.target.value)}
                                                    className="bg-black border border-line rounded-md px-2 py-1.5 text-warm-white font-mono text-sm"
                                                />
                                                <span className="text-silver-dark">→</span>
                                                <input
                                                    type="time"
                                                    value={row.end_time}
                                                    onChange={(e) => updateTime(idx, "end_time", e.target.value)}
                                                    className="bg-black border border-line rounded-md px-2 py-1.5 text-warm-white font-mono text-sm"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-xs text-silver-dark italic">Chiuso</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={applyMondayToAll}
                            disabled={!rows[0]}
                            className="text-[10px] uppercase tracking-[0.25em] text-accent-warm hover:text-warm-white font-body font-semibold disabled:opacity-40"
                        >
                            Copia lunedì su tutti i giorni
                        </button>

                        <div className="flex justify-end gap-2 pt-2 border-t border-line">
                            <button
                                onClick={onClose}
                                disabled={busy}
                                className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em]"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={save}
                                disabled={busy}
                                className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50"
                            >
                                {busy ? "Salvataggio…" : "Salva orari"}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
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
