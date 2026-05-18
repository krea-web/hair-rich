"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";
import { downloadCsv, todayStamp } from "@/lib/csv";

type OrderStatus = "pending" | "ready" | "picked_up" | "cancelled" | "expired";

interface OrderItem {
    product_name: string;
    quantity: number;
    unit_price_cents: number;
}

interface OrderRow {
    id: string;
    short_code: string;
    customer_first_name: string;
    customer_last_name: string | null;
    customer_phone: string;
    customer_email: string | null;
    status: OrderStatus;
    total_cents: number;
    notes: string | null;
    pickup_deadline: string;
    created_at: string;
    items: OrderItem[];
}

const STATUS_META: Record<OrderStatus, { label: string; class: string; nextLabel?: string; nextStatus?: OrderStatus }> = {
    pending: {
        label: "Da preparare",
        class: "bg-accent-warm/15 text-accent-warm border-accent-warm/40",
        nextLabel: "Segna pronto",
        nextStatus: "ready",
    },
    ready: {
        label: "Pronto al ritiro",
        class: "bg-success/15 text-success border-success/40",
        nextLabel: "Segna ritirato",
        nextStatus: "picked_up",
    },
    picked_up: {
        label: "Ritirato",
        class: "bg-warm-white-faint text-silver border-line",
    },
    cancelled: {
        label: "Annullato",
        class: "bg-error/10 text-error border-error/30",
    },
    expired: {
        label: "Scaduto",
        class: "bg-error/5 text-silver-dark border-line",
    },
};

