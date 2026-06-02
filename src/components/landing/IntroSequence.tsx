"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/useLang";
import type { Locale } from "@/i18n/types";

const FRAME_COUNT = 102;
// Bump FRAMES_VERSION every time the source webp assets change shape (e.g.
// after a re-crop). The query string forces stale service-worker caches and
// browser HTTP caches to revalidate, so the JS positioning math never gets
// mismatched against an older asset version.
const FRAMES_VERSION = "v4";
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

    // Phase 1 — frames animate in the first ~half of the scroll budget.
    // Phase 2 — welcome word reveals at scrollY 0.18 and STAYS until the
    //           section ends, so when the user scrolls past, the welcome
    //           is the last thing visible and the hero slides in
    //           immediately behind it — no black tail.
    const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);
    const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const lang = useLang();

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

    // Drawing strategy: scale ogni frame in modo che riempia ESATTAMENTE
    // la dimensione più vincolante del canvas (object-contain), poi
    // centra orizzontalmente E verticalmente. Cosi' la forbice/rosa sta
    // sempre al centro del canvas con i bordi che toccano i lati del
    // viewport intro a seconda dell'aspect — niente piu' offset
    // asimmetrico, niente piu' subject pinned a top.
    const drawFrame = (img?: HTMLImageElement, progress: number = 0) => {
        if (!img || !img.naturalWidth || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scaleX = canvas.width / img.naturalWidth;
        const scaleY = canvas.height / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (canvas.width - w) / 2;
        // Subject parte spostato verso l'ALTO (15% del canvas) per non
        // coprire la welcome "Benvenuto" in basso. Durante l'animazione
        // un offset negativo cresce con il progress -> il subject ESCE
        // dal bordo top del canvas alla fine della sequenza.
        const baseY = (canvas.height - h) * 0.15;
        const exitOffset = progress * canvas.height * 0.6;
        const y = baseY - exitOffset;
        ctx.drawImage(img, x, y, w, h);
    };

    useMotionValueEvent(frameIndex, "change", (latest) => {
        if (!imagesRef.current.length) return;
        const idx = Math.min(Math.max(Math.floor(latest) - 1, 0), FRAME_COUNT - 1);
        const progress = idx / (FRAME_COUNT - 1);
        drawFrame(imagesRef.current[idx], progress);
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
            const progress = idx / (FRAME_COUNT - 1);
            drawFrame(imagesRef.current[idx], progress);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [imagesReady, frameIndex]);

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

    // Auto-skip al primo input scroll: appena l'utente tocca rotellina o
    // swipe verso il basso, scroll smooth fino a fine intro -> niente
    // schermo nero durante la sequenza frame-by-frame.
    useEffect(() => {
        let triggered = false;
        const onUserScroll = () => {
            if (triggered) return;
            const section = sectionRef.current;
            if (!section) return;
            // Solo se siamo ancora dentro la intro section
            if (document.body.dataset.introActive !== "true") return;
            const sectionTop = section.offsetTop;
            const sectionEnd = sectionTop + section.offsetHeight;
            if (window.scrollY >= sectionEnd) return;
            triggered = true;
            window.scrollTo({ top: sectionEnd, behavior: "smooth" });
            // Lascia che il browser termini lo smooth scroll prima di
            // marcare intro come terminata.
            window.setTimeout(() => {
                document.body.dataset.introActive = "false";
            }, 800);
        };
        const opts: AddEventListenerOptions = { passive: true };
        window.addEventListener("wheel", onUserScroll, opts);
        window.addEventListener("touchmove", onUserScroll, opts);
        window.addEventListener("keydown", (e) => {
            if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key)) onUserScroll();
        });
        return () => {
            window.removeEventListener("wheel", onUserScroll);
            window.removeEventListener("touchmove", onUserScroll);
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
            <div className="h-[150vh] md:h-[160vh] lg:h-[150vh] xl:h-[145vh] 2xl:h-[140vh]">
                <div className="sticky top-0 h-[100dvh] overflow-hidden bg-black">
                    {/* Skip button — desktop only (mobile users just scroll past). */}
                    <button
                        onClick={handleSkip}
                        className="hidden md:inline-flex absolute top-24 right-7 z-30 items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-line text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white hover:text-black transition-colors active:scale-95"
                        aria-label="Salta intro"
                    >
                        Salta
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>

                    {/* Inner padded wrapper: pushes the canvas (and the welcome
                       overlay) below the fixed navbar so frame 1 is never
                       clipped behind it. Mobile fills full width (subject is
                       portrait, viewport is portrait — match). Desktop caps
                       the canvas width so the subject doesn't bloat across a
                       16:9 viewport. */}
                    <div className="absolute inset-0 pt-[68px] md:pt-[80px]">
                        <div className="w-full h-full mx-auto md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full block"
                                aria-hidden="true"
                            />
                        </div>
                    </div>

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

                    <span className="hidden md:inline absolute right-3 top-24 text-[10px] tracking-[0.5em] uppercase text-silver-dark font-body font-semibold rotate-180 [writing-mode:vertical-rl]">
                        EST. 2017
                    </span>

                    {/* Welcome word — mobile only. On desktop the constrained
                       canvas already breathes inside a wide viewport and the
                       welcome text was competing with the subject + hero text
                       below, so it's mobile-only by design. */}
                    <motion.div
                        className="md:hidden absolute inset-x-0 bottom-[15%] flex items-center justify-center pointer-events-none z-20 px-6"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                        aria-hidden="true"
                    >
                        <span className="text-display-alt text-warm-white text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] tracking-[0.02em] text-center whitespace-nowrap leading-none drop-shadow-[0_4px_40px_rgba(212,165,116,0.45)]">
                            {welcomeText}
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
