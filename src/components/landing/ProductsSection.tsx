"use client";

import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { useCartStore, useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

const PRODUCTS = [
    {
        id: "1",
        name: "Pomade Opaca",
        sub: "Tenuta Forte",
        description: "Crema opaca per un look naturale e texturizzato.",
        price: 2500,
        category: "Styling",
        img: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?q=80&w=900&auto=format&fit=crop",
    },
    {
        id: "2",
        name: "Olio Barba",
        sub: "Legno di Cedro",
        description: "Nutre barba e pelle. Fragranza legnosa e virile.",
        price: 2800,
        category: "Barba",
        img: "https://images.unsplash.com/photo-1583241475880-083f84372725?q=80&w=900&auto=format&fit=crop",
    },
    {
        id: "3",
        name: "Shampoo",
        sub: "Carbone Detox",
        description: "Pulisce in profondità, rimuove residui di styling.",
        price: 1800,
        category: "Lavaggio",
        img: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=900&auto=format&fit=crop",
    },
    {
        id: "4",
        name: "Balsamo Dopobarba",
        sub: "Lenitivo",
        description: "Calma le irritazioni post rasatura. Senza alcool.",
        price: 3200,
        category: "Rasatura",
        img: "https://images.unsplash.com/photo-1609097162405-43c0d6b1e1f3?q=80&w=900&auto=format&fit=crop",
    },
    {
        id: "5",
        name: "Cera Lucida",
        sub: "Classica",
        description: "Look tradizionali effetto bagnato, facile da rimuovere.",
        price: 2400,
        category: "Styling",
        img: "https://images.unsplash.com/photo-1581618520099-3a7e6b6b65c5?q=80&w=900&auto=format&fit=crop",
    },
];

export function ProductsSection() {
    const { addItem } = useCartStore();
    const addToast = useToastStore((s) => s.addToast);
    const { t } = useT();
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
    });

    const [prevEnabled, setPrevEnabled] = useState(false);
    const [nextEnabled, setNextEnabled] = useState(false);
    const [progress, setProgress] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setPrevEnabled(emblaApi.canScrollPrev());
        setNextEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    const onScroll = useCallback(() => {
        if (!emblaApi) return;
        setProgress(Math.max(0, Math.min(1, emblaApi.scrollProgress())));
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        onScroll();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
        emblaApi.on("scroll", onScroll);
    }, [emblaApi, onSelect, onScroll]);

    return (
        <section
            id="prodotti"
            aria-label="Prodotti"
            className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 overflow-hidden bg-black-2"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-16">
                    <EditorialHeading
                        eyebrow={t.products.eyebrow}
                        title={
                            <>
                                {t.products.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.products.titleB}</em>
                            </>
                        }
                    />
                    <div className="flex items-end gap-6">
                        <p className="md:max-w-sm text-warm-white-muted text-base leading-relaxed">
                            {t.products.intro}
                        </p>
                        <div className="hidden md:flex gap-2">
                            <button
                                onClick={scrollPrev}
                                disabled={!prevEnabled}
                                className="w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center transition-colors enabled:hover:bg-warm-white enabled:hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label={t.products.prev}
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button
                                onClick={scrollNext}
                                disabled={!nextEnabled}
                                className="w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center transition-colors enabled:hover:bg-warm-white enabled:hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label={t.products.next}
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Carousel — overflow-hidden necessario per Embla measurement */}
                <div className="overflow-hidden -mx-6 md:mx-0" ref={emblaRef}>
                    <div className="flex gap-4 md:gap-6 px-6 md:px-0">
                        {PRODUCTS.map((p, i) => (
                            <motion.article
                                key={p.id}
                                className="flex-[0_0_80%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.06 }}
                            >
                                <div className="group relative bg-black border border-line rounded-[var(--radius-lg)] overflow-hidden">
                                    <div className="relative aspect-square overflow-hidden">
                                        <div className="absolute inset-0 transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-105">
                                            <SmartImage src={p.img} alt={`${p.name} ${p.sub}`} className="h-full grayscale-[10%]" />
                                        </div>
                                        <div className="absolute top-4 left-4">
                                            <span className="text-[9px] uppercase tracking-[0.3em] bg-black/70 backdrop-blur-md text-warm-white px-2.5 py-1 rounded-full border border-line">
                                                {p.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6 flex flex-col gap-4">
                                        <div>
                                            <span className="text-display-alt text-lg text-accent-warm">{p.sub}</span>
                                            <h3 className="text-display text-xl text-warm-white tracking-tight">{p.name}</h3>
                                            <p className="mt-2 text-sm text-warm-white-muted leading-relaxed line-clamp-2">
                                                {p.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-line">
                                            <span className="text-display text-xl text-warm-white tabular-nums">
                                                {formatPrice(p.price)}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    addItem({ productId: p.id, name: `${p.name} · ${p.sub}`, price: p.price });
                                                    addToast(`${p.name} · ${t.products.added}`, "success");
                                                }}
                                                className="inline-flex items-center gap-2 bg-warm-white text-black text-[10px] uppercase tracking-[0.3em] font-semibold px-4 py-2.5 rounded-full hover:bg-accent-warm transition-colors active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                                                aria-label={t.products.addToCart(p.name)}
                                            >
                                                +
                                                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-10 max-w-md mx-auto md:mx-0 h-px bg-line relative overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-accent-warm transition-[width] duration-300"
                        style={{ width: `${Math.max(20, progress * 100 + 20)}%` }}
                    />
                </div>
            </div>
        </section>
    );
}
