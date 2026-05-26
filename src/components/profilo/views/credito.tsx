"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBookingDrawer, useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

interface PackageRow {
    id: string;
    name: string;
    credits_total: number;
    credits_used: number;
    expires_at: string | null;
    purchased_at: string;
    status: "active" | "expired" | "exhausted";
}

interface CouponRow {
    id: string;
    code: string;
    description: string | null;
    discount_cents: number | null;
    discount_pct: number | null;
    valid_until: string | null;
    redeemed_at: string | null;
}

interface ReferralStats {
    code: string | null;
    invited_count: number;
    credit_cents: number;
}

export default function ProfiloCreditoPage() {
    const [packages, setPackages] = useState<PackageRow[]>([]);
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [referral, setReferral] = useState<ReferralStats | null>(null);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return;
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", user.user.id)
                .maybeSingle();
            if (!customer) return;
            const customerId = (customer as { id: string }).id;

            // 1. Packages
            const pkgResp = await supabase
                .from("customer_packages")
                .select(`
                    id, status, credits_total, credits_used, expires_at, purchased_at,
                    package:package_id ( name )
                `)
                .eq("customer_id", customerId)
                .order("purchased_at", { ascending: false });
            const pkgRows = (pkgResp.data ?? []).map((r: any) => ({
                id: r.id,
                name: r.package?.name ?? "Pacchetto",
                credits_total: r.credits_total,
                credits_used: r.credits_used,
                expires_at: r.expires_at,
                purchased_at: r.purchased_at,
                status: r.status,
            })) as PackageRow[];
            setPackages(pkgRows);

            // 2. Active coupons assigned to this customer (unused)
            const couponResp = await supabase
                .from("coupons")
                .select("id, code, description, discount_cents, discount_pct, valid_until, redeemed_at")
                .eq("customer_id", customerId)
                .is("redeemed_at", null)
                .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
                .order("valid_until", { ascending: true, nullsFirst: false });
            setCoupons(((couponResp.data ?? []) as unknown) as CouponRow[]);

            // 3. Referral stats
            const referralResp = await supabase
                .from("referrals")
                .select("code, credit_cents")
                .eq("referrer_customer_id", customerId)
                .maybeSingle();
            const inviteCountResp = await supabase
                .from("referral_uses")
                .select("id", { count: "exact", head: true })
                .eq("referrer_customer_id", customerId);
            setReferral({
                code: (referralResp.data as any)?.code ?? null,
                credit_cents: (referralResp.data as any)?.credit_cents ?? 0,
                invited_count: inviteCountResp.count ?? 0,
            });
        } catch (e: any) {
            // Some tables may not exist yet in a fresh install; render gracefully
            if (!String(e?.message ?? "").includes("relation")) {
                addToast(`Errore: ${e?.message ?? "?"}`, "error");
            }
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const activePackages = packages.filter((p) => p.status === "active");
    const expiredPackages = packages.filter((p) => p.status !== "active");

    const copyReferral = async () => {
        if (!referral?.code) return;
        const url = `${window.location.origin}/?r=${referral.code}`;
        try {
            await navigator.clipboard.writeText(url);
            addToast("Link copiato negli appunti", "success");
        } catch {
            addToast("Copia manualmente: " + url, "info");
        }
    };

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-4xl space-y-10">
            <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">I tuoi</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Crediti & bonus.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-md">
                    Pacchetti prepagati, coupon attivi, crediti dal passaparola. Tutto in un unico posto.
                </p>
            </motion.header>

            {/* Pacchetti */}
            <section>
                <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mb-4">
                    🎫 Pacchetti
                </h2>
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1].map((i) => (
                            <div key={i} className="h-28 bg-carbon border border-line rounded-md animate-pulse" />
                        ))}
                    </div>
                ) : activePackages.length === 0 ? (
                    <div className="p-6 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                        <p className="text-warm-white-muted text-sm">
                            Nessun pacchetto attivo. I pacchetti (es. 5 tagli prepagati) si acquistano
                            in salone e sblocchi uno sconto sul totale.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {activePackages.map((p) => {
                            const remaining = p.credits_total - p.credits_used;
                            const pct = (p.credits_used / p.credits_total) * 100;
                            const expiringSoon =
                                p.expires_at &&
                                new Date(p.expires_at).getTime() - Date.now() < 30 * 86400000;
                            return (
                                <li key={p.id} className="p-5 bg-carbon border border-line rounded-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-warm-white font-body font-semibold">{p.name}</h3>
                                            <p className="text-xs text-silver-dark mt-1">
                                                Acquistato {new Date(p.purchased_at).toLocaleDateString("it-IT")}
                                            </p>
                                        </div>
                                        <span className="text-display text-2xl text-accent-warm tabular-nums">
                                            {remaining}
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 bg-black-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent-warm transition-all"
                                            style={{ width: `${100 - pct}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <span className="text-silver-dark">
                                            {p.credits_used} usati su {p.credits_total}
                                        </span>
                                        {p.expires_at && (
                                            <span className={expiringSoon ? "text-amber-300 font-semibold" : "text-silver-dark"}>
                                                {expiringSoon ? "⚠ Scade " : "scade "}
                                                {new Date(p.expires_at).toLocaleDateString("it-IT")}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {expiredPackages.length > 0 && (
                    <details className="mt-4">
                        <summary className="text-xs text-silver-dark cursor-pointer hover:text-warm-white">
                            Vedi pacchetti passati ({expiredPackages.length})
                        </summary>
                        <ul className="mt-2 space-y-2">
                            {expiredPackages.map((p) => (
                                <li
                                    key={p.id}
                                    className="p-3 bg-carbon/50 border border-line/50 rounded-md text-xs text-silver-dark"
                                >
                                    {p.name} · {p.credits_used}/{p.credits_total} · {p.status}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </section>

            {/* Coupon */}
            <section>
                <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mb-4">
                    🎪 Coupon disponibili
                </h2>
                {loading ? (
                    <div className="h-24 bg-carbon border border-line rounded-md animate-pulse" />
                ) : coupons.length === 0 ? (
                    <div className="p-6 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                        <p className="text-warm-white-muted text-sm">
                            Nessun coupon attivo. I coupon arrivano dopo il compleanno, dal programma fedeltà
                            o quando il salone lancia una promo.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {coupons.map((c) => {
                            const expiresSoon =
                                c.valid_until &&
                                new Date(c.valid_until).getTime() - Date.now() < 7 * 86400000;
                            return (
                                <li
                                    key={c.id}
                                    className="p-5 bg-gradient-to-br from-accent-warm/10 to-carbon border border-accent-warm/30 rounded-md flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-warm-white font-mono text-lg tracking-widest font-bold">
                                                {c.code}
                                            </code>
                                            <button
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(c.code);
                                                    addToast("Codice copiato", "success");
                                                }}
                                                className="text-xs text-accent-warm hover:text-warm-white"
                                            >
                                                copia
                                            </button>
                                        </div>
                                        {c.description && (
                                            <p className="text-sm text-warm-white-muted mt-1">{c.description}</p>
                                        )}
                                        <p className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-2">
                                            {c.valid_until ? (
                                                <span className={expiresSoon ? "text-amber-300" : ""}>
                                                    Valido fino al {new Date(c.valid_until).toLocaleDateString("it-IT")}
                                                </span>
                                            ) : (
                                                "Senza scadenza"
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-display text-2xl text-accent-warm tabular-nums">
                                            {c.discount_pct ? `-${c.discount_pct}%` : formatPrice(c.discount_cents ?? 0)}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Referral credit */}
            {referral?.code && (
                <section>
                    <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mb-4">
                        🤝 Passaparola
                    </h2>
                    <div className="p-5 bg-carbon border border-line rounded-md">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Tuo codice
                                </div>
                                <code className="text-warm-white font-mono text-xl tracking-widest font-bold block mt-1">
                                    {referral.code}
                                </code>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    Credito accumulato
                                </div>
                                <div className="text-display text-2xl text-accent-warm tabular-nums mt-1">
                                    {formatPrice(referral.credit_cents)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs">
                            <span className="text-silver-dark">{referral.invited_count} amici già invitati</span>
                            <button
                                onClick={copyReferral}
                                className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon-2"
                            >
                                Copia link invito
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA prenota */}
            {(activePackages.length > 0 || coupons.length > 0) && (
                <div className="text-center pt-4">
                    <button
                        onClick={openDrawer}
                        className="cta-shine cta-pulse inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                    >
                        Usa il tuo credito
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
