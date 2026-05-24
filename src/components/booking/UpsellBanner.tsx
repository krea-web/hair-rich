"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore, useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

const DISMISS_KEY = "hr-upsell-dismiss-count";
const DISMISS_LIMIT = 3;

const UPSELL_MAP: Record<string, string> = {
    "taglio-classico": "taglio-barba",
    "barba-sartoriale": "taglio-barba",
};

/**
 * One-shot upsell banner shown above the StepConfirm form. Bumps the
 * service to the combo when the customer accepts and exits silently
 * otherwise. Three "no thanks" in a row blacklists the banner for the
 * device (localStorage), no nagging.
 */
export function UpsellBanner() {
    const { serviceId, services, setService } = useBookingStore();
    const addToast = useToastStore((s) => s.addToast);
    const [hidden, setHidden] = useState(false);

    const dismissCount = useMemo(() => {
        if (typeof window === "undefined") return 0;
        return Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    }, []);

    const targetSlug = serviceId
        ? services.find((s) => s.id === serviceId)?.slug
        : null;
    const upsellSlug = targetSlug ? UPSELL_MAP[targetSlug] : null;

    const currentService = serviceId ? services.find((s) => s.id === serviceId) : null;
    const upsellService = upsellSlug ? services.find((s) => s.slug === upsellSlug) : null;

    useEffect(() => {
        setHidden(false);
    }, [serviceId]);

    if (!currentService || !upsellService || hidden || dismissCount >= DISMISS_LIMIT) {
        return null;
    }

    const priceDelta = upsellService.price_cents - currentService.price_cents;
    const minuteDelta = upsellService.duration_min - currentService.duration_min;

    const accept = () => {
        setService(upsellService.id);
        addToast(`Aggiunto: ${upsellService.name}`, "success");
        setHidden(true);
    };

    const decline = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem(DISMISS_KEY, String(dismissCount + 1));
        }
        setHidden(true);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-5 rounded-[var(--radius-md)] bg-gradient-to-br from-accent-warm/10 to-accent-warm/5 border border-accent-warm/40"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                            Vuoi aggiungere?
                        </p>
                        <h4 className="mt-1 text-display text-lg text-warm-white tracking-tight">
                            {upsellService.name}{" "}
                            <span className="text-accent-warm">+{formatPrice(priceDelta)}</span>
                        </h4>
                        <p className="mt-1 text-sm text-warm-white-muted">
                            {minuteDelta > 0 ? `+${minuteDelta} min` : "stessa durata"} · ti
                            conviene su prezzo se prendi entrambi.
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={decline}
                        className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                    >
                        No grazie
                    </button>
                    <button
                        type="button"
                        onClick={accept}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                    >
                        Sì, aggiungi
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
