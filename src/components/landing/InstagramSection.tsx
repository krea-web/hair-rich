"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/constants";
import { EditorialHeading } from "./_shared/EditorialHeading";
import {
    fetchPortfolio,
    portfolioImageUrl,
    portfolioImageSrcset,
} from "@/lib/supabase/queries";
import type { PortfolioImage } from "@/lib/supabase/types";
import { useT } from "@/i18n/useLang";

/**
 * Instagram block — six curated portfolio shots styled as a feed grid,
 * with a big "Seguici @hair_rich_" CTA. Photos are real (pulled from the
 * Supabase portfolio bucket, featured first), each tile links to the
 * Instagram profile so the visitor lands on the actual account.
 */
export function InstagramSection() {
    const { t } = useT();
    const [shots, setShots] = useState<PortfolioImage[]>([]);

    useEffect(() => {
        let alive = true;
        fetchPortfolio()
            .then((rows) => {
                if (!alive) return;
                // Take 6: featured first, then most-recent fallback.
                const featured = rows.filter((r) => r.is_featured).slice(0, 6);
                const rest = rows.filter((r) => !r.is_featured);
                const merged = [...featured, ...rest].slice(0, 6);
                setShots(merged);
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    const handle = "@hair_rich_";

    return (
        <section
            aria-label="Instagram · @hair_rich_"
            className="relative py-16 md:py-28 px-6 md:px-12 lg:px-20 bg-black-2 overflow-hidden border-y border-line"
        >
            {/* Editorial watermark */}
            <div
                aria-hidden="true"
                className="absolute -bottom-8 left-2 md:left-8 text-display-alt text-[26vw] md:text-[14vw] text-warm-white/[0.04] leading-none pointer-events-none select-none"
            >
                follow
            </div>

            <div className="relative max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10 mb-10 md:mb-12">
                    <EditorialHeading
                        eyebrow={t.instagram.eyebrow}
                        title={
                            <>
                                {t.instagram.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">
                                    {t.instagram.titleB}
                                </em>
                            </>
                        }
                    />
                    <div className="flex flex-col gap-2 md:items-end">
                        <a
                            href={SITE.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-display-alt text-3xl md:text-4xl text-warm-white hover:text-accent-warm transition-colors"
                        >
                            {handle}
                        </a>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Backstage, taglio in tempo reale
                        </span>
                    </div>
                </div>

                {/* 6-tile feed grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                    {(shots.length > 0
                        ? shots
                        : Array.from({ length: 6 }).map((_, i) => ({ storage_path: "", id: `ph-${i}`, alt_text: "" } as any))
                    ).map((shot, i) => (
                        <motion.a
                            key={shot.id}
                            href={SITE.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-line bg-carbon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            aria-label="Apri profilo Instagram"
                        >
                            {shot.storage_path ? (
                                <img
                                    src={portfolioImageUrl(shot.storage_path, {
                                        width: 600,
                                        height: 600,
                                        resize: "cover",
                                        quality: 78,
                                        format: "webp",
                                    })}
                                    srcSet={portfolioImageSrcset(shot.storage_path, 78)}
                                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw"
                                    alt={shot.alt_text ?? ""}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-110 grayscale-[15%]"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-carbon to-black-2" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-colors" />
                            {/* Instagram icon — visible on hover only */}
                            <span aria-hidden="true" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-warm-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]" fill="currentColor">
                                    <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </span>
                        </motion.a>
                    ))}
                </div>

                {/* Big follow CTA */}
                <div className="mt-10 md:mt-14 flex flex-col items-center gap-3">
                    <a
                        href={SITE.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cta-shine cta-pulse group inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-accent-warm text-black rounded-full text-sm md:text-base uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform shadow-[0_20px_55px_-15px_rgba(212,165,116,0.55)]"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                            <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        Seguici su Instagram
                        <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Reel, dietro-le-quinte, nuove trasformazioni
                    </span>
                </div>
            </div>
        </section>
    );
}
