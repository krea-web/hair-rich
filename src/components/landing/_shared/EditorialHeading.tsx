"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
    eyebrow?: string;
    title: ReactNode;
    align?: "left" | "center" | "right";
    underline?: boolean;
    className?: string;
}

export function EditorialHeading({
    eyebrow,
    title,
    align = "left",
    underline = true,
    className = "",
}: Props) {
    const alignClasses =
        align === "center" ? "text-center items-center" : align === "right" ? "text-right items-end" : "text-left items-start";

    return (
        <motion.div
            className={`flex flex-col gap-3 ${alignClasses} ${className}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {eyebrow && (
                <span
                    aria-hidden="true"
                    className="text-display-alt text-2xl md:text-3xl text-accent-warm"
                >
                    {eyebrow}
                </span>
            )}
            <h2 className="text-display text-3xl md:text-5xl lg:text-6xl text-warm-white leading-[0.95]">
                {title}
            </h2>
            {underline && (
                <motion.span
                    aria-hidden="true"
                    className="block h-px w-16 bg-accent-warm origin-left"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.7, 0, 0.3, 1], delay: 0.3 }}
                />
            )}
        </motion.div>
    );
}
