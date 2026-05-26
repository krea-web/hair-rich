"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";

type CouponKind = "percent" | "amount" | "free_service";
type LoyaltyModel = "stamp" | "points" | "cashback";
type LoyaltyRewardKind = "free_service" | "fixed_discount" | "percent_discount";
type Tab = "coupons" | "loyalty" | "referrals";

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
    origin?: string | null;
    created_at: string;
}

interface LoyaltyConfigRow {
    id: string;
    model: LoyaltyModel;
    earn_per_visit: number;
    earn_per_euro_spent: number;
    reward_threshold: number;
    reward_kind: LoyaltyRewardKind;
    reward_value_cents: number | null;
    reward_value_percent: number | null;
    reward_service_id: string | null;
    signup_bonus: number;
    birthday_bonus: number;
    min_days_between_earns: number;
    max_earns_per_month: number | null;
    earn_requires_completed_status: boolean;
    reward_validity_days: number;
    display_name: string;
    display_description: string | null;
    display_unit_singular: string;
    display_unit_plural: string;
}

interface ReferralRow {
    id: string;
    referrer_customer_id: string;
    code: string;
    invited_email: string | null;
    invited_phone: string | null;
    invited_customer_id: string | null;
    status: "pending" | "signed_up" | "first_visit_completed" | "rewarded" | "expired";
    credit_cents: number;
    signed_up_at: string | null;
    first_visit_at: string | null;
    rewarded_at: string | null;
    created_at: string;
    referrer?: { first_name: string; last_name: string | null } | null;
    invited?: { first_name: string; last_name: string | null } | null;
}

function todayISO(): string {
    return new Date().toISOString().split("T")[0]!;
}

function randomCode(prefix = "HR"): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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

const STATUS_LABEL: Record<ReferralRow["status"], string> = {
    pending: "In attesa",
    signed_up: "Iscritto",
    first_visit_completed: "Prima visita",
    rewarded: "Premiato",
    expired: "Scaduto",
};

export default function AdminGamificationPage() {
    const [tab, setTab] = useState<Tab>("coupons");

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Gamification</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Coupon, fedeltà, referral.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Tre leve di fidelizzazione: sconti puntuali, programma fedeltà ricorrente,
                    passaparola incentivato. Le attivi/disattivi una alla volta dalla Skills Hub.
                </p>
            </motion.div>

            <div className="flex gap-2 border-b border-line">
                {(
                    [
                        { id: "coupons", label: "Coupon" },
                        { id: "loyalty", label: "Fedeltà" },
                        { id: "referrals", label: "Referral" },
                    ] as { id: Tab; label: string }[]
                ).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-5 py-3 text-[11px] uppercase tracking-[0.25em] font-body font-semibold transition-colors border-b-2 ${
                            tab === t.id
                                ? "border-accent-warm text-accent-warm"
                                : "border-transparent text-silver-dark hover:text-warm-white"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "coupons" && <CouponsTab />}
            {tab === "loyalty" && <LoyaltyTab />}
            {tab === "referrals" && <ReferralsTab />}
        </div>
    );
}

