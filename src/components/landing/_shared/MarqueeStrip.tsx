"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
    items: string[];
    /** "headline" = riga editorial cinematic · "duo" = due righe controdirezione · "ribbon" = strip oro */
    variant?: "headline" | "duo" | "ribbon";
    speedSec?: number;
    accent?: string;
}

const Asterisk = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="M12 1.5l1.6 7.4 7.4 1.6-7.4 1.6L12 19.5l-1.6-7.4-7.4-1.6 7.4-1.6L12 1.5z" />
    </svg>
);

/** Logo icona usato come separatore (animato in rotazione lenta) */
function LogoSeparator({ size = 32, opacity = 1 }: { size?: number; opacity?: number }) {
    return (
        <img
            src="/logo-icona.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="select-none pointer-events-none object-contain"
            style={{ height: `${size}px`, width: `${size}px`, opacity }}
        />
    );
}

function MarqueeTrack({
    items,
    speedSec,
    direction = "left",
    children,
    gapClass = "gap-12 md:gap-20",
}: {
    items: string[];
    speedSec: number;
    direction?: "left" | "right";
    children: (item: string, i: number) => React.ReactNode;
    gapClass?: string;
}) {
    const reduced = useReducedMotion();
    const loop = [...items, ...items, ...items, ...items];
    const xKeyframes = direction === "left" ? ["0%", "-25%"] : ["-25%", "0%"];

    return (
        <motion.div
            className={`flex items-center ${gapClass} whitespace-nowrap will-change-transform`}
            animate={reduced ? undefined : { x: xKeyframes }}
            transition={
                reduced ? undefined : { duration: speedSec, ease: "linear", repeat: Infinity }
            }
        >
            {loop.map((it, i) => children(it, i))}
        </motion.div>
    );
}

export function MarqueeStrip({
    items,
    variant = "headline",
    speedSec,
    accent,
}: Props) {
    const accentColor = accent ?? "var(--accent-warm)";

    if (variant === "ribbon") {
        return (
            <div
                className="relative overflow-hidden border-y border-accent-warm"
                style={{
                    background:
                        "linear-gradient(90deg, var(--accent-warm) 0%, #E5BB8A 50%, var(--accent-warm) 100%)",
                }}
                aria-hidden="true"
            >
                <MarqueeTrack
                    items={items}
                    speedSec={speedSec ?? 22}
                    direction="left"
                    gapClass="gap-6 md:gap-10"
                >
                    {(item, i) => {
                        const italic = i % 2 === 1;
                        return (
                            <span
                                key={`${item}-${i}`}
                                className="inline-flex items-center gap-5 md:gap-8 py-3 text-black"
                            >
                                {italic ? (
                                    <span className="text-display-alt text-xl md:text-2xl">
                                        {item}
                                    </span>
                                ) : (
                                    <span className="text-display text-xs md:text-sm tracking-[0.4em] font-semibold uppercase">
                                        {item}
                                    </span>
                                )}
                                {/* Logo icona separator: silver su oro = bronzo, con drop-shadow
                                   per leggibilità */}
                                <span className="mix-blend-multiply">
                                    <LogoSeparator size={40} />
                                </span>
                            </span>
                        );
                    }}
                </MarqueeTrack>
            </div>
        );
    }

    if (variant === "duo") {
        return (
            <div
                className="relative bg-black border-y border-line py-3 md:py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
                aria-hidden="true"
            >
                <div className="space-y-1 md:space-y-2">
                    <MarqueeTrack items={items} speedSec={speedSec ?? 22} direction="left">
                        {(item, i) => (
                            <span key={`a-${item}-${i}`} className="inline-flex items-center gap-8 md:gap-12">
                                <span className="text-display-alt text-2xl md:text-4xl text-warm-white">
                                    {item}
                                </span>
                                <LogoSeparator size={32} opacity={0.85} />
                            </span>
                        )}
                    </MarqueeTrack>

                    <MarqueeTrack
                        items={[...items].reverse()}
                        speedSec={(speedSec ?? 22) + 4}
                        direction="right"
                    >
                        {(item, i) => (
                            <span key={`b-${item}-${i}`} className="inline-flex items-center gap-8 md:gap-12">
                                <span
                                    className="text-display text-2xl md:text-4xl tracking-[0.18em] font-semibold"
                                    style={{
                                        color: "transparent",
                                        WebkitTextStroke: "1px var(--silver-dark)",
                                    }}
                                >
                                    {item}
                                </span>
                                <Asterisk className="w-3 h-3 md:w-4 md:h-4 text-silver-dark" />
                            </span>
                        )}
                    </MarqueeTrack>
                </div>
            </div>
        );
    }

    // headline (default): logo icona come separatore
    return (
        <div
            className="relative bg-black border-y border-line py-4 md:py-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
            aria-hidden="true"
        >
            <MarqueeTrack
                items={items}
                speedSec={speedSec ?? 22}
                direction="left"
                gapClass="gap-7 md:gap-12"
            >
                {(item, i) => {
                    const isItalic = i % 2 === 1;
                    return (
                        <span
                            key={`${item}-${i}`}
                            className="inline-flex items-center gap-7 md:gap-12"
                        >
                            {isItalic ? (
                                <span className="text-display-alt text-3xl md:text-5xl text-warm-white leading-none">
                                    {item.toLowerCase()}
                                </span>
                            ) : (
                                <span className="text-display text-2xl md:text-4xl tracking-[0.05em] font-semibold leading-none text-warm-white">
                                    {item}
                                </span>
                            )}
                            <LogoSeparator size={44} opacity={0.9} />
                        </span>
                    );
                }}
            </MarqueeTrack>
        </div>
    );
}
