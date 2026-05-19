"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";

const TEAM_MANIFESTO = [
    "Tre persone scelte a mano.",
    "Stessi standard, lingue diverse.",
    "Una sola testa alla volta.",
];

/**
 * "Cast portrait" hero for /team. Big stack of staff avatars (gradient
 * monograms while real photos remain unavailable) anchors the eye, with
 * a short editorial manifesto in three lines beside them. Reads more
 * like a film poster than a corporate "about us" banner.
 */
export function TeamHero() {
    const [staff, setStaff] = useState<Staff[]>([]);

    useEffect(() => {
        let alive = true;
        fetchStaff()
            .then((rows) => {
                if (alive) setStaff(rows.slice(0, 4));
            })
            .catch(() => {
                /* fallback: render with empty list */
            });
        return () => {
            alive = false;
        };
    }, []);

    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            {/* Soft radial backdrop */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_30%,rgba(212,165,116,0.18),transparent_60%)]"
            />

            {/* Big EST. monogram top-left */}
            <div
                aria-hidden="true"
                className="absolute left-2 md:left-8 top-16 md:top-12 text-display-alt text-[35vw] md:text-[16vw] text-warm-white/[0.04] leading-none pointer-events-none select-none"
            >
                Cast
            </div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-28 md:pt-40 pb-12 md:pb-24 min-h-[80vh] md:min-h-[90vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                        Il team · Master barber
                    </span>
                    <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight mt-3 md:mt-5 leading-[0.95]">
                        Mani che
                        <br />
                        <em className="text-display-alt not-italic text-silver">
                            pensano insieme.
                        </em>
                    </h1>
                </motion.div>

                {/* Avatar row */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
                    }}
                    className="mt-10 md:mt-16 flex items-center justify-center gap-3 md:gap-6"
                >
                    {(staff.length > 0
                        ? staff
                        : ([
                              { id: "s1", name: "Federico", role: "Master barber" },
                              { id: "s2", name: "Luca", role: "Barber" },
                              { id: "s3", name: "Marco", role: "Barber" },
                          ] as any[])
                    ).map((s, i) => (
                        <motion.div
                            key={s.id}
                            variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.95 },
                                visible: { opacity: 1, y: 0, scale: 1 },
                            }}
                            className="flex flex-col items-center"
                            style={{ transform: `translateY(${i % 2 === 0 ? 0 : 12}px)` }}
                        >
                            <div className="relative w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-accent-warm/60 via-warning/30 to-black border border-accent-warm/40 flex items-center justify-center shadow-[0_8px_40px_-8px_rgba(212,165,116,0.45)]">
                                <span className="text-display text-3xl md:text-5xl text-warm-white">
                                    {s.name.charAt(0)}
                                </span>
                            </div>
                            <span className="mt-3 text-warm-white font-body text-sm md:text-base font-semibold">
                                {s.name}
                            </span>
                            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                {s.role}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Manifesto */}
                <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.15, delayChildren: 0.9 } },
                    }}
                    className="mt-10 md:mt-16 text-center space-y-1.5 md:space-y-2"
                >
                    {TEAM_MANIFESTO.map((line, i) => (
                        <motion.li
                            key={i}
                            variants={{
                                hidden: { opacity: 0, y: 8 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            className="text-warm-white-muted text-base md:text-xl font-body italic"
                        >
                            {line}
                        </motion.li>
                    ))}
                </motion.ul>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="mt-10 md:mt-16 flex items-end justify-between gap-4"
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
