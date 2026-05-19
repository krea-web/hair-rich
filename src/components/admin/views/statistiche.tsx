"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";
import { downloadCsv, todayStamp } from "@/lib/csv";

type RangePreset = "week" | "month" | "quarter" | "year";

interface StatsPayload {
    from: string;
    to: string;
    total_completed: number;
    total_noshow: number;
    total_revenue_cents: number;
    no_show_rate_pct: number;
    new_customers: number;
    revenue_by_day: Array<{ day: string; revenue_cents: number }>;
    top_services: Array<{
        service_id: string;
        service_name: string;
        count: number;
        revenue_cents: number;
    }>;
    top_staff: Array<{
        staff_id: string;
        staff_name: string;
        count: number;
        revenue_cents: number;
    }>;
}

function rangeFor(preset: RangePreset): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    if (preset === "week") from.setDate(to.getDate() - 6);
    else if (preset === "month") from.setDate(to.getDate() - 29);
    else if (preset === "quarter") from.setDate(to.getDate() - 89);
    else from.setDate(to.getDate() - 364);
    return { from: from.toISOString().split("T")[0]!, to: to.toISOString().split("T")[0]! };
}

function formatDayLabel(iso: string): string {
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function AdminStatisticheePage() {
    const [preset, setPreset] = useState<RangePreset>("month");
    const [stats, setStats] = useState<StatsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = rangeFor(preset);
            const supabase = createClient();
            const { data, error } = await supabase.rpc("fn_admin_stats_range", {
                p_from: from,
                p_to: to,
            });
            if (error) throw error;
            setStats(data as StatsPayload);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [preset, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const revenueChartData = useMemo(() => {
        if (!stats) return [];
        return stats.revenue_by_day.map((r) => ({
            label: formatDayLabel(r.day),
            revenue: r.revenue_cents / 100,
        }));
    }, [stats]);

    const topServicesData = useMemo(() => {
        if (!stats) return [];
        return stats.top_services.map((s) => ({
            label: s.service_name,
            count: s.count,
            revenue: s.revenue_cents / 100,
        }));
    }, [stats]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Analytics</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Statistiche.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Fatturato, top servizi, performance per barber, tasso no-show e nuovi clienti
                    nel periodo selezionato.
                </p>
            </motion.div>

            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex gap-1.5 bg-carbon border border-line rounded-full p-1">
                    {(
                        [
                            { key: "week", label: "7 giorni" },
                            { key: "month", label: "30 giorni" },
                            { key: "quarter", label: "90 giorni" },
                            { key: "year", label: "365 giorni" },
                        ] as { key: RangePreset; label: string }[]
                    ).map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPreset(p.key)}
                            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full transition-colors ${
                                preset === p.key ? "bg-warm-white text-black" : "text-silver hover:text-warm-white"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                {stats && (
                    <button
                        onClick={() =>
                            downloadCsv({
                                filename: `statistiche-${preset}-${todayStamp()}`,
                                rows: stats.revenue_by_day,
                                columns: [
                                    { key: "day", label: "Giorno" },
                                    {
                                        key: "revenue_cents",
                                        label: "Fatturato EUR",
                                        get: (r) => (r.revenue_cents / 100).toFixed(2),
                                    },
                                ],
                            })
                        }
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                    >
                        Export CSV
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {[
                    { label: "Fatturato", value: stats ? formatPrice(stats.total_revenue_cents) : "—" },
                    { label: "Completati", value: stats?.total_completed ?? "—" },
                    { label: "No-show %", value: stats ? `${stats.no_show_rate_pct}%` : "—" },
                    { label: "Nuovi clienti", value: stats?.new_customers ?? "—" },
                ].map((k) => (
                    <div
                        key={k.label}
                        className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]"
                    >
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {k.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">
                            {loading ? "…" : k.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Revenue chart */}
            <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6">
                <h2 className="text-display text-xl text-warm-white tracking-tight mb-4">
                    Fatturato giornaliero
                </h2>
                <div className="h-48 md:h-64">
                    {loading ? (
                        <div className="h-full bg-black-2 rounded-md animate-pulse" />
                    ) : revenueChartData.length === 0 ? (
                        <p className="text-warm-white-muted text-sm py-12 text-center">
                            Nessun dato nel periodo selezionato.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#6b6b6b"
                                    style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}
                                />
                                <YAxis
                                    stroke="#6b6b6b"
                                    style={{ fontSize: "10px" }}
                                    tickFormatter={(v) => `€${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#111",
                                        border: "1px solid #2a2a2a",
                                        borderRadius: 8,
                                        fontSize: 12,
                                    }}
                                    labelStyle={{ color: "#fff" }}
                                    formatter={(v: any) => [`€${(v as number).toFixed(2)}`, "Fatturato"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#d4a574"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#d4a574" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            {/* Top services + top staff */}
            <div className="grid md:grid-cols-2 gap-5">
                <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6">
                    <h2 className="text-display text-xl text-warm-white tracking-tight mb-4">
                        Top 5 servizi
                    </h2>
                    <div className="h-44 md:h-56">
                        {loading ? (
                            <div className="h-full bg-black-2 rounded-md animate-pulse" />
                        ) : topServicesData.length === 0 ? (
                            <p className="text-warm-white-muted text-sm py-12 text-center">
                                Nessun servizio in questo periodo.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topServicesData}
                                    layout="vertical"
                                    margin={{ top: 8, right: 16, left: 80, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                                    <XAxis type="number" stroke="#6b6b6b" style={{ fontSize: "10px" }} />
                                    <YAxis
                                        type="category"
                                        dataKey="label"
                                        stroke="#6b6b6b"
                                        style={{ fontSize: "10px" }}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#111",
                                            border: "1px solid #2a2a2a",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        formatter={(v: any) => [`${v}`, "Numero"]}
                                    />
                                    <Bar dataKey="count" fill="#d4a574" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6">
                    <h2 className="text-display text-xl text-warm-white tracking-tight mb-4">
                        Top barber per appuntamenti
                    </h2>
                    {loading ? (
                        <div className="space-y-2">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-10 bg-black-2 rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : !stats || stats.top_staff.length === 0 ? (
                        <p className="text-warm-white-muted text-sm py-8 text-center">
                            Nessun dato barber in questo periodo.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {stats.top_staff.map((s, i) => {
                                const max = stats.top_staff[0]?.count ?? 1;
                                const pct = (s.count / max) * 100;
                                return (
                                    <li key={s.staff_id} className="flex items-center gap-3">
                                        <span className="text-display text-warm-white text-xl tabular-nums w-6">
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-warm-white text-sm font-body font-semibold truncate">
                                                    {s.staff_name}
                                                </span>
                                                <span className="text-silver-dark text-xs tabular-nums">
                                                    {s.count} · {formatPrice(s.revenue_cents)}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-black-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-warm rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
