"use client";

import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";

export function CartFAB() {
    const { totalItems, totalPrice, open } = useCartStore();
    const itemsCount = totalItems();

    return (
        <AnimatePresence>
            {itemsCount > 0 && (
                <motion.button
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={open}
                    className="
            fixed z-[55]
            bottom-24 right-4
            md:bottom-6 md:right-6
            flex items-center gap-3
            bg-warm-white text-black
            px-5 py-3
            rounded-full
            shadow-xl shadow-black/50
            font-body font-semibold text-sm
            transition-colors hover:bg-white
            safe-bottom
          "
                    aria-label="Apri carrello"
                >
                    <div className="relative">
                        <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                            <path d="M3 6h18" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span className="cta-shine cta-pulse absolute -top-2 -right-2 bg-accent-warm text-black w-4 h-4 text-[10px] flex items-center justify-center rounded-full font-bold">
                            {itemsCount}
                        </span>
                    </div>
                    <span>{formatPrice(totalPrice())}</span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
