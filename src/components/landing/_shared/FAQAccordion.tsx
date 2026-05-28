"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export interface FAQItem {
    q: string;
    a: string;
}

interface Props {
    eyebrow: string;
    title: string;
    items: FAQItem[];
}

export function FAQAccordion({ eyebrow, title, items }: Props) {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 md:mb-14 text-center">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        {eyebrow}
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3">
                        {title}
                    </h2>
                </div>

                <ul className="divide-y divide-line border-y border-line">
                    {items.map((it, i) => {
                        const open = openIdx === i;
                        return (
                            <li key={i}>
                                <button
                                    onClick={() => setOpenIdx(open ? null : i)}
                                    className="w-full text-left py-5 md:py-7 flex items-start justify-between gap-6 group"
                                    aria-expanded={open}
                                >
                                    <span className="text-warm-white text-base md:text-lg font-body font-semibold pr-2">
                                        {it.q}
                                    </span>
                                    <span
                                        className={`flex-shrink-0 mt-1 w-7 h-7 rounded-full border border-line flex items-center justify-center text-silver transition-transform ${
                                            open ? "rotate-45 bg-accent-warm border-accent-warm text-black" : "group-hover:border-silver-mid"
                                        }`}
                                        aria-hidden="true"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                        </svg>
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {open && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pb-6 md:pb-8 text-warm-white-muted text-sm md:text-base leading-relaxed pr-12">
                                                {it.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
