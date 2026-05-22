"use client";

import { useBookingDrawer } from "@/lib/store";

interface Props {
    label: string;
    className?: string;
    variant?: "primary" | "outline";
}

/**
 * The big orange "Prenota Ora" button. Always opens the global booking
 * drawer (bottom sheet on mobile, centered modal on desktop). There is
 * no /prenota page anymore — booking is drawer-only by design.
 */
export function BookingCtaButton({ label, className = "", variant = "primary" }: Props) {
    const open = useBookingDrawer((s) => s.open);

    const base =
        "group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white";
    const styles =
        variant === "primary"
            ? "bg-accent-warm text-black cta-shine cta-pulse"
            : "border border-line text-warm-white hover:border-warm-white hover:bg-warm-white/5";

    return (
        <button
            type="button"
            className={`${base} ${styles} ${className}`}
            onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
                open();
            }}
        >
            <span>{label}</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
        </button>
    );
}
