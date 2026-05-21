"use client";

import { useCartStore } from "@/lib/store";

interface Props {
    /** Tighter padding on mobile topbar; larger on desktop nav. */
    size?: "sm" | "md";
}

/**
 * Cart pill that lives in the top navbar (mobile + desktop). When empty it
 * stays neutral — same glass-tinted treatment as the other topbar chips.
 * The moment something lands in the cart it flips to a solid warm-white
 * pill so the user has a visible, persistent hook to checkout from any
 * page on the site.
 */
export function CartIconButton({ size = "sm" }: Props) {
    const items = useCartStore((s) => s.items);
    const openCart = useCartStore((s) => s.open);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const hasItems = totalItems > 0;

    const dim = size === "md" ? "w-10 h-10" : "w-9 h-9";
    const iconDim = size === "md" ? "w-5 h-5" : "w-4 h-4";

    return (
        <button
            onClick={openCart}
            aria-label={hasItems ? `Carrello · ${totalItems} articoli` : "Carrello"}
            className={`relative inline-flex items-center justify-center ${dim} rounded-full active:scale-95 transition-transform ${
                hasItems ? "bg-warm-white text-black" : "text-warm-white"
            }`}
            style={
                hasItems
                    ? {
                          boxShadow:
                              "0 4px 14px -4px rgba(244, 239, 230, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                      }
                    : {
                          background: "rgba(255,255,255,0.06)",
                          boxShadow:
                              "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)",
                      }
            }
        >
            <svg
                viewBox="0 0 24 24"
                className={iconDim}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
            </svg>
            {hasItems && (
                <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent-warm text-black text-[10px] font-body font-semibold tabular-nums"
                    aria-hidden="true"
                >
                    {totalItems > 9 ? "9+" : totalItems}
                </span>
            )}
        </button>
    );
}
