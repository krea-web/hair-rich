"use client";

import { motion } from "framer-motion";
import { useT } from "@/i18n/useLang";

/**
 * "Una giornata al salone" — narrative timeline that humanizes the team
 * page. Copy localizzata via i18n (t.salonDay).
 */
export function SalonDay() {
    const { t } = useT();
    const s = t.salonDay;
    const TIMELINE = s.timeline;
    return (
        <section className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div
                aria-hidden="true"
                className="absolute -top-20 right-0 text-display-alt text-[32vw] md:text-[18vw] text-warm-white/[0.02] leading-none pointer-events-none select-none whitespace-nowrap"
            >
                {s.watermark}
            </div>

            <div className="relative max-w-5xl mx-auto">
                <div className="mb-14 md:mb-20 max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        {s.eyebrow}
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl 2xl:text-6xl text-warm-white tracking-tight mt-4 leading-[1.05]">
                        {s.titleA}<br />
                        <em className="text-display-alt not-italic text-silver">{s.titleB}</em>
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        {s.intro}
                    </p>
                </div>

                <ol className="relative space-y-0">
                    {/* Vertical line */}
                    <div
                        aria-hidden="true"
                        className="absolute left-[68px] md:left-[88px] top-2 bottom-2 w-px bg-gradient-to-b from-line via-line to-transparent"
                    />

                    {TIMELINE.map((entry, i) => (
                        <motion.li
                            key={entry.time}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                            className="relative grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] gap-5 md:gap-8 py-6 md:py-8 border-b border-line/40 last:border-b-0"
                        >
                            <div className="flex items-start">
                                <span className="font-mono text-sm md:text-base text-accent-warm tabular-nums">
                                    {entry.time}
                                </span>
                            </div>
                            <div className="relative pl-5 md:pl-8">
                                {/* Dot */}
                                <span
                                    aria-hidden="true"
                                    className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-accent-warm ring-4 ring-black-2"
                                />
                                <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                                    {entry.title}
                                </h3>
                                <p className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed max-w-2xl">
                                    {entry.body}
                                </p>
                            </div>
                        </motion.li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
