"use client";

import { motion } from "framer-motion";
import { useBookingDrawer } from "@/lib/store";
import { isBirthdayMonth, useCurrentCustomer } from "@/lib/supabase/me";

const MONTHS_IT = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre",
];

/**
 * Renders a birthday-month banner if the current customer's `birthdate`
 * sits in the current month. Silent otherwise. Visually understated —
 * accent-warm border + warm text + a single CTA. Reuses the global
 * BookingDrawer.
 */
export function BirthdayBanner() {
    const { customer } = useCurrentCustomer();
    const openDrawer = useBookingDrawer((s) => s.open);

    if (!isBirthdayMonth(customer)) return null;

    const monthLabel = MONTHS_IT[new Date().getMonth()];
    const name = customer?.first_name ?? "tu";

    return (
        <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative overflow-hidden rounded-[var(--radius-md)] border border-accent-warm/40 bg-gradient-to-br from-carbon via-black to-black p-5 md:p-7"
        >
            <div
                aria-hidden="true"
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-accent-warm/15 blur-3xl pointer-events-none"
            />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="text-3xl md:text-4xl leading-none mt-0.5">
                        🎂
                    </span>
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Mese del tuo compleanno
                        </span>
                        <h2 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight mt-1 leading-tight">
                            Buon compleanno, {name}.
                        </h2>
                        <p className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-md">
                            Hai diritto a <strong className="text-warm-white">−20% sul prossimo servizio</strong>{" "}
                            entro fine {monthLabel}. Te lo applichiamo in salone.
                        </p>
                    </div>
                </div>
                <button
                    onClick={openDrawer}
                    className="cta-shine cta-pulse inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform whitespace-nowrap self-start md:self-center"
                >
                    Prenota con sconto
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </motion.aside>
    );
}
