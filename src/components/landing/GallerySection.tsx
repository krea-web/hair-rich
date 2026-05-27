"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";
import { fetchPortfolio, portfolioImageUrl, portfolioImageSrcset } from "@/lib/supabase/queries";
import type { PortfolioImage } from "@/lib/supabase/types";
import { usePersistedState } from "@/lib/usePersistedState";

interface Shot {
    path: string;
    alt: string;
    tag: string;
    title: string;
}

export function GallerySection() {
    const { t } = useT();
    const ALL_LABEL = t.gallery.filters.all;
    const [shots, setShots] = useState<Shot[]>([]);
    const [filter, setFilter] = usePersistedState<string>("hr-home-gallery-filter", ALL_LABEL);
    const [lightbox, setLightbox] = useState<Shot | null>(null);

    useEffect(() => {
        let alive = true;
        fetchPortfolio()
            .then((rows: PortfolioImage[]) => {
                if (!alive) return;
                setShots(
                    rows.map((r) => ({
                        path: r.storage_path,
                        alt: r.alt_text ?? r.title,
                        tag: r.tag,
                        title: r.title,
                    }))
                );
            })
            .catch(() => {
                /* fail silently — gallery rimane vuota se DB irraggiungibile */
            });
        return () => {
            alive = false;
        };
    }, []);

    const filterTags = useMemo(() => {
        const unique = Array.from(new Set(shots.map((s) => s.tag))).sort();
        return [ALL_LABEL, ...unique];
    }, [shots, ALL_LABEL]);

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(null);
        };
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [lightbox]);

    const filtered = filter === ALL_LABEL ? shots : shots.filter((s) => s.tag === filter);

    return (
        <section
            id="galleria"
            aria-label={t.gallery.eyebrow}
            className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black-2 overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-16 lg:mb-20">
                    <EditorialHeading
                        eyebrow={t.gallery.eyebrow}
                        title={
                            <>
                                {t.gallery.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.gallery.titleB}</em>
                            </>
                        }
                    />
                    <p className="md:max-w-md text-warm-white-muted text-base">
                        {t.gallery.intro}
                    </p>
                </div>

                {/* ── Filter chips ─────────────────────────────────────────── */}
                <motion.div
                    className="flex flex-wrap gap-2 mb-10 md:mb-14"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {filterTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setFilter(tag)}
                            className={`px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-body font-semibold rounded-full border transition-colors ${
                                filter === tag
                                    ? "bg-warm-white text-black border-warm-white"
                                    : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                            }`}
                            aria-pressed={filter === tag}
                        >
                            {tag}
                        </button>
                    ))}
                </motion.div>

                {/* Unified grid — square tiles on every breakpoint. Photos
                   fill the tile (object-cover, server-side cover crop) so no
                   black bars. Per-item margin-top staggers the row by index
                   for the irregular checkerboard feel — using mt-* (not
                   transform) so offset items extend the row height instead
                   of overlapping the next row. */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 xl:gap-6 pb-12">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((shot, i) => {
                            const offset = i % 4;
                            const offsetClass =
                                offset === 1
                                    ? "mt-6 md:mt-8"
                                    : offset === 2
                                      ? "mt-3 md:mt-4"
                                      : offset === 3
                                        ? "mt-9 md:mt-12"
                                        : "mt-0";
                            return (
                                <motion.button
                                    key={shot.path}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    onClick={() => setLightbox(shot)}
                                    className={`group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-line ${offsetClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm`}
                                    aria-label={`Apri ${shot.title}`}
                                >
                                    <img
                                        src={portfolioImageUrl(shot.path, { width: 800, height: 800, resize: "cover", quality: 80, format: "webp" })}
                                        alt={shot.alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-[1.05]"
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                                    <div className="absolute top-2 md:top-3 left-2 md:left-3">
                                        <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md text-warm-white px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-line">
                                            {shot.tag}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3">
                                        <span className="text-display text-xs md:text-base text-warm-white tracking-tight truncate block">
                                            {shot.title}
                                        </span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Lightbox ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label={lightbox.title}
                    >
                        <motion.button
                            className="absolute top-6 right-6 w-12 h-12 rounded-full border border-line text-warm-white flex items-center justify-center hover:bg-warm-white hover:text-black transition-colors"
                            onClick={() => setLightbox(null)}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            aria-label="Chiudi"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        <motion.div
                            className="max-w-5xl w-full max-h-[85vh]"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative mx-auto max-w-3xl max-h-[85vh] flex items-center justify-center">
                                <SmartImage
                                    src={portfolioImageUrl(lightbox.path, { width: 1600, quality: 82, format: "webp" })}
                                    srcSet={portfolioImageSrcset(lightbox.path, 82)}
                                    sizes="(min-width: 1024px) 80vw, 100vw"
                                    alt={lightbox.alt}
                                    eager
                                    natural
                                    className="max-h-[85vh] w-auto"
                                />
                            </div>
                            <div className="text-center mt-4">
                                <span className="text-display-alt text-2xl text-accent-warm">{lightbox.tag}</span>
                                <h3 className="text-display text-2xl text-warm-white tracking-tight">{lightbox.title}</h3>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
