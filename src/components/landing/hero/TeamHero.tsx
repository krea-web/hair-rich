"use client";

import { motion } from "framer-motion";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import { Wordmark } from "../_shared/Wordmark";

/**
 * Editorial hero for /team. Full-bleed photo of the salon with the
 * two barbers working, centred Wordmark on top, oversized "Team"
 * setpiece below, single CTA. Designed to fit on a single PC viewport
 * (no scroll before the showcase begins).
 */
export function TeamHero() {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Background: salone with both barbers at work */}
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={assetImageUrl("salone-team-staff.webp", { width: 2000, quality: 78, format: "webp" })}
                    srcSet={assetImageSrcset("salone-team-staff.webp", 78)}
                    sizes="100vw"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
            </div>

            <div className="relative max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-24 md:pt-28 lg:pt-32 pb-16 md:pb-20 lg:pb-24 min-h-[58vh] md:min-h-[62vh] lg:min-h-[55vh] xl:min-h-[52vh] 2xl:min-h-[50vh] flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                >
                    <Wordmark
                        variant="wordmark"
                        size="md"
                        className="opacity-95 drop-shadow-[0_0_24px_rgba(212,165,116,0.35)]"
                    />
                </motion.div>

                <motion.span
                    className="mt-6 md:mt-8 text-[10px] md:text-xs uppercase tracking-[0.5em] text-accent-warm font-body font-semibold"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    Master barber · Olbia
                </motion.span>

                <motion.h1
                    className="mt-3 md:mt-4 text-display text-warm-white tracking-tight leading-[0.85] text-[20vw] md:text-[14vw] lg:text-[12vw] xl:text-[10.5vw] 2xl:text-[9.5vw]"
                    initial={{ opacity: 0, y: 30, clipPath: "inset(40% 0 40% 0)" }}
                    animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0 0)" }}
                    transition={{ duration: 1.1, ease: [0.7, 0, 0.3, 1], delay: 0.35 }}
                >
                    Team
                </motion.h1>

                <motion.p
                    className="mt-6 md:mt-8 max-w-xl text-warm-white-muted text-sm md:text-base lg:text-lg leading-relaxed"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.65 }}
                >
                    Federico, Cristian e chi sta crescendo dietro la sedia. Ogni mano ha la sua firma, lo standard è uno.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.85 }}
                    className="mt-10 md:mt-12 flex items-end justify-between gap-4 w-full"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Sul campo · Dal 2017
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        03 / Team
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
