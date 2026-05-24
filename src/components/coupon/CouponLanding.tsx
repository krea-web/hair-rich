"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBookingDrawer } from "@/lib/store";

type Stage = "loading" | "valid" | "invalid" | "expired";

interface ValidatedCoupon {
    coupon_id: string;
    code: string;
    kind: "percent" | "amount" | "free_service";
    discount_cents: number;
    description: string | null;
}

export function CouponLanding() {
    const [stage, setStage] = useState<Stage>("loading");
    const [coupon, setCoupon] = useState<ValidatedCoupon | null>(null);
    const [errorReason, setErrorReason] = useState<string | null>(null);
    const openBookingDrawer = useBookingDrawer((s) => s.open);

    useEffect(() => {
        const code = extractCode();
        if (!code) {
            setStage("invalid");
            return;
        }
        const supabase = createClient();
        supabase
            .rpc("fn_validate_coupon", {
                p_code: code,
                p_customer_id: null,
                p_subtotal_cents: 2000,
            })
            .then(({ data, error }) => {
                if (error) {
                    setStage("invalid");
                    return;
                }
                if (!data?.valid) {
                    setErrorReason(data?.reason ?? "unknown");
                    setStage(data?.reason === "expired" ? "expired" : "invalid");
                    return;
                }
                setCoupon(data as ValidatedCoupon);
                setStage("valid");
                try {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(data.code).catch(() => {});
                    }
                } catch {
                    /* ignore */
                }
            });
    }, []);

    if (stage === "loading") {
        return (
            <div className="min-h-[70dvh] grid place-items-center px-6">
                <div className="w-12 h-12 border-2 border-accent-warm border-r-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (stage === "invalid" || stage === "expired") {
        return (
            <div className="min-h-[70dvh] grid place-items-center px-6 text-center">
                <div className="max-w-md">
                    <span className="text-display-alt text-2xl text-accent-warm">Ops</span>
                    <h1 className="text-display text-3xl text-warm-white tracking-tight mt-1">
                        {stage === "expired" ? "Codice scaduto" : "Codice non valido"}
                    </h1>
                    <p className="mt-3 text-warm-white-muted text-base">
                        {stage === "expired"
                            ? "Questo coupon non è più attivo. Passa lo stesso da Hair Rich Olbia, ti aspettiamo!"
                            : "Verifica di aver scritto il codice corretto. Se l'hai scansionato da un volantino, prova a riscannerizzare."}
                    </p>
                    <a
                        href="/"
                        className="mt-6 inline-block px-6 py-3 border border-line text-warm-white rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                    >
                        Torna alla home
                    </a>
                </div>
            </div>
        );
    }

    const valueText =
        coupon!.kind === "free_service"
            ? "Servizio gratis"
            : coupon!.kind === "percent"
            ? `Sconto · circa ${Math.round(coupon!.discount_cents / 100)} €`
            : `${(coupon!.discount_cents / 100).toFixed(2)} € di sconto`;

    return (
        <div className="min-h-[70dvh] grid place-items-center px-6 py-14">
            <AnimatePresence>
                <motion.div
                    key="valid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center"
                >
                    <span className="text-display-alt text-2xl text-accent-warm">Benvenuto</span>
                    <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                        Il tuo coupon è qui.
                    </h1>

                    <div className="mt-8 bg-gradient-to-br from-accent-warm/15 via-carbon to-black-2 border border-accent-warm/40 rounded-[var(--radius-xl)] p-6 md:p-8">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                            Codice
                        </div>
                        <div className="mt-2 text-display text-3xl md:text-4xl text-warm-white tracking-[0.2em] tabular-nums">
                            {coupon!.code}
                        </div>
                        <div className="mt-4 text-warm-white-muted text-sm">{valueText}</div>
                        {coupon!.description && (
                            <p className="mt-3 text-silver-dark text-xs">{coupon!.description}</p>
                        )}
                    </div>

                    <p className="mt-6 text-warm-white-muted text-sm">
                        Inseriscilo nel campo "Hai un codice?" durante la prenotazione. Il codice è
                        già copiato negli appunti.
                    </p>

                    <button
                        onClick={openBookingDrawer}
                        className="mt-6 inline-block px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                    >
                        Prenota ora
                    </button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function extractCode(): string | null {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname.replace(/\/$/, "");
    const idx = path.lastIndexOf("/");
    if (idx < 0) return null;
    const tail = path.slice(idx + 1);
    return tail || null;
}
