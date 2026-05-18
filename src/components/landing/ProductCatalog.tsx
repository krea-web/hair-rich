"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, portfolioImageSrcset, portfolioImageUrl } from "@/lib/supabase/queries";
import type { Product, ProductCategory } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useCartStore, useToastStore } from "@/lib/store";
import { SmartImage } from "./_shared/SmartImage";

const CATEGORIES: { key: ProductCategory | "all"; label: string }[] = [
    { key: "all", label: "Tutti" },
    { key: "hair", label: "Capelli" },
    { key: "beard", label: "Barba" },
    { key: "shave", label: "Rasatura" },
    { key: "tools", label: "Strumenti" },
];

export function ProductCatalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<ProductCategory | "all">("all");
    const addItem = useCartStore((s) => s.addItem);
    const openCart = useCartStore((s) => s.open);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        let alive = true;
        fetchProducts()
            .then((rows) => {
                if (!alive) return;
                setProducts(rows);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    const filtered = useMemo(() => {
        if (category === "all") return products;
        return products.filter((p) => p.category === category);
    }, [products, category]);

    const handleAdd = (p: Product) => {
        if (p.stock <= 0) {
            addToast("Prodotto esaurito", "error");
            return;
        }
        addItem({
            productId: p.id,
            name: p.name,
            price: p.price_cents,
            imageUrl: p.image_path
                ? portfolioImageUrl(p.image_path, { width: 400, quality: 78, format: "webp" })
                : undefined,
        });
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
        addToast(`${p.name} aggiunto al carrello`, "success");
        openCart();
    };

    return (
        <section className="relative py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-black">
            <div className="max-w-7xl mx-auto">
                {/* Filter chips */}
                <div className="flex flex-nowrap overflow-x-auto gap-2 md:gap-3 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide pb-2 md:pb-0">
                    {CATEGORIES.map((c) => {
                        const active = category === c.key;
                        const count =
                            c.key === "all"
                                ? products.length
                                : products.filter((p) => p.category === c.key).length;
                        return (
                            <button
                                key={c.key}
                                onClick={() => setCategory(c.key)}
                                className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] uppercase tracking-[0.25em] font-body font-semibold transition-colors ${
                                    active
                                        ? "bg-warm-white text-black border-warm-white"
                                        : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                                }`}
                                aria-pressed={active}
                            >
                                {c.label}
                                <span
                                    className={`text-[9px] tabular-nums ${
                                        active ? "text-black/60" : "text-silver-dark"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Grid */}
                <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {loading &&
                        Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-[3/4] bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                            />
                        ))}

                    {!loading && (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((p) => {
                                const outOfStock = p.stock <= 0;
                                const lowStock = !outOfStock && p.stock < 5;
                                return (
                                    <motion.article
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ duration: 0.4 }}
                                        className="group relative bg-carbon border border-line hover:border-silver-dark transition-colors rounded-[var(--radius-md)] overflow-hidden flex flex-col"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[4/5] bg-black-2 overflow-hidden">
                                            {p.image_path ? (
                                                <SmartImage
                                                    src={portfolioImageUrl(p.image_path, { width: 600, quality: 80, format: "webp" })}
                                                    srcSet={portfolioImageSrcset(p.image_path, 80)}
                                                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                                    alt={p.name}
                                                    className="h-full transition-transform duration-700 group-hover:scale-[1.04]"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-carbon to-black-2">
                                                    <span className="text-display-alt text-5xl text-accent-warm/30">
                                                        {p.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            {p.badge && (
                                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-accent-warm text-black text-[9px] uppercase tracking-[0.25em] font-body font-bold rounded-full">
                                                    {p.badge}
                                                </div>
                                            )}
                                            {outOfStock && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="px-3 py-1.5 bg-black text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold rounded-full border border-line">
                                                        Esaurito
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 p-4 md:p-5 flex flex-col">
                                            {p.brand && (
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    {p.brand}
                                                </span>
                                            )}
                                            <h3 className="mt-1 text-warm-white font-body font-semibold text-sm md:text-base leading-tight">
                                                {p.name}
                                            </h3>
                                            {p.description && (
                                                <p className="mt-2 text-warm-white-muted text-xs leading-relaxed line-clamp-2 hidden md:block">
                                                    {p.description}
                                                </p>
                                            )}

                                            <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-display text-xl md:text-2xl text-accent-warm tabular-nums leading-none">
                                                        {formatPrice(p.price_cents)}
                                                    </span>
                                                    {lowStock && (
                                                        <span className="block mt-1 text-[9px] uppercase tracking-[0.25em] text-warning font-body font-semibold">
                                                            Solo {p.stock} pezzi
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleAdd(p)}
                                                    disabled={outOfStock}
                                                    aria-label={`Aggiungi ${p.name}`}
                                                    className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-body font-semibold transition-all ${
                                                        outOfStock
                                                            ? "bg-line text-silver-dark cursor-not-allowed"
                                                            : "bg-accent-warm text-black active:scale-95 hover:scale-[1.04]"
                                                    }`}
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {!loading && filtered.length === 0 && (
                    <p className="mt-10 text-warm-white-muted text-sm text-center">
                        Nessun prodotto in questa categoria.
                    </p>
                )}
            </div>
        </section>
    );
}
