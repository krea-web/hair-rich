"use client";

import { motion, AnimatePresence } from "framer-motion";
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

const DISMISS_KEY = "hr-slot-peek-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

/**
 * Sticky bottom-pill widget that surfaces the next available booking slot on
 * any non-/prenota page (the home already shows the same widget inline).
 *
 * Lives above the MobileBottomBar on mobile, bottom-right on desktop.
 * Dismissable with an X — the dismissal is remembered for 8 hours so users
 * who explicitly close it don't get pestered, but it returns naturally for
 * a fresh visit later in the day.
 */
export function StickySlotPeek() {
    const [next, setNext] = useState<NextSlot | null>(null);
    const [visible, setVisible] = useState(false);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);
    const setStaff = useBookingStore((s) => s.setStaff);
    const setDate = useBookingStore((s) => s.setDate);
    const setTime = useBookingStore((s) => s.setTime);

    useEffect(() => {
        if (typeof window === "undefined") return;
        // Don't show on /prenota (the wizard is already on-page) or admin/profilo
        const path = window.location.pathname;
        if (
            path.startsWith("/admin") ||
            path.startsWith("/profilo") ||
            /\/prenota(\/|$)/.test(path)
        ) {
            return;
        }
        // Respect recent dismissal
        try {
            const raw = localStorage.getItem(DISMISS_KEY);
            if (raw) {
                const ts = parseInt(raw, 10);
                if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) return;
            }
        } catch {
            /* ignore */
        }

        let alive = true;
        (async () => {
            try {
                const [services, staff] = await Promise.all([fetchServices(), fetchStaff()]);
                const fade: Service | undefined =
                    services.find((s) => s.slug === "fade-sfumatura") ?? services[0];
                if (!fade) return;

                for (let i = 0; i < 14; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    if (d.getDay() === 0 || d.getDay() === 1) continue;
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
                            staffName: staffMember?.name ?? "",
                            dayLabel: d.toLocaleDateString("it-IT", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                            }),
                        });
                        // Reveal with a delay so the page settles first
                        setTimeout(() => alive && setVisible(true), 1500);
                        return;
                    }
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const handleDismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch {
            /* ignore */
        }
        setVisible(false);
    };

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

    return (
        <AnimatePresence>
            {visible && next && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed left-0 right-0 z-40 pointer-events-none px-3 md:px-6
                               bottom-[calc(env(safe-area-inset-bottom,0px)+88px)] md:bottom-6
                               flex justify-center md:justify-end"
                    data-intro-hidden
                >
                    <div className="pointer-events-auto inline-flex items-center gap-2 md:gap-3 pl-1.5 pr-2 py-1.5 bg-black/85 backdrop-blur-xl border border-accent-warm/40 rounded-full shadow-[0_8px_28px_-8px_rgba(0,0,0,0.6)]">
                        <button
                            onClick={handleQuickBook}
                            className="inline-flex items-center gap-2 md:gap-3 pl-2 pr-3 py-2 rounded-full active:scale-95 hover:bg-warm-white/5 transition-colors"
                            aria-label={`Prenota slot ${next.dayLabel} ${next.time}`}
                        >
                            <span
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-accent-warm text-black flex-shrink-0"
                                aria-hidden="true"
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L11 17l-4-4-6 6" />
                                </svg>
                            </span>
                            <span className="flex flex-col items-start">
                                <span className="text-[8px] uppercase tracking-[0.25em] text-accent-warm font-body font-semibold leading-none">
                                    Prossimo slot
                                </span>
                                <span className="text-warm-white text-xs md:text-sm font-body font-semibold leading-tight whitespace-nowrap mt-0.5">
                                    {next.dayLabel} · {next.time}
                                </span>
                            </span>
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 w-7 h-7 rounded-full text-silver hover:text-warm-white flex items-center justify-center transition-colors"
                            aria-label="Nascondi"
                        >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
