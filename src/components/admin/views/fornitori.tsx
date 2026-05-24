"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface Supplier {
    id: string;
    name: string;
    vat_number: string | null;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    category: string | null;
    payment_terms: string | null;
    delivery_lead_days: number | null;
    min_order_eur: number | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    total_eur: number;
    created_at: string;
    expected_delivery_date: string | null;
    received_at: string | null;
}

const EMPTY: Omit<Supplier, "id" | "created_at" | "is_active"> = {
    name: "",
    vat_number: "",
    contact_person: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    category: "",
    payment_terms: "30 gg fine mese",
    delivery_lead_days: 7,
    min_order_eur: null,
    notes: "",
};

const STATUS_LABEL: Record<string, string> = {
    draft: "Bozza",
    sent: "Inviato",
    confirmed: "Confermato",
    partially_received: "Parziale",
    received: "Ricevuto",
    cancelled: "Annullato",
};

export default function AdminFornitoriPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Supplier | typeof EMPTY | null>(null);
    const [saving, setSaving] = useState(false);
    const [orders, setOrders] = useState<Record<string, OrderRow[]>>({});
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("suppliers")
                .select("*")
                .order("name");
            if (error) throw error;
            setSuppliers((data ?? []) as Supplier[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const loadOrders = async (supplierId: string) => {
        if (orders[supplierId]) return;
        const supabase = createClient();
        const { data } = await supabase
            .from("supplier_orders")
            .select("id, order_number, status, total_eur, created_at, expected_delivery_date, received_at")
            .eq("supplier_id", supplierId)
            .order("created_at", { ascending: false })
            .limit(20);
        setOrders((prev) => ({ ...prev, [supplierId]: (data ?? []) as OrderRow[] }));
    };

    const save = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const isUpdate = "id" in editing;
            if (isUpdate) {
                const { id, created_at, is_active, ...patch } = editing as Supplier;
                const { error } = await supabase.from("suppliers").update(patch).eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("suppliers").insert({ ...editing, is_active: true });
                if (error) throw error;
            }
            addToast("Salvato", "success");
            setEditing(null);
            await load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (s: Supplier) => {
        const supabase = createClient();
        await supabase.from("suppliers").update({ is_active: !s.is_active }).eq("id", s.id);
        setSuppliers((prev) =>
            prev.map((x) => (x.id === s.id ? { ...x, is_active: !s.is_active } : x))
        );
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Catena fornitura</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Fornitori.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Anagrafica completa di chi ti rifornisce: contatti, termini di pagamento,
                    storico ordini. Sinergia con stock alert (#75) per riordinare in 2 tap.
                </p>
            </motion.div>

            <div className="flex justify-end">
                <button
                    onClick={() => setEditing({ ...EMPTY })}
                    className="px-5 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90"
                >
                    + Nuovo fornitore
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : suppliers.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun fornitore. Tap "+ Nuovo fornitore" per iniziare.
                </p>
            ) : (
                <ul className="space-y-2">
                    {suppliers.map((s) => (
                        <li
                            key={s.id}
                            className={`bg-carbon border border-line rounded-[var(--radius-md)] overflow-hidden ${
                                !s.is_active ? "opacity-60" : ""
                            }`}
                        >
                            <details
                                className="group"
                                onToggle={(e) => {
                                    if ((e.currentTarget as HTMLDetailsElement).open) loadOrders(s.id);
                                }}
                            >
                                <summary className="cursor-pointer list-none p-4 md:p-5 flex items-center gap-4">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-warm-white font-body font-semibold">{s.name}</h3>
                                            {s.category && (
                                                <span className="text-[9px] uppercase tracking-wider text-silver-dark border border-line px-1.5 py-0.5 rounded">
                                                    {s.category}
                                                </span>
                                            )}
                                            {!s.is_active && (
                                                <span className="text-[9px] uppercase tracking-wider text-error border border-error/40 px-1.5 py-0.5 rounded">
                                                    Inattivo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-silver-dark text-xs">
                                            {s.contact_person && `${s.contact_person} · `}
                                            {s.phone ?? s.email ?? "—"}
                                        </p>
                                    </div>
                                    <span className="w-6 h-6 rounded-full border border-line text-silver flex items-center justify-center group-open:rotate-45 transition-transform">
                                        +
                                    </span>
                                </summary>
                                <div className="px-4 md:px-5 pb-5 border-t border-line/60 pt-4 space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <Field label="Email" value={s.email} />
                                        <Field label="Telefono" value={s.phone} />
                                        <Field label="P.IVA" value={s.vat_number} />
                                        <Field label="Sito" value={s.website} />
                                        <Field
                                            label="Termini pagamento"
                                            value={s.payment_terms}
                                        />
                                        <Field
                                            label="Lead time"
                                            value={s.delivery_lead_days ? `${s.delivery_lead_days} gg` : null}
                                        />
                                        {s.address && (
                                            <Field
                                                label="Indirizzo"
                                                value={`${s.address}${s.city ? `, ${s.city}` : ""}`}
                                            />
                                        )}
                                    </div>
                                    {s.notes && (
                                        <p className="text-warm-white-muted text-sm italic">{s.notes}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setEditing(s)}
                                            className="px-3 py-1.5 border border-line rounded-full text-[10px] uppercase tracking-[0.25em] text-warm-white hover:border-warm-white"
                                        >
                                            Modifica
                                        </button>
                                        <button
                                            onClick={() => toggleActive(s)}
                                            className="px-3 py-1.5 border border-line rounded-full text-[10px] uppercase tracking-[0.25em] text-silver hover:text-warm-white"
                                        >
                                            {s.is_active ? "Disattiva" : "Riattiva"}
                                        </button>
                                        {s.phone && (
                                            <a
                                                href={`tel:${s.phone.replace(/\s+/g, "")}`}
                                                className="px-3 py-1.5 border border-accent-warm/40 text-accent-warm rounded-full text-[10px] uppercase tracking-[0.25em]"
                                            >
                                                Chiama
                                            </a>
                                        )}
                                    </div>

                                    {orders[s.id] && orders[s.id].length > 0 && (
                                        <div className="pt-3 border-t border-line/40">
                                            <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-2">
                                                Ultimi ordini
                                            </h4>
                                            <ul className="space-y-1">
                                                {orders[s.id].map((o) => (
                                                    <li
                                                        key={o.id}
                                                        className="flex items-center justify-between text-sm py-1.5 border-b border-line/30"
                                                    >
                                                        <span className="text-warm-white font-mono text-xs">
                                                            #{o.order_number}
                                                        </span>
                                                        <span className="text-silver-dark text-xs">
                                                            {new Date(o.created_at).toLocaleDateString("it-IT")}
                                                        </span>
                                                        <span className="text-[10px] uppercase tracking-[0.2em] text-warm-white border border-line px-1.5 py-0.5 rounded">
                                                            {STATUS_LABEL[o.status] ?? o.status}
                                                        </span>
                                                        <span className="text-accent-warm tabular-nums">
                                                            €{Number(o.total_eur).toFixed(2)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
            )}

            {editing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm grid place-items-center p-4">
                    <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 max-w-2xl w-full max-h-[90dvh] overflow-y-auto space-y-4">
                        <h3 className="text-display text-2xl text-warm-white tracking-tight">
                            {"id" in editing ? "Modifica fornitore" : "Nuovo fornitore"}
                        </h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            <Input label="Nome*" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                            <Input label="Categoria" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
                            <Input label="Persona contatto" value={editing.contact_person ?? ""} onChange={(v) => setEditing({ ...editing, contact_person: v })} />
                            <Input label="P.IVA" value={editing.vat_number ?? ""} onChange={(v) => setEditing({ ...editing, vat_number: v })} />
                            <Input label="Telefono" value={editing.phone ?? ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
                            <Input label="Email" value={editing.email ?? ""} onChange={(v) => setEditing({ ...editing, email: v })} />
                            <Input label="Sito" value={editing.website ?? ""} onChange={(v) => setEditing({ ...editing, website: v })} />
                            <Input label="Indirizzo" value={editing.address ?? ""} onChange={(v) => setEditing({ ...editing, address: v })} />
                            <Input label="Città" value={editing.city ?? ""} onChange={(v) => setEditing({ ...editing, city: v })} />
                            <Input label="Termini pagamento" value={editing.payment_terms ?? ""} onChange={(v) => setEditing({ ...editing, payment_terms: v })} />
                            <Input
                                label="Lead time (gg)"
                                type="number"
                                value={String(editing.delivery_lead_days ?? "")}
                                onChange={(v) => setEditing({ ...editing, delivery_lead_days: v ? parseInt(v, 10) : null })}
                            />
                            <Input
                                label="Ordine minimo (€)"
                                type="number"
                                value={String(editing.min_order_eur ?? "")}
                                onChange={(v) => setEditing({ ...editing, min_order_eur: v ? parseFloat(v) : null })}
                            />
                        </div>
                        <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Note interne
                            </span>
                            <textarea
                                value={editing.notes ?? ""}
                                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                                rows={3}
                                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm resize-none"
                            />
                        </label>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setEditing(null)}
                                className="px-5 py-2.5 border border-line text-warm-white rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={save}
                                disabled={saving || !editing.name.trim()}
                                className="px-5 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50"
                            >
                                {saving ? "Salvataggio…" : "Salva"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <p className="text-warm-white mt-1 truncate">{value ?? "—"}</p>
        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm"
            />
        </label>
    );
}
