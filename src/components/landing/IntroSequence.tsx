"use client";

import { motion } from "framer-motion";
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

// ⚠️ Devono combaciare con lo script inline in HomeContent.astro che decide,
// prima dell'hydration, se nascondere la UI flottante (data-intro-active).
const SESSION_KEY = "hr-intro-seen";
const MOBILE_MAX = 768; // breakpoint `md`

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

const SWIPE_HINT: Record<Locale, string> = {
    it: "Scorri verso l'alto",
    en: "Swipe up",
    fr: "Glissez vers le haut",
    de: "Nach oben wischen",
};

function shouldShowIntro(): boolean {
    if (typeof window === "undefined") return false; // SSR → niente
    if (window.innerWidth >= MOBILE_MAX) return false; // desktop mai
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false; // a11y
    try {
        if (sessionStorage.getItem(SESSION_KEY) === "1") return false; // già vista in sessione
    } catch {
        /* sessionStorage bloccato → mostra comunque */
    }
    return true;
}

/**
 * Intro mobile: overlay nero a tutto schermo, SCOLLEGATO dallo scroll della
 * pagina. Lo swipe verso l'alto fa avanzare i 102 frame seguendo il dito
 * (ridisegno via requestAnimationFrame → mai uno schermo nero). Al rilascio
 * del dito (o a fine sequenza) l'overlay si dissolve e rivela la hero già in
 * cima allo schermo. Mostrato una sola volta per sessione, solo su mobile.
 */
export function IntroSequence() {
    const [show, setShow] = useState<boolean>(() => shouldShowIntro());
    if (!show) return null;
    return <IntroOverlay onDismissed={() => setShow(false)} />;
}

const DISMISS_THRESHOLD = 0.2; // rilascio oltre il 20% → completa; sotto → snap-back
const FADE_MS = 480;

