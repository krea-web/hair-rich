"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";

interface WorkingHourRow {
    id: string;
    staff_id: string | null;
    weekday: number;
    start_time: string; // HH:MM:SS
    end_time: string;
}

const WEEKDAY_LABELS = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
];

function toHM(t: string): string {
    // PG time returns HH:MM:SS — keep HH:MM for input value
    return t.slice(0, 5);
}

function withSeconds(hm: string): string {
    return /^\d{2}:\d{2}$/.test(hm) ? `${hm}:00` : hm;
}

export default function AdminOrariPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [rows, setRows] = useState<WorkingHourRow[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const [staffRows, whRes] = await Promise.all([
                fetchStaff(),
                supabase.from("working_hours").select("*").order("weekday").order("start_time"),
            ]);
            setStaff(staffRows);
            if (whRes.error) throw whRes.error;
            setRows((whRes.data ?? []) as WorkingHourRow[]);
            if (!selectedStaffId && staffRows[0]) setSelectedStaffId(staffRows[0].id);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast, selectedStaffId]);

    useEffect(() => {
        load();
    }, [load]);

    // Group current staff's rows by weekday (Mon=1..Sun=0 in PG style)
    const byDay = useMemo(() => {
        const map: Record<number, WorkingHourRow[]> = {};
        for (let i = 0; i < 7; i++) map[i] = [];
        for (const r of rows) {
            if (r.staff_id !== selectedStaffId) continue;
            (map[r.weekday] ??= []).push(r);
        }
        for (const k of Object.keys(map)) {
            map[+k]!.sort((a, b) => a.start_time.localeCompare(b.start_time));
        }
        return map;
    }, [rows, selectedStaffId]);

    const addShift = async (weekday: number) => {
        if (!selectedStaffId) return;
        const existing = byDay[weekday] ?? [];
        // Default new shift: 09:00–13:00 morning slot, or 14:30–19:30 if morning exists.
        const newStart = existing.length === 0 ? "09:00" : "14:30";
        const newEnd = existing.length === 0 ? "13:00" : "19:30";
        setSaving(`new-${weekday}`);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("working_hours")
                .insert({
                    staff_id: selectedStaffId,
                    weekday,
                    start_time: withSeconds(newStart),
                    end_time: withSeconds(newEnd),
                })
                .select()
                .single();
            if (error) throw error;
            setRows((rs) => [...rs, data as WorkingHourRow]);
            addToast("Turno aggiunto", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(null);
        }
    };

    const updateShift = async (id: string, patch: Partial<WorkingHourRow>) => {
        setSaving(id);
        try {
            const supabase = createClient();
            const dbPatch: any = { ...patch };
            if (dbPatch.start_time) dbPatch.start_time = withSeconds(dbPatch.start_time);
            if (dbPatch.end_time) dbPatch.end_time = withSeconds(dbPatch.end_time);
            const { error } = await supabase.from("working_hours").update(dbPatch).eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(null);
        }
    };

    const removeShift = async (id: string) => {
        setSaving(id);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("working_hours").delete().eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.filter((r) => r.id !== id));
            addToast("Turno rimosso", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Disponibilità</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Orari staff.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Per ogni barber, definisci i turni settimanali (mattina, pomeriggio, eventuale
                    pausa pranzo). Il sistema di prenotazione genera gli slot solo all'interno di
                    questi orari.
                </p>
            </motion.div>

            {/* Staff selector */}
            <div className="flex flex-wrap gap-2">
                {staff.map((s) => {
                    const active = s.id === selectedStaffId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSelectedStaffId(s.id)}
                            className={`px-4 py-2 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full border transition-colors ${
                                active
                                    ? "bg-warm-white text-black border-warm-white"
                                    : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                            }`}
                        >
                            {s.name}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-20 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
                        const shifts = byDay[wd] ?? [];
                        return (
                            <article
                                key={wd}
                                className="bg-carbon border border-line rounded-[var(--radius-md)] p-4 md:p-5"
                            >
                                <div className="flex items-start gap-4">
                                    <h3 className="text-warm-white font-body font-semibold min-w-[100px]">
                                        {WEEKDAY_LABELS[wd]}
                                    </h3>
                                    <div className="flex-1 space-y-2">
                                        {shifts.length === 0 ? (
                                            <p className="text-silver-dark text-sm italic">
                                                Chiuso · nessun turno
                                            </p>
                                        ) : (
                                            shifts.map((sh) => {
                                                const busy = saving === sh.id;
                                                return (
                                                    <div
                                                        key={sh.id}
                                                        className="flex items-center gap-2 flex-wrap"
                                                    >
                                                        <input
                                                            type="time"
                                                            step={1800}
                                                            value={toHM(sh.start_time)}
                                                            disabled={busy}
                                                            onBlur={(e) =>
                                                                e.target.value !== toHM(sh.start_time) &&
                                                                updateShift(sh.id, {
                                                                    start_time: e.target.value,
                                                                })
                                                            }
                                                            onChange={(e) =>
                                                                setRows((rs) =>
                                                                    rs.map((r) =>
                                                                        r.id === sh.id
                                                                            ? { ...r, start_time: e.target.value }
                                                                            : r
                                                                    )
                                                                )
                                                            }
                                                            className="bg-black-2 border border-line rounded-md px-2 py-1 text-warm-white text-sm"
                                                        />
                                                        <span className="text-silver-dark">–</span>
                                                        <input
                                                            type="time"
                                                            step={1800}
                                                            value={toHM(sh.end_time)}
                                                            disabled={busy}
                                                            onBlur={(e) =>
                                                                e.target.value !== toHM(sh.end_time) &&
                                                                updateShift(sh.id, {
                                                                    end_time: e.target.value,
                                                                })
                                                            }
                                                            onChange={(e) =>
                                                                setRows((rs) =>
                                                                    rs.map((r) =>
                                                                        r.id === sh.id
                                                                            ? { ...r, end_time: e.target.value }
                                                                            : r
                                                                    )
                                                                )
                                                            }
                                                            className="bg-black-2 border border-line rounded-md px-2 py-1 text-warm-white text-sm"
                                                        />
                                                        <button
                                                            onClick={() => removeShift(sh.id)}
                                                            disabled={busy}
                                                            className="ml-auto px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-error border border-error/40 rounded-full hover:bg-error/10 transition-colors disabled:opacity-50"
                                                        >
                                                            Rimuovi
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <button
                                            onClick={() => addShift(wd)}
                                            disabled={saving === `new-${wd}` || shifts.length >= 3}
                                            className="text-accent-warm text-sm hover:underline disabled:opacity-50"
                                        >
                                            + Aggiungi turno
                                        </button>
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