const FILTERS: { key: "all" | OrderStatus; label: string }[] = [
    { key: "all", label: "Tutti" },
    { key: "pending", label: "Da preparare" },
    { key: "ready", label: "Pronti" },
    { key: "picked_up", label: "Ritirati" },
    { key: "cancelled", label: "Annullati" },
];

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("it-IT", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDateShort(iso: string) {
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function AdminOrdiniPage() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("pending");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("orders")
                .select(
                    `id, short_code, customer_first_name, customer_last_name, customer_phone,
                    customer_email, status, total_cents, notes, pickup_deadline, created_at,
                    items:order_items ( product_name, quantity, unit_price_cents )`
                )
                .order("created_at", { ascending: false });
            if (error) throw error;
            setOrders((data ?? []) as OrderRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const changeStatus = async (orderId: string, next: OrderStatus) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("orders")
            .update({ status: next })
            .eq("id", orderId);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        addToast(`Stato aggiornato → ${STATUS_META[next].label}`, "success");
        load();
    };

    const filtered = useMemo(() => {
        if (filter === "all") return orders;
        return orders.filter((o) => o.status === filter);
    }, [orders, filter]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: orders.length };
        for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
        return c;
    }, [orders]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Shop</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Ordini in salone.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl leading-relaxed">
                    Click &amp; Collect — prodotti prenotati dai clienti per ritiro in negozio.
                    Verifica il codice corto al ritiro per chiudere l'ordine.
                </p>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    const count = counts[f.key] ?? 0;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-body font-semibold rounded-full border transition-colors ${
                                active
                                    ? "bg-warm-white text-black border-warm-white"
                                    : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                            }`}
                            aria-pressed={active}
                        >
                            {f.label}
                            <span className={`text-[9px] tabular-nums ${active ? "text-black/60" : "text-silver-dark"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
                <button
                    onClick={() =>
                        downloadCsv({
                            filename: `ordini-${todayStamp()}`,
                            rows: filtered,
                            columns: [
                                { key: "short_code", label: "Codice" },
                                { key: "status", label: "Stato" },
                                { key: "customer_first_name", label: "Nome cliente" },
                                { key: "customer_last_name", label: "Cognome cliente" },
                                { key: "customer_phone", label: "Telefono" },
                                { key: "customer_email", label: "Email" },
                                { key: "total_cents", label: "Totale EUR", get: (r) => (r.total_cents / 100).toFixed(2) },
                                { key: "items", label: "Articoli", get: (r) => r.items.map((i) => `${i.quantity}x ${i.product_name}`).join("; ") },
                                { key: "pickup_deadline", label: "Scadenza ritiro" },
                                { key: "created_at", label: "Creato il" },
                                { key: "notes", label: "Note" },
                            ],
                        })
                    }
                    className="ml-auto px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                >
                    Export CSV
                </button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun ordine in questa categoria.
                </p>
            )}

            {!loading && filtered.length > 0 && (
                <ul className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((o) => {
                            const expanded = expandedId === o.id;
                            const meta = STATUS_META[o.status];
                            const customerName = `${o.customer_first_name}${o.customer_last_name ? " " + o.customer_last_name : ""}`;
                            return (
                                <motion.li
                                    key={o.id}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-carbon border border-line hover:border-silver-dark transition-colors rounded-[var(--radius-md)] overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedId(expanded ? null : o.id)}
                                        className="w-full text-left grid grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-center p-5"
                                    >
                                        <div className="flex flex-col items-center justify-center w-20 md:w-24 h-16 md:h-20 bg-black-2 border border-accent-warm/40 rounded-[var(--radius-md)] shrink-0">
                                            <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                Codice
                                            </span>
                                            <span className="text-display text-base md:text-lg text-accent-warm leading-none mt-1 tabular-nums tracking-wider">
                                                {o.short_code}
                                            </span>
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-display text-lg md:text-xl text-warm-white tracking-tight truncate">
                                                {customerName}
                                            </h3>
                                            <p className="mt-1 text-silver-dark text-xs uppercase tracking-[0.2em] font-body font-semibold truncate">
                                                {o.customer_phone} · {formatDate(o.created_at)}
                                            </p>
                                            <p className="mt-2 flex items-center gap-3 text-warm-white-muted text-xs">
                                                <span>
                                                    {o.items.length} {o.items.length === 1 ? "articolo" : "articoli"}
                                                </span>
                                                <span className="text-accent-warm tabular-nums">{formatPrice(o.total_cents)}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-body font-semibold whitespace-nowrap ${meta.class}`}>
                                                {meta.label}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                Scade · {formatDateShort(o.pickup_deadline)}
                                            </span>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden border-t border-line"
                                            >
                                                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                                            Articoli
                                                        </span>
                                                        <ul className="mt-3 divide-y divide-line/40 border-y border-line/40">
                                                            {o.items.map((it, i) => (
                                                                <li key={i} className="flex justify-between items-center py-2.5">
                                                                    <span className="text-warm-white text-sm flex-1 truncate pr-3">
                                                                        {it.product_name}
                                                                        <span className="text-silver-dark text-xs ml-2">× {it.quantity}</span>
                                                                    </span>
                                                                    <span className="text-warm-white-muted text-sm tabular-nums">
                                                                        {formatPrice(it.unit_price_cents * it.quantity)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {o.notes && (
                                                            <div className="mt-4 pl-3 border-l-2 border-accent-warm/40">
                                                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                                    Note cliente
                                                                </span>
                                                                <p className="mt-1 text-warm-white-muted text-sm">{o.notes}</p>
                                                            </div>
                                                        )}
                                                        {o.customer_email && (
                                                            <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                                Email · <span className="text-warm-white-muted normal-case tracking-normal">{o.customer_email}</span>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="md:w-48 flex flex-col gap-2">
                                                        {meta.nextStatus && meta.nextLabel && (
                                                            <button
                                                                onClick={() => changeStatus(o.id, meta.nextStatus!)}
                                                                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                                                            >
                                                                {meta.nextLabel}
                                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {o.status !== "cancelled" && o.status !== "picked_up" && (
                                                            <button
                                                                onClick={() => changeStatus(o.id, "cancelled")}
                                                                className="inline-flex items-center justify-center px-4 py-3 border border-error/40 text-error rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-error/10 transition-colors"
                                                            >
                                                                Annulla
                                                            </button>
                                                        )}
                                                        <a
                                                            href={`tel:${o.customer_phone.replace(/\s+/g, "")}`}
                                                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:border-warm-white transition-colors"
                                                        >
                                                            Chiama cliente
                                                        </a>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
}
