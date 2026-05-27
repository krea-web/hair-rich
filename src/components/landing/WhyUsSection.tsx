"use client";

import { motion } from "framer-motion";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { useT } from "@/i18n/useLang";

const FEATURE_ICONS = [
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" key="0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M15 9h.01M9.5 14a3.5 3.5 0 0 0 5 0" />
    </svg>,
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" key="1">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4M19.5 12c0 5-7.5 9-7.5 9s-7.5-4-7.5-9V6l7.5-3 7.5 3v6Z" />
    </svg>,
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" key="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9 11 5.26 4 12.26V16h3.74L14.74 9Zm0 0L18 5.74A2.5 2.5 0 0 0 14.5 2.24L11 5.74m3.74 3.26 3.5 3.5" />
    </svg>,
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" key="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>,
];

export function WhyUsSection() {
    const { t } = useT();
    const FEATURES = t.whyUs.features.map((f, i) => ({ ...f, icon: FEATURE_ICONS[i] }));
    return (
        <section
            aria-label={t.whyUs.titleA}
            className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black-2 overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <EditorialHeading
                    align="center"
                    eyebrow={t.whyUs.eyebrow}
                    title={
                        <>
                            {t.whyUs.titleA} <em className="text-display-alt not-italic text-silver">{t.whyUs.titleB}</em>
                        </>
                    }
                    className="mx-auto"
                />

                <div className="mt-16 md:mt-24 lg:mt-32 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 lg:gap-20 xl:gap-24 items-center">
                    {/* ── Left features ────────────────────────────────────── */}
                    <div className="md:col-span-4 space-y-12 md:text-right">
                        {FEATURES.slice(0, 2).map((f, i) => (
                            <motion.div
                                key={f.title}
                                className="flex md:flex-row-reverse gap-5 items-start"
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.7, delay: i * 0.15 }}
                            >
                                <span className="flex-shrink-0 w-12 h-12 rounded-full border border-accent-warm/40 bg-black flex items-center justify-center text-accent-warm">
                                    {f.icon}
                                </span>
                                <div>
                                    <h3 className="text-display text-lg md:text-xl text-warm-white tracking-tight">
                                        {f.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-warm-white-muted leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Center: logo icona dentro cerchio ────────────────── */}
                    <motion.div
                        className="md:col-span-4 relative flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <div className="relative aspect-square w-full max-w-[420px] lg:max-w-[500px] xl:max-w-[560px] mx-auto">
                            {/* Outer rotating ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full border border-accent-warm/30 pointer-events-none"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                            />
                            {/* Inner static ring */}
                            <div className="absolute inset-4 rounded-full border border-line pointer-events-none" />
                            {/* Subtle radial backdrop */}
                            <div
                                aria-hidden="true"
                                className="absolute inset-8 rounded-full bg-radial-[ellipse_at_center] from-accent-warm/[0.08] via-transparent to-transparent"
                            />
                            {/* Logo icona centered */}
                            <motion.img
                                src="/logo-icona.png"
                                alt="Hair Rich"
                                loading="lazy"
                                decoding="async"
                                className="absolute inset-0 m-auto w-[68%] h-auto select-none pointer-events-none drop-shadow-[0_0_30px_rgba(212,165,116,0.25)]"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            />
                            {/* Orbital dots */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            >
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-warm" />
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-silver-dark" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ── Right features ───────────────────────────────────── */}
                    <div className="md:col-span-4 space-y-12">
                        {FEATURES.slice(2, 4).map((f, i) => (
                            <motion.div
                                key={f.title}
                                className="flex gap-5 items-start"
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.7, delay: i * 0.15 }}
                            >
                                <span className="flex-shrink-0 w-12 h-12 rounded-full border border-accent-warm/40 bg-black flex items-center justify-center text-accent-warm">
                                    {f.icon}
                                </span>
                                <div>
                                    <h3 className="text-display text-lg md:text-xl text-warm-white tracking-tight">
                                        {f.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-warm-white-muted leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
