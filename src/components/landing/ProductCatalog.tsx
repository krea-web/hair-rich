"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, productImageSrcset, productImageUrl } from "@/lib/supabase/queries";
import type { Product, ProductCategory } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useFavoritesStore, useProductDrawer } from "@/lib/store";
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
    const openProduct = useProductDrawer((s) => s.open);
    const favIds = useFavoritesStore((s) => s.ids);
    const toggleFav = useFavoritesStore((s) => s.toggle);

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

    const handleOpen = (p: Product) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
        openProduct({
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            category: p.category,
            description: p.description,
            price_cents: p.price_cents,
            stock: p.stock,
            image_path: p.image_path,
            badge: p.badge,
        });
    };

    return (
        <section id="catalog" className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black scroll-mt-20">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                {/* Filter chips */}
                <div className="flex flex-nowrap overflow-x-auto gap-2 md:gap-3 lg:gap-4 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide pb-2 md:pb-0">
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
                <div className="mt-10 lg:mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 xl:gap-10">
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
                                const isFavorite = favIds.includes(p.id);
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
                                        {/* Favorite — top right of the image */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFav(p.id);
                                            }}
                                            aria-label={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                                            aria-pressed={isFavorite}
                                            className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                                isFavorite
                                                    ? "bg-accent-warm/20 text-accent-warm"
                                                    : "bg-black/60 backdrop-blur-md text-warm-white hover:bg-black/80"
                                            }`}
                                        >
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                                            </svg>
                                        </button>

                                        {/* Whole card opens the product drawer */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpen(p)}
                                            disabled={outOfStock}
                                            aria-label={`Apri ${p.name}`}
                                            className="flex-1 flex flex-col text-left disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-warm rounded-[var(--radius-md)]"
                                        >
                                            <div className="relative aspect-[4/5] bg-black-2 overflow-hidden">
                                                {p.image_path ? (
                                                    <SmartImage
                                                        src={productImageUrl(p.image_path, { width: 600, quality: 80, format: "webp" })}
                                                        srcSet={productImageSrcset(p.image_path, 80)}
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
                                                    <div className="cta-shine cta-pulse absolute top-3 left-3 px-2.5 py-1 bg-accent-warm text-black text-[9px] uppercase tracking-[0.25em] font-body font-bold rounded-full">
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
                                                    <span
                                                        aria-hidden="true"
                                                        className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full text-[10px] font-body font-semibold transition-all ${
                                                            outOfStock
                                                                ? "bg-line text-silver-dark"
                                                                : "bg-accent-warm text-black group-hover:scale-110"
                                                        }`}
                                                    >
                                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
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
