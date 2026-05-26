"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface ClockEntry {
    id: string;
    kind: "in" | "out";
    occurred_at: string;
    note: string | null;
}

interface DaySummary {
    date: string;
    pairs: { in: string; out: string | null }[];
    minutes_total: number;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
}

function summarize(entries: ClockEntry[]): DaySummary[] {
    const byDay = new Map<string, ClockEntry[]>();
    for (const e of entries) {
        const day = e.occurred_at.slice(0, 10);
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(e);
    }
    const summaries: DaySummary[] = [];
    for (const [day, items] of byDay) {
        items.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
        const pairs: { in: string; out: string | null }[] = [];
        let openIn: string | null = null;
        let minutes = 0;
        for (const e of items) {
            if (e.kind === "in") {
                if (openIn) pairs.push({ in: openIn, out: null });
                openIn = e.occurred_at;
            } else {
                if (openIn) {
                    pairs.push({ in: openIn, out: e.occurred_at });
                    minutes += Math.floor((new Date(e.occurred_at).getTime() - new Date(openIn).getTime()) / 60000);
                    openIn = null;
                }
            }
        }
        if (openIn) pairs.push({ in: openIn, out: null });
        summaries.push({ date: day, pairs, minutes_total: minutes });
    }
    return summaries.sort((a, b) => b.date.localeCompare(a.date));
}

export default function StaffTimbraturaPage() {
    const [entries, setEntries] = useState<ClockEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const since = new Date();
            since.setDate(since.getDate() - 30);
            const { data, error } = await supabase
                .from("staff_clock_entries")
                .select("id, kind, occurred_at, note")
                .gte("occurred_at", since.toISOString())
                .order("occurred_at", { ascending: false });
            if (error) throw error;
            setEntries((data ?? []) as ClockEntry[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const last = entries[0];
    const isIn = last?.kind === "in";

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_staff_toggle_clock", { p_note: null });
            if (error) throw error;
            addToast(isIn ? "Uscita registrata" : "Entrata registrata", "success");
            load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setBusy(false);
        }
    };

    const days = summarize(entries);

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Presenza</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Timbratura.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Entrata e uscita. Storico ultimi 30 giorni con totale ore.
                </p>
            </motion.div>

            <button
                onClick={toggle}
                disabled={busy}
                className={`w-full p-6 rounded-[var(--radius-lg)] border-2 text-left transition-colors disabled:opacity-50 ${
                    isIn
                        ? "bg-green-500/10 border-green-400/50 hover:bg-green-500/15"
                        : "bg-carbon border-line hover:border-silver-mid"
                }`}
            >
                <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                    Stato attuale
                </div>
                <div className="text-display text-4xl text-warm-white mt-2">
                    {isIn ? "🟢 In servizio" : "⚫️ Fuori servizio"}
                </div>
                {last && (
                    <div className="text-sm text-warm-white-muted mt-2">
                        Ultima azione: {last.kind === "in" ? "entrata" : "uscita"} alle {formatTime(last.occurred_at)}
                    </div>
                )}
                <div className="mt-4 text-sm text-accent-warm font-body font-semibold">
                    {busy ? "Sto registrando…" : isIn ? "Tap per uscire" : "Tap per entrare"} →
                </div>
            </button>

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : days.length === 0 ? (
                <div className="text-center text-silver-dark py-12 bg-carbon border border-line border-dashed rounded-md">
                    Nessuna timbratura negli ultimi 30 giorni.
                </div>
            ) : (
                <section>
                    <h2 className="text-display text-xl text-warm-white tracking-tight mb-3">
                        Storico
                    </h2>
                    <ul className="space-y-2">
                        {days.map((d) => (
                            <li key={d.date} className="p-4 bg-carbon border border-line rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-warm-white font-body font-semibold capitalize">
                                        {formatDate(d.date + "T00:00:00")}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent-warm font-body font-semibold tabular-nums">
                                        {Math.floor(d.minutes_total / 60)}h {String(d.minutes_total % 60).padStart(2, "0")}m
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs">
                                    {d.pairs.map((p, i) => (
                                        <div key={i} className="flex items-center gap-2 text-warm-white-muted">
                                            <span className="text-green-400 tabular-nums">{formatTime(p.in)}</span>
                                            <span className="text-silver-dark">→</span>
                                            <span className={p.out ? "text-red-400 tabular-nums" : "text-amber-300"}>
                                                {p.out ? formatTime(p.out) : "in corso"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
