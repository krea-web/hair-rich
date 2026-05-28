"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";

interface Pair {
    before: string; // storage_path
    after: string;
    title: string;
    note?: string;
}

// Single real before/after pair shot in salon. Same client, same chair,
// same lighting — the only variable is the cut.
const REAL_PAIR: Pair = {
    before: "trasformazione-prima.webp",
    after: "trasformazione-dopo.webp",
    title: "Bowl cut + low fade · taglio sartoriale Hair Rich",
    note: "Stessa testa, stesso sguardo. Solo il taglio cambia.",
};

interface Props {
    pair?: Pair;
}

export function BeforeAfterSlider({ pair = REAL_PAIR }: Props) {
    return (
        <section className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-20 bg-black-2 border-y border-line overflow-hidden">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12 md:mb-16 text-center md:text-left">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        Trasformazione
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Prima e dopo, senza filtri.
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Trascina il cursore per vedere il cambiamento. Stessa luce, stessa angolazione,
                        zero ritocco digitale.
                    </p>
                </div>

                <Compare pair={pair} />
            </div>
        </section>
    );
}

function Compare({ pair }: { pair: Pair }) {
    const [pos, setPos] = useState(50);
    const ref = useRef<HTMLDivElement>(null);

    // Native listeners attached via useEffect — React's synthetic
    // PointerEvent handlers attach as passive on iOS Safari, which both
    // breaks preventDefault and occasionally drops events when the finger
    // glides over child elements. Going native + window-level move/up
    // gives us reliable cross-browser behaviour, particularly on iOS.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let dragging = false;

        const clientXFromEvent = (e: PointerEvent | TouchEvent): number | null => {
            if ("clientX" in e) return (e as PointerEvent).clientX;
            const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
            return t ? t.clientX : null;
        };

        const update = (clientX: number) => {
            const rect = el.getBoundingClientRect();
            const x = clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setPos(pct);
        };

        const onDown = (e: PointerEvent | TouchEvent) => {
            const cx = clientXFromEvent(e);
            if (cx == null) return;
            dragging = true;
            update(cx);
            // Stop the page from rubber-banding while we drag.
            if (e.cancelable) e.preventDefault();
        };

        const onMove = (e: PointerEvent | TouchEvent) => {
            if (!dragging) return;
            const cx = clientXFromEvent(e);
            if (cx == null) return;
            update(cx);
            if (e.cancelable) e.preventDefault();
        };

        const onUp = () => {
            dragging = false;
        };

        // Pointer events where available
        const hasPointer = typeof window !== "undefined" && "PointerEvent" in window;
        if (hasPointer) {
            el.addEventListener("pointerdown", onDown as EventListener, { passive: false });
            window.addEventListener("pointermove", onMove as EventListener, { passive: false });
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        } else {
            // Fallback: touch + mouse
            el.addEventListener("touchstart", onDown as EventListener, { passive: false });
            window.addEventListener("touchmove", onMove as EventListener, { passive: false });
            window.addEventListener("touchend", onUp);
            window.addEventListener("touchcancel", onUp);
            el.addEventListener("mousedown", onDown as EventListener);
            window.addEventListener("mousemove", onMove as EventListener);
            window.addEventListener("mouseup", onUp);
        }

        return () => {
            if (hasPointer) {
                el.removeEventListener("pointerdown", onDown as EventListener);
                window.removeEventListener("pointermove", onMove as EventListener);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
            } else {
                el.removeEventListener("touchstart", onDown as EventListener);
                window.removeEventListener("touchmove", onMove as EventListener);
                window.removeEventListener("touchend", onUp);
                window.removeEventListener("touchcancel", onUp);
                el.removeEventListener("mousedown", onDown as EventListener);
                window.removeEventListener("mousemove", onMove as EventListener);
                window.removeEventListener("mouseup", onUp);
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
        >
            <div
                ref={ref}
                role="slider"
                aria-label={`Confronto prima/dopo: ${pair.title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
                    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
                }}
                className="relative aspect-[3/4] lg:aspect-[4/5] xl:aspect-[1/1] w-full max-h-[640px] lg:max-h-[720px] xl:max-h-[760px] 2xl:max-h-[800px] mx-auto rounded-[var(--radius-md)] border border-line overflow-hidden cursor-ew-resize select-none focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent-warm"
                style={{
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    touchAction: "none",
                    WebkitTouchCallout: "none",
                }}
            >
                {/* After (sfondo full) */}
                <img
                    src={portfolioImageUrl(pair.after, { width: 1200, quality: 82, format: "webp" })}
                    alt={`Dopo: ${pair.title}`}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
                {/* Before (clip) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
                >
                    <img
                        src={portfolioImageUrl(pair.before, { width: 1200, quality: 82, format: "webp" })}
                        alt={`Prima: ${pair.title}`}
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                {/* Labels — small badges, both with the same compact glass
                    treatment so neither competes with the photo subject. */}
                <span className="absolute top-3 left-3 md:top-4 md:left-4 bg-black/65 backdrop-blur-md text-warm-white text-[9px] uppercase tracking-[0.3em] font-body font-semibold px-2.5 py-1 rounded-full border border-line pointer-events-none">
                    Prima
                </span>
                <span className="absolute top-3 right-3 md:top-4 md:right-4 bg-accent-warm text-black text-[9px] uppercase tracking-[0.3em] font-body font-semibold px-2.5 py-1 rounded-full pointer-events-none">
                    Dopo
                </span>

                {/* Handle — divider line + circular grip with arrows */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-warm-white pointer-events-none"
                    style={{ left: `${pos}%` }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 w-12 h-12 rounded-full bg-warm-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6M9 6l6 6-6 6" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="text-center md:text-left">
                <span className="text-display text-base md:text-lg text-warm-white tracking-tight block">
                    {pair.title}
                </span>
                {pair.note && (
                    <p className="text-warm-white-muted text-xs md:text-sm mt-1">{pair.note}</p>
                )}
            </div>
        </motion.div>
    );
}
