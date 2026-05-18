"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";

type CouponKind = "percent" | "amount" | "free_service";

interface CouponRow {
    id: string;
    code: string;
    description: string | null;
    kind: CouponKind;
    value_percent: number | null;
    value_cents: number | null;
    valid_from: string;
    valid_until: string | null;
    max_redemptions: number;
    redeemed_count: number;
    is_active: boolean;
    created_at: string;
}

function todayISO(): string {
    return new Date().toISOString().split("T")[0]!;
}

function randomCode(prefix = "HR"): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing I/O/0/1
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}-${out}`;
}

function formatRange(from: string, to: string | null): string {
    const f = new Date(from).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    if (!to) return `dal ${f} · permanente`;
    const t = new Date(to).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
    return `${f} → ${t}`;
}

function describeValue(c: CouponRow): string {
    if (c.kind === "percent") return `-${c.value_percent}%`;
    if (c.kind === "amount") return `-${formatPrice(c.value_cents ?? 0)}`;
    return "Servizio gratis";
}

export default function AdminGamificationPage() {
    const [rows, setRows] = useState<CouponRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            setRows((data ?? []) as CouponRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const toggle = async (id: string, is_active: boolean) => {
        setSavingId(id);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_active } : r)));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSavingId(null);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm("Eliminare definitivamente questo coupon?")) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from("coupons").delete().eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.filter((r) => r.id !== id));
            addToast("Coupon rimosso", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    const stats = useMemo(() => {
        const active = rows.filter((r) => r.is_active).length;
        const totalRedemptions = rows.reduce((sum, r) => sum + r.redeemed_count, 0);
        return { total: rows.length, active, totalRedemptions };
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Promo</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Coupon & sconti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Codici sconto per compleanno, referral, win-back. Genera un codice e dallo al
                    cliente: il barber lo inserirà in fase di pagamento per applicarlo.
                </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 md:gap-5">
                {[
                    { label: "Totali", value: stats.total },
                    { label: "Attivi", value: stats.active },
                    { label: "Usati", value: stats.totalRedemptions },
                ].map((s) => (
                    <div key={s.label} className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {s.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="px-5 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors"
                >
                    {showForm ? "Annulla" : "+ Nuovo coupon"}
                </button>
            </div>

            {showForm && (
                <CouponForm
                    onCreated={async () => {
                        setShowForm(false);
                        await load();
                    }}
                />
            )}

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun coupon creato. Inizia con un benvenuto-15% o un compleanno-20%.
                </p>
            ) : (
                <ul className="space-y-2">
                    {rows.map((r) => {
                        const exhausted = r.redeemed_count >= r.max_redemptions;
                        const expired = r.valid_until && new Date(r.valid_until).getTime() < Date.now();
                        return (
                            <li
                                key={r.id}
                                className={`bg-carbon border border-line rounded-[var(--radius-md)] p-5 transition-opacity ${
                                    !r.is_active || expired ? "opacity-60" : ""
                                }`}
                            >
                                <div className="flex items-start gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <code className="text-warm-white text-lg font-mono tracking-widest bg-black-2 border border-line px-3 py-1 rounded-md">
                                                {r.code}
                                            </code>
                                            <span className="text-display text-2xl text-accent-warm tabular-nums leading-none">
                                                {describeValue(r)}
                                            </span>
                                            {exhausted && (
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-error font-body font-semibold border border-error/40 px-2 py-0.5 rounded-full bg-error/10">
                                                    Esaurito
                                                </span>
                                            )}
                                            {expired && (
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-warning font-body font-semibold border border-warning/40 px-2 py-0.5 rounded-full bg-warning/10">
                                                    Scaduto
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-silver-dark text-xs">
                                            {formatRange(r.valid_from, r.valid_until)}
                                            <span className="ml-3">
                                                Usato {r.redeemed_count} / {r.max_redemptions}
                                            </span>
                                        </p>
                                        {r.description && (
                                            <p className="text-warm-white-muted text-sm">{r.description}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => toggle(r.id, !r.is_active)}
                                            disabled={savingId === r.id}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                                                r.is_active
                                                    ? "bg-accent-warm/15 text-accent-warm border-accent-warm/40"
                                                    : "border-line text-silver hover:text-warm-white"
                                            }`}
                                        >
                                            {r.is_active ? "Attivo" : "Disattivato"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                                    navigator.clipboard.writeText(r.code).catch(() => {});
                                                    addToast("Codice copiato", "info");
                                                }
                                            }}
                                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                                        >
                                            Copia codice
                                        </button>
                                        <button
                                            onClick={() => remove(r.id)}
                                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-error border border-error/40 rounded-full hover:bg-error/10 transition-colors"
                                        >
                                            Elimina
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function CouponForm({ onCreated }: { onCreated: () => void }) {
    const [code, setCode] = useState(randomCode());
    const [description, setDescription] = useState("");
    const [kind, setKind] = useState<CouponKind>("percent");
    const [valuePercent, setValuePercent] = useState(15);
    const [valueEuros, setValueEuros] = useState("10.00");
    const [validFrom, setValidFrom] = useState(todayISO());
    const [validUntil, setValidUntil] = useState("");
    const [maxRedemptions, setMaxRedemptions] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        if (!code.trim()) {
            addToast("Codice mancante", "error");
            return;
        }
        setSubmitting(true);
        try {
            const supabase = createClient();
            const insert: any = {
                code: code.trim().toUpperCase(),
                description: description.trim() || null,
                kind,
                valid_from: validFrom,
                valid_until: validUntil || null,
                max_redemptions: Math.max(1, maxRedemptions),
                is_active: true,
            };
            if (kind === "percent") {
                insert.value_percent = Math.max(1, Math.min(100, valuePercent));
            } else if (kind === "amount") {
                const cents = Math.round(parseFloat(valueEuros.replace(",", ".")) * 100);
                if (!Number.isFinite(cents) || cents <= 0) {
                    throw new Error("Importo non valido");
                }
                insert.value_cents = cents;
            }
            const { error } = await supabase.from("coupons").insert(insert);
            if (error) throw error;
            addToast("Coupon creato", "success");
            onCreated();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4"
        >
            <h3 className="text-display text-xl text-warm-white tracking-tight">Nuovo coupon</h3>

            <div className="grid md:grid-cols-3 gap-4">
                <label className="block md:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Codice
                    </span>
                    <div className="mt-1 flex gap-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className="flex-1 bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono tracking-widest"
                        />
                        <button
                            type="button"
                            onClick={() => setCode(randomCode())}
                            className="px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-md hover:bg-carbon-2 transition-colors"
                        >
                            Genera
                        </button>
                    </div>
                </label>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Tipo
                    </span>
                    <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value as CouponKind)}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    >
                        <option value="percent">Sconto %</option>
                        <option value="amount">Sconto € fisso</option>
                        <option value="free_service">Servizio gratis</option>
                    </select>
                </label>

                {kind === "percent" && (
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Percentuale
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={valuePercent}
                            onChange={(e) => setValuePercent(parseInt(e.target.value, 10) || 1)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </label>
                )}
                {kind === "amount" && (
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Importo €
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            min={0.01}
                            value={valueEuros}
                            onChange={(e) => setValueEuros(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                        />
                    </label>
                )}

                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Validità dal
                    </span>
                    <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Validità fino
                    </span>
                    <input
                        type="date"
                        value={validUntil}
                        min={validFrom}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Max utilizzi
                    </span>
                    <input
                        type="number"
                        min={1}
                        max={1000}
                        value={maxRedemptions}
                        onChange={(e) => setMaxRedemptions(parseInt(e.target.value, 10) || 1)}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
                    />
                </label>
            </div>

            <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    Descrizione (interna)
                </span>
                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Es. Compleanno Marco · Maggio"
                    className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                />
            </label>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                >
                    {submitting ? "Creazione…" : "Crea coupon"}
                </button>
            </div>
        </form>
    );
}
