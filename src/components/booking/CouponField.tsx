"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

export interface AppliedCoupon {
    couponId: string;
    code: string;
    discountCents: number;
    description: string | null;
}

interface Props {
    subtotalCents: number;
    onChange: (applied: AppliedCoupon | null) => void;
}

export function CouponField({ subtotalCents, onChange }: Props) {
    const [skillEnabled, setSkillEnabled] = useState<boolean | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [code, setCode] = useState("");
    const [validating, setValidating] = useState(false);
    const [applied, setApplied] = useState<AppliedCoupon | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("skills_config")
            .select("enabled")
            .eq("skill_key", "coupons")
            .maybeSingle()
            .then(({ data }) => {
                setSkillEnabled(!!data?.enabled);
            });
    }, []);

    if (skillEnabled !== true) return null;

    const validate = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) return;
        setValidating(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error: rpcError } = await supabase.rpc("fn_validate_coupon", {
                p_code: trimmed,
                p_customer_id: null,
                p_subtotal_cents: subtotalCents,
            });
            if (rpcError) throw rpcError;
            if (!data?.valid) {
                const reasonText: Record<string, string> = {
                    not_found: "Codice non trovato",
                    expired: "Codice scaduto",
                    not_started: "Codice non ancora valido",
                    exhausted: "Codice esaurito",
                    already_used: "Hai già usato questo codice",
                    wrong_customer: "Codice non intestato a te",
                    min_purchase_not_met: "Importo minimo non raggiunto",
                    feature_disabled: "Funzione coupon non attiva",
                };
                setError(reasonText[data?.reason] ?? "Codice non valido");
                setApplied(null);
                onChange(null);
                return;
            }
            const next: AppliedCoupon = {
                couponId: data.coupon_id,
                code: data.code,
                discountCents: data.discount_cents ?? 0,
                description: data.description ?? null,
            };
            setApplied(next);
            onChange(next);
        } catch (e: any) {
            setError(e?.message ?? "Errore validazione");
        } finally {
            setValidating(false);
        }
    };

    const remove = () => {
        setApplied(null);
        setCode("");
        setError(null);
        onChange(null);
    };

    if (applied) {
        return (
            <div className="rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-success font-body font-semibold">
                            Coupon applicato
                        </span>
                        <code className="text-warm-white font-mono text-sm tracking-widest">{applied.code}</code>
                    </div>
                    <p className="text-success text-sm mt-1 tabular-nums">
                        Sconto -{formatPrice(applied.discountCents)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={remove}
                    className="text-[10px] uppercase tracking-[0.25em] text-silver hover:text-warm-white"
                >
                    Rimuovi
                </button>
            </div>
        );
    }

    if (!expanded) {
        return (
            <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-[11px] uppercase tracking-[0.25em] text-silver hover:text-warm-white underline underline-offset-4"
            >
                Hai un codice?
            </button>
        );
    }

    return (
        <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                Codice sconto
            </label>
            <div className="flex gap-2">
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ES. WELCOME15"
                    className="flex-1 bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-2.5 text-warm-white font-mono tracking-widest text-sm focus:border-accent-warm focus:outline-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            validate();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={validate}
                    disabled={validating || !code.trim()}
                    className="px-4 py-2.5 bg-accent-warm/15 border border-accent-warm/40 text-accent-warm rounded-[var(--radius-sm)] text-[10px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50 hover:bg-accent-warm/25 transition-colors"
                >
                    {validating ? "…" : "Applica"}
                </button>
            </div>
            {error && <p className="text-error text-xs">{error}</p>}
        </div>
    );
}
