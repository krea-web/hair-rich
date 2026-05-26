"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface SurveyRow {
    id: string;
    appointment_id: string;
    customer_id: string;
    sent_at: string;
    responded_at: string | null;
    sentiment: "happy" | "neutral" | "sad" | null;
    free_text: string | null;
    customers: { first_name: string; last_name: string | null } | null;
}

type WindowFilter = "30d" | "90d" | "all";

const SENTIMENT_LABEL: Record<"happy" | "neutral" | "sad", { emoji: string; label: string; className: string }> = {
    happy: { emoji: "😊", label: "Felice", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    neutral: { emoji: "😐", label: "Neutro", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    sad: { emoji: "😞", label: "Insoddisfatto", className: "bg-red-500/15 text-red-300 border-red-500/40" },
};

export default function AdminSondaggiPage() {
    const [rows, setRows] = useState<SurveyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [windowFilter, setWindowFilter] = useState<WindowFilter>("30d");
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            let q = supabase
                .from("customer_surveys")
                .select(`
                    id, appointment_id, customer_id, sent_at, responded_at,
                    sentiment, free_text,
                    customers ( first_name, last_name )
                `)
                .order("sent_at", { ascending: false })
                .limit(500);
            if (windowFilter !== "all") {
                const days = windowFilter === "30d" ? 30 : 90;
                q = q.gte("sent_at", new Date(Date.now() - days * 86400 * 1000).toISOString());
            }
            const { data, error } = await q;
            if (error) throw error;
            setRows((data ?? []) as unknown as SurveyRow[]);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    }, [windowFilter, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const nps = useMemo(() => {
        const responded = rows.filter((r) => r.sentiment);
        const happy = responded.filter((r) => r.sentiment === "happy").length;
        const sad = responded.filter((r) => r.sentiment === "sad").length;
        const neutral = responded.filter((r) => r.sentiment === "neutral").length;
        const total = responded.length;
        const respondRate = rows.length === 0 ? 0 : Math.round((total / rows.length) * 100);
        const score = total === 0 ? 0 : Math.round(((happy - sad) / total) * 100);
        return { happy, neutral, sad, total, sent: rows.length, respondRate, score };
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
            <header className="mb-8 flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                        Marketing · NPS interno
                    </p>
                    <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1">
                        Sondaggio post-visita
                    </h1>
                    <p className="mt-2 text-sm text-silver max-w-2xl">
                        Segnale privato 2h dopo l'appuntamento. Niente Google,
                        serve a intercettare gli insoddisfatti prima che
                        diventino recensioni pubbliche.
                    </p>
                </div>

                <div className="flex gap-1.5 bg-carbon border border-line rounded-full p-1">
                    {(["30d", "90d", "all"] as const).map((w) => (
                        <button
                            key={w}
                            onClick={() => setWindowFilter(w)}
                            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full transition-colors ${
                                windowFilter === w
                                    ? "bg-warm-white text-black"
                                    : "text-silver hover:text-warm-white"
                            }`}
                        >
                            {w === "30d" ? "30 giorni" : w === "90d" ? "90 giorni" : "Tutto"}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                <Stat label="Inviati" value={nps.sent} />
                <Stat label="Risposte" value={`${nps.total} · ${nps.respondRate}%`} />
                <Stat label="Felici" value={nps.happy} className="text-emerald-300" />
                <Stat label="Insoddisfatti" value={nps.sad} className="text-red-300" />
                <Stat label="Score (NPS-ish)" value={nps.score} className="text-accent-warm" />
            </div>

            <div className="rounded-[var(--radius-md)] border border-line overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-black-2">
                        <tr className="text-left text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Sentiment</th>
                            <th className="px-4 py-3">Nota</th>
                            <th className="px-4 py-3">Inviato</th>
                            <th className="px-4 py-3">Risposto</th>
                        </tr>
                    </thead>
                    <tbody className="bg-carbon">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-silver-dark">
                                    Carico...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-silver-dark">
                                    Nessun sondaggio inviato in questo periodo.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <motion.tr
                                    key={r.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-t border-line hover:bg-black-2/60"
                                >
                                    <td className="px-4 py-3 text-warm-white">
                                        {r.customers?.first_name} {r.customers?.last_name ?? ""}
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.sentiment ? (
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-body font-semibold ${SENTIMENT_LABEL[r.sentiment].className}`}
                                            >
                                                {SENTIMENT_LABEL[r.sentiment].emoji} {SENTIMENT_LABEL[r.sentiment].label}
                                            </span>
                                        ) : (
                                            <span className="text-silver-dark text-[12px]">In attesa</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-silver text-[12px] max-w-md truncate">
                                        {r.free_text ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-silver-dark font-mono text-[12px]">
                                        {new Date(r.sent_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                                    </td>
                                    <td className="px-4 py-3 text-silver-dark font-mono text-[12px]">
                                        {r.responded_at
                                            ? new Date(r.responded_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })
                                            : "—"}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Stat({ label, value, className = "" }: { label: string; value: number | string; className?: string }) {
    return (
        <div className="p-4 rounded-[var(--radius-md)] bg-black-2 border border-line">
            <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                {label}
            </div>
            <div className={`mt-1 text-display text-2xl text-warm-white ${className}`}>{value}</div>
        </div>
    );
}
