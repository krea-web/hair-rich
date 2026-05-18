"use client";

import { motion } from "framer-motion";
import { useCurrentCustomer } from "@/lib/supabase/me";

const MILESTONE = 10; // every 10th appointment is on us

/**
 * "Sei al taglio #5" — visual progress bar for the loyalty count.
 * Reads completedAppointments from useCurrentCustomer and renders a gold
 * progress bar against MILESTONE. Hidden when there's no customer record
 * yet (e.g. first session, customer row missing).
 */
export function LoyaltyProgress() {
    const { customer, completedAppointments, loading } = useCurrentCustomer();

    if (loading || !customer) return null;

    const count = completedAppointments;
    const cycle = Math.floor(count / MILESTONE);
    const inCycle = count % MILESTONE;
    const isCycleComplete = count > 0 && inCycle === 0;
    const labelN = isCycleComplete ? MILESTONE : inCycle;
    const pct = (labelN / MILESTONE) * 100;
    const toGoal = MILESTONE - labelN;

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-carbon to-black-2 p-5 md:p-7"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        Hair Rich Club
                    </span>
                    <h3 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight mt-1 leading-tight">
                        {isCycleComplete
                            ? `Hai sbloccato un rituale in regalo.`
                            : `Sei al taglio ${labelN} di ${MILESTONE}.`}
                    </h3>
                    <p className="mt-2 text-warm-white-muted text-sm leading-relaxed max-w-md">
                        {isCycleComplete
                            ? "Al prossimo appuntamento il rituale è offerto da noi. Te lo applicheremo direttamente in salone."
                            : `Mancano ${toGoal} ${toGoal === 1 ? "rituale" : "rituali"} al prossimo regalo${cycle > 0 ? " · " + cycle + " regalo già sbloccato" + (cycle > 1 ? "i" : "") : ""}.`}
                    </p>
                </div>
                <div className="hidden md:flex flex-col items-end shrink-0">
                    <span className="text-display text-5xl text-accent-warm tabular-nums leading-none">
                        {count}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mt-1">
                        Tagli totali
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
                <div className="relative h-2 rounded-full bg-line overflow-hidden">
                    <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-warm/80 to-accent-warm rounded-full"
                    />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                    <span>0</span>
                    <span className="text-accent-warm">{labelN} / {MILESTONE}</span>
                    <span>Premio</span>
                </div>
            </div>
        </motion.section>
    );
}
