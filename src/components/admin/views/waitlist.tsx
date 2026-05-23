"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface WaitlistRow {
    id: string;
    customer_id: string;
    service_id: string;
    staff_id: string | null;
    date_from: string;
    date_to: string;
    preferred_time_start: string | null;
    preferred_time_end: string | null;
    status: "waiting" | "notified" | "confirmed" | "expired" | "cancelled" | "ghosted";
    position: number;
    notify_token: string | null;
    notify_token_expires_at: string | null;
    notified_appointment_id: string | null;
    notified_at: string | null;
    confirmed_at: string | null;
    missed_notifications: number;
    notes: string | null;
    source: string;
    created_at: string;
    customers: { first_name: string; last_name: string | null; phone: string | null; email: string | null } | null;
    services: { name: string } | null;
    staff: { name: string } | null;
}

type StatusFilter = "active" | "waiting" | "notified" | "confirmed" | "ghosted" | "all";

const STATUS_PILL: Record<WaitlistRow["status"], { label: string; className: string }> = {
    waiting: { label: "In coda", className: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
    notified: { label: "Notificato", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    confirmed: { label: "Confermato", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    expired: { label: "Scaduto", className: "bg-silver-dark/15 text-silver border-silver-dark/40" },
    cancelled: { label: "Annullato", className: "bg-silver-dark/15 text-silver border-silver-dark/40" },
    ghosted: { label: "Ghosted", className: "bg-red-500/15 text-red-300 border-red-500/40" },
};

export default function AdminWaitlistPage() {
    const [rows, setRows] = useState<WaitlistRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<StatusFilter>("active");
    const [matchRunning, setMatchRunning] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            let q = supabase
                .from("waitlist")
                .select(`
                    *,
                    customers ( first_name, last_name, phone, email ),
                    services ( name ),
                    staff ( name )
                `)
                .order("created_at", { ascending: false })
                .limit(200);
            if (status === "active") {
                q = q.in("status", ["waiting", "notified"]);
            } else if (status !== "all") {
                q = q.eq("status", status);
            }
            const { data, error } = await q;
            if (error) throw error;
            setRows((data ?? []) as unknown as WaitlistRow[]);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    }, [status, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const acc: Record<string, number> = { waiting: 0, notified: 0, confirmed: 0, ghosted: 0 };
        for (const r of rows) acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
    }, [rows]);

    const triggerMatcher = async () => {
        setMatchRunning(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.functions.invoke("waitlist-matcher", { body: {} });
            if (error) throw error;
            const s = data as { matches_made?: number; cancellations_checked?: number };
            addToast(
                `Run completato · ${s?.matches_made ?? 0} match su ${s?.cancellations_checked ?? 0} candidati`,
                "success",
            );
            await load();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setMatchRunning(false);
        }
    };

    const cancelEntry = async (id: string) => {
        if (!confirm("Cancellare questa entry dalla lista d'attesa?")) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("waitlist")
            .update({ status: "cancelled" })
            .eq("id", id);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        addToast("Entry annullata", "success");
        load();
    };

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
            <header className="mb-8 flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                        Booking · waitlist
                    </p>
                    <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1">
                        Lista d'attesa
                    </h1>
                    <p className="mt-2 text-sm text-silver max-w-2xl">
                        Quando un cliente cancella in tempo utile, il matcher
                        propone lo slot al primo in coda. Token con validità
                        adattiva (24h → 45 min), tre missed = ghosted.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={triggerMatcher}
                        disabled={matchRunning}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                    >
                        {matchRunning ? "..." : "Esegui match ora"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {(["waiting", "notified", "confirmed", "ghosted"] as const).map((k) => (
                    <div key={k} className="p-4 rounded-[var(--radius-md)] bg-black-2 border border-line">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            {STATUS_PILL[k].label}
                        </div>
                        <div className="mt-1 text-display text-2xl text-warm-white">{counts[k] ?? 0}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(["active", "waiting", "notified", "confirmed", "ghosted", "all"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold transition-colors ${
                            status === s
                                ? "bg-accent-warm text-black"
                                : "bg-black-2 border border-line text-silver hover:text-warm-white"
                        }`}
                    >
                        {s === "active" ? "Attive" : s === "all" ? "Tutte" : STATUS_PILL[s as WaitlistRow["status"]].label}
                    </button>
                ))}
            </div>

            <div className="rounded-[var(--radius-md)] border border-line overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-black-2">
                        <tr className="text-left text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Servizio</th>
                            <th className="px-4 py-3">Finestra</th>
                            <th className="px-4 py-3">Orario</th>
                            <th className="px-4 py-3">Staff</th>
                            <th className="px-4 py-3">Stato</th>
                            <th className="px-4 py-3">Missed</th>
                            <th className="px-4 py-3">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="bg-carbon">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-silver-dark">
                                    Carico...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-silver-dark">
                                    Nessuna entry per questo filtro.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => {
                                const tokenExp = r.notify_token_expires_at
                                    ? new Date(r.notify_token_expires_at)
                                    : null;
                                const isStale =
                                    r.status === "notified" && tokenExp && tokenExp < new Date();
                                return (
                                    <motion.tr
                                        key={r.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-t border-line hover:bg-black-2/60"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-warm-white font-medium">
                                                {r.customers?.first_name} {r.customers?.last_name ?? ""}
                                            </div>
                                            <div className="text-[11px] text-silver-dark">
                                                {r.customers?.phone || r.customers?.email || "—"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-silver">{r.services?.name ?? "—"}</td>
                                        <td className="px-4 py-3 text-silver font-mono text-[12px]">
                                            {formatDateRange(r.date_from, r.date_to)}
                                        </td>
                                        <td className="px-4 py-3 text-silver font-mono text-[12px]">
                                            {r.preferred_time_start
                                                ? `${r.preferred_time_start.slice(0, 5)}${r.preferred_time_end ? `–${r.preferred_time_end.slice(0, 5)}` : ""}`
                                                : "Qualsiasi"}
                                        </td>
                                        <td className="px-4 py-3 text-silver">{r.staff?.name ?? "Qualsiasi"}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-[0.2em] font-body font-semibold ${STATUS_PILL[r.status].className}`}
                                            >
                                                {STATUS_PILL[r.status].label}
                                            </span>
                                            {r.status === "notified" && tokenExp && !isStale && (
                                                <div className="text-[10px] text-amber-300 mt-1">
                                                    Scade {tokenExp.toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            )}
                                            {isStale && (
                                                <div className="text-[10px] text-red-300 mt-1">Token scaduto</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-silver font-mono">{r.missed_notifications}</td>
                                        <td className="px-4 py-3">
                                            {(r.status === "waiting" || r.status === "notified") && (
                                                <button
                                                    onClick={() => cancelEntry(r.id)}
                                                    className="text-[10px] uppercase tracking-[0.25em] text-red-300 hover:text-red-200 font-body font-semibold"
                                                >
                                                    Cancella
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function formatDateRange(from: string, to: string) {
    const f = new Date(from);
    const t = new Date(to);
    const sameMonth = f.getMonth() === t.getMonth();
    const fStr = f.toLocaleDateString("it-IT", { day: "2-digit", month: sameMonth ? undefined : "short" });
    const tStr = t.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    return `${fStr} → ${tStr}`;
}
