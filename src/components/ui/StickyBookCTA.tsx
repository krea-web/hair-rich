"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingDrawer } from "@/lib/store";

export function StickyBookCTA() {
    const [visible, setVisible] = useState(false);
    const [hideOnPage, setHideOnPage] = useState(false);
    const openDrawer = useBookingDrawer((s) => s.open);

    useEffect(() => {
        const path = window.location.pathname;
        // Mobile: nascondi sempre — c'è MobileBottomBar fissa
        const isMobileBarHost = /^\/(it|en|fr|de)?\/?(prenota|admin|profilo|legal)?/.test(path);
        if (path.startsWith("/admin") || path.startsWith("/legal") || /\/prenota(\/|$)/.test(path)) {
            setHideOnPage(true);
            return;
        }
        // Silenzia il warning di var inutilizzata
        void isMobileBarHost;

        const onScroll = () => {
            const threshold = window.innerHeight * 0.5;
            const past = window.scrollY > threshold;
            const booking = document.getElementById("booking");
            const bookingTop = booking ? booking.getBoundingClientRect().top : Infinity;
            const overlapBooking = bookingTop < window.innerHeight * 0.6;
            setVisible(past && !overlapBooking);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    if (hideOnPage) return null;

    const handleClick = () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
        openDrawer();
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* DESKTOP only: la versione mobile è gestita da MobileBottomBar */}
                    <motion.button
                        onClick={handleClick}
                        initial={{ y: -24, opacity: 0, scale: 0.92 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -24, opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        className="
                            hidden md:inline-flex fixed z-[60]
                            top-5 right-6 lg:top-6 lg:right-10
                            items-center gap-3
                            pl-6 pr-3 py-3
                            bg-accent-warm text-black
                            font-display text-sm font-semibold tracking-[0.25em] uppercase
                            rounded-full
                            shadow-[0_15px_40px_-10px_rgba(212,165,116,0.6)]
                            transition-transform duration-[var(--dur-fast)] ease-[var(--ease-spring)]
                            hover:scale-[1.04] hover:shadow-[0_20px_50px_-10px_rgba(212,165,116,0.8)]
                            active:scale-95
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white
                        "
                        aria-label="Prenota appuntamento"
                    >
                        <span>Prenota</span>
                        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-accent-warm">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </motion.button>
                </>
            )}
        </AnimatePresence>
    );
}
