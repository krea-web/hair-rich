"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

interface Props {
    customerId: string;
    customerName: string;
    onClose: () => void;
    onSold?: () => void;
}

interface PackageOption {
    id: string;
    name: string;
    total_price_cents: number;
    credits: number;
    validity_days: number;
}

const PAYMENT_METHODS: { value: "cash" | "pos" | "bonifico" | "omaggio"; label: string }[] = [
    { value: "cash", label: "Contanti" },
    { value: "pos", label: "POS / Carta" },
    { value: "bonifico", label: "Bonifico" },
    { value: "omaggio", label: "Omaggio" },
];

export function SellPackageModal({ customerId, customerName, onClose, onSold }: Props) {
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PackageOption | null>(null);
    const [priceEuro, setPriceEuro] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]["value"]>("cash");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("service_packages")
            .select("id, name, total_price_cents, credits, validity_days")
            .eq("is_active", true)
            .order("sort_order")
            .then(({ data }) => {
                setPackages((data ?? []) as PackageOption[]);
                setLoading(false);
            });
    }, []);

    const handleSelect = (p: PackageOption) => {
        setSelected(p);
        setPriceEuro(((p.total_price_cents) / 100).toFixed(2));
    };

    const handleSell = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            const supabase = createClient();
            const priceCents = paymentMethod === "omaggio" ? 0 : Math.round(Number(priceEuro) * 100);
            const { data, error } = await supabase.rpc("fn_sell_package", {
                p_customer_id: customerId,
                p_package_id: selected.id,
                p_price_paid_cents: priceCents,
                p_payment_method: paymentMethod,
                p_notes: notes || null,
            });
            if (error) throw error;

            // Customer email receipt
            await supabase.functions.invoke("notifications-router", {
                body: {
                    mode: "customer",
                    customerId,
                    eventType: "package_purchased",
                    payload: {
                        package_name: selected.name,
                        credits_total: selected.credits,
                        expires_at: data?.[0]?.expires_at,
                        purchased_at: new Date().toISOString(),
                    },
                },
            });

            addToast("Pacchetto venduto", "success");
            onSold?.();
            onClose();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-carbon border border-line rounded-[var(--radius-lg)] p-6 max-h-[90dvh] overflow-y-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-silver hover:text-warm-white"
                    aria-label="Chiudi"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                    Vendi pacchetto
                </p>
                <h2 className="text-display text-2xl text-warm-white tracking-tight mt-1">{customerName}</h2>

                {loading ? (
                    <p className="mt-6 text-silver-dark">Carico catalogo...</p>
                ) : packages.length === 0 ? (
                    <p className="mt-6 text-silver-dark">
                        Nessun pacchetto attivo. Crea un pacchetto in /admin/pacchetti.
                    </p>
                ) : (
                    <>
                        <h3 className="mt-6 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Scegli pacchetto
                        </h3>
                        <div className="mt-2 space-y-2">
                            {packages.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p)}
                                    className={`w-full text-left p-3 rounded-[var(--radius-sm)] border transition-colors ${
                                        selected?.id === p.id
                                            ? "bg-accent-warm/10 border-accent-warm"
                                            : "bg-black-2 border-line hover:border-silver-dark"
                                    }`}
                                >
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-warm-white font-body font-semibold">{p.name}</span>
                                        <span className="text-warm-white font-mono">{formatPrice(p.total_price_cents)}</span>
                                    </div>
                                    <div className="text-[11px] text-silver-dark mt-0.5">
                                        {p.credits} crediti · valido {p.validity_days} gg
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {selected && (
                    <div className="mt-6 space-y-3 border-t border-line pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Prezzo pagato (€)
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={priceEuro}
                                    onChange={(e) => setPriceEuro(e.target.value)}
                                    disabled={paymentMethod === "omaggio"}
                                    className="mt-1 w-full px-3 py-2 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white font-mono text-sm focus:outline-none focus:border-accent-warm disabled:opacity-50"
                                />
                            </label>
                            <label className="block">
                                <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Metodo pagamento
                                </span>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                                    className="mt-1 w-full px-3 py-2 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white font-body text-sm focus:outline-none focus:border-accent-warm"
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="block">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                Note (opz.)
                            </span>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="mt-1 w-full px-3 py-2 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white font-body text-sm focus:outline-none focus:border-accent-warm"
                            />
                        </label>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSell}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {submitting ? "..." : "Vendi"}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
