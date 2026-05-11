"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/useLang";
import type { Locale } from "@/i18n/types";

const FRAME_COUNT = 103;
const framePath = (i: number) => `/hero-seq/frame_${String(i).padStart(3, "0")}.webp`;

const WELCOME: Record<Locale, string> = {
    it: "Benvenuto",
    en: "Welcome",
    fr: "Bienvenue",
    de: "Willkommen",
};

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

    // Phase 1 — frames animate across the first ~65% of the scroll budget.
    // Phase 2 — the welcome word fades in once the scissors are gone and
    //           holds until the hero starts taking over the viewport.
    const frameIndex = useTransform(scrollYProgress, [0, 0.65], [1, FRAME_COUNT]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const welcomeOpacity = useTransform(
        scrollYProgress,
        [0.7, 0.82, 0.95, 1],
        [0, 1, 1, 0],
    );
    const welcomeY = useTransform(scrollYProgress, [0.7, 0.82], [24, 0]);
    const welcomeLetterSpacing = useTransform(
        scrollYProgress,
        [0.7, 0.95],
        ["0.4em", "0.18em"],
    );
    const lang = useLang();

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

    // The source frames are 907×800. The naive bbox centre (557, 411) is
    // skewed by a thin anti-aliasing artifact on the right edge of every
    // frame. The pixel-mass-weighted centroid of frame 1 lands at (459, 322)
    // — that's the actual optical centre of the rose+scissors composition,
    // and it's what we anchor on so the icon is genuinely centred on screen.
    const ICON_CENTER_X_SRC = 459;
    const ICON_CENTER_Y_SRC = 322;

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
        const y = canvas.height / 2 - ICON_CENTER_Y_SRC * ratio;
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

    // Toggle body[data-intro-active] based on whether the intro section is
    // still in front of the user. While active, all floating UI is hidden
    // via the CSS rule on [data-intro-hidden] (see globals.css). Cleared
    // when the section has fully scrolled past the viewport top.
    useEffect(() => {
        document.body.dataset.introActive = "true";
        const section = sectionRef.current;
        if (!section) return;

        const onScroll = () => {
            const rect = section.getBoundingClientRect();
            // Section is considered "passed" when its bottom edge crosses
            // the top of the viewport.
            if (rect.bottom <= 0) {
                document.body.dataset.introActive = "false";
            } else {
                document.body.dataset.introActive = "true";
            }
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            delete document.body.dataset.introActive;
        };
    }, []);

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

                    {/* Phase 2: welcome word fades in at the centre of the
                       black space once the scissors animation completes. */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                        style={{ opacity: welcomeOpacity }}
                        aria-hidden="true"
                    >
                        <motion.span
                            className="text-display-alt text-warm-white text-5xl md:text-8xl lg:text-9xl"
                            style={{ y: welcomeY, letterSpacing: welcomeLetterSpacing }}
                        >
                            {WELCOME[lang]}
                        </motion.span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
