"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/constants";
import { useBookingDrawer } from "@/lib/store";

const MAPS_URL =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(SITE.address);
const PHONE_URL = "tel:" + SITE.phone.replace(/\s+/g, "");

/**
 * Bottom bar persistente mobile — sempre visibile, 3 azioni primarie:
 * Prenota, Chiama, Indicazioni. Si nasconde:
 *  · su breakpoint md+ (la nav header copre il ruolo)
 *  · durante l'IntroSequence (data-intro-active sul body)
 *  · sulle pagine admin/profilo (auto-gestite dal componente padre)
 *  · quando l'utente è già su /prenota (l'azione è on-page)
 */
export function MobileBottomBar() {
    const [hidden, setHidden] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const path = window.location.pathname;
        if (path.startsWith("/admin") || path.startsWith("/profilo")) {
            setHidden(true);
            return;
        }
        setHidden(false);
    }, []);

    if (hidden) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none"
            aria-label="Azioni rapide"
            data-intro-hidden
        >
            <div className="pointer-events-auto mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
                <div className="grid grid-cols-3 gap-2 rounded-full bg-black/85 backdrop-blur-xl border border-line shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.8)] p-1.5">
                    <button
                        onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
                            openDrawer();
                        }}
                        className="flex items-center justify-center gap-2 py-3 rounded-full bg-accent-warm text-black text-[11px] uppercase tracking-[0.18em] font-body font-semibold active:scale-95 transition-transform"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                        </svg>
                        Prenota
                    </button>
                    <a
                        href={PHONE_URL}
                        className="flex items-center justify-center gap-2 py-3 rounded-full text-warm-white text-[11px] uppercase tracking-[0.18em] font-body font-semibold border border-line active:scale-95 transition-transform"
                        aria-label={`Chiama ${SITE.phone}`}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.91.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        Chiama
                    </a>
                    <a
                        href={MAPS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 rounded-full text-warm-white text-[11px] uppercase tracking-[0.18em] font-body font-semibold border border-line active:scale-95 transition-transform"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        Mappa
                    </a>
                </div>
            </div>
        </div>
    );
}
