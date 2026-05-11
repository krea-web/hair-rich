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

/**
 * Logo separator — renders `/logo-icona.png` (848×736) in full at its
 * natural aspect ratio. The image content (rose+scissors above, HAIRRICH
 * wordmark below) fills 95% of the source bbox vertically, so the visual
 * centre is close enough to the geometric centre that flex `items-center`
 * lines it up correctly with the marquee text on every variant.
 */
function LogoSeparator({
    size = 32,
    opacity = 1,
    tone = "silver",
}: {
    size?: number;
    opacity?: number;
    tone?: "silver" | "ink";
}) {
    const SOURCE_ASPECT = 848 / 736; // ≈ 1.152
    const width = Math.round(size * SOURCE_ASPECT);
    return (
        <img
            src="/logo-icona.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="block shrink-0 select-none pointer-events-none"
            style={{
                height: `${size}px`,
                width: `${width}px`,
                opacity,
                filter: tone === "ink" ? "brightness(0) saturate(100%)" : undefined,
            }}
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
                className="relative overflow-hidden"
                style={{
                    background:
                        "linear-gradient(180deg, #B8843D 0%, #D9A663 22%, #F2D49A 50%, #D9A663 78%, #A4702C 100%)",
                    boxShadow:
                        "inset 0 1px 0 rgba(255,236,200,0.55), inset 0 -1px 0 rgba(0,0,0,0.32), 0 1px 0 rgba(0,0,0,0.4)",
                }}
                aria-hidden="true"
            >
                {/* subtle horizontal sheen */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 18%, rgba(255,255,255,0.14) 50%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.18) 100%)",
                    }}
                />
                <MarqueeTrack
                    items={items}
                    speedSec={speedSec ?? 22}
                    direction="left"
                    gapClass="gap-7 md:gap-12"
                >
                    {(item, i) => {
                        const italic = i % 2 === 1;
                        return (
                            <span
                                key={`${item}-${i}`}
                                className="inline-flex items-center gap-6 md:gap-10 py-3.5 md:py-4 leading-none"
                                style={{ color: "#1a0f04" }}
                            >
                                {italic ? (
                                    <span className="text-display-alt text-2xl md:text-3xl leading-none">
                                        {item}
                                    </span>
                                ) : (
                                    <span className="text-display text-[11px] md:text-sm tracking-[0.42em] font-semibold uppercase leading-none">
                                        {item}
                                    </span>
                                )}
                                <LogoSeparator size={40} tone="ink" opacity={0.85} />
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
                                <LogoSeparator size={48} opacity={0.9} />
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
                            <LogoSeparator size={60} opacity={0.95} />
                        </span>
                    );
                }}
            </MarqueeTrack>
        </div>
    );
}
