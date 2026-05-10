"use client";

import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export function CartDrawer() {
    const { items, isOpen, close, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore();

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleCheckout = () => {
        alert("Checkout flow to be implemented in phase 2");
        // close();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="
              fixed top-0 right-0 z-[80]
              w-full max-w-md h-[100dvh]
              bg-carbon border-l border-line
              flex flex-col
              shadow-2xl shadow-black
            "
                        role="dialog"
                        aria-modal="true"
                        aria-label="Carrello"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-line">
                            <h2 className="text-display text-xl text-warm-white">
                                Il tuo carrello <span className="text-silver-dark text-sm ml-2">({totalItems()})</span>
                            </h2>
                            <button
                                onClick={close}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-black-2 hover:bg-carbon-2 text-silver-mid transition-colors"
                                aria-label="Chiudi"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 overscroll-contain">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-black-2 flex items-center justify-center text-silver-dark">
                                        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                            <path d="M3 6h18" />
                                            <path d="M16 10a4 4 0 0 1-8 0" />
                                        </svg>
                                    </div>
                                    <p className="text-warm-white-muted text-sm max-w-[200px]">
                                        Il tuo carrello è vuoto. Scopri i nostri prodotti in salone.
                                    </p>
                                    <button
                                        onClick={close}
                                        className="mt-4 text-xs font-semibold tracking-wider uppercase text-accent-warm hover:text-warm-white transition-colors"
                                    >
                                        Torna allo shop
                                    </button>
                                </div>
                            ) : (
                                <ul className="space-y-6">
                                    <AnimatePresence>
                                        {items.map((item) => (
                                            <motion.li
                                                key={item.productId}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                                className="flex gap-4"
                                            >
                                                {/* Image placeholder */}
                                                <div className="w-20 h-24 shrink-0 rounded-[var(--radius-sm)] bg-black-2 flex items-center justify-center border border-line overflow-hidden">
                                                    {item.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-silver-dark text-xs font-body uppercase">No img</span>
                                                    )}
                                                </div>

                                                <div className="flex-1 flex flex-col justify-between py-1">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <h3 className="font-body text-sm font-semibold text-warm-white line-clamp-2">
                                                                {item.name}
                                                            </h3>
                                                            <button
                                                                onClick={() => removeItem(item.productId)}
                                                                className="text-silver-dark hover:text-error transition-colors p-1 -m-1"
                                                                aria-label="Rimuovi prodotto"
                                                            >
                                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <p className="text-accent-warm text-sm mt-1">{formatPrice(item.price)}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center rounded-full border border-line bg-black-2 overflow-hidden max-w-[100px]">
                                                            <button
                                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-silver hover:bg-carbon transition-colors active:bg-carbon-2"
                                                                aria-label="Riduci quantità"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="flex-1 text-center text-sm font-semibold text-warm-white bg-transparent">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center text-silver hover:bg-carbon transition-colors active:bg-carbon-2"
                                                                aria-label="Aumenta quantità"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-line bg-black-2 safe-bottom">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-warm-white-muted text-sm">Totale (Click & Collect)</span>
                                    <span className="text-display text-2xl text-warm-white">{formatPrice(totalPrice())}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="
                    w-full py-4 px-6
                    bg-accent-warm text-black
                    font-body font-semibold text-sm tracking-wider uppercase
                    rounded-[var(--radius-md)]
                    transition-all duration-200
                    hover:brightness-110 hover:scale-[1.02]
                    active:scale-[0.98]
                  "
                                >
                                    Procedi all'ordine
                                </button>
                                <p className="text-center text-xs text-silver-dark mt-4">
                                    Ritiro in salone. Pagamento al ritiro.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
