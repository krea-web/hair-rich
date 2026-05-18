"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";

interface ProductRow {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: string;
    price_cents: number;
    stock: number;
    is_active: boolean;
    sort_order: number;
}

const CATEGORIES = [
    { key: "all", label: "Tutti" },
    { key: "hair", label: "Capelli" },
    { key: "beard", label: "Barba" },
    { key: "shave", label: "Rasatura" },
    { key: "tools", label: "Strumenti" },
    { key: "other", label: "Altro" },
];

export default function AdminProdottiPage() {
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("products")
                .select("id, slug, name, brand, category, price_cents, stock, is_active, sort_order")
                .order("sort_order");
            if (error) throw error;
            setProducts((data ?? []) as ProductRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const updateField = async (id: string, patch: Partial<ProductRow>) => {
        setSavingId(id);
        const supabase = createClient();
        const { error } = await supabase.from("products").update(patch).eq("id", id);
        setSavingId(null);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return false;
        }
        setProducts((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        return true;
    };

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (category !== "all" && p.category !== category) return false;
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                return p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q);
            }
            return true;
        });
    }, [products, category, search]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Shop</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Prodotti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Modifica prezzo e scorta direttamente in tabella. Toggle "Attivo" nasconde
                    il prodotto dal sito senza eliminarlo.
                </p>
            </motion.div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                        const active = category === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => setCategory(c.key)}
                                className={`px-3.5 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full border transition-colors ${
                                    active
                                        ? "bg-warm-white text-black border-warm-white"
                                        : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                                }`}
                            >
                                {c.label}
                            </button>
                        );
                    })}
                </div>
                <input
                    type="search"
                    placeholder="Cerca per nome o brand…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="md:ml-auto w-full md:w-64 bg-carbon border border-line rounded-full px-4 py-2 text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                />
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-16 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && (
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-carbon text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                <th className="text-left p-3 font-semibold">Prodotto</th>
                                <th className="text-left p-3 font-semibold hidden md:table-cell">Categoria</th>
                                <th className="text-right p-3 font-semibold">Prezzo</th>
                                <th className="text-right p-3 font-semibold">Stock</th>
                                <th className="text-center p-3 font-semibold">Attivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const saving = savingId === p.id;
                                return (
                                    <tr
                                        key={p.id}
                                        className={`border-t border-line/60 transition-colors hover:bg-carbon/60 ${
                                            !p.is_active ? "opacity-50" : ""
                                        }`}
                                    >
                                        <td className="p-3">
                                            <div className="font-body text-warm-white">{p.name}</div>
                                            {p.brand && (
                                                <div className="text-xs text-silver-dark mt-0.5">{p.brand}</div>
                                            )}
                                        </td>
                                        <td className="p-3 hidden md:table-cell text-warm-white-muted text-xs uppercase tracking-wider">
                                            {p.category}
                                        </td>
                                        <td className="p-3 text-right">
                                            <PriceCell
                                                value={p.price_cents}
                                                disabled={saving}
                                                onSave={(cents) => updateField(p.id, { price_cents: cents })}
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <StockCell
                                                value={p.stock}
                                                disabled={saving}
                                                onSave={(n) => updateField(p.id, { stock: n })}
                                            />
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                role="switch"
                                                aria-checked={p.is_active}
                                                onClick={() => updateField(p.id, { is_active: !p.is_active })}
                                                disabled={saving}
                                                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                                                    p.is_active ? "bg-accent-warm" : "bg-line"
                                                } disabled:opacity-50`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                                                        p.is_active ? "translate-x-5" : "translate-x-0.5"
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <p className="p-8 text-center text-warm-white-muted text-sm">
                            Nessun prodotto trovato.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

function PriceCell({
    value,
    onSave,
    disabled,
}: {
    value: number;
    onSave: (cents: number) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => (value / 100).toFixed(2));

    useEffect(() => {
        setDraft((value / 100).toFixed(2));
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="text-accent-warm font-display tabular-nums hover:underline"
            >
                {formatPrice(value)}
            </button>
        );
    }

    const commit = () => {
        const parsed = parseFloat(draft.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
            setDraft((value / 100).toFixed(2));
            setEditing(false);
            return;
        }
        onSave(Math.round(parsed * 100));
        setEditing(false);
    };

    return (
        <input
            type="number"
            step="0.01"
            min="0"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft((value / 100).toFixed(2));
                    setEditing(false);
                }
            }}
            className="w-20 bg-black-2 border border-line rounded-md px-2 py-1 text-right text-accent-warm font-mono"
        />
    );
}

function StockCell({
    value,
    onSave,
    disabled,
}: {
    value: number;
    onSave: (n: number) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className={`tabular-nums font-mono hover:underline ${
                    value === 0 ? "text-error" : value < 5 ? "text-warning" : "text-warm-white"
                }`}
            >
                {value}
            </button>
        );
    }

    const commit = () => {
        const parsed = parseInt(draft, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
            setDraft(String(value));
            setEditing(false);
            return;
        }
        onSave(parsed);
        setEditing(false);
    };

    return (
        <input
            type="number"
            min="0"
            step="1"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(String(value));
                    setEditing(false);
                }
            }}
            className="w-16 bg-black-2 border border-line rounded-md px-2 py-1 text-right text-warm-white font-mono"
        />
    );
}
