"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import { useT } from "@/i18n/useLang";

// Real staff portraits from the asset bucket. Order matches the i18n
// members[] array (currently a single entry: Cristian).
const FEATURED_IMG = "federico.webp";
const TEAM_IMGS = ["cristian.webp"];

export function TeamSection() {
    const { t } = useT();
    const FEATURED = t.team.featured;
    const TEAM = t.team.members.map((m, i) => ({ ...m, img: TEAM_IMGS[i] ?? TEAM_IMGS[0]! }));
    return (
        <section
            id="team"
            aria-label={t.team.titleA + " " + t.team.titleB}
            className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black"
        >
            <style dangerouslySetInnerHTML={{ __html: `
                @media (min-width: 768px) {
                    .hr-home-photo-sticky {
                        position: sticky !important;
                        top: 6rem !important;
                        align-self: flex-start !important;
                    }
                }
            ` }} />
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <EditorialHeading
                    eyebrow={t.team.eyebrow}
                    title={
                        <>
                            {t.team.titleA} <em className="text-display-alt not-italic text-silver">{t.team.titleB}</em>
                        </>
                    }
                />

                {/* ── Featured Master ────────────────────────────────────────── */}
                <div className="mt-16 md:mt-20 lg:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 lg:gap-20 xl:gap-24 items-start">
                    <div className="md:col-span-5 relative hr-home-photo-sticky">
                        <div className="relative aspect-[3/4] max-h-[640px] lg:max-h-[500px] xl:max-h-[560px] 2xl:max-h-[620px] mx-auto">
                            <SmartImage
                                src={assetImageUrl(FEATURED_IMG, { width: 1200, quality: 82, format: "webp" })}
                                srcSet={assetImageSrcset(FEATURED_IMG, 82)}
                                sizes="(min-width: 768px) 42vw, 100vw"
                                alt={`${FEATURED.name}, ${FEATURED.role}`}
                                className="h-full grayscale-[10%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Years badge */}
                        <motion.div
                            className="absolute -top-6 -right-6 md:-right-12 lg:-right-14 xl:-right-16 bg-accent-warm text-black w-32 h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_-15px_rgba(212,165,116,0.4)]"
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                            <span className="text-display text-3xl font-semibold">{FEATURED.yearsLabel}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-body font-bold mt-1">
                                {FEATURED.yearsCaption}
                            </span>
                        </motion.div>
                    </div>

                    {/* ── Featured Bio ───────────────────────────────────────── */}
                    <div className="md:col-span-7 md:pl-8">
                        <motion.span
                            className="text-display-alt text-2xl text-accent-warm"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {FEATURED.role}
                        </motion.span>
                        <motion.h3
                            className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl text-warm-white mt-2 leading-[0.95]"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {FEATURED.name}
                        </motion.h3>

                        <motion.blockquote
                            className="mt-8 text-display-alt text-2xl md:text-3xl text-silver border-l-2 border-accent-warm pl-6 leading-snug"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            "{FEATURED.quote}"
                        </motion.blockquote>

                        <motion.p
                            className="mt-8 text-warm-white-muted text-base leading-relaxed max-w-xl"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            {FEATURED.bio}
                        </motion.p>

                        <motion.div
                            className="mt-8 flex flex-wrap gap-2"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                        >
                            {FEATURED.specialties.map((s) => (
                                <span
                                    key={s}
                                    className="text-[10px] uppercase tracking-[0.3em] px-4 py-2 border border-line text-silver font-body font-semibold rounded-full"
                                >
                                    {s}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* ── Featured Member 2 — stesso peso del founder ──────── */}
                {TEAM.map((m, i) => (
                    <div
                        key={m.name}
                        className="mt-20 md:mt-32 lg:mt-40 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 lg:gap-20 xl:gap-24 items-start"
                    >
                        {/* Bio (sx) */}
                        <div className="md:col-span-7 md:order-1 md:pr-8 order-2">
                            <motion.span
                                className="text-display-alt text-2xl text-accent-warm"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                {m.role}
                            </motion.span>
                            <motion.h3
                                className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl text-warm-white mt-2 leading-[0.95]"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            >
                                {m.name}
                            </motion.h3>

                            <motion.blockquote
                                className="mt-8 text-display-alt text-2xl md:text-3xl text-silver border-l-2 border-accent-warm pl-6 leading-snug"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                &ldquo;{m.quote}&rdquo;
                            </motion.blockquote>

                            <motion.p
                                className="mt-8 text-warm-white-muted text-base leading-relaxed max-w-xl"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                {m.bio}
                            </motion.p>

                            <motion.div
                                className="mt-8 flex flex-wrap gap-2"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                            >
                                {m.tags.map((s) => (
                                    <span
                                        key={s}
                                        className="text-[10px] uppercase tracking-[0.3em] px-4 py-2 border border-line text-silver font-body font-semibold rounded-full"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </motion.div>
                        </div>

                        {/* Image (dx, mirror del founder) */}
                        <div className="md:col-span-5 md:order-2 relative order-1 hr-home-photo-sticky">
                            <div className="relative aspect-[3/4] max-h-[520px] lg:max-h-[460px] xl:max-h-[520px] 2xl:max-h-[580px]">
                                <SmartImage
                                    src={assetImageUrl(m.img, { width: 1200, quality: 82, format: "webp" })}
                                    srcSet={assetImageSrcset(m.img, 82)}
                                    sizes="(min-width: 768px) 42vw, 100vw"
                                    alt={`${m.name}, ${m.role}`}
                                    className="h-full grayscale-[10%]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                            </div>

                            <motion.div
                                className="absolute -top-6 -left-6 md:-left-12 bg-warm-white text-black w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_-15px_rgba(244,239,230,0.25)]"
                                initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                            >
                                <span className="text-display text-2xl md:text-3xl font-semibold">
                                    {m.yearsLabel}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-body font-bold mt-1 text-center px-2">
                                    {m.yearsCaption}
                                </span>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
