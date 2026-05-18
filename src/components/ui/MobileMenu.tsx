"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useT } from "@/i18n/useLang";
import { useMobileMenu, useBookingDrawer } from "@/lib/store";
import { SITE } from "@/lib/constants";

const LINKS = [
    { href: "/servizi", key: "services" as const },
    { href: "/lavori", key: "gallery" as const },
    { href: "/team", key: "team" as const },
    { href: "/prodotti", key: "products" as const },
    { href: "/contatti", key: "about" as const },
];

const phoneHref = "tel:" + SITE.phone.replace(/\s+/g, "");
const mapsHref =
    "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(SITE.address);

export function MobileMenu() {
    const { t } = useT();
    const isOpen = useMobileMenu((s) => s.isOpen);
    const close = useMobileMenu((s) => s.close);
    const openBookingDrawer = useBookingDrawer((s) => s.open);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, close]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] md:hidden bg-black/95 backdrop-blur-xl"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu di navigazione"
                >
                    {/* Close + logo bar */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-6 pb-4">
                        <span className="text-display text-lg text-warm-white tracking-[0.2em]">
                            HAIR RICH
                        </span>
                        <button
                            onClick={close}
                            aria-label="Chiudi menu"
                            className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-warm-white hover:bg-warm-white hover:text-black transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-center px-8 py-24">
                        <ul className="space-y-1">
                            {LINKS.map((link, i) => (
                                <motion.li
                                    key={link.href}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                                >
                                    <a
                                        href={link.href}
                                        onClick={close}
                                        className="block py-4 text-display text-3xl md:text-4xl text-warm-white tracking-tight hover:text-accent-warm transition-colors border-b border-line/40"
                                    >
                                        {t.nav[link.key]}
                                    </a>
                                </motion.li>
                            ))}
                        </ul>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.45 }}
                            className="mt-10 space-y-3"
                        >
                            <button
                                onClick={() => {
                                    close();
                                    openBookingDrawer();
                                }}
                                className="w-full inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-sm uppercase tracking-[0.25em] font-body font-semibold active:scale-95 transition-transform"
                            >
                                {t.nav.bookCta}
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href={phoneHref}
                                    onClick={close}
                                    className="flex items-center justify-center gap-2 py-3 rounded-full border border-line text-warm-white text-xs uppercase tracking-[0.2em] font-body font-semibold active:scale-95 transition-transform"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.91.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                                    </svg>
                                    Chiama
                                </a>
                                <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={close}
                                    className="flex items-center justify-center gap-2 py-3 rounded-full border border-line text-warm-white text-xs uppercase tracking-[0.2em] font-body font-semibold active:scale-95 transition-transform"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    Mappa
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.6 }}
                            className="mt-10 pt-6 border-t border-line/40"
                        >
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                {SITE.address}
                            </span>
                        </motion.div>
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function MobileMenuTrigger({ className = "" }: { className?: string }) {
    const toggle = useMobileMenu((s) => s.toggle);
    return (
        <button
            onClick={toggle}
            aria-label="Apri menu"
            className={`md:hidden pointer-events-auto inline-flex items-center justify-center w-11 h-11 rounded-full border border-line text-warm-white bg-black/30 backdrop-blur-md hover:border-accent-warm transition-colors ${className}`}
        >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
}
