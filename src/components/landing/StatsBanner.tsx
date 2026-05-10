"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STATS = [
    { value: 8, suffix: "+", label: "Anni di Attività" },
    { value: 5000, suffix: "+", label: "Clienti Soddisfatti" },
    { value: 150, suffix: "+", label: "Stili Realizzati" },
    { value: 4.9, suffix: "/5", label: "Recensioni Medie", isFloat: true },
];

function CountUp({
    target,
    duration = 1800,
    isFloat = false,
}: {
    target: number;
    duration?: number;
    isFloat?: boolean;
}) {
    const [value, setValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!inView) return;
        const start = performance.now();
        let raf = 0;
        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, target, duration]);

    const display = isFloat
        ? value.toFixed(1).replace(".", ",")
        : Math.floor(value).toLocaleString("it-IT");

    return <span ref={ref}>{display}</span>;
}

export function StatsBanner() {
    return (
        <section
            aria-label="Statistiche"
            className="relative bg-black border-y border-line py-10 md:py-14 px-6 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        className="relative text-center group"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                    >
                        {/* Vertical separator (between items, not after the last) */}
                        {i < STATS.length - 1 && (
                            <span
                                aria-hidden="true"
                                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-line"
                            />
                        )}

                        <div className="text-display text-4xl md:text-5xl lg:text-6xl text-accent-warm tabular-nums font-semibold">
                            <CountUp target={stat.value} isFloat={stat.isFloat} />
                            <span className="text-silver">{stat.suffix}</span>
                        </div>
                        <div className="mt-3 text-[10px] md:text-xs uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
