"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import { useT } from "@/i18n/useLang";

const FEATURED_IMG =
    "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=900&auto=format&fit=crop";
const TEAM_IMGS = [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620577314869-4d3a3b8a8d8b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?q=80&w=600&auto=format&fit=crop",
];

export function TeamSection() {
    const { t } = useT();
    const FEATURED = t.team.featured;
    const TEAM = t.team.members.map((m, i) => ({ ...m, img: TEAM_IMGS[i] ?? TEAM_IMGS[0]! }));
    return (
        <section
            id="team"
            aria-label={t.team.titleA + " " + t.team.titleB}
            className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 bg-black overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                <EditorialHeading
                    eyebrow={t.team.eyebrow}
                    title={
                        <>
                            {t.team.titleA} <em className="text-display-alt not-italic text-silver">{t.team.titleB}</em>
                        </>
                    }
                />

                {/* ── Featured Master ────────────────────────────────────────── */}
                <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-end">
                    <motion.div
                        className="md:col-span-5 relative"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <div className="relative aspect-[3/4]">
                            <SmartImage
                                src={FEATURED_IMG}
                                alt={`${FEATURED.name}, ${FEATURED.role}`}
                                className="h-full grayscale-[10%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* Years badge */}
                        <motion.div
                            className="absolute -top-6 -right-6 md:-right-12 bg-accent-warm text-black w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_-15px_rgba(212,165,116,0.4)]"
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
                    </motion.div>

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
                            className="text-display text-4xl md:text-6xl text-warm-white mt-2 leading-[0.95]"
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

                {/* ── Other team members ─────────────────────────────────────── */}
                <div className="mt-24 md:mt-32 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {TEAM.map((m, i) => (
                        <motion.article
                            key={m.name}
                            className="group cursor-pointer"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.7, delay: i * 0.12 }}
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)]">
                                <div className="absolute inset-0 transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-105">
                                    <SmartImage src={m.img} alt={`${m.name}, ${m.role}`} className="h-full grayscale-[20%]" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <span className="text-display-alt text-lg text-accent-warm">{m.role}</span>
                                    <h3 className="text-display text-2xl text-warm-white tracking-tight">{m.name}</h3>
                                    <p className="text-[10px] uppercase tracking-[0.25em] text-silver mt-1 font-body font-semibold">
                                        {m.specialties}
                                    </p>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
