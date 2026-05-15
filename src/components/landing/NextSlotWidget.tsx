"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchAvailableSlots, fetchServices, fetchStaff } from "@/lib/supabase/queries";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import type { Service, Staff } from "@/lib/supabase/types";

interface NextSlot {
    date: string;
    time: string;
    staffId: string;
    staffName: string;
    dayLabel: string;
}

/**
 * Fetches the soonest available 30-min slot for the most popular service
 * (Fade & Sfumatura) starting today, scanning the next 7 days. Shown
 * inline in the hero — one tap pre-fills the wizard with this slot.
 */
export function NextSlotWidget() {
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
                const fade: Service | undefined = services.find((s) => s.slug === "fade-sfumatura") ?? services[0];
                if (!fade) return;

                // scan next 7 days
                for (let i = 0; i < 14; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    if (d.getDay() === 0 || d.getDay() === 1) continue; // chiuso dom/lun
                    const dateStr = d.toISOString().split("T")[0]!;
                    const slots = await fetchAvailableSlots({ date: dateStr, serviceId: fade.id });
                    if (slots.length > 0) {
                        const first = slots[0]!;
                        const staffMember: Staff | undefined = staff.find((m) => m.id === first.staff_id);
                        if (!alive) return;
                        setNext({
                            date: dateStr,
                            time: first.slot_time.slice(0, 5),
                            staffId: first.staff_id,
                            staffName: staffMember?.name ?? "Prima disponibilità",
                            dayLabel: d.toLocaleDateString("it-IT", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                            }),
                        });
                        setLoading(false);
                        return;
                    }
                }
                setLoading(false);
            } catch {
                setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const handleQuickBook = async () => {
        if (!next) return;
        const services = await fetchServices().catch(() => []);
        const fade = services.find((s) => s.slug === "fade-sfumatura") ?? services[0];
        if (fade) setService(fade.id);
        setStaff(next.staffId);
        setDate(next.date);
        setTime(next.time);
        openDrawer();
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-3 px-5 py-3 bg-black/30 backdrop-blur-md border border-line rounded-full"
            >
                <span className="w-2 h-2 rounded-full bg-silver-dark animate-pulse" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    Cerco prossimo slot…
                </span>
            </motion.div>
        );
    }

    if (!next) return null;

    return (
        <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={handleQuickBook}
            className="group inline-flex items-center gap-3 md:gap-4 pl-2 pr-5 py-2 bg-black/40 backdrop-blur-md border border-accent-warm/30 rounded-full hover:border-accent-warm transition-colors"
            aria-label={`Prenota lo slot del ${next.dayLabel} alle ${next.time} con ${next.staffName}`}
        >
            <span
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-accent-warm text-black flex-shrink-0"
                aria-hidden="true"
            >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L11 17l-4-4-6 6" />
                </svg>
            </span>
            <span className="flex flex-col items-start">
                <span className="text-[9px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                    Prossimo slot libero
                </span>
                <span className="text-warm-white text-sm md:text-base font-body font-semibold leading-tight">
                    {next.dayLabel} · {next.time}
                </span>
            </span>
            <span
                className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-warm/20 text-accent-warm transition-transform group-hover:translate-x-1"
                aria-hidden="true"
            >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </span>
        </motion.button>
    );
}
