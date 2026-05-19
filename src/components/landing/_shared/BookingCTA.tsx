"use client";

import { useBookingDrawer } from "@/lib/store";

interface Props {
    /** Plausible event source label for tracking which surface fired the CTA. */
    source?: string;
    label?: string;
}

/**
 * Generic "Prenota un taglio" button that opens the BookingDrawer. Use this
 * anywhere on the marketing pages instead of duplicating the open-drawer
 * pattern inline.
 */
export function BookingCTA({ source, label = "Prenota un taglio" }: Props) {
    const openDrawer = useBookingDrawer((s) => s.open);
    return (
        <button
            onClick={() => {
                openDrawer();
                if (typeof window !== "undefined" && (window as any).plausible) {
                    (window as any).plausible("booking_cta_click", {
                        props: { source: source ?? "unknown" },
                    });
                }
            }}
            className="inline-flex items-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
        >
            {label}
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
        </button>
    );
}
