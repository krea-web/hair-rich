"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
    fetchServices,
    assetImageUrl,
    assetImageSrcset,
} from "@/lib/supabase/queries";
import type { Service } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/format";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

// Cover image per active service slug — sourced from the asset bucket so
// the stories use real salon shots, matching the desktop ServiceCatalog.
const COVER: Record<string, string> = {
    "taglio-classico": "salone-team-staff.webp",
    "barba-sartoriale": "salone-vista-completa.webp",
    "taglio-barba": "salone-interno-postazioni.webp",
};

const POETIC: Record<string, string> = {
    "taglio-classico": "Forbice, controllo, niente fronzoli.",
    "barba-sartoriale": "Asciugamano caldo, rasoio classico, olio sulla pelle.",
    "taglio-barba": "Un'ora intera. Capelli e barba in continuità.",
};

const STORY_DURATION_MS = 6500;

/**
 * Instagram-style stories for the mobile /servizi entry. Each service is a
 * full-bleed story with cover photo, name, poetic one-liner, price and a
 * Prenota CTA. Auto-advances every ~6.5s, swipe horizontally to jump, tap
 * left/right edge to step, tap center to pause/resume.
 *
 * Renders only on mobile (md:hidden) — desktop already gets the editorial
 * ServiceCatalog with side-by-side layouts that work better on wide screens.
 */
export function ServiceStories() {
    const [services, setServices] = useState<Service[]>([]);
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const rafRef = useRef<number | null>(null);
    const tStart = useRef<number>(0);
    const tAcc = useRef<number>(0);
    const dragX = useMotionValue(0);
    const opacity = useTransform(dragX, [-200, 0, 200], [0.55, 1, 0.55]);

    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);

    useEffect(() => {
        fetchServices().then(setServices).catch(() => undefined);
    }, []);

    // Progress loop with RAF
    useEffect(() => {
        if (services.length === 0) return;
        if (paused) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            return;
        }
        tStart.current = performance.now() - tAcc.current;
        const tick = (now: number) => {
            const elapsed = now - tStart.current;
            const p = Math.min(1, elapsed / STORY_DURATION_MS);
            setProgress(p);
            if (p >= 1) {
                tAcc.current = 0;
                setActive((a) => (a + 1) % services.length);
            } else {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            tAcc.current = (performance.now() - tStart.current) % STORY_DURATION_MS;
        };
    }, [paused, active, services.length]);

    // Reset accumulator when changing story
    useEffect(() => {
        tAcc.current = 0;
        setProgress(0);
    }, [active]);

    if (services.length === 0) return null;
    const cur = services[active];
    if (!cur) return null;

    const cover = COVER[cur.slug];
    const poetic = POETIC[cur.slug] ?? cur.description ?? "";

    const goto = (i: number) => {
        const next = (i + services.length) % services.length;
        setActive(next);
    };

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        if (paused) return;
        const target = e.currentTarget;
        const x = e.clientX - target.getBoundingClientRect().left;
        const w = target.offsetWidth;
        if (x < w * 0.33) goto(active - 1);
        else if (x > w * 0.67) goto(active + 1);
    };

    const handleBook = () => {
        setService(cur.id);
        openDrawer();
    };

    return (
        <section className="md:hidden relative bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
                <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                    Anteprima servizi
                </span>
                <h2 className="text-display text-3xl text-warm-white tracking-tight mt-2 leading-tight">
                    Sfoglia in 60 secondi.
                </h2>
            </div>

            <div className="relative mx-3 mb-10 rounded-[var(--radius-md)] overflow-hidden border border-line bg-carbon">
                {/* Progress bars at top */}
                <div className="absolute top-2 left-2 right-2 z-30 flex gap-1">
                    {services.map((_, i) => (
                        <span
                            key={i}
                            className="flex-1 h-0.5 rounded-full bg-warm-white/20 overflow-hidden"
                        >
                            <span
                                className="block h-full bg-warm-white origin-left"
                                style={{
                                    transform: `scaleX(${i < active ? 1 : i === active ? progress : 0})`,
                                    transformOrigin: "left",
                                    transition: i === active ? "none" : "transform 0.25s linear",
                                }}
                            />
                        </span>
                    ))}
                </div>

                <div
                    className="relative aspect-[4/5] cursor-pointer select-none touch-pan-y"
                    onClick={handleTap}
                    onMouseDown={() => setPaused(true)}
                    onMouseUp={() => setPaused(false)}
                    onMouseLeave={() => setPaused(false)}
                    onTouchStart={() => setPaused(true)}
                    onTouchEnd={() => setPaused(false)}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={cur.id}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.25}
                            onDragEnd={(_, info) => {
                                const t = 60;
                                if (info.offset.x < -t) goto(active + 1);
                                else if (info.offset.x > t) goto(active - 1);
                            }}
                            style={{ x: dragX, opacity }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            {cover && (
                                <img
                                    src={assetImageUrl(cover, { width: 900, quality: 82, format: "webp" })}
                                    srcSet={assetImageSrcset(cover, 82)}
                                    sizes="(min-width: 768px) 0px, 100vw"
                                    alt={cur.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                    draggable={false}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none" />

                            {/* Index pill */}
                            <div className="absolute top-7 left-4 z-10 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-line rounded-full">
                                <span className="text-[9px] uppercase tracking-[0.3em] text-warm-white font-body font-semibold">
                                    {String(active + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 z-10">
                                <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                    Servizio
                                </span>
                                <h3 className="text-display text-4xl text-warm-white tracking-tight mt-2 leading-[1.05]">
                                    {cur.name}
                                </h3>
                                <p className="mt-3 text-display-alt text-lg text-silver italic leading-snug max-w-xs">
                                    {poetic}
                                </p>
                                <div className="mt-5 flex items-center justify-between gap-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-display text-2xl text-accent-warm tabular-nums">
                                            {formatPrice(cur.price_cents)}
                                        </span>
                                        <span className="text-warm-white-muted text-xs">
                                            · {cur.duration_min} min
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleBook();
                                        }}
                                        className="cta-shine cta-pulse inline-flex items-center gap-2 px-4 py-2.5 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95"
                                    >
                                        Prenota
                                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <p className="text-center text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold py-3 bg-black-2">
                    Tap ai bordi per scorrere · tieni premuto per pausare
                </p>
            </div>
        </section>
    );
}
