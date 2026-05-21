"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    fetchProducts,
    productImageUrl,
    productImageSrcset,
    assetImageUrl,
} from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/supabase/types";
import { useProductDrawer } from "@/lib/store";

/**
 * Editorial hero for /prodotti. Storefront photo darkened in the bg, two
 * featured product cards in a mini contact-sheet on the right, big title
 * + Click & Collect badge on the left. The product cards open the global
 * ProductDrawer on tap — same interaction as the catalog below.
 */
export function ShopHero() {
    const [products, setProducts] = useState<Product[]>([]);
    const openProduct = useProductDrawer((s) => s.open);

    useEffect(() => {
        let alive = true;
        fetchProducts()
            .then((rows) => {
                if (alive) setProducts(rows.slice(0, 2));
            })
            .catch(() => {
                /* fail silently, hero degrades to text-only */
            });
        return () => {
            alive = false;
        };
    }, []);

    const handleOpen = (p: Product) => {
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
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Background: blurred storefront photo */}
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={assetImageUrl("salone-esterno.webp", { width: 1920, quality: 65, format: "webp" })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-black/60" />
            </div>

            {/* Watermark numeral */}
            <div
                aria-hidden="true"
                className="absolute -bottom-8 left-3 md:left-6 text-display-alt text-[35vw] md:text-[18vw] text-warm-white/[0.04] leading-none pointer-events-none select-none"
            >
                06
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-24 md:pt-40 pb-16 md:pb-28 min-h-[80vh] md:min-h-[90vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    {/* Title block */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-7"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-warm/15 border border-accent-warm/40 mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                Click & Collect · Olbia
                            </span>
                        </div>

                        <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] text-warm-white tracking-tight leading-[0.92]">
                            Quello che usiamo
                            <br />
                            <em className="text-display-alt not-italic text-silver">
                                in salone.
                            </em>
                        </h1>

                        <p className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Pomate, cere, oli barba e shampoo selezionati uno per uno. Prenoti
                            online, paghi al ritiro. Niente spedizioni, niente sorprese.
                        </p>

                        {/* Three pillar value-props */}
                        <motion.dl
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
                            }}
                            className="mt-8 md:mt-12 grid grid-cols-3 gap-4 max-w-md"
                        >
                            {[
                                { value: "15+", label: "Prodotti curati" },
                                { value: "7gg", label: "Tempo ritiro" },
                                { value: "0€", label: "Spese spedizione" },
                            ].map((m) => (
                                <motion.div
                                    key={m.label}
                                    variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                                    className="border-l-2 border-accent-warm/60 pl-3"
                                >
                                    <dt className="text-display text-2xl md:text-3xl text-warm-white tabular-nums">
                                        {m.value}
                                    </dt>
                                    <dd className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                        {m.label}
                                    </dd>
                                </motion.div>
                            ))}
                        </motion.dl>

                        {/* Primary CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="mt-8 md:mt-12"
                        >
                            <a
                                href="#catalog"
                                className="cta-shine cta-pulse group inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent-warm text-black rounded-full text-sm uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform shadow-[0_18px_50px_-12px_rgba(212,165,116,0.55)]"
                            >
                                Esplora il catalogo
                                <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* Right column — two featured product cards. Stack on lg+,
                        side-by-side on smaller screens for visual interest. */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.18, delayChildren: 0.4 } },
                        }}
                        className="lg:col-span-5 grid grid-cols-2 gap-3 md:gap-4"
                    >
                        {(products.length > 0
                            ? products
                            : ([
                                  { id: "ph1", name: "—", brand: "Hair Rich", price_cents: 0, image_path: null, slug: "", category: "hair", description: null, stock: 1, badge: null } as any,
                                  { id: "ph2", name: "—", brand: "Hair Rich", price_cents: 0, image_path: null, slug: "", category: "hair", description: null, stock: 1, badge: null } as any,
                              ])
                        ).map((p, i) => (
                            <motion.button
                                key={p.id}
                                variants={{
                                    hidden: { opacity: 0, y: 24 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                                onClick={() => p.image_path && handleOpen(p)}
                                className={`group relative aspect-square rounded-[var(--radius-md)] border border-line bg-carbon overflow-hidden text-left ${
                                    i === 0 ? "lg:translate-y-6" : ""
                                } ${p.image_path ? "" : "pointer-events-none"}`}
                            >
                                {p.image_path ? (
                                    <img
                                        src={productImageUrl(p.image_path, { width: 700, quality: 82, format: "webp" })}
                                        srcSet={productImageSrcset(p.image_path, 82)}
                                        sizes="(min-width: 1024px) 22vw, 45vw"
                                        alt={p.name}
                                        className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.04]"
                                        loading="eager"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-display-alt text-5xl text-accent-warm/30">
                                            {p.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                                    {p.brand && (
                                        <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold block">
                                            {p.brand}
                                        </span>
                                    )}
                                    <span className="mt-0.5 text-warm-white text-xs md:text-sm font-body font-semibold leading-tight line-clamp-2 block">
                                        {p.name}
                                    </span>
                                    {p.price_cents > 0 && (
                                        <span className="mt-1 text-accent-warm text-sm md:text-base font-display tabular-nums block">
                                            {formatPrice(p.price_cents)}
                                        </span>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom meta */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-12 md:mt-16 flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Ritiro entro 7 giorni
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        06 / Prodotti
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
