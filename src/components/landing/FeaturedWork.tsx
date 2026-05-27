"use client";

import { motion } from "framer-motion";
import { portfolioImageSrcset, portfolioImageUrl } from "@/lib/supabase/queries";
import { SmartImage } from "./_shared/SmartImage";

interface Props {
    /** storage_path inside the portfolio bucket */
    image: string;
    badge?: string;
    title: string;
    subtitle?: string;
    body: string;
    meta: { label: string; value: string }[];
}

/**
 * Full-bleed editorial feature card. Used at the top of /lavori to lead
 * the gallery with a curated piece (e.g. "Caso del mese") before the
 * filter grid takes over. Designed mobile-first: stacked photo + text,
 * generous spacing, no decorations that crowd small viewports.
 */
export function FeaturedWork({ image, badge, title, subtitle, body, meta }: Props) {
    return (
        <section className="relative bg-black overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 pt-16 md:pt-24 lg:pt-32 xl:pt-40 pb-20 md:pb-28 lg:pb-36 xl:pb-44">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.7 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-end"
                >
                    {/* Photo — natural aspect, no crop. The card grows to the
                        image's intrinsic ratio so the subject is preserved. */}
                    <div className="lg:col-span-7 relative">
                        <div className="relative rounded-[var(--radius-md)] overflow-hidden border border-line">
                            <SmartImage
                                src={portfolioImageUrl(image, { width: 1400, quality: 82, format: "webp" })}
                                srcSet={portfolioImageSrcset(image, 82)}
                                sizes="(min-width: 1024px) 58vw, 100vw"
                                alt={title}
                                eager
                                natural
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                            {badge && (
                                <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-accent-warm/40 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                                    <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                                        {badge}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="lg:col-span-5 lg:pb-10">
                        {subtitle && (
                            <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                                {subtitle}
                            </span>
                        )}
                        <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                            {title}
                        </h2>
                        <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                            {body}
                        </p>

                        {meta.length > 0 && (
                            <dl className="mt-8 grid grid-cols-2 gap-y-5 gap-x-6 pt-6 border-t border-line">
                                {meta.map((m) => (
                                    <div key={m.label}>
                                        <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                            {m.label}
                                        </dt>
                                        <dd className="mt-1 text-warm-white text-base font-body">
                                            {m.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
