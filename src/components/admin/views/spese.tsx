"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface Expense {
    id: string;
    occurred_on: string;
    amount_cents: number;
    category: string;
    description: string | null;
    payment_method: string | null;
    is_extraordinary: boolean;
    source: string;
    created_at: string;
}

const CATEGORIES: { value: string; label: string }[] = [
    { value: "attrezzatura", label: "Attrezzatura (forbici, macchinette…)" },
    { value: "pulizia_detergenti", label: "Pulizia / detergenti" },
    { value: "merce_rivendita", label: "Merce da rivendita" },
    { value: "abbigliamento_personalizzato", label: "Abbigliamento personalizzato" },
    { value: "stipendio_dipendente", label: "Stipendio dipendente" },
    { value: "utenze", label: "Utenze" },
    { value: "affitto", label: "Affitto" },
    { value: "marketing", label: "Marketing" },
    { value: "straordinaria", label: "Spesa straordinaria" },
    { value: "altro", label: "Altro" },
];
const CAT_LABEL: Record<string, string> = Object.fromEntries(
    CATEGORIES.map((c) => [c.value, c.label]),
);
const PAYMENT = [
    { value: "cash", label: "Contanti" },
    { value: "pos", label: "POS / carta" },
    { value: "bonifico", label: "Bonifico" },
    { value: "altro", label: "Altro" },
];

function fmtEur(cents: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AdminSpesePage() {
    const supabase = createClient();
    const pushToast = useToastStore((s) => s.push);
    const [rows, setRows] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("attrezzatura");
    const [description, setDescription] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");

    const load = useCallback(async () => {
        setLoading(true);
        // Spese del mese corrente.
        const start = new Date();
        start.setDate(1);
        const from = start.toISOString().slice(0, 10);
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .gte("occurred_on", from)
            .order("occurred_on", { ascending: false })
            .order("created_at", { ascending: false });
        if (error) {
            pushToast({ type: "error", message: "Errore nel caricare le spese" });
        } else {
            setRows((data ?? []) as Expense[]);
        }
        setLoading(false);
    }, [supabase, pushToast]);

    useEffect(() => {
        load();
    }, [load]);

    const total = rows.reduce((s, r) => s + r.amount_cents, 0);
    const extraordinaryTotal = rows
        .filter((r) => r.is_extraordinary || r.category === "straordinaria")
        .reduce((s, r) => s + r.amount_cents, 0);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const euros = parseFloat(amount.replace(",", "."));
        if (!Number.isFinite(euros) || euros < 0) {
            pushToast({ type: "error", message: "Importo non valido" });
            return;
        }
        setSaving(true);
        const { error } = await supabase.from("expenses").insert({
            amount_cents: Math.round(euros * 100),
            category,
            description: description.trim() || null,
            payment_method: paymentMethod,
            is_extraordinary: category === "straordinaria",
            source: "admin",
        });
        setSaving(false);
        if (error) {
            pushToast({ type: "error", message: "Errore nel salvare la spesa" });
            return;
        }
        pushToast({ type: "success", message: "Spesa registrata" });
        setAmount("");
        setDescription("");
        load();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) {
            pushToast({ type: "error", message: "Errore nell'eliminare" });
            return;
        }
        setRows((r) => r.filter((x) => x.id !== id));
    };

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
            <header className="mb-6 md:mb-8">
                <h1 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">Spese attività</h1>
                <p className="mt-2 text-warm-white-muted text-sm">
                    Spese del mese corrente. Attrezzatura, detergenti, merce, stipendi, spese straordinarie —
                    per sapere quanto guadagni davvero (incassi meno spese).
                </p>
            </header>

            {/* KPI mese */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">Totale mese</span>
                    <p className="text-display text-2xl md:text-3xl text-warm-white tabular-nums mt-1">{fmtEur(total)}</p>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">Di cui straordinarie</span>
                    <p className="text-display text-2xl md:text-3xl text-accent-warm tabular-nums mt-1">{fmtEur(extraordinaryTotal)}</p>
                </div>
            </div>

            {/* Form nuova spesa */}
            <form onSubmit={handleAdd} className="bg-carbon border border-line rounded-[var(--radius-md)] p-4 md:p-5 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <label className="md:col-span-2 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">Importo €</span>
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="120" required
                        className="bg-black border border-line rounded-md px-3 py-2 text-warm-white" />
                </label>
                <label className="md:col-span-4 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">Categoria</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className="bg-black border border-line rounded-md px-3 py-2 text-warm-white">
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </label>
                <label className="md:col-span-2 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">Pagamento</span>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                        className="bg-black border border-line rounded-md px-3 py-2 text-warm-white">
                        {PAYMENT.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </label>
                <label className="md:col-span-3 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">Note (opz.)</span>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="es. nuove forbici"
                        className="bg-black border border-line rounded-md px-3 py-2 text-warm-white" />
                </label>
                <button type="submit" disabled={saving}
                    className="md:col-span-1 bg-accent-warm text-black rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] font-body font-semibold disabled:opacity-50">
                    {saving ? "…" : "Aggiungi"}
                </button>
            </form>

            {/* Lista */}
            {loading ? (
                <p className="text-warm-white-muted text-sm">Caricamento…</p>
            ) : rows.length === 0 ? (
                <p className="text-warm-white-muted text-sm">Nessuna spesa registrata questo mese.</p>
            ) : (
                <ul className="divide-y divide-line border-y border-line">
                    {rows.map((r) => (
                        <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-warm-white text-sm font-body">
                                    {CAT_LABEL[r.category] ?? r.category}
                                    {r.description ? <span className="text-silver-dark"> · {r.description}</span> : null}
                                </p>
                                <p className="text-[11px] text-silver-dark mt-0.5">
                                    {r.occurred_on}{r.payment_method ? ` · ${r.payment_method}` : ""}{r.source === "telegram" ? " · da bot" : ""}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <span className="text-warm-white font-display tabular-nums">{fmtEur(r.amount_cents)}</span>
                                <button onClick={() => handleDelete(r.id)} aria-label="Elimina"
                                    className="text-silver-dark hover:text-error transition-colors text-xs uppercase tracking-[0.2em]">
                                    Elimina
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
