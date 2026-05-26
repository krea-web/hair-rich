"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

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

type Filter = "upcoming" | "today" | "past" | "all";

const FILTER_LABELS: Record<Filter, string> = {
    upcoming: "In arrivo",
    today: "Oggi",
    past: "Storico",
    all: "Tutti",
};

export default function StaffAppuntamentiPage() {
    const [rows, setRows] = useState<ApptRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("upcoming");
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const now = new Date();
            const from = new Date(now);
            from.setDate(from.getDate() - 30);
            const to = new Date(now);
            to.setDate(to.getDate() + 60);
            const { data, error } = await supabase.rpc("fn_staff_my_appointments", {
                p_from: from.toISOString(),
                p_to: to.toISOString(),
            });
            if (error) throw error;
            setRows((data ?? []) as ApptRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const now = Date.now();
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        switch (filter) {
            case "upcoming":
                return rows.filter((r) => new Date(r.start_at).getTime() > now);
            case "today":
                return rows.filter((r) => {
                    const t = new Date(r.start_at).getTime();
                    return t >= startOfDay.getTime() && t <= endOfDay.getTime();
                });
            case "past":
                return rows.filter((r) => new Date(r.start_at).getTime() < now);
            default:
                return rows;
        }
    }, [rows, filter]);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Calendario</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Appuntamenti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    I tuoi appuntamenti: passati 30 giorni, oggi, e futuri 60 giorni.
                </p>
            </motion.div>

            <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                            filter === f
                                ? "bg-accent-warm text-black border-accent-warm"
                                : "border-line text-silver hover:bg-carbon"
                        }`}
                    >
                        {FILTER_LABELS[f]}
                    </button>
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                    {filtered.length} risultati
                </span>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-silver-dark py-12 bg-carbon border border-line border-dashed rounded-md">
                    Nessun appuntamento per questo filtro.
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((a) => (
                        <ApptRowCard key={a.appointment_id} a={a} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ApptRowCard({ a }: { a: ApptRow }) {
    const start = new Date(a.start_at);
    const isPast = new Date(a.end_at).getTime() < Date.now();
    const statusLabel =
        a.status === "completed"
            ? "Completato"
            : a.status === "cancelled"
              ? "Annullato"
              : a.status === "no_show"
                ? "No-show"
                : isPast
                  ? "Passato"
                  : "Confermato";
    const statusColor =
        a.status === "completed"
            ? "text-green-300"
            : a.status === "cancelled" || a.status === "no_show"
              ? "text-red-300"
              : "text-warm-white-muted";

    return (
        <article className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-carbon border border-line rounded-md hover:border-silver-mid transition-colors">
            <div className="flex flex-col items-center min-w-[60px]">
                <div className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">
                    {start.toLocaleDateString("it-IT", { weekday: "short" })}
                </div>
                <div className="text-display text-2xl text-warm-white tabular-nums leading-none">
                    {start.getDate()}
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-0.5">
                    {start.toLocaleDateString("it-IT", { month: "short" })}
                </div>
            </div>
            <div className="min-w-0">
                <div className="text-warm-white font-body font-semibold truncate">
                    {a.customer_first_name} {a.customer_last_name ?? ""}
                </div>
                <div className="text-xs text-warm-white-muted truncate mt-0.5">
                    {a.service_names} ·{" "}
                    {start.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {a.customer_phone && (
                    <a href={`tel:${a.customer_phone}`} className="text-xs text-accent-warm hover:underline mt-1 inline-block">
                        {a.customer_phone}
                    </a>
                )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[9px] uppercase tracking-[0.25em] font-body font-semibold ${statusColor}`}>
                    {statusLabel}
                </span>
                <span className="text-sm text-warm-white tabular-nums">€ {(a.total_cents / 100).toFixed(2)}</span>
            </div>
        </article>
    );
}
