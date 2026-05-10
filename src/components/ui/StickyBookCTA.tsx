"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function StickyBookCTA() {
    const [visible, setVisible] = useState(false);
    const [hideOnPage, setHideOnPage] = useState(false);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith("/admin") || path.startsWith("/legal")) {
            setHideOnPage(true);
            return;
        }

        const onScroll = () => {
            // Mostra dopo aver scrollato oltre 50% del viewport
            const threshold = window.innerHeight * 0.5;
            const past = window.scrollY > threshold;
            // Nasconde quando siamo già sopra la sezione booking (per non sovrapporsi)
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
        const target = document.getElementById("booking");
        if (target) target.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* ── MOBILE: barra sticky in basso a tutta larghezza ─────── */}
                    <motion.button
                        onClick={handleClick}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                        className="
                            md:hidden fixed z-[60] bottom-0 inset-x-0
                            flex items-center justify-center gap-3
                            py-4 px-6
                            bg-accent-warm text-black
                            font-display text-sm font-semibold tracking-[0.25em] uppercase
                            shadow-[0_-15px_40px_-10px_rgba(212,165,116,0.5)]
                            active:scale-[0.99]
                            safe-bottom
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-warm-white
                        "
                        aria-label="Prenota appuntamento"
                    >
                        <span>Prenota Ora</span>
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-accent-warm">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </motion.button>

                    {/* ── DESKTOP: pill sticky in alto a destra ───────────────── */}
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
