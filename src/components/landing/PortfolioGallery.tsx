"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
    fetchPortfolio,
    portfolioImageSrcset,
    portfolioImageUrl,
} from "@/lib/supabase/queries";
import type { PortfolioImage } from "@/lib/supabase/types";
import { SmartImage } from "./_shared/SmartImage";

interface Shot {
    path: string;
    title: string;
    tag: string;
    alt: string;
    featured: boolean;
}

/**
 * Editorial portfolio layout for /lavori. Differs from GallerySection by:
 * - asymmetric masonry with hero feature shot
 * - large filter chips with photo previews
 * - lightbox with arrow nav between shots
 * - "Mostra altri" pagination instead of all-at-once
 */
export function PortfolioGallery() {
    const [shots, setShots] = useState<Shot[]>([]);
    const [filter, setFilter] = useState<string>("Tutti");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [visibleCount, setVisibleCount] = useState(12);

    useEffect(() => {
        let alive = true;
        fetchPortfolio()
            .then((rows: PortfolioImage[]) => {
                if (!alive) return;
                setShots(
                    rows.map((r) => ({
                        path: r.storage_path,
                        title: r.title,
                        tag: r.tag,
                        alt: r.alt_text ?? r.title,
                        featured: r.is_featured,
                    }))
                );
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    const tags = useMemo(() => {
        const unique = Array.from(new Set(shots.map((s) => s.tag))).sort();
        return ["Tutti", ...unique];
    }, [shots]);

    const filtered = filter === "Tutti" ? shots : shots.filter((s) => s.tag === filter);
    const visible = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visible.length;

    useEffect(() => {
        if (lightboxIdx === null) return;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxIdx(null);
            if (e.key === "ArrowRight") setLightboxIdx((i) => (i === null ? null : Math.min(i + 1, filtered.length - 1)));
            if (e.key === "ArrowLeft") setLightboxIdx((i) => (i === null ? null : Math.max(i - 1, 0)));
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKey);
        };
    }, [lightboxIdx, filtered.length]);

    const tagPreview = (tag: string): string | null => {
        if (tag === "Tutti") return shots[0]?.path ?? null;
        return shots.find((s) => s.tag === tag)?.path ?? null;
    };

    return (
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-10 mb-12 md:mb-16">
                    <div className="max-w-2xl">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Archive · 2024 — 2026
                        </span>
                        <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                            Tagli che hanno camminato fuori dalla nostra porta.
                        </h2>
                        <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                            Ogni foto è un cliente vero, fotografato post-finishing. Filtra per categoria
                            per vedere come trattiamo ogni tipo di lavorazione.
                        </p>
                    </div>

                    {/* Filter chips con preview foto — scroll orizzontale mobile, wrap su desktop */}
                    <div className="flex flex-nowrap overflow-x-auto gap-2 md:flex-wrap md:gap-3 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide [&::-webkit-scrollbar]:hidden">
                        {tags.map((tag) => {
                            const preview = tagPreview(tag);
                            const active = filter === tag;
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setFilter(tag);
                                        setVisibleCount(12);
                                    }}
                                    className={`group inline-flex flex-shrink-0 items-center gap-3 pl-1 pr-5 py-1 rounded-full border transition-all ${
                                        active
                                            ? "bg-warm-white border-warm-white text-black"
                                            : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                                    }`}
                                    aria-pressed={active}
                                >
                                    {preview && (
                                        <span className="w-8 h-8 rounded-full overflow-hidden border border-line flex-shrink-0">
                                            <img
                                                src={portfolioImageUrl(preview, { width: 96, quality: 70, format: "webp" })}
                                                alt=""
                                                aria-hidden="true"
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </span>
                                    )}
                                    <span className="text-[11px] uppercase tracking-[0.25em] font-body font-semibold">
                                        {tag}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Uniform 4:5 grid — matches the natural aspect of iPhone-shot
                   portrait photos, so the subject is never cropped by tile
                   geometry. 2 col mobile, 3 col md, 4 col lg. */}
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={filter}
                        layout
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
                    >
                        {visible.map((shot, i) => {
                            return (
                                <motion.button
                                    key={shot.path}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4, delay: (i % 12) * 0.04 }}
                                    onClick={() => setLightboxIdx(filtered.indexOf(shot))}
                                    className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line aspect-[4/5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                                    aria-label={`Apri ${shot.title}`}
                                >
                                    <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.04]">
                                        <SmartImage
                                            src={portfolioImageUrl(shot.path, { width: 800, quality: 80, format: "webp" })}
                                            srcSet={portfolioImageSrcset(shot.path, 80)}
                                            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                            alt={shot.alt}
                                            className="h-full"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                                    <div className="absolute top-3 left-3">
                                        <span className="text-[9px] uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md text-warm-white px-2.5 py-1 rounded-full border border-line">
                                            {shot.tag}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <span className="text-display text-base md:text-lg text-warm-white tracking-tight block truncate">
                                            {shot.title}
                                        </span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>

                {hasMore && (
                    <div className="mt-10 md:mt-14 flex justify-center">
                        <button
                            onClick={() => setVisibleCount((c) => c + 12)}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-line text-warm-white text-[11px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-colors"
                        >
                            Mostra altri {Math.min(12, filtered.length - visible.length)}
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && filtered[lightboxIdx] && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-md flex items-center justify-center p-4 md:p-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxIdx(null)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            className="absolute top-6 right-6 w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIdx(null);
                            }}
                            aria-label="Chiudi"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {lightboxIdx > 0 && (
                            <button
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIdx((i) => (i === null ? null : Math.max(i - 1, 0)));
                                }}
                                aria-label="Precedente"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                        )}
                        {lightboxIdx < filtered.length - 1 && (
                            <button
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxIdx((i) => (i === null ? null : Math.min(i + 1, filtered.length - 1)));
                                }}
                                aria-label="Successiva"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                                </svg>
                            </button>
                        )}

                        <motion.div
                            className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center touch-pan-y"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            key={filtered[lightboxIdx].path}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.25}
                            onDragEnd={(_, info) => {
                                const threshold = 80;
                                if (info.offset.x < -threshold && lightboxIdx < filtered.length - 1) {
                                    setLightboxIdx(lightboxIdx + 1);
                                } else if (info.offset.x > threshold && lightboxIdx > 0) {
                                    setLightboxIdx(lightboxIdx - 1);
                                }
                            }}
                        >
                            <div className="relative w-full max-h-[80vh] aspect-[4/5] mx-auto">
                                <SmartImage
                                    src={portfolioImageUrl(filtered[lightboxIdx].path, { width: 1600, quality: 82, format: "webp" })}
                                    srcSet={portfolioImageSrcset(filtered[lightboxIdx].path, 82)}
                                    sizes="(min-width: 1024px) 80vw, 100vw"
                                    alt={filtered[lightboxIdx].alt}
                                    eager
                                    className="h-full"
                                />
                            </div>
                            <div className="text-center mt-4">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                    {filtered[lightboxIdx].tag} · {lightboxIdx + 1} / {filtered.length}
                                </span>
                                <h3 className="text-display text-2xl text-warm-white tracking-tight mt-1">
                                    {filtered[lightboxIdx].title}
                                </h3>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
