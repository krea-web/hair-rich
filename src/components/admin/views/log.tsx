"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface ActivityRow {
    id: string;
    occurred_at: string;
    category: string;
    action: "create" | "update" | "delete";
    priority: "low" | "normal" | "high" | "critical";
    table_name: string;
    row_id: string | null;
    actor_id: string | null;
    actor_email: string | null;
    actor_role: string | null;
    before_data: Record<string, unknown> | null;
    after_data: Record<string, unknown> | null;
    diff: Record<string, { from?: unknown; to?: unknown }>;
}

const CATEGORY_LABELS: Record<string, string> = {
    appointments: "Appuntamenti",
    customers: "Clienti",
    catalog: "Catalogo",
    staff: "Staff",
    payments: "Pagamenti",
    marketing: "Marketing",
    system: "Sistema",
    media: "Media",
};

const ACTION_LABELS: Record<string, string> = {
    create: "Creato",
    update: "Modificato",
    delete: "Eliminato",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "text-silver-dark",
    normal: "text-warm-white-muted",
    high: "text-amber-300",
    critical: "text-red-400",
};

const PAGE_SIZE = 50;

export default function AdminLogPage() {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [category, setCategory] = useState<string>("all");
    const [action, setAction] = useState<string>("all");
    const [priority, setPriority] = useState<string>("all");
    const [actorEmail, setActorEmail] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [selected, setSelected] = useState<ActivityRow | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const buildQuery = useCallback(
        (offset: number) => {
            const supabase = createClient();
            let q = supabase
                .from("activity_log")
                .select("*")
                .order("occurred_at", { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);
            if (category !== "all") q = q.eq("category", category);
            if (action !== "all") q = q.eq("action", action);
            if (priority !== "all") q = q.eq("priority", priority);
            if (actorEmail.trim()) q = q.ilike("actor_email", `%${actorEmail.trim()}%`);
            if (dateFrom) q = q.gte("occurred_at", `${dateFrom}T00:00:00`);
            if (dateTo) q = q.lte("occurred_at", `${dateTo}T23:59:59`);
            return q;
        },
        [category, action, priority, actorEmail, dateFrom, dateTo],
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await buildQuery(0);
            if (error) throw error;
            const list = (data ?? []) as ActivityRow[];
            setRows(list);
            setHasMore(list.length === PAGE_SIZE);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [buildQuery, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const { data, error } = await buildQuery(rows.length);
            if (error) throw error;
            const list = (data ?? []) as ActivityRow[];
            setRows((r) => [...r, ...list]);
            setHasMore(list.length === PAGE_SIZE);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoadingMore(false);
        }
    };

    const exportCsv = () => {
        if (rows.length === 0) {
            addToast("Nessun dato da esportare", "info");
            return;
        }
        const headers = ["occurred_at", "category", "action", "priority", "table_name", "row_id", "actor_email", "actor_role"];
        const csv = [
            headers.join(","),
            ...rows.map((r) =>
                headers
                    .map((h) => {
                        const v = (r as any)[h];
                        if (v == null) return "";
                        const s = String(v).replace(/"/g, '""');
                        return /[,\n"]/.test(s) ? `"${s}"` : s;
                    })
                    .join(","),
            ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const counts = useMemo(() => {
        const by: Record<string, number> = {};
        for (const r of rows) by[r.category] = (by[r.category] ?? 0) + 1;
        return by;
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Audit</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Log attività.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Ogni modifica al gestionale viene registrata qui — chi, cosa, quando, e il diff completo.
                    Immutabile: nessuno può cancellare entry, solo leggerle.
                </p>
            </motion.div>

            {/* Filters */}
            <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                >
                    <option value="all">Categoria · Tutte</option>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                            {v}
                        </option>
                    ))}
                </select>
                <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                >
                    <option value="all">Azione · Tutte</option>
                    <option value="create">Creato</option>
                    <option value="update">Modificato</option>
                    <option value="delete">Eliminato</option>
                </select>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                >
                    <option value="all">Priorità · Tutte</option>
                    <option value="critical">Critica</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normale</option>
                    <option value="low">Bassa</option>
                </select>
                <input
                    type="search"
                    placeholder="Email attore…"
                    value={actorEmail}
                    onChange={(e) => setActorEmail(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white placeholder:text-silver-dark"
                />
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-black-2 border border-line rounded-md px-3 py-2 text-sm text-warm-white"
                />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-silver-dark">
                    {rows.length} eventi caricati
                    {Object.keys(counts).length > 0 && (
                        <span className="ml-2 text-xs">
                            ·{" "}
                            {Object.entries(counts)
                                .map(([k, v]) => `${CATEGORY_LABELS[k] ?? k}: ${v}`)
                                .join(" · ")}
                        </span>
                    )}
                </div>
                <button
                    onClick={exportCsv}
                    disabled={rows.length === 0}
                    className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon transition-colors disabled:opacity-40"
                >
                    Esporta CSV
                </button>
            </div>

            {/* Feed */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-12 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center text-silver-dark py-12">Nessun evento corrisponde ai filtri.</div>
            ) : (
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-black-2 text-[10px] uppercase tracking-[0.2em] text-silver-dark">
                            <tr>
                                <th className="px-3 py-2 text-left font-body font-semibold">Quando</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Categoria</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Azione</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Tabella</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Attore</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Priorità</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => setSelected(r)}
                                    className="border-t border-line cursor-pointer hover:bg-black-2 transition-colors"
                                >
                                    <td className="px-3 py-2 text-warm-white-muted font-mono text-xs whitespace-nowrap">
                                        {formatDate(r.occurred_at)}
                                    </td>
                                    <td className="px-3 py-2 text-warm-white">{CATEGORY_LABELS[r.category] ?? r.category}</td>
                                    <td className="px-3 py-2 text-warm-white-muted">{ACTION_LABELS[r.action]}</td>
                                    <td className="px-3 py-2 text-silver-dark font-mono text-xs">{r.table_name}</td>
                                    <td className="px-3 py-2 text-warm-white-muted">
                                        {r.actor_email ?? <span className="text-silver-dark italic">{r.actor_role}</span>}
                                    </td>
                                    <td className={`px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-body font-semibold ${PRIORITY_COLORS[r.priority]}`}>
                                        {r.priority}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon disabled:opacity-40"
                    >
                        {loadingMore ? "Caricamento…" : "Carica altri 50"}
                    </button>
                </div>
            )}

            <AnimatePresence>
                {selected && <DiffModal row={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}

function DiffModal({ row, onClose }: { row: ActivityRow; onClose: () => void }) {
    const entries = Object.entries(row.diff ?? {});

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-md)] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-carbon border-b border-line p-5 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-display text-xl text-warm-white">
                            {CATEGORY_LABELS[row.category] ?? row.category} · {ACTION_LABELS[row.action]}
                        </h3>
                        <p className="text-xs text-silver-dark mt-1 font-mono">
                            {row.table_name} · {row.row_id ?? "(no id)"} · {formatDate(row.occurred_at)}
                        </p>
                        <p className="text-xs text-warm-white-muted mt-1">
                            {row.actor_email ?? row.actor_role ?? "anonymous"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-silver-dark hover:text-warm-white text-xl px-2">
                        ×
                    </button>
                </div>
                <div className="p-5 space-y-3">
                    {row.action === "create" ? (
                        <DataPreview title="Valori inseriti" data={row.after_data} highlight="add" />
                    ) : row.action === "delete" ? (
                        <DataPreview title="Valori eliminati" data={row.before_data} highlight="remove" />
                    ) : entries.length === 0 ? (
                        <div className="text-silver-dark italic text-sm">Nessun campo modificato.</div>
                    ) : (
                        <div className="space-y-2">
                            {entries.map(([key, change]) => (
                                <div key={key} className="border border-line rounded-md p-3">
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mb-2">
                                        {key}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                        <div className="bg-red-900/20 border-l-2 border-red-400 p-2 rounded">
                                            <div className="text-[9px] uppercase text-red-400 mb-1">prima</div>
                                            <div className="text-warm-white-muted break-all">
                                                {stringify(change.from)}
                                            </div>
                                        </div>
                                        <div className="bg-green-900/20 border-l-2 border-green-400 p-2 rounded">
                                            <div className="text-[9px] uppercase text-green-400 mb-1">dopo</div>
                                            <div className="text-warm-white break-all">{stringify(change.to)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

function DataPreview({
    title,
    data,
    highlight,
}: {
    title: string;
    data: Record<string, unknown> | null;
    highlight: "add" | "remove";
}) {
    if (!data) return null;
    const color = highlight === "add" ? "border-green-400 bg-green-900/10" : "border-red-400 bg-red-900/10";
    return (
        <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mb-2">
                {title}
            </div>
            <div className={`border-l-2 ${color} rounded p-3 space-y-1`}>
                {Object.entries(data).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs font-mono">
                        <span className="text-silver-dark">{k}:</span>
                        <span className="text-warm-white-muted break-all">{stringify(v)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function stringify(v: unknown): string {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