// ─── Coupons ──────────────────────────────────────────────────────────────
function CouponsTab() {
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
        <div className="space-y-6">
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
                                            {r.origin && r.origin !== "manual" && (
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold border border-line px-2 py-0.5 rounded-full">
                                                    {r.origin}
                                                </span>
                                            )}
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
                origin: "manual",
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

// ─── Loyalty config ──────────────────────────────────────────────────────
function LoyaltyTab() {
    const [cfg, setCfg] = useState<LoyaltyConfigRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("loyalty_config")
            .select("*")
            .eq("is_singleton", true)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) addToast(`Errore: ${error.message}`, "error");
                else setCfg(data as LoyaltyConfigRow);
                setLoading(false);
            });
    }, [addToast]);

    const save = async () => {
        if (!cfg) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("loyalty_config")
                .update({
                    model: cfg.model,
                    earn_per_visit: cfg.earn_per_visit,
                    earn_per_euro_spent: cfg.earn_per_euro_spent,
                    reward_threshold: cfg.reward_threshold,
                    reward_kind: cfg.reward_kind,
                    reward_value_cents: cfg.reward_value_cents,
                    reward_value_percent: cfg.reward_value_percent,
                    signup_bonus: cfg.signup_bonus,
                    birthday_bonus: cfg.birthday_bonus,
                    min_days_between_earns: cfg.min_days_between_earns,
                    max_earns_per_month: cfg.max_earns_per_month,
                    earn_requires_completed_status: cfg.earn_requires_completed_status,
                    reward_validity_days: cfg.reward_validity_days,
                    display_name: cfg.display_name,
                    display_description: cfg.display_description,
                    display_unit_singular: cfg.display_unit_singular,
                    display_unit_plural: cfg.display_unit_plural,
                })
                .eq("id", cfg.id);
            if (error) throw error;
            addToast("Configurazione salvata", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="h-64 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />;
    }
    if (!cfg) {
        return (
            <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                Configurazione fedeltà non trovata. Esegui la migration 0039.
            </p>
        );
    }

    const update = (patch: Partial<LoyaltyConfigRow>) =>
        setCfg((c) => (c ? { ...c, ...patch } : c));

    return (
        <div className="space-y-6">
            <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-6">
                <header>
                    <h3 className="text-display text-xl text-warm-white tracking-tight">Modello fedeltà</h3>
                    <p className="text-warm-white-muted text-sm mt-1">
                        Attiva la skill <code className="text-accent-warm">loyalty</code> dalla
                        Skills Hub per rendere visibile il programma ai clienti.
                    </p>
                </header>

                <div className="grid grid-cols-3 gap-3">
                    {(
                        [
                            { id: "stamp", label: "A timbri", hint: "Ogni visita = 1 timbro" },
                            { id: "points", label: "A punti", hint: "Punti su spesa €" },
                            { id: "cashback", label: "Cashback", hint: "% del totale" },
                        ] as { id: LoyaltyModel; label: string; hint: string }[]
                    ).map((m) => (
                        <button
                            key={m.id}
                            onClick={() => update({ model: m.id })}
                            className={`p-4 rounded-[var(--radius-md)] border text-left transition-colors ${
                                cfg.model === m.id
                                    ? "border-accent-warm bg-accent-warm/10"
                                    : "border-line hover:border-warm-white/40"
                            }`}
                        >
                            <div className="text-warm-white text-sm font-semibold">{m.label}</div>
                            <div className="text-silver-dark text-xs mt-1">{m.hint}</div>
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <NumField
                        label="Earn per visita"
                        value={cfg.earn_per_visit}
                        onChange={(v) => update({ earn_per_visit: v })}
                    />
                    <NumField
                        label="Earn per € spesi"
                        value={cfg.earn_per_euro_spent}
                        onChange={(v) => update({ earn_per_euro_spent: v })}
                    />
                    <NumField
                        label="Soglia premio"
                        value={cfg.reward_threshold}
                        onChange={(v) => update({ reward_threshold: v })}
                    />
                    <NumField
                        label="Validità premio (giorni)"
                        value={cfg.reward_validity_days}
                        onChange={(v) => update({ reward_validity_days: v })}
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Tipo premio
                        </span>
                        <select
                            value={cfg.reward_kind}
                            onChange={(e) =>
                                update({ reward_kind: e.target.value as LoyaltyRewardKind })
                            }
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        >
                            <option value="free_service">Servizio gratis</option>
                            <option value="fixed_discount">Sconto € fisso</option>
                            <option value="percent_discount">Sconto %</option>
                        </select>
                    </label>
                    {cfg.reward_kind === "fixed_discount" && (
                        <NumField
                            label="Sconto € (centesimi)"
                            value={cfg.reward_value_cents ?? 0}
                            onChange={(v) => update({ reward_value_cents: v })}
                        />
                    )}
                    {cfg.reward_kind === "percent_discount" && (
                        <NumField
                            label="Sconto %"
                            value={cfg.reward_value_percent ?? 0}
                            onChange={(v) => update({ reward_value_percent: v })}
                        />
                    )}
                </div>

                <details className="border border-line rounded-md px-4 py-3 bg-black-2/40">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-[0.25em] text-silver">
                        Bonus + anti-gaming
                    </summary>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <NumField
                            label="Bonus iscrizione"
                            value={cfg.signup_bonus}
                            onChange={(v) => update({ signup_bonus: v })}
                        />
                        <NumField
                            label="Bonus compleanno"
                            value={cfg.birthday_bonus}
                            onChange={(v) => update({ birthday_bonus: v })}
                        />
                        <NumField
                            label="Min giorni tra earn consecutivi"
                            value={cfg.min_days_between_earns}
                            onChange={(v) => update({ min_days_between_earns: v })}
                        />
                        <NumField
                            label="Max earn per mese (0 = senza limite)"
                            value={cfg.max_earns_per_month ?? 0}
                            onChange={(v) => update({ max_earns_per_month: v === 0 ? null : v })}
                        />
                        <label className="flex items-center gap-3 col-span-2">
                            <input
                                type="checkbox"
                                checked={cfg.earn_requires_completed_status}
                                onChange={(e) =>
                                    update({ earn_requires_completed_status: e.target.checked })
                                }
                                className="w-4 h-4"
                            />
                            <span className="text-warm-white text-sm">
                                Earn solo dopo che il barber segna l'appuntamento come completato
                            </span>
                        </label>
                    </div>
                </details>

                <details className="border border-line rounded-md px-4 py-3 bg-black-2/40">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-[0.25em] text-silver">
                        Branding / etichette
                    </summary>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <TextField
                            label="Nome programma"
                            value={cfg.display_name}
                            onChange={(v) => update({ display_name: v })}
                        />
                        <TextField
                            label="Unit singolare"
                            value={cfg.display_unit_singular}
                            onChange={(v) => update({ display_unit_singular: v })}
                        />
                        <TextField
                            label="Unit plurale"
                            value={cfg.display_unit_plural}
                            onChange={(v) => update({ display_unit_plural: v })}
                        />
                        <TextField
                            label="Descrizione (interno)"
                            value={cfg.display_description ?? ""}
                            onChange={(v) => update({ display_description: v || null })}
                        />
                    </div>
                </details>

                <div className="flex justify-end">
                    <button
                        onClick={save}
                        disabled={saving}
                        className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Salvataggio…" : "Salva configurazione"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function NumField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white font-mono"
            />
        </label>
    );
}

function TextField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
            />
        </label>
    );
}

// ─── Referrals ──────────────────────────────────────────────────────────
function ReferralsTab() {
    const [rows, setRows] = useState<ReferralRow[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("referrals")
            .select(
                `*,
                referrer:customers!referrals_referrer_customer_id_fkey(first_name,last_name),
                invited:customers!referrals_invited_customer_id_fkey(first_name,last_name)`
            )
            .order("created_at", { ascending: false })
            .limit(200)
            .then(({ data, error }) => {
                if (error) addToast(`Errore: ${error.message}`, "error");
                else setRows((data ?? []) as ReferralRow[]);
                setLoading(false);
            });
    }, [addToast]);

    const stats = useMemo(() => {
        const pending = rows.filter((r) => r.status === "pending").length;
        const completed = rows.filter((r) => r.status === "rewarded").length;
        const totalCredits = rows
            .filter((r) => r.status === "rewarded")
            .reduce((sum, r) => sum + r.credit_cents, 0);
        return { total: rows.length, pending, completed, totalCredits };
    }, [rows]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {[
                    { label: "Inviti totali", value: stats.total },
                    { label: "In attesa", value: stats.pending },
                    { label: "Convertiti", value: stats.completed },
                    { label: "Crediti erogati", value: formatPrice(stats.totalCredits) },
                ].map((s) => (
                    <div key={s.label} className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {s.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="h-64 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
            ) : rows.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun referral ancora generato. I clienti generano i propri codici da{" "}
                    <code className="text-accent-warm">/profilo/referral</code>.
                </p>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="text-left text-silver-dark text-[10px] uppercase tracking-[0.25em] border-b border-line">
                            <th className="py-3">Referrer</th>
                            <th className="py-3">Codice</th>
                            <th className="py-3">Invitato</th>
                            <th className="py-3">Status</th>
                            <th className="py-3 text-right">Credito</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-b border-line/30">
                                <td className="py-3 text-warm-white">
                                    {r.referrer?.first_name} {r.referrer?.last_name ?? ""}
                                </td>
                                <td className="py-3">
                                    <code className="text-warm-white-muted font-mono text-xs">{r.code}</code>
                                </td>
                                <td className="py-3 text-warm-white-muted">
                                    {r.invited
                                        ? `${r.invited.first_name} ${r.invited.last_name ?? ""}`
                                        : r.invited_email || r.invited_phone || "—"}
                                </td>
                                <td className="py-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-body font-semibold border ${
                                            r.status === "rewarded"
                                                ? "border-success/40 text-success bg-success/10"
                                                : r.status === "pending"
                                                ? "border-line text-silver"
                                                : "border-accent-warm/40 text-accent-warm bg-accent-warm/10"
                                        }`}
                                    >
                                        {STATUS_LABEL[r.status]}
                                    </span>
                                </td>
                                <td className="py-3 text-right text-accent-warm tabular-nums">
                                    {formatPrice(r.credit_cents)}
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
