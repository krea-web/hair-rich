"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

interface ApptRow {
    appointment_id: string;
    start_at: string;
    end_at: string;
    status: string;
    customer_first_name: string;
    customer_last_name: string | null;
    customer_phone: string | null;
    service_names: string;
    total_cents: number;
    notes: string | null;
}

interface ClockEntry {
    id: string;
    kind: "in" | "out";
    occurred_at: string;
}

export default function StaffDashboardPage() {
    const [todayAppts, setTodayAppts] = useState<ApptRow[]>([]);
    const [tomorrowCount, setTomorrowCount] = useState(0);
    const [clockEntries, setClockEntries] = useState<ClockEntry[]>([]);
    const [todayEarnings, setTodayEarnings] = useState<{ gross: number; commission: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [clockBusy, setClockBusy] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const startTomorrow = new Date(tomorrow);
            startTomorrow.setHours(0, 0, 0, 0);
            const endTomorrow = new Date(tomorrow);
            endTomorrow.setHours(23, 59, 59, 999);

            const [todayResp, tomorrowResp, clockResp, earningsResp] = await Promise.all([
                supabase.rpc("fn_staff_my_appointments", {
                    p_from: startOfDay.toISOString(),
                    p_to: endOfDay.toISOString(),
                }),
                supabase.rpc("fn_staff_my_appointments", {
                    p_from: startTomorrow.toISOString(),
                    p_to: endTomorrow.toISOString(),
                }),
                supabase
                    .from("staff_clock_entries")
                    .select("id, kind, occurred_at")
                    .gte("occurred_at", startOfDay.toISOString())
                    .order("occurred_at", { ascending: true }),
                supabase.rpc("fn_staff_my_earnings", {
                    p_from: startOfDay.toISOString().slice(0, 10),
                    p_to: startOfDay.toISOString().slice(0, 10),
                }),
            ]);

            setTodayAppts((todayResp.data ?? []) as ApptRow[]);
            setTomorrowCount(((tomorrowResp.data ?? []) as ApptRow[]).length);
            setClockEntries((clockResp.data ?? []) as ClockEntry[]);
            const e = (earningsResp.data ?? [])[0] as
                | { gross_revenue_cents: number; commission_cents: number }
                | undefined;
            if (e) {
                setTodayEarnings({ gross: e.gross_revenue_cents, commission: e.commission_cents });
            } else {
                setTodayEarnings({ gross: 0, commission: 0 });
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

    const lastClock = clockEntries[clockEntries.length - 1];
    const isClockedIn = lastClock?.kind === "in";

    const toggleClock = async () => {
        if (clockBusy) return;
        setClockBusy(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_staff_toggle_clock", { p_note: null });
            if (error) throw error;
            addToast(isClockedIn ? "Uscita registrata" : "Entrata registrata", "success");
            load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setClockBusy(false);
        }
    };

    const nextAppt = useMemo(() => {
        const now = Date.now();
        return todayAppts.find(
            (a) => new Date(a.start_at).getTime() > now && a.status !== "cancelled" && a.status !== "no_show",
        );
    }, [todayAppts]);

    const todayDate = new Date().toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    if (loading) {
        return (
            <div className="p-6 md:p-10 space-y-4 max-w-5xl mx-auto">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-32 bg-carbon border border-line rounded-md animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Oggi</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95] capitalize">
                    {todayDate}.
                </h1>
            </motion.div>

            {/* Clock + Next appointment + earnings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={toggleClock}
                    disabled={clockBusy}
                    className={`text-left p-5 rounded-[var(--radius-md)] border transition-colors ${
                        isClockedIn
                            ? "bg-green-500/10 border-green-400/40 hover:bg-green-500/15"
                            : "bg-carbon border-line hover:border-silver-mid"
                    } disabled:opacity-50`}
                >
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        Timbratura
                    </div>
                    <div className="text-2xl text-warm-white font-display mt-1">
                        {isClockedIn ? "🟢 In servizio" : "⚫️ Fuori servizio"}
                    </div>
                    {lastClock && (
                        <div className="text-xs text-warm-white-muted mt-1">
                            ultima: {new Date(lastClock.occurred_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                            {clockEntries.filter((e) => e.kind === "in").length} entrate oggi
                        </div>
                    )}
                    <div className="mt-3 text-xs text-accent-warm">
                        Tap per {isClockedIn ? "uscire" : "entrare"} →
                    </div>
                </button>

                <div className="p-5 rounded-[var(--radius-md)] bg-carbon border border-line">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        Prossimo appuntamento
                    </div>
                    {nextAppt ? (
                        <>
                            <div className="text-2xl text-warm-white font-display mt-1">
                                {new Date(nextAppt.start_at).toLocaleTimeString("it-IT", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                            <div className="text-sm text-warm-white mt-1 font-body font-semibold truncate">
                                {nextAppt.customer_first_name} {nextAppt.customer_last_name ?? ""}
                            </div>
                            <div className="text-xs text-warm-white-muted truncate">{nextAppt.service_names}</div>
                        </>
                    ) : (
                        <div className="text-warm-white-muted text-sm mt-1">Nessuno in arrivo oggi</div>
                    )}
                </div>

                <div className="p-5 rounded-[var(--radius-md)] bg-carbon border border-line">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        Incasso oggi
                    </div>
                    <div className="text-2xl text-warm-white font-display mt-1 tabular-nums">
                        {todayEarnings ? formatPrice(todayEarnings.gross) : "—"}
                    </div>
                    {todayEarnings && todayEarnings.commission > 0 && (
                        <div className="text-xs text-accent-warm mt-1">
                            tua quota: {formatPrice(todayEarnings.commission)}
                        </div>
                    )}
                    <div className="text-xs text-silver-dark mt-2">
                        {todayAppts.filter((a) => a.status === "completed").length} appuntamenti completati
                    </div>
                </div>
            </div>

            {/* Today's appointments list */}
            <section>
                <h2 className="text-display text-xl text-warm-white tracking-tight mb-3">
                    Programma di oggi
                    <span className="text-silver-dark text-sm font-body ml-2 tabular-nums">
                        · {todayAppts.length}
                    </span>
                </h2>
                {todayAppts.length === 0 ? (
                    <div className="text-center text-silver-dark py-10 bg-carbon border border-line border-dashed rounded-md">
                        Nessun appuntamento oggi. Goditi la giornata. 🌴
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayAppts.map((a) => (
                            <ApptCard key={a.appointment_id} a={a} />
                        ))}
                    </div>
                )}
            </section>

            {tomorrowCount > 0 && (
                <section>
                    <h2 className="text-display text-xl text-warm-white tracking-tight mb-2">
                        Domani
                    </h2>
                    <a
                        href="/staff/appuntamenti"
                        className="block p-4 bg-carbon border border-line rounded-md hover:bg-carbon-2 transition-colors"
                    >
                        <div className="text-warm-white">
                            <span className="text-accent-warm font-display text-xl tabular-nums">{tomorrowCount}</span>{" "}
                            <span className="text-sm">{tomorrowCount === 1 ? "appuntamento" : "appuntamenti"} previsti</span>
                        </div>
                        <div className="text-xs text-silver-dark mt-1">Vedi calendario completo →</div>
                    </a>
                </section>
            )}
        </div>
    );
}

function ApptCard({ a }: { a: ApptRow }) {
    const start = new Date(a.start_at);
    const end = new Date(a.end_at);
    const isPast = end.getTime() < Date.now();
    const statusColor =
        a.status === "completed"
            ? "border-green-400/40 bg-green-500/5"
            : a.status === "cancelled" || a.status === "no_show"
              ? "border-red-400/30 bg-red-500/5 opacity-60"
              : "border-line";

    return (
        <article className={`grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-carbon border rounded-md ${statusColor}`}>
            <div className="flex flex-col items-center justify-center min-w-[60px]">
                <div className="text-display text-2xl text-warm-white tabular-nums leading-none">
                    {start.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold mt-1">
                    {end.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
            <div className="min-w-0">
                <h3 className="text-warm-white font-body font-semibold truncate">
                    {a.customer_first_name} {a.customer_last_name ?? ""}
                </h3>
                <p className="text-xs text-warm-white-muted truncate mt-0.5">{a.service_names}</p>
                {a.notes && <p className="text-xs text-silver-dark italic mt-1 line-clamp-1">{a.notes}</p>}
                {a.customer_phone && (
                    <a
                        href={`tel:${a.customer_phone}`}
                        className="text-xs text-accent-warm hover:underline mt-1 inline-block"
                    >
                        {a.customer_phone}
                    </a>
                )}
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                    {a.status === "completed"
                        ? "Completato"
                        : a.status === "cancelled"
                          ? "Annullato"
                          : a.status === "no_show"
                            ? "No-show"
                            : isPast
                              ? "Passato"
                              : "Confermato"}
                </span>
                <span className="text-sm text-warm-white font-body font-semibold tabular-nums">
                    € {(a.total_cents / 100).toFixed(2)}
                </span>
            </div>
        </article>
    );
}
