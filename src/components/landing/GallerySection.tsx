"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

interface Shot {
    src: string;
    alt: string;
    tag: string;
    title: string;
}

const SHOTS: Shot[] = [
    { src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1000&auto=format&fit=crop", alt: "Fade chirurgico", tag: "Fade", title: "Razor Fade" },
    { src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop", alt: "Lavorazione classica", tag: "Classic", title: "Side Part" },
    { src: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1000&auto=format&fit=crop", alt: "Strumenti e barba", tag: "Beard", title: "Beard Sculpt" },
    { src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop", alt: "Texture moderna", tag: "Modern", title: "Crop Textured" },
    { src: "https://images.unsplash.com/photo-1620577314869-4d3a3b8a8d8b?q=80&w=1000&auto=format&fit=crop", alt: "Color uomo", tag: "Color", title: "Salt & Pepper" },
    { src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop", alt: "Ritratto silver", tag: "Editorial", title: "Editorial #03" },
    { src: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=1000&auto=format&fit=crop", alt: "Stile contemporaneo", tag: "Modern", title: "Mid Skin Fade" },
    { src: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?q=80&w=1000&auto=format&fit=crop", alt: "Mood salone", tag: "Mood", title: "Studio Mood" },
];

const TAGS = ["Tutti", "Fade", "Classic", "Beard", "Modern", "Color", "Editorial", "Mood"] as const;

export function GallerySection() {
    const { t } = useT();
    const ALL_LABEL = t.gallery.filters.all;
    const filterTags = [ALL_LABEL, "Fade", "Classic", "Beard", "Modern", "Color", "Editorial", "Mood"];
    const [filter, setFilter] = useState<string>(ALL_LABEL);
    const [lightbox, setLightbox] = useState<Shot | null>(null);

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

    const filtered = filter === ALL_LABEL ? SHOTS : SHOTS.filter((s) => s.tag === filter);

    return (
        <section
            id="galleria"
            aria-label={t.gallery.eyebrow}
            className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 bg-black-2 overflow-hidden"
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

                {/* ── Masonry-ish grid ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[260px] gap-3 md:gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((shot, i) => {
                            const featured = i === 0;
                            return (
                                <motion.button
                                    key={shot.src}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    onClick={() => setLightbox(shot)}
                                    className={`group relative overflow-hidden rounded-[var(--radius-md)] border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm ${
                                        featured ? "col-span-2 row-span-2" : i % 5 === 0 ? "row-span-2" : ""
                                    }`}
                                    aria-label={`Apri ${shot.title}`}
                                >
                                    <div className="absolute inset-0 transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-[1.06]">
                                        <SmartImage src={shot.src} alt={shot.alt} className="h-full grayscale-[15%]" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                                    <div className="absolute top-3 left-3">
                                        <span className="text-[9px] uppercase tracking-[0.3em] bg-black/60 backdrop-blur-md text-warm-white px-2.5 py-1 rounded-full border border-line">
                                            {shot.tag}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                        <span className="text-display text-base md:text-lg text-warm-white tracking-tight">
                                            {shot.title}
                                        </span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-warm-white text-black w-8 h-8 rounded-full flex items-center justify-center">
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
                            <div className="relative w-full max-h-[85vh] aspect-[4/5] mx-auto">
                                <SmartImage src={lightbox.src} alt={lightbox.alt} eager className="h-full" />
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
