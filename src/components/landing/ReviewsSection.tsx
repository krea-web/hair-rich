"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { SmartImage } from "./_shared/SmartImage";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";

interface Review {
    name: string;
    rating: number;
    text: string;
    date: string;
    location: string;
}

const REVIEWS: Review[] = [
    {
        name: "Alessandro M.",
        rating: 5,
        text:
            "Il miglior barbiere di Olbia, senza dubbio. Marco ha un talento incredibile per il fade — ascolta davvero e ti propone soluzioni cucite addosso. Ci torno ogni mese.",
        date: "Aprile 2025",
        location: "Olbia",
    },
    {
        name: "Francesco R.",
        rating: 5,
        text:
            "Ambiente curato, musica perfetta, taglio impeccabile. Hair Rich è un'esperienza, non un semplice appuntamento. Il momento della barba con asciugamani caldi è qualcosa di unico.",
        date: "Marzo 2025",
        location: "Cagliari",
    },
    {
        name: "Giovanni P.",
        rating: 5,
        text:
            "Finalmente un posto dove sanno ascoltare. Ho mostrato una foto e il risultato è stato anche meglio. Consigliatissimo a chi cerca qualità sartoriale.",
        date: "Febbraio 2025",
        location: "Sassari",
    },
    {
        name: "Luigi B.",
        rating: 5,
        text:
            "La cura dei dettagli è impressionante. Dal lavaggio al rifinitura, ogni gesto è studiato. Il taglio dura davvero un mese e si modella benissimo.",
        date: "Gennaio 2025",
        location: "Olbia",
    },
];

// Real salon photo from the asset bucket — wider angle of the floor with
// barbers at work. Lives in the asset/ bucket alongside the other shots.
const BG_IMG_KEY = "salone-vista-completa.webp";

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1" aria-label={`${rating} stelle su 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className={`w-4 h-4 ${i < rating ? "text-accent-warm" : "text-silver-dark/30"}`}
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

import { useT } from "@/i18n/useLang";

export function ReviewsSection() {
    const { t } = useT();
    const REVIEWS_T = t.reviews.items;
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => setIdx((v) => (v + 1) % REVIEWS_T.length), 7000);
        return () => clearInterval(id);
    }, [paused, REVIEWS_T.length]);

    const r = REVIEWS_T[idx]!;

    return (
        <section
            id="recensioni"
            aria-label={t.reviews.eyebrow}
            className="relative py-16 md:py-32 lg:py-40 xl:py-48 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Backdrop image */}
            <div className="absolute inset-0">
                <SmartImage
                    src={assetImageUrl(BG_IMG_KEY, { width: 1920, quality: 70, format: "webp" })}
                    srcSet={assetImageSrcset(BG_IMG_KEY, 70)}
                    sizes="100vw"
                    alt=""
                    aspect=""
                    className="h-full grayscale brightness-[0.35]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
            </div>

            <div className="relative max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto text-center">
                <motion.span
                    className="text-display-alt text-3xl md:text-4xl text-accent-warm"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    {t.reviews.eyebrow}
                </motion.span>
                <motion.h2
                    className="mt-2 text-display text-3xl md:text-5xl lg:text-6xl xl:text-7xl text-warm-white tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                >
                    {t.reviews.title}
                </motion.h2>

                <div className="mt-16 md:mt-20 relative min-h-[280px]">
                    <AnimatePresence mode="wait">
                        <motion.figure
                            key={r.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative"
                        >
                            {/* Big quote mark */}
                            <span
                                aria-hidden="true"
                                className="absolute -top-12 left-1/2 -translate-x-1/2 text-display-alt text-[120px] md:text-[180px] lg:text-[220px] xl:text-[260px] text-accent-warm/15 leading-none select-none pointer-events-none"
                            >
                                &ldquo;
                            </span>

                            <blockquote className="relative text-display-alt text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-warm-white leading-snug max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto">
                                {r.text}
                            </blockquote>

                            <figcaption className="mt-10 flex flex-col items-center gap-3">
                                <Stars rating={5} />
                                <p className="text-display text-base text-warm-white tracking-widest">
                                    {r.name}
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    {r.location} · {r.date}
                                </p>
                            </figcaption>
                        </motion.figure>
                    </AnimatePresence>
                </div>

                {/* ── Controls ──────────────────────────────────────────────── */}
                <div className="mt-12 flex items-center justify-center gap-6">
                    <button
                        onClick={() => setIdx((v) => (v - 1 + REVIEWS_T.length) % REVIEWS_T.length)}
                        className="w-11 h-11 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                        aria-label={t.reviews.prev}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    {/* Indicator dots */}
                    <div className="flex items-center gap-3" role="tablist">
                        {REVIEWS_T.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                className={`h-1.5 rounded-full transition-all ${
                                    i === idx ? "w-8 bg-accent-warm" : "w-1.5 bg-silver-dark/50 hover:bg-silver-dark"
                                }`}
                                role="tab"
                                aria-selected={i === idx}
                                aria-label={`Recensione ${i + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setIdx((v) => (v + 1) % REVIEWS_T.length)}
                        className="w-11 h-11 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                        aria-label={t.reviews.next}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
