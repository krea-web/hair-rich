"use client";

import { useBookingDrawer } from "@/lib/store";

interface Props {
    label: string;
    /** If true, falls back to /prenota navigation on Cmd/Ctrl-click. */
    pageHref?: string;
    className?: string;
    variant?: "primary" | "outline";
}

/**
 * The big orange "Prenota Ora" button. Default behavior: open the global
 * booking drawer (bottom sheet on mobile, centered on desktop). Cmd/Ctrl-
 * click or middle-click navigates to /prenota for a full page (useful for
 * bookmarking and sharing).
 */
export function BookingCtaButton({ label, pageHref = "/prenota", className = "", variant = "primary" }: Props) {
    const open = useBookingDrawer((s) => s.open);

    const base =
        "group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white";
    const styles =
        variant === "primary"
            ? "bg-accent-warm text-black"
            : "border border-line text-warm-white hover:border-warm-white hover:bg-warm-white/5";

    return (
        <a
            href={pageHref}
            className={`${base} ${styles} ${className}`}
            onClick={(e) => {
                // Permetti Cmd/Ctrl click + middle click di seguire l'href
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
                e.preventDefault();
                open();
            }}
        >
            <span>{label}</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
        </a>
    );
}
