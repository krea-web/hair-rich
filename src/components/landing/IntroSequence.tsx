"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 103;
const framePath = (i: number) => `/hero-seq/frame_${String(i).padStart(3, "0")}.webp`;

/**
 * Full-viewport scroll-driven intro sequence: the rose+scissors composition
 * lifts away as the user scrolls through 103 webp frames. Sits before
 * HeroSection. The subject is rendered with `contain` (no cropping) plus a
 * subtle inset margin so the composition is well framed on every viewport.
 */
export function IntroSequence() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imagesReady, setImagesReady] = useState(false);
    const imagesRef = useRef<HTMLImageElement[]>([]);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    // Animation completes at 0.92 of progress, last 8% holds the final frame
    // so the transition into the hero section feels intentional, not abrupt.
    const frameIndex = useTransform(scrollYProgress, [0, 0.92], [1, FRAME_COUNT]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

    useEffect(() => {
        let cancelled = false;
        const imgs: HTMLImageElement[] = [];
        let loaded = 0;

        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            const done = () => {
                if (cancelled) return;
                loaded++;
                if (loaded === FRAME_COUNT) {
                    imagesRef.current = imgs;
                    setImagesReady(true);
                    drawFrame(imgs[0]);
                }
            };
            img.onload = done;
            img.onerror = done;
            img.src = framePath(i);
            imgs.push(img);
        }

        return () => {
            cancelled = true;
        };
    }, []);

    // The source frames are 907×800 with the rose+scissors content ANCHORED
    // to the right edge (bbox x=209→906 on frame 1). Naive centering pushes
    // the icon visibly off-centre to the right, so we position by the icon
    // CONTENT centre — found empirically from frame 1 — and let the empty
    // left padding spill off-canvas where it harmlessly merges with the
    // black page background.
    const ICON_CENTER_X_SRC = 557;

    const drawFrame = (img?: HTMLImageElement) => {
        if (!img || !img.naturalWidth || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.naturalWidth;
        const vRatio = canvas.height / img.naturalHeight;
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const isPortrait = canvasAspect < imgAspect;

        // Portrait viewports: fit by width and apply a 1.3× presence bump.
        // The bump only eats into the empty left-side padding (x=0–208 of
        // the source), never the icon itself, so the scissors feel BIG on
        // mobile without losing the blade tips.
        // Landscape viewports: fit by height so the composition fills the
        // viewport vertically.
        const ratio = isPortrait ? hRatio * 1.3 : vRatio;
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        const x = canvas.width / 2 - ICON_CENTER_X_SRC * ratio;
        // Top-anchored: the subject visually exits through the very top edge
        // of the screen as the animation progresses.
        const y = 0;
        ctx.drawImage(img, x, y, w, h);
    };

    useMotionValueEvent(frameIndex, "change", (latest) => {
        if (!imagesRef.current.length) return;
        const idx = Math.min(Math.max(Math.floor(latest) - 1, 0), FRAME_COUNT - 1);
        drawFrame(imagesRef.current[idx]);
    });

    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = canvas.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect.width * dpr));
            const h = Math.max(1, Math.floor(rect.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            const idx = Math.min(Math.max(Math.floor(frameIndex.get()) - 1, 0), FRAME_COUNT - 1);
            drawFrame(imagesRef.current[idx]);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [imagesReady, frameIndex]);

    return (
        <section
            ref={sectionRef}
            className="relative bg-black"
            aria-label="Intro"
            data-intro-sequence
        >
            <div className="h-[260vh] md:h-[280vh]">
                <div className="sticky top-0 h-[100dvh] overflow-hidden bg-black">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                        aria-hidden="true"
                    />

                    {!imagesReady && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2 flex items-center justify-center">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Caricamento…
                            </span>
                        </div>
                    )}

                    {/* Scroll hint */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                        style={{ opacity: hintOpacity }}
                    >
                        <div className="flex flex-col items-center gap-2 text-silver-dark">
                            <span className="text-[10px] tracking-[0.4em] uppercase font-body font-semibold">
                                <span className="md:hidden">Scorri per scoprire</span>
                                <span className="hidden md:inline">Scroll</span>
                            </span>
                            <motion.div
                                className="w-px h-10 md:h-12 bg-gradient-to-b from-silver to-transparent"
                                animate={{ scaleY: [1, 0.3, 1] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                style={{ transformOrigin: "top" }}
                            />
                        </div>
                    </motion.div>

                    <span className="absolute right-3 top-6 text-[10px] tracking-[0.5em] uppercase text-silver-dark font-body font-semibold rotate-180 [writing-mode:vertical-rl]">
                        EST. 2017
                    </span>
                </div>
            </div>
        </section>
    );
}
