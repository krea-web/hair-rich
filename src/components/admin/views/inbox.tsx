"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminInboxStore, useToastStore } from "@/lib/store";
import { handleClientLink } from "@/lib/clientRouter";

interface InboxRow {
    id: string;
    event_type: string;
    category: string;
    priority: "low" | "normal" | "high" | "critical";
    title: string;
    body: string | null;
    icon: string | null;
    action_url: string | null;
    related_type: string | null;
    related_id: string | null;
    payload: Record<string, unknown>;
    source_skill: string | null;
    read_at: string | null;
    archived_at: string | null;
    created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
    appointments: "Appuntamenti",
    customers: "Clienti",
    catalog: "Catalogo",
    staff: "Staff",
    payments: "Pagamenti",
    marketing: "Marketing",
    system: "Sistema",
};

const PRIORITY_RING: Record<string, string> = {
    low: "border-line",
    normal: "border-line",
    high: "border-amber-400/60",
    critical: "border-red-400/70",
};

type StateFilter = "unread" | "all" | "archived";

export default function AdminInboxPage() {
    const [rows, setRows] = useState<InboxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<StateFilter>("unread");
    const [category, setCategory] = useState<string>("all");
    const setUnreadCount = useAdminInboxStore((s) => s.setUnreadCount);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            let q = supabase
                .from("admin_inbox_items")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(200);
            if (state === "unread") q = q.is("read_at", null).is("archived_at", null);
            else if (state === "archived") q = q.not("archived_at", "is", null);
            else q = q.is("archived_at", null);
            if (category !== "all") q = q.eq("category", category);

            const { data, error } = await q;
            if (error) throw error;
            setRows((data ?? []) as InboxRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [state, category, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const markRead = async (ids: string[]) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_admin_inbox_mark_read", { p_ids: ids });
            if (error) throw error;
            setRows((r) =>
                r.map((row) =>
                    ids.includes(row.id) && !row.read_at
                        ? { ...row, read_at: new Date().toISOString() }
                        : row,
                ),
            );
            const { data } = await supabase.rpc("fn_admin_inbox_unread_count");
            setUnreadCount(Number(data) || 0);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    const archive = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("admin_inbox_items")
                .update({ archived_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            setRows((r) => r.filter((row) => row.id !== id));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    const markAllRead = async () => {
        const unread = rows.filter((r) => !r.read_at).map((r) => r.id);
        if (unread.length === 0) return;
        await markRead(unread);
        addToast(`${unread.length} notifiche segnate come lette`, "success");
    };

    const handleRowClick = (row: InboxRow) => {
        if (!row.read_at) void markRead([row.id]);
    };

    const counts = useMemo(() => {
        const unread = rows.filter((r) => !r.read_at).length;
        return { unread, total: rows.length };
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Notifiche</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Inbox.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Tutto quello che succede nel salone in un unico flusso.
                    Click su un evento per andare dove serve.
                </p>
            </motion.div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {(["unread", "all", "archived"] as StateFilter[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setState(s)}
                            className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold px-3 py-1.5 rounded-full border ${
                                state === s
                                    ? "bg-accent-warm text-black border-accent-warm"
                                    : "border-line text-silver hover:bg-carbon"
                            }`}
                        >
                            {s === "unread" ? "Da leggere" : s === "all" ? "Tutte" : "Archiviate"}
                        </button>
                    ))}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-black-2 border border-line rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-warm-white font-body font-semibold"
                    >
                        <option value="all">Categoria · Tutte</option>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-silver-dark tabular-nums">
                        <span className="text-accent-warm font-semibold">{counts.unread}</span> da leggere ·{" "}
                        <span className="text-warm-white">{counts.total}</span> totali
                    </span>
                    {counts.unread > 0 && (
                        <button
                            onClick={markAllRead}
                            className="px-3 py-1.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon"
                        >
                            Segna tutte lette
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center text-silver-dark py-16">
                    {state === "unread"
                        ? "Tutto a posto. Nessuna notifica da leggere."
                        : "Nessuna notifica trovata."}
                </div>
            ) : (
                <ul className="space-y-2">
                    {rows.map((r) => (
                        <li
                            key={r.id}
                            className={`group bg-carbon border-l-2 ${PRIORITY_RING[r.priority]} border-y border-r border-line rounded-md p-4 hover:bg-black-2 transition-colors ${
                                !r.read_at ? "ring-1 ring-accent-warm/10" : ""
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl shrink-0 leading-none mt-0.5">{r.icon ?? "🔔"}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <h3
                                            className={`font-body text-base ${!r.read_at ? "text-warm-white font-semibold" : "text-warm-white-muted"}`}
                                        >
                                            {r.title}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-[0.25em] font-body font-semibold text-silver-dark whitespace-nowrap">
                                            {formatRelative(r.created_at)}
                                        </span>
                                    </div>
                                    {r.body && (
                                        <p className="text-sm text-warm-white-muted mt-1 leading-snug">{r.body}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-[0.25em] font-body font-semibold text-silver-dark">
                                        <span>{CATEGORY_LABELS[r.category] ?? r.category}</span>
                                        {r.priority !== "normal" && r.priority !== "low" && (
                                            <span
                                                className={
                                                    r.priority === "critical"
                                                        ? "text-red-400"
                                                        : "text-amber-300"
                                                }
                                            >
                                                {r.priority}
                                            </span>
                                        )}
                                        {!r.read_at && (
                                            <span className="text-accent-warm">● non letta</span>
                                        )}
                                        <span className="flex-1" />
                                        {r.action_url && (
                                            <a
                                                href={r.action_url}
                                                onClick={(e) => {
                                                    handleRowClick(r);
                                                    handleClientLink(e);
                                                }}
                                                className="text-accent-warm hover:underline"
                                            >
                                                Vai →
                                            </a>
                                        )}
                                        {!r.read_at && (
                                            <button
                                                onClick={() => markRead([r.id])}
                                                className="text-silver hover:text-warm-white"
                                            >
                                                Letta
                                            </button>
                                        )}
                                        {!r.archived_at && (
                                            <button
                                                onClick={() => archive(r.id)}
                                                className="text-silver hover:text-warm-white"
                                            >
                                                Archivia
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "ora";
    if (min < 60) return `${min}m fa`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h fa`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}g fa`;
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}
