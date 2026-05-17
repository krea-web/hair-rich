"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/useLang";
import type { Locale } from "@/i18n/types";

const FRAME_COUNT = 103;
// Bump FRAMES_VERSION every time the source webp assets change shape (e.g.
// after a re-crop). The query string forces stale service-worker caches and
// browser HTTP caches to revalidate, so the JS positioning math never gets
// mismatched against an older asset version.
const FRAMES_VERSION = "v2";
const framePath = (i: number) =>
    `/hero-seq/frame_${String(i).padStart(3, "0")}.webp?v=${FRAMES_VERSION}`;

const WELCOME: Record<Locale, string> = {
    it: "Benvenuto",
    en: "Welcome",
    fr: "Bienvenue",
    de: "Willkommen",
};

const WELCOME_BACK: Record<Locale, string> = {
    it: "Bentornato",
    en: "Welcome back",
    fr: "Bon retour",
    de: "Willkommen zurück",
};

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);
    return isMobile;
}

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

    // Phase 1 — frames animate in the first half of the scroll budget.
    // Phase 2 — welcome word reveals EARLIER (around 30%) so the moment the
    //           subject starts leaving the frame, the welcome text fills the
    //           emerging black space instead of letting it gape.
    const frameIndex = useTransform(scrollYProgress, [0, 0.45], [1, FRAME_COUNT]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const welcomeOpacity = useTransform(
        scrollYProgress,
        [0.28, 0.42, 0.93, 1],
        [0, 1, 1, 0],
    );
    const welcomeY = useTransform(scrollYProgress, [0.28, 0.42], [40, 0]);
    const lang = useLang();
    const isMobile = useIsMobile();

    // Auth detect: choose Benvenuto / Bentornato. Best-effort, defaults to
    // Benvenuto if check fails or session not yet known.
    const [isReturning, setIsReturning] = useState(false);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data } = await supabase.auth.getSession();
                if (!alive) return;
                setIsReturning(!!data.session);
            } catch {
                /* keep default */
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const welcomeText = isReturning ? WELCOME_BACK[lang] : WELCOME[lang];

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

    // Source frames are pre-cropped to 568×615 — a tight wrap around the
    // union bbox of all 103 frames. The pixel-mass-weighted centroid of
    // frame 1 lands at (292, 312) in the cropped coordinate space. Because
    // wasted padding is now baked out of the source itself, plain `contain`
    // scaling already gives the composition genuine presence on every
    // viewport — the previous portrait presence bump is no longer needed.
    const ICON_CENTER_X_SRC = 292;
    const ICON_CENTER_Y_SRC = 312;

    const drawFrame = (img?: HTMLImageElement) => {
        if (!img || !img.naturalWidth || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.naturalWidth;
        const vRatio = canvas.height / img.naturalHeight;
        const ratio = Math.min(hRatio, vRatio);
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        const x = canvas.width / 2 - ICON_CENTER_X_SRC * ratio;
        // Mobile: anchor higher (subject sits near top, so as it animates
        // it exits through the top edge of the screen — feels like the
        // composition is emerging from the liquid-glass navbar). Desktop:
        // keep classic centered framing.
        const verticalAnchor = isMobile ? 0.35 : 0.5;
        const y = canvas.height * verticalAnchor - ICON_CENTER_Y_SRC * ratio;
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
        // isMobile change must redraw because verticalAnchor depends on it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagesReady, frameIndex, isMobile]);

    // Toggle body[data-intro-active] based on whether the intro section is
    // still in front of the user. While active, all floating UI is hidden
    // via the CSS rule on [data-intro-hidden] (see globals.css). Cleared
    // when the section has fully scrolled past the viewport top, and a
    // permanent flag is stored so future visits skip the intro entirely.
    useEffect(() => {
        document.body.dataset.introActive = "true";
        const section = sectionRef.current;
        if (!section) return;

        const onScroll = () => {
            const rect = section.getBoundingClientRect();
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

    const handleSkip = () => {
        const section = sectionRef.current;
        if (section) {
            // Salta al fine sezione: scrollTo + nascondi flag intro
            const bottom = section.offsetTop + section.offsetHeight;
            window.scrollTo({ top: bottom, behavior: "auto" });
        }
        document.body.dataset.introActive = "false";
    };

    return (
        <section
            ref={sectionRef}
            className="relative bg-black"
            aria-label="Intro"
            data-intro-sequence
        >
            <div className="h-[200vh] md:h-[220vh]">
                <div className="sticky top-0 h-[100dvh] overflow-hidden bg-black">
                    {/* Skip button — always visible, top-right */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-5 right-5 md:top-7 md:right-7 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-line text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white hover:text-black transition-colors active:scale-95"
                        aria-label="Salta intro"
                    >
                        Salta
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>

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

                    {/* Phase 2: welcome word fades in as the subject begins to
                       leave the frame. On mobile, sits in the lower half (the
                       subject is anchored higher so the bottom would otherwise
                       be a black void). On desktop, centered. */}
                    <motion.div
                        className="absolute inset-0 flex items-end md:items-center justify-center pointer-events-none z-20 px-6 pb-[28%] md:pb-0"
                        style={{ opacity: welcomeOpacity }}
                        aria-hidden="true"
                    >
                        <motion.span
                            className="text-display-alt text-warm-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-[0.04em] text-center whitespace-nowrap drop-shadow-[0_2px_24px_rgba(212,165,116,0.25)]"
                            style={{ y: welcomeY, willChange: "transform, opacity" }}
                        >
                            {welcomeText}
                        </motion.span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
