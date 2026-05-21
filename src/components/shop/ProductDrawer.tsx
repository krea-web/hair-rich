"use client";

import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { productImageUrl, productImageSrcset } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/format";
import {
    useCartStore,
    useFavoritesStore,
    useProductDrawer,
    useToastStore,
} from "@/lib/store";

const CATEGORY_LABELS: Record<string, string> = {
    hair: "Capelli",
    beard: "Barba",
    shave: "Rasatura",
    tools: "Strumenti",
    other: "Altro",
};

/**
 * Bottom-sheet drawer with full product details. Mirrors the booking drawer's
 * UX — opened from any product card via `useProductDrawer.open(p)`. Lets the
 * user pick quantity, favorite the item, and add to cart in one flow.
 */
export function ProductDrawer() {
    const isOpen = useProductDrawer((s) => s.isOpen);
    const setOpen = useProductDrawer((s) => s.setOpen);
    const product = useProductDrawer((s) => s.product);

    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.open);
    const favIds = useFavoritesStore((s) => s.ids);
    const toggleFav = useFavoritesStore((s) => s.toggle);
    const addToast = useToastStore((s) => s.addToast);

    const [qty, setQty] = useState(1);

    // Reset quantity each time the drawer opens with a new product.
    useEffect(() => {
        if (isOpen && product) setQty(1);
    }, [isOpen, product?.id]);

    if (!product) {
        return (
            <Drawer.Root open={false} onOpenChange={setOpen}>
                <Drawer.Portal />
            </Drawer.Root>
        );
    }

    const outOfStock = product.stock <= 0;
    const lowStock = !outOfStock && product.stock < 5;
    const isFavorite = favIds.includes(product.id);
    const maxQty = Math.max(1, product.stock);

    const handleAdd = () => {
        if (outOfStock) {
            addToast("Prodotto esaurito", "error");
            return;
        }
        addItem(
            {
                productId: product.id,
                name: product.name,
                price: product.price_cents,
                imageUrl: product.image_path
                    ? productImageUrl(product.image_path, {
                          width: 400,
                          quality: 78,
                          format: "webp",
                      })
                    : undefined,
            },
            qty,
        );
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
        addToast(`${product.name} aggiunto al carrello`, "success");
        setOpen(false);
        openCart();
    };

    return (
        <Drawer.Root open={isOpen} onOpenChange={setOpen} shouldScaleBackground>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-[91] mt-24 flex flex-col rounded-t-[28px] bg-black-2 border-t border-line outline-none"
                    style={{
                        height: "88dvh",
                        maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 12px)",
                        paddingTop: "env(safe-area-inset-top, 0px)",
                    }}
                >
                    {/* Handle */}
                    <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 md:px-8 pt-4 pb-2">
                        <Drawer.Title className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {CATEGORY_LABELS[product.category] ?? product.category}
                        </Drawer.Title>
                        <Drawer.Close asChild>
                            <button
                                aria-label="Chiudi"
                                className="w-10 h-10 rounded-full border border-line text-silver hover:text-warm-white hover:border-warm-white transition-colors flex items-center justify-center"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </Drawer.Close>
                    </div>

                    {/* Scrollable body */}
                    <div
                        className="flex-1 overflow-y-auto px-6 md:px-8 pt-2"
                        style={{
                            paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)",
                        }}
                    >
                        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
                            {/* Image */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className="relative aspect-square bg-black border border-line rounded-[var(--radius-md)] overflow-hidden"
                            >
                                {product.image_path ? (
                                    <img
                                        src={productImageUrl(product.image_path, {
                                            width: 1000,
                                            quality: 85,
                                            format: "webp",
                                        })}
                                        srcSet={productImageSrcset(product.image_path, 85)}
                                        sizes="(min-width: 768px) 40vw, 90vw"
                                        alt={product.name}
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-display-alt text-7xl text-accent-warm/30">
                                            {product.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                {product.badge && (
                                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-accent-warm text-black text-[9px] uppercase tracking-[0.25em] font-body font-bold rounded-full">
                                        {product.badge}
                                    </div>
                                )}
                            </motion.div>

                            {/* Details */}
                            <div className="flex flex-col">
                                {product.brand && (
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                        {product.brand}
                                    </span>
                                )}
                                <h2 className="mt-2 text-display text-2xl md:text-3xl text-warm-white tracking-tight leading-tight">
                                    {product.name}
                                </h2>
                                <span className="mt-3 text-display text-3xl md:text-4xl text-accent-warm tabular-nums">
                                    {formatPrice(product.price_cents)}
                                </span>

                                {product.description && (
                                    <p className="mt-5 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                        {product.description}
                                    </p>
                                )}

                                {/* Stock indicator */}
                                <div className="mt-6">
                                    {outOfStock ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-error/40 bg-error/10 text-error text-[10px] uppercase tracking-[0.25em] font-body font-semibold">
                                            Esaurito
                                        </span>
                                    ) : lowStock ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-warning/40 bg-warning/10 text-warning text-[10px] uppercase tracking-[0.25em] font-body font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                                            Solo {product.stock} pezzi
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/40 bg-success/10 text-success text-[10px] uppercase tracking-[0.25em] font-body font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                            Disponibile
                                        </span>
                                    )}
                                </div>

                                {/* Quantity selector */}
                                {!outOfStock && (
                                    <div className="mt-6">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                            Quantità
                                        </span>
                                        <div className="mt-2 inline-flex items-center gap-1 bg-carbon border border-line rounded-full p-1">
                                            <button
                                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                                disabled={qty <= 1}
                                                aria-label="Riduci"
                                                className="w-10 h-10 rounded-full text-warm-white hover:bg-black-2 disabled:opacity-30 transition-colors flex items-center justify-center"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M5 12h14" />
                                                </svg>
                                            </button>
                                            <span className="min-w-[44px] text-center text-warm-white font-display text-xl tabular-nums">
                                                {qty}
                                            </span>
                                            <button
                                                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                                                disabled={qty >= maxQty}
                                                aria-label="Aumenta"
                                                className="w-10 h-10 rounded-full text-warm-white hover:bg-black-2 disabled:opacity-30 transition-colors flex items-center justify-center"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M12 5v14m-7-7h14" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Sticky-ish action bar */}
                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => toggleFav(product.id)}
                                        aria-label={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                                        aria-pressed={isFavorite}
                                        className={`shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full border transition-colors ${
                                            isFavorite
                                                ? "bg-accent-warm/15 border-accent-warm text-accent-warm"
                                                : "border-line text-silver hover:text-warm-white hover:border-warm-white"
                                        }`}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={outOfStock}
                                        className={`cta-shine cta-pulse group flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold transition-transform active:scale-95 hover:scale-[1.02] ${
                                            outOfStock
                                                ? "bg-line text-silver-dark cursor-not-allowed"
                                                : "bg-accent-warm text-black"
                                        }`}
                                    >
                                        {outOfStock
                                            ? "Esaurito"
                                            : qty > 1
                                              ? `Aggiungi ${qty} al carrello`
                                              : "Aggiungi al carrello"}
                                        {!outOfStock && (
                                            <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Reassurance */}
                                <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    Ritiro in salone · pagamento al ritiro
                                </p>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
