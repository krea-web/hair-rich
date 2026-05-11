"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/useLang";

interface Props {
    /** "inline" = compatto da inserire in CTA · "block" = card più grande · "ribbon" = stretch */
    variant?: "inline" | "block" | "ribbon";
    className?: string;
}

/**
 * Micro-componente di urgenza: mostra "Solo N slot rimasti questa settimana"
 * con dot pulsante. Usa mock realistico (2-7 slot, deterministico per giornata
 * per non sembrare un trucco).
 */
export function AvailabilityPulse({ variant = "inline", className = "" }: Props) {
    const { t } = useT();
    const [n, setN] = useState<number>(0);

    useEffect(() => {
        // Deterministico per giorno: stesso numero per tutte le pagine durante la giornata
        const day = Math.floor(Date.now() / 86_400_000);
        // Pseudo-random ma stabile: range 2..7
        const rnd = ((day * 9301 + 49297) % 233280) / 233280;
        setN(2 + Math.floor(rnd * 6));
    }, []);

    if (n === 0) return null;

    const text = t.availability.slotsLeft(n);

    if (variant === "ribbon") {
        return (
            <div
                className={`inline-flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-accent-warm/40 bg-accent-warm/10 backdrop-blur-md max-w-full ${className}`}
                role="status"
                aria-live="polite"
            >
                <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5 shrink-0">
                    <motion.span
                        className="absolute inline-flex h-full w-full rounded-full bg-accent-warm opacity-50"
                        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                    <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-accent-warm" />
                </span>
                <span className="text-[9px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.25em] font-body font-semibold text-warm-white whitespace-nowrap leading-tight">
                    {text}
                </span>
            </div>
        );
    }

    if (variant === "block") {
        return (
            <div
                className={`flex items-center gap-3 p-4 bg-carbon border border-accent-warm/30 rounded-[var(--radius-md)] ${className}`}
                role="status"
                aria-live="polite"
            >
                <span className="relative flex h-3 w-3 flex-shrink-0">
                    <motion.span
                        className="absolute inline-flex h-full w-full rounded-full bg-accent-warm opacity-60"
                        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-warm" />
                </span>
                <div className="flex-1">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                        Live
                    </span>
                    <p className="text-warm-white text-sm md:text-base font-body mt-0.5 leading-tight">
                        {text}
                    </p>
                </div>
            </div>
        );
    }

    // inline (default)
    return (
        <span
            className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-accent-warm font-body font-semibold ${className}`}
            role="status"
            aria-live="polite"
        >
            <span className="relative flex h-2 w-2">
                <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-accent-warm opacity-50"
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-warm" />
            </span>
            {text}
        </span>
    );
}
