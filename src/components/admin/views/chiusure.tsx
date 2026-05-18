"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";

interface TimeOffRow {
    id: string;
    staff_id: string | null;
    starts_at: string;
    ends_at: string;
    reason: string | null;
}

function isoLocal(d: Date): string {
    // YYYY-MM-DDTHH:mm in local time (datetime-local input format)
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startOfDayLocal(yyyymmdd: string): Date {
    const [y, m, d] = yyyymmdd.split("-").map((s) => parseInt(s, 10));
    return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function endOfDayLocal(yyyymmdd: string): Date {
    const [y, m, d] = yyyymmdd.split("-").map((s) => parseInt(s, 10));
    return new Date(y!, (m ?? 1) - 1, d ?? 1, 23, 59, 0, 0);
}

function formatRange(startISO: string, endISO: string): string {
    const s = new Date(startISO);
    const e = new Date(endISO);
    const sameDay = s.toDateString() === e.toDateString();
    const day = (d: Date) =>
        d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
    const time = (d: Date) =>
        d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    // Whole-day heuristic: starts at 00:00 and ends at 23:5x
    const isAllDay =
        s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() >= 23 && e.getMinutes() >= 55;

    if (sameDay) {
        return isAllDay ? `${day(s)} · tutto il giorno` : `${day(s)} · ${time(s)} – ${time(e)}`;
    }
    return isAllDay
        ? `${day(s)} → ${day(e)}`
        : `${day(s)} ${time(s)} → ${day(e)} ${time(e)}`;
}

export default function AdminChiusurePage() {
    const [rows, setRows] = useState<TimeOffRow[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
    const addToast = useToastStore((s) => s.addToast);

    // Form state
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const [dateStart, setDateStart] = useState(() => isoLocal(today).slice(0, 10));
    const [dateEnd, setDateEnd] = useState(() => isoLocal(today).slice(0, 10));
    const [allDay, setAllDay] = useState(true);
    const [timeStart, setTimeStart] = useState("09:00");
    const [timeEnd, setTimeEnd] = useState("19:30");
    const [staffId, setStaffId] = useState<string | "all">("all");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const [staffRows, toRes] = await Promise.all([
                fetchStaff(),
                supabase.from("time_off").select("*").order("starts_at", { ascending: true }),
            ]);
            setStaff(staffRows);
            if (toRes.error) throw toRes.error;
            setRows((toRes.data ?? []) as TimeOffRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const start = allDay ? startOfDayLocal(dateStart) : new Date(`${dateStart}T${timeStart}:00`);
            const end = allDay ? endOfDayLocal(dateEnd) : new Date(`${dateEnd}T${timeEnd}:00`);
            if (end.getTime() <= start.getTime()) {
                throw new Error("La fine deve essere dopo l'inizio");
            }
            const supabase = createClient();
            const { error } = await supabase.from("time_off").insert({
                staff_id: staffId === "all" ? null : staffId,
                starts_at: start.toISOString(),
                ends_at: end.toISOString(),
                reason: reason.trim() || null,
            });
            if (error) throw error;
            addToast("Chiusura salvata", "success");
            setReason("");
            await load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (id: string) => {
        const ok = window.confirm("Eliminare questa chiusura? Gli slot torneranno disponibili.");
        if (!ok) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from("time_off").delete().eq("id", id);
            if (error) throw error;
            addToast("Chiusura rimossa", "success");
            setRows((rs) => rs.filter((r) => r.id !== id));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    const staffName = (id: string | null) =>
        id == null ? "Tutto il salone" : staff.find((s) => s.id === id)?.name ?? "Staff sconosciuto";

    const now = Date.now();
    const visible = rows.filter((r) => {
        const isPast = new Date(r.ends_at).getTime() < now;
        return tab === "upcoming" ? !isPast : isPast;
    });

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Disponibilità</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Chiusure & ferie.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Blocca un giorno intero (festivo, ferie) o un intervallo orario per un singolo
                    barber. Gli slot bloccati spariscono immediatamente dal booking pubblico.
                </p>
            </motion.div>

            {/* Form */}
            <form
                onSubmit={submit}
                className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4"
            >
                <h2 className="text-display text-xl text-warm-white tracking-tight">
                    Aggiungi chiusura
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Dal
                        </span>
                        <input
                            type="date"
                            value={dateStart}
                            onChange={(e) => {
                                setDateStart(e.target.value);
                                if (e.target.value > dateEnd) setDateEnd(e.target.value);
                            }}
                            required
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Al
                        </span>
                        <input
                            type="date"
                            value={dateEnd}
                            min={dateStart}
                            onChange={(e) => setDateEnd(e.target.value)}
                            required
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </label>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={allDay}
                        onChange={(e) => setAllDay(e.target.checked)}
                        className="w-4 h-4 accent-accent-warm"
                    />
                    <span className="text-sm text-warm-white">Tutto il giorno</span>
                </label>

                {!allDay && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Ora inizio
                            </span>
                            <input
                                type="time"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                step={1800}
                                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                            />
                        </label>
                        <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Ora fine
                            </span>
                            <input
                                type="time"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                step={1800}
                                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                            />
                        </label>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Si applica a
                        </span>
                        <select
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value as any)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        >
                            <option value="all">Tutto il salone</option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Motivo (opzionale)
                        </span>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Es. Festa Patronale"
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Salvataggio…" : "Salva chiusura"}
                    </button>
                </div>
            </form>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-carbon border border-line rounded-full p-1 w-fit">
                {[
                    { key: "upcoming" as const, label: "Prossime" },
                    { key: "past" as const, label: "Storico" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full transition-colors ${
                            tab === t.key ? "bg-warm-white text-black" : "text-silver hover:text-warm-white"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    {tab === "upcoming" ? "Nessuna chiusura programmata." : "Nessuna chiusura passata."}
                </p>
            ) : (
                <ul className="space-y-2">
                    {visible.map((r) => (
                        <li
                            key={r.id}
                            className="bg-carbon border border-line rounded-[var(--radius-md)] p-4 md:p-5 flex items-start gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-warm-white font-body font-semibold">
                                    {formatRange(r.starts_at, r.ends_at)}
                                </p>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`text-[9px] uppercase tracking-[0.3em] font-body font-semibold px-2 py-0.5 rounded-full border ${
                                            r.staff_id == null
                                                ? "border-error/40 text-error bg-error/10"
                                                : "border-accent-warm/40 text-accent-warm bg-accent-warm/10"
                                        }`}
                                    >
                                        {staffName(r.staff_id)}
                                    </span>
                                    {r.reason && (
                                        <span className="text-silver-dark text-sm">· {r.reason}</span>
                                    )}
                                </div>
                            </div>
                            {tab === "upcoming" && (
                                <button
                                    onClick={() => remove(r.id)}
                                    className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-error border border-error/40 rounded-full hover:bg-error/10 transition-colors"
                                >
                                    Rimuovi
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
