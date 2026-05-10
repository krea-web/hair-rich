"use client";

import { motion } from "framer-motion";

interface Props {
    /**
     * - "wordmark" → wordmark esteso "HAIRRICH" (per navbar, hero, footer)
     * - "mark"     → logo icona completo (scissors + rosa + HAIRRICH) per accent decorativi
     */
    variant?: "wordmark" | "mark";
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
    animated?: boolean;
}

const SIZES = {
    xs: "h-6",
    sm: "h-9",
    md: "h-14",
    lg: "h-24",
    xl: "h-36",
    "2xl": "h-52",
};

const SRC: Record<NonNullable<Props["variant"]>, string> = {
    wordmark: "/hairrich-logoesteso.png", // wide HAIRRICH text only
    mark: "/logo-icona.png",                // full scissors + rosa + HAIRRICH
};

export function Wordmark({
    variant = "wordmark",
    size = "md",
    className = "",
    animated = false,
}: Props) {
    const sizeClass = SIZES[size];
    const src = SRC[variant];
    const altText = variant === "mark" ? "Hair Rich · Olbia" : "Hair Rich";

    const Image = (
        <img
            src={src}
            alt={altText}
            className={`${sizeClass} w-auto select-none pointer-events-none`}
            loading="eager"
            decoding="async"
            draggable={false}
        />
    );

    if (!animated) return <div className={className}>{Image}</div>;

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {Image}
        </motion.div>
    );
}
