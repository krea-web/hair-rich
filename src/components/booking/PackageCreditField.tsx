"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ActivePackage {
    customer_package_id: string;
    package_id: string;
    package_name: string;
    credits_remaining: number;
    credits_total: number;
    expires_at: string;
    eligible_for_service: boolean;
}

interface Props {
    serviceId: string | null;
    onChange: (selected: ActivePackage | null) => void;
}

/**
 * Inline credit selector. Visible only when the logged-in customer has
 * at least one active package whose eligibility matches the chosen
 * service. The actual decrement happens after bookAppointment succeeds
 * (see StepConfirm) so an invalid slot doesn't burn a credit.
 */
export function PackageCreditField({ serviceId, onChange }: Props) {
    const [packages, setPackages] = useState<ActivePackage[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [enabled, setEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        if (!serviceId) return;
        let cancelled = false;
        (async () => {
            const supabase = createClient();
            const [{ data: salon }, { data: auth }] = await Promise.all([
                supabase.from("salon_settings").select("packages_enabled").limit(1).maybeSingle(),
                supabase.auth.getUser(),
            ]);
            if (cancelled) return;
            const featureOn = Boolean(salon?.packages_enabled);
            setEnabled(featureOn);
            if (!featureOn || !auth.user) return;

            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", auth.user.id)
                .maybeSingle();
            if (!customer?.id) return;

            const { data } = await supabase.rpc("fn_customer_active_packages", {
                p_customer_id: customer.id,
                p_service_id: serviceId,
            });
            if (cancelled) return;
            const eligible = (data ?? []).filter((p: ActivePackage) => p.eligible_for_service);
            setPackages(eligible);
        })();
        return () => {
            cancelled = true;
        };
    }, [serviceId]);

    if (!enabled || packages.length === 0) return null;

    const toggle = (p: ActivePackage) => {
        if (selectedId === p.customer_package_id) {
            setSelectedId(null);
            onChange(null);
        } else {
            setSelectedId(p.customer_package_id);
            onChange(p);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[var(--radius-sm)] bg-accent-warm/5 border border-accent-warm/40"
        >
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                Hai un pacchetto attivo
            </p>
            <p className="mt-1 text-sm text-warm-white">
                Usa 1 credito su questo appuntamento? Nessun pagamento in salone.
            </p>
            <div className="mt-3 space-y-2">
                {packages.map((p) => {
                    const on = selectedId === p.customer_package_id;
                    return (
                        <button
                            key={p.customer_package_id}
                            type="button"
                            onClick={() => toggle(p)}
                            className={`w-full text-left p-3 rounded-[var(--radius-sm)] border transition-colors flex items-center justify-between gap-3 ${
                                on
                                    ? "bg-accent-warm text-black border-accent-warm"
                                    : "bg-black-2 border-line text-warm-white hover:border-accent-warm/60"
                            }`}
                        >
                            <div>
                                <div className="font-body font-semibold text-sm">{p.package_name}</div>
                                <div className={`text-[11px] ${on ? "text-black/70" : "text-silver-dark"}`}>
                                    {p.credits_remaining}/{p.credits_total} crediti · scade il{" "}
                                    {new Date(p.expires_at).toLocaleDateString("it-IT", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "2-digit",
                                    })}
                                </div>
                            </div>
                            <span
                                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.25em] font-body font-semibold ${
                                    on ? "bg-black text-accent-warm" : "bg-accent-warm/20 text-accent-warm"
                                }`}
                            >
                                {on ? "✓ usa" : "usa 1"}
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

export type { ActivePackage };
