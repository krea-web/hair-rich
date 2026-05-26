"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

interface EarningsRow {
    day: string;
    appointments_count: number;
    gross_revenue_cents: number;
    commission_cents: number;
}

type Range = "this_week" | "this_month" | "last_30" | "last_90";

const RANGE_LABELS: Record<Range, string> = {
    this_week: "Settimana",
    this_month: "Mese corrente",
    last_30: "Ultimi 30gg",
    last_90: "Ultimi 90gg",
};

function rangeDates(r: Range): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    const from = new Date(now);
    if (r === "this_week") {
        const day = (from.getDay() + 6) % 7; // Mon=0
        from.setDate(from.getDate() - day);
    } else if (r === "this_month") {
        from.setDate(1);
    } else if (r === "last_30") {
        from.setDate(from.getDate() - 30);
    } else {
        from.setDate(from.getDate() - 90);
    }
    return { from: from.toISOString().slice(0, 10), to };
}

export default function StaffIncassiPage() {
    const [rows, setRows] = useState<EarningsRow[]>([]);
    const [commissionPct, setCommissionPct] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<Range>("this_month");
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { from, to } = rangeDates(range);
            const [earningsResp, staffResp] = await Promise.all([
                supabase.rpc("fn_staff_my_earnings", { p_from: from, p_to: to }),
                supabase.from("staff").select("commission_pct").eq("user_id", (await supabase.auth.getUser()).data.user?.id).maybeSingle(),
            ]);
            setRows((earningsResp.data ?? []) as EarningsRow[]);
            setCommissionPct(((staffResp.data as any)?.commission_pct as number) ?? 0);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast, range]);

    useEffect(() => {
        load();
    }, [load]);

    const totals = rows.reduce(
        (acc, r) => {
            acc.appts += r.appointments_count;
            acc.gross += r.gross_revenue_cents;
            acc.commission += r.commission_cents;
            return acc;
        },
        { appts: 0, gross: 0, commission: 0 },
    );

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">I miei numeri</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Incassi.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Quanto hai prodotto e la tua quota.{" "}
                    {commissionPct > 0 ? (
                        <>Commissione attuale: <span className="text-warm-white font-semibold">{commissionPct}%</span></>
                    ) : (
                        <span className="text-warm-white-muted italic">Nessuna percentuale configurata (parlane col titolare).</span>
                    )}
                </p>
            </motion.div>

            <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                            range === r
                                ? "bg-accent-warm text-black border-accent-warm"
                                : "border-line text-silver hover:bg-carbon"
                        }`}
                    >
                        {RANGE_LABELS[r]}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-carbon border border-line rounded-md p-4">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        Appuntamenti
                    </div>
                    <div className="text-display text-3xl text-warm-white mt-1 tabular-nums">{totals.appts}</div>
                </div>
                <div className="bg-carbon border border-line rounded-md p-4">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        Lordo
                    </div>
                    <div className="text-display text-3xl text-warm-white mt-1 tabular-nums">{formatPrice(totals.gross)}</div>
                </div>
                <div className="bg-carbon border-2 border-accent-warm/40 rounded-md p-4">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent-warm font-body font-semibold">
                        Tua quota
                    </div>
                    <div className="text-display text-3xl text-accent-warm mt-1 tabular-nums">{formatPrice(totals.commission)}</div>
                </div>
            </div>

            {loading ? (
                <div className="h-48 bg-carbon border border-line rounded-md animate-pulse" />
            ) : rows.length === 0 ? (
                <div className="text-center text-silver-dark py-12 bg-carbon border border-line border-dashed rounded-md">
                    Nessun appuntamento completato in questo range.
                </div>
            ) : (
                <div className="bg-carbon border border-line rounded-md overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                        <thead className="bg-black-2 text-[10px] uppercase tracking-[0.2em] text-silver-dark">
                            <tr>
                                <th className="px-4 py-3 text-left font-body font-semibold">Giorno</th>
                                <th className="px-4 py-3 text-right font-body font-semibold">Appuntamenti</th>
                                <th className="px-4 py-3 text-right font-body font-semibold">Lordo</th>
                                <th className="px-4 py-3 text-right font-body font-semibold">Tua quota</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.day} className="border-t border-line">
                                    <td className="px-4 py-2 text-warm-white">
                                        {new Date(r.day).toLocaleDateString("it-IT", {
                                            weekday: "short",
                                            day: "2-digit",
                                            month: "short",
                                        })}
                                    </td>
                                    <td className="px-4 py-2 text-warm-white-muted text-right tabular-nums">
                                        {r.appointments_count}
                                    </td>
                                    <td className="px-4 py-2 text-warm-white text-right tabular-nums">
                                        {formatPrice(r.gross_revenue_cents)}
                                    </td>
                                    <td className="px-4 py-2 text-accent-warm text-right tabular-nums font-body font-semibold">
                                        {formatPrice(r.commission_cents)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
