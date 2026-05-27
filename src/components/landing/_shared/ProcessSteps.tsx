"use client";

import { motion } from "framer-motion";

export interface ProcessStep {
    n: string;
    title: string;
    body: string;
}

interface Props {
    eyebrow: string;
    title: string;
    steps: ProcessStep[];
}

export function ProcessSteps({ eyebrow, title, steps }: Props) {
    return (
        <section className="relative py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12 md:mb-16">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        {eyebrow}
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-3 max-w-2xl">
                        {title}
                    </h2>
                </div>

                <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line">
                    {steps.map((s, i) => (
                        <motion.li
                            key={s.n}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative bg-black p-7 md:p-9 group"
                        >
                            <span className="text-display-alt text-5xl md:text-6xl text-accent-warm leading-none block">
                                {s.n}
                            </span>
                            <h3 className="text-display text-xl md:text-2xl text-warm-white mt-4 tracking-tight">
                                {s.title}
                            </h3>
                            <p className="mt-3 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                {s.body}
                            </p>
                        </motion.li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
