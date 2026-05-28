"use client";

import { motion } from "framer-motion";
import { bucketImageUrl } from "@/lib/supabase/queries";

interface Props {
    eyebrow: string;
    titleA: string;
    titleB?: string;
    intro?: string;
    /** Optional storage path for the bg image (filename inside the chosen bucket). */
    bgImage?: string;
    /** Bucket where bgImage lives. Defaults to portfolio for back-compat. */
    bgImageBucket?: "portfolio" | "asset" | "products";
    /** Children appear under the intro, before the scroll cue. Typically a CTA. */
    children?: React.ReactNode;
    /** Bottom-left meta line: e.g. "Aggiornato · Maggio 2026" */
    metaLeft?: string;
    /** Bottom-right meta line: e.g. "01 / Servizi" */
    metaRight?: string;
}

/**
 * Cinematic page hero for non-home routes. 75vh on mobile, 85vh on desktop.
 * Optional background photo (sourced from portfolio bucket with on-demand
 * transformations) with a dark gradient ramp for legibility. Title uses
 * the display serif at full editorial scale.
 */
export function PageHero({
    eyebrow,
    titleA,
    titleB,
    intro,
    bgImage,
    bgImageBucket = "portfolio",
    children,
    metaLeft,
    metaRight,
}: Props) {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Background image with gradient ramp */}
            {bgImage && (
                <div className="absolute inset-0" aria-hidden="true">
                    <img
                        src={bucketImageUrl(bgImageBucket, bgImage, { width: 1920, quality: 70, format: "webp" })}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[15%]"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/60" />
                </div>
            )}

            {/* Editorial wordmark on the watermark layer */}
            <div
                aria-hidden="true"
                className="absolute -top-12 md:-top-16 -left-4 md:-left-6 text-display-alt text-[16vw] md:text-[18vw] text-warm-white/[0.025] leading-none pointer-events-none select-none"
            >
                {titleA}
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-20 md:pt-24 lg:pt-28 xl:pt-32 pb-10 md:pb-14 lg:pb-18 min-h-[40vh] md:min-h-[48vh] lg:min-h-[44vh] xl:min-h-[40vh] flex flex-col justify-end">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        {eyebrow}
                    </span>
                    <h1 className="text-display text-4xl sm:text-5xl md:text-8xl lg:text-9xl text-warm-white tracking-tight mt-3 md:mt-6 leading-[0.95]">
                        {titleA}
                        {titleB && (
                            <>
                                <br />
                                <em className="text-display-alt not-italic text-silver">{titleB}</em>
                            </>
                        )}
                    </h1>
                    {intro && (
                        <p className="mt-6 md:mt-8 max-w-2xl text-warm-white-muted text-base md:text-xl leading-relaxed">
                            {intro}
                        </p>
                    )}
                    {children && <div className="mt-8 md:mt-10">{children}</div>}
                </motion.div>

                {/* Meta footer */}
                {(metaLeft || metaRight) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-10 md:mt-16 pt-6 border-t border-line/40 flex flex-wrap items-end justify-between gap-4"
                    >
                        {metaLeft && (
                            <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                                {metaLeft}
                            </span>
                        )}
                        {metaRight && (
                            <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                                {metaRight}
                            </span>
                        )}
                    </motion.div>
                )}

                {/* Scroll cue */}
                <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="absolute bottom-6 md:bottom-8 right-6 md:right-12 lg:right-20 flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold pointer-events-none"
                >
                    <span>Scorri</span>
                    <span className="block w-px h-12 bg-gradient-to-b from-silver-dark to-transparent" />
                </motion.div>
            </div>
        </section>
    );
}
