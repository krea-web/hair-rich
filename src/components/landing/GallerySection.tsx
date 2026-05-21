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
            className="relative py-16 md:py-32 px-6 md:px-12 lg:px-20 bg-black-2 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-16">
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

                {/* Mobile: two flex columns where the right column starts
                   shifted down ~32px. Each photo renders at its NATURAL
                   aspect (no crop, no letterbox) so the original framing is
                   intact — the staggered offset between the two columns
                   gives the layout an irregular, editorial rhythm. */}
                <div className="md:hidden grid grid-cols-2 gap-3 pb-10">
                    {[0, 1].map((col) => (
                        <div
                            key={col}
                            className={`flex flex-col gap-3 ${col === 1 ? "mt-8" : ""}`}
                        >
                            <AnimatePresence mode="popLayout">
                                {filtered
                                    .filter((_, idx) => idx % 2 === col)
                                    .map((shot, i) => (
                                        <motion.button
                                            key={shot.path}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.5, delay: i * 0.05 }}
                                            onClick={() => setLightbox(shot)}
                                            className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                                            aria-label={`Apri ${shot.title}`}
                                        >
                                            <SmartImage
                                                src={portfolioImageUrl(shot.path, { width: 600, quality: 80, format: "webp" })}
                                                srcSet={portfolioImageSrcset(shot.path, 80)}
                                                sizes="50vw"
                                                alt={shot.alt}
                                                natural
                                            />
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-transparent" />
                                            <div className="absolute top-2 left-2">
                                                <span className="text-[8px] uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md text-warm-white px-2 py-0.5 rounded-full border border-line">
                                                    {shot.tag}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <span className="text-display text-xs text-warm-white tracking-tight truncate block">
                                                    {shot.title}
                                                </span>
                                            </div>
                                        </motion.button>
                                    ))}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Desktop: masonry columns — photos render at natural aspect,
                   no crop. CSS columns balance heights across the row freely. */}
                <div className="hidden md:block columns-4 gap-4 [column-fill:_balance]">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((shot, i) => {
                            return (
                                <motion.button
                                    key={shot.path}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    onClick={() => setLightbox(shot)}
                                    className="group relative overflow-hidden rounded-[var(--radius-md)] border border-line block w-full mb-4 break-inside-avoid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                                    aria-label={`Apri ${shot.title}`}
                                >
                                    <div className="transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-[1.04]">
                                        <SmartImage
                                            src={portfolioImageUrl(shot.path, { width: 800, quality: 80, format: "webp" })}
                                            srcSet={portfolioImageSrcset(shot.path, 80)}
                                            sizes="25vw"
                                            alt={shot.alt}
                                            natural
                                        />
                                    </div>
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                                    <div className="absolute top-3 left-3">
                                        <span className="text-[9px] uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md text-warm-white px-2.5 py-1 rounded-full border border-line">
                                            {shot.tag}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                                        <span className="text-display text-base md:text-lg text-warm-white tracking-tight truncate">
                                            {shot.title}
                                        </span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-warm-white text-black w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                                            </svg>
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
