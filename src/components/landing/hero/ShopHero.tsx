"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchProducts, portfolioImageUrl } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/supabase/types";

/**
 * "Curated stack" hero for /prodotti. Three real featured products
 * cascade on the right as a vertical receipt-style stack. Title sits
 * left. A pickup badge anchors the proposition: prenoti online, ritiri
 * in salone. No e-commerce shipping noise.
 */
export function ShopHero() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        let alive = true;
        fetchProducts()
            .then((rows) => {
                if (alive) setProducts(rows.slice(0, 3));
            })
            .catch(() => {
                /* fallback: empty list, hero degrades gracefully */
            });
        return () => {
            alive = false;
        };
    }, []);

    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={portfolioImageUrl("provvisorio/IMG_2493.jpeg", {
                        width: 1920,
                        quality: 70,
                        format: "webp",
                    })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-28 md:pt-40 pb-12 md:pb-24 min-h-[80vh] md:min-h-[90vh]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        className="lg:col-span-7"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-warm/15 border border-accent-warm/40 mb-4">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                Click & Collect · Olbia
                            </span>
                        </div>
                        <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight leading-[0.95]">
                            Prodotti scelti
                            <br />
                            <em className="text-display-alt not-italic text-silver">
                                con le nostre mani.
                            </em>
                        </h1>
                        <p className="mt-5 md:mt-7 max-w-xl text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Le pomate, gli oli e gli strumenti che usiamo davvero in salone —
                            selezionati uno per uno. Prenoti online, paghi e ritiri quando passi.
                        </p>
                    </motion.div>

                    {/* Receipt-style stack of featured products */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
                        }}
                        className="lg:col-span-5 space-y-3"
                    >
                        <motion.span
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                            className="block text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold mb-2"
                        >
                            Selezione corrente · {products.length || 3}
                        </motion.span>
                        {(products.length > 0
                            ? products
                            : ([
                                  { id: "p1", name: "Pomata strong hold", brand: "Hair Rich Lab", price_cents: 1800 },
                                  { id: "p2", name: "Olio per barba", brand: "Proraso", price_cents: 1500 },
                                  { id: "p3", name: "Pettine in legno", brand: "Hair Rich Lab", price_cents: 1200 },
                              ] as any[])
                        ).map((p, i) => (
                            <motion.div
                                key={p.id}
                                variants={{
                                    hidden: { opacity: 0, x: 20 },
                                    visible: { opacity: 1, x: 0 },
                                }}
                                className="flex items-center gap-3 p-3 md:p-4 bg-carbon/60 backdrop-blur-sm border border-line rounded-[var(--radius-md)] hover:border-accent-warm/40 transition-colors"
                            >
                                <span className="text-display-alt text-accent-warm text-xl tabular-nums shrink-0 w-8">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-warm-white font-body text-sm md:text-base font-semibold truncate">
                                        {p.name}
                                    </p>
                                    {p.brand && (
                                        <p className="text-silver-dark text-[10px] uppercase tracking-[0.2em] mt-0.5 truncate">
                                            {p.brand}
                                        </p>
                                    )}
                                </div>
                                <span className="text-display text-accent-warm text-base md:text-lg tabular-nums shrink-0">
                                    {formatPrice(p.price_cents)}
                                </span>
                            </motion.div>
                        ))}
                        <motion.a
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                            href="#catalog"
                            className="block text-center text-[10px] uppercase tracking-[0.4em] text-silver hover:text-warm-white font-body font-semibold pt-2 transition-colors"
                        >
                            Vedi catalogo completo →
                        </motion.a>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-10 md:mt-16 flex items-end justify-between gap-4"
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