function IntroOverlay({ onDismissed }: { onDismissed: () => void }) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [imagesReady, setImagesReady] = useState(false);
    const [dismissing, setDismissing] = useState(false);
    const [interacted, setInteracted] = useState(false);

    const lang = useLang();
    const onDismissedRef = useRef(onDismissed);
    onDismissedRef.current = onDismissed;

    const progressRef = useRef(0); // 0..1 — verità per il paint
    const targetRef = useRef(0); // ease verso questo (snap-back / completamento)
    const draggingRef = useRef(false);
    const startYRef = useRef(0);
    const startProgRef = useRef(0);
    const dismissingRef = useRef(false);
    const imagesReadyRef = useRef(false);

    // Auth detect: Benvenuto / Bentornato. Best-effort, default Benvenuto.
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

    // Disegno: object-contain centrato orizzontalmente, subject spostato in
    // alto del 15% e che ESCE dal bordo top man mano che progress→1. Frame ed
    // exit-offset derivano dallo STESSO progress → nessuno stato incoerente,
    // sempre un frame valido da dipingere.
    const paint = (p: number) => {
        const canvas = canvasRef.current;
        const imgs = imagesRef.current;
        if (!canvas || !imgs.length) return;
        const idx = Math.min(Math.max(Math.round(p * (FRAME_COUNT - 1)), 0), FRAME_COUNT - 1);
        const img = imgs[idx];
        if (!img || !img.naturalWidth) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (canvas.width - w) / 2;
        const baseY = (canvas.height - h) * 0.15;
        ctx.drawImage(img, x, baseY - p * canvas.height * 0.6, w, h);
    };

    const triggerDismiss = () => {
        if (dismissingRef.current) return;
        dismissingRef.current = true;
        setDismissing(true); // overlay opacity 1→0
        try {
            sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
            /* noop */
        }
        window.scrollTo(0, 0); // difensivo: pagina in cima
        document.body.dataset.introActive = "false"; // sblocca scroll + rivela UI sotto
        window.setTimeout(() => onDismissedRef.current(), FADE_MS); // smonta dopo il fade
    };

    // Difensivo: lo script inline ha già messo data-intro-active="true", ma lo
    // riaffermiamo al mount (l'overlay esiste solo quando l'intro va mostrata).
    useEffect(() => {
        document.body.dataset.introActive = "true";
    }, []);

    // Preload eager dei 102 frame.
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
                    imagesReadyRef.current = true;
                    setImagesReady(true);
                    paint(0);
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

    // Canvas sizing (devicePixelRatio) + ridisegno del frame corrente.
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
            paint(progressRef.current);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Loop rAF: dipinge SEMPRE il frame corrente (mai un buco nero). Durante il
    // drag segue il dito 1:1; fuori dal drag fa ease verso target (snap-back o
    // completamento) e, arrivato a fine, fa partire il dismiss.
    useEffect(() => {
        let running = true;
        const loop = () => {
            if (!running) return;
            if (!draggingRef.current) {
                const cur = progressRef.current;
                const diff = targetRef.current - cur;
                progressRef.current = Math.abs(diff) > 0.001 ? cur + diff * 0.18 : targetRef.current;
            }
            paint(progressRef.current);
            if (!dismissingRef.current && progressRef.current >= 0.999 && targetRef.current >= 0.999) {
                triggerDismiss();
            }
            rafId = requestAnimationFrame(loop);
        };
        let rafId = requestAnimationFrame(loop);
        return () => {
            running = false;
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Touch scrubbing sulla superficie (il bottone "Salta" è fuori da questa
    // superficie, così il suo tap non viene catturato dal preventDefault).
    useEffect(() => {
        const el = surfaceRef.current;
        if (!el) return;
        const dist = () => window.innerHeight * 0.8; // swipe quasi-full per completare
        const onStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (!imagesReadyRef.current || !touch) return;
            draggingRef.current = true;
            setInteracted(true);
            startYRef.current = touch.clientY;
            startProgRef.current = progressRef.current;
        };
        const onMove = (e: TouchEvent) => {
            if (!draggingRef.current) return;
            e.preventDefault(); // blocca scroll pagina + gesture browser (anche iOS)
            const touch = e.touches[0];
            if (!touch) return;
            const dy = startYRef.current - touch.clientY; // su = positivo
            const p = Math.min(Math.max(startProgRef.current + dy / dist(), 0), 1);
            progressRef.current = p;
            if (p >= 1) {
                draggingRef.current = false;
                targetRef.current = 1;
            }
        };
        const onEnd = (e: TouchEvent) => {
            if (!draggingRef.current) return;
            e.preventDefault();
            draggingRef.current = false;
            targetRef.current = progressRef.current >= DISMISS_THRESHOLD ? 1 : 0;
        };
        el.addEventListener("touchstart", onStart, { passive: false });
        el.addEventListener("touchmove", onMove, { passive: false });
        el.addEventListener("touchend", onEnd, { passive: false });
        el.addEventListener("touchcancel", onEnd, { passive: false });
        return () => {
            el.removeEventListener("touchstart", onStart);
            el.removeEventListener("touchmove", onMove);
            el.removeEventListener("touchend", onEnd);
            el.removeEventListener("touchcancel", onEnd);
        };
    }, []);

    const handleSkip = () => {
        if (!imagesReadyRef.current) return;
        draggingRef.current = false;
        setInteracted(true);
        targetRef.current = 1; // il loop fa ease fino a fine → dismiss
    };

    return (
        <div
            ref={overlayRef}
            className={`fixed inset-0 z-[95] bg-black overflow-hidden transition-opacity ease-out ${dismissing ? "opacity-0" : "opacity-100"}`}
            style={{ touchAction: "none", transitionDuration: `${FADE_MS}ms` }}
            aria-label="Intro"
            aria-hidden={dismissing || undefined}
        >
            {/* Tap-to-skip (a11y / escape). Fuori dalla superficie touch così il
               tap non viene mangiato dal preventDefault dello scrubbing. */}
            <button
                onClick={handleSkip}
                disabled={!imagesReady}
                className="absolute top-[max(env(safe-area-inset-top,0px),16px)] right-4 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-line text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold transition-opacity duration-500 disabled:opacity-0 active:scale-95"
                aria-label="Salta intro"
            >
                Salta
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>

            <div ref={surfaceRef} className="absolute inset-0 z-10" style={{ touchAction: "none" }}>
                {/* Inner padded wrapper: tiene la composizione centrata come prima
                   (clear dell'area dove c'era la top bar). */}
                <div className="absolute inset-0 pt-[68px]">
                    <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />
                </div>

                {!imagesReady && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2 flex items-center justify-center">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Caricamento…
                        </span>
                    </div>
                )}

                {/* Hint "swipe up" — sparisce alla prima interazione */}
                {imagesReady && !interacted && (
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-2 text-silver-dark"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <motion.svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-7 7m7-7 7 7" />
                        </motion.svg>
                        <span className="text-[10px] tracking-[0.4em] uppercase font-body font-semibold">
                            {SWIPE_HINT[lang]}
                        </span>
                    </motion.div>
                )}

                {/* Welcome word */}
                <motion.div
                    className="absolute inset-x-0 bottom-[15%] flex items-center justify-center pointer-events-none z-20 px-6"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                    aria-hidden="true"
                >
                    <span className="text-display-alt text-warm-white text-7xl sm:text-8xl tracking-[0.02em] text-center whitespace-nowrap leading-none drop-shadow-[0_4px_40px_rgba(212,165,116,0.45)]">
                        {welcomeText}
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
