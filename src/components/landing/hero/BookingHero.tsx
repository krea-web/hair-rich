"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    fetchAvailableSlots,
    fetchServices,
    fetchStaff,
} from "@/lib/supabase/queries";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import type { Service, Staff } from "@/lib/supabase/types";

interface NextSlot {
    date: string;
    time: string;
    staffId: string;
    staffName: string;
    dayLabel: string;
    serviceId: string;
}

/**
 * "Live slot" hero for /prenota. Split layout: editorial title on the
 * left, a giant live "Prossimo slot disponibile" card on the right that
 * pulses while it fetches and resolves into an actual booking CTA. One
 * tap pre-fills the wizard with the service+staff+slot and opens the
 * drawer.
 */
export function BookingHero() {
    const [next, setNext] = useState<NextSlot | null>(null);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);
    const setStaff = useBookingStore((s) => s.setStaff);
    const setDate = useBookingStore((s) => s.setDate);
    const setTime = useBookingStore((s) => s.setTime);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [services, staff] = await Promise.all([fetchServices(), fetchStaff()]);
                const featured: Service | undefined =
                    services.find((s) => s.slug === "fade-sfumatura") ?? services[0];
                if (!featured) return;
                for (let i = 0; i < 14; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    if (d.getDay() === 0 || d.getDay() === 1) continue;
                    const dateStr = d.toISOString().split("T")[0]!;
                    const slots = await fetchAvailableSlots({ date: dateStr, serviceId: featured.id });
                    if (slots.length > 0) {
                        const first = slots[0]!;
                        const member: Staff | undefined = staff.find((m) => m.id === first.staff_id);
                        if (!alive) return;
                        setNext({
                            date: dateStr,
                            time: first.slot_time.slice(0, 5),
                            staffId: first.staff_id,
                            staffName: member?.name ?? "Disponibile",
                            dayLabel:
                                i === 0
                                    ? "Oggi"
                                    : i === 1
                                      ? "Domani"
                                      : d.toLocaleDateString("it-IT", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                        }),
                            serviceId: featured.id,
                        });
                        return;
                    }
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const claim = () => {
        if (!next) {
            openDrawer();
            return;
        }
        setService(next.serviceId);
        setStaff(next.staffId);
        setDate(next.date);
        setTime(next.time);
        openDrawer();
    };

    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(212,165,116,0.18),transparent_55%)]"
            />

            <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-24 md:pt-32 lg:pt-36 xl:pt-40 2xl:pt-44 pb-16 md:pb-24 lg:pb-28 xl:pb-32 min-h-[80vh] md:min-h-[85vh] lg:min-h-[78vh] xl:min-h-[72vh] 2xl:min-h-[68vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
                    {/* Left — title */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-7"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30 mb-4">
                            <span className="relative flex w-2 h-2">
                                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
                                <span className="relative rounded-full w-2 h-2 bg-success" />
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-success font-body font-semibold">
                                Slot live · 365 giorni
                            </span>
                        </div>
                        <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight leading-[0.95]">
                            Prenota in
                            <br />
                            <em className="text-display-alt not-italic text-silver">
                                trenta secondi.
                            </em>
                        </h1>
                        <p className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Disponibilità in tempo reale, conferma immediata, nessun pagamento online.
                            Scegli servizio, ora e barber — pensiamo noi al resto.
                        </p>
                    </motion.div>

                    {/* Right — live next slot card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-5"
                    >
                        <div className="relative bg-gradient-to-br from-carbon via-carbon to-black-2 border border-accent-warm/40 rounded-[var(--radius-lg)] p-6 md:p-8 overflow-hidden">
                            <div
                                aria-hidden="true"
                                className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent-warm/10 blur-3xl"
                            />
                            <div className="relative">
                                <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                    Prossimo slot disponibile
                                </span>

                                {loading ? (
                                    <div className="mt-4 space-y-3 animate-pulse">
                                        <div className="h-16 bg-warm-white/5 rounded" />
                                        <div className="h-4 bg-warm-white/5 rounded w-2/3" />
                                    </div>
                                ) : next ? (
                                    <>
                                        <div className="mt-3 flex items-baseline gap-3">
                                            <span className="text-display text-6xl md:text-7xl lg:text-8xl text-warm-white tabular-nums leading-none">
                                                {next.time}
                                            </span>
                                            <span className="text-display-alt text-xl md:text-2xl text-accent-warm capitalize">
                                                {next.dayLabel}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-warm-white-muted text-sm md:text-base">
                                            con <span className="text-warm-white font-semibold">{next.staffName}</span> · Taglio sartoriale
                                        </p>
                                    </>
                                ) : (
                                    <p className="mt-3 text-warm-white text-base">
                                        Apri il booking per vedere gli slot della settimana.
                                    </p>
                                )}

                                <button
                                    onClick={claim}
                                    className="cta-shine cta-pulse mt-6 md:mt-8 w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                                >
                                    {next ? "Prendi questo slot" : "Apri il booking"}
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-10 md:mt-16 flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Slot live · 365 giorni
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        04 / Prenota
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
