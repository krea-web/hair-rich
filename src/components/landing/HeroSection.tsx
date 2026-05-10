"use client";

import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./_shared/Wordmark";
import { LangSwitcher } from "./_shared/LangSwitcher";
import { AvailabilityPulse } from "./_shared/AvailabilityPulse";
import { BookingPulse } from "./_shared/BookingPulse";
import { useLang, useT } from "@/i18n/useLang";

const FRAME_COUNT = 121;
const framePath = (i: number) => `/hero-seq/frame_${String(i).padStart(3, "0")}.webp`;

function HeroTextBlock({ withWordmark = true }: { withWordmark?: boolean }) {
    const { t } = useT();
    return (
        <div className="flex flex-col justify-center">
            {withWordmark && (
                <Wordmark
                    variant="wordmark"
                    size="2xl"
                    className="mb-8 -ml-2 md:mb-10 opacity-90 drop-shadow-[0_0_20px_rgba(212,165,116,0.18)]"
                    animated
                />
            )}

            <motion.span
                className="text-display-alt text-3xl md:text-4xl text-accent-warm mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
            >
                The
            </motion.span>

            <motion.h1
                className="text-display text-warm-white leading-[0.85] tracking-tight"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
                }}
            >
                {["BARBER", "STUDIO"].map((word, i) => (
                    <motion.span
                        key={word}
                        className="block text-[14vw] md:text-[8.5vw] lg:text-[7.5vw]"
                        variants={{
                            hidden: { opacity: 0, y: 60, clipPath: "inset(100% 0 0 0)" },
                            visible: {
                                opacity: 1,
                                y: 0,
                                clipPath: "inset(0% 0 0 0)",
                                transition: { duration: 1, ease: [0.7, 0, 0.3, 1] },
                            },
                        }}
                    >
                        {i === 1 ? <em className="text-display-alt not-italic text-silver">{word}</em> : word}
                    </motion.span>
                ))}
            </motion.h1>

            <motion.p
                className="mt-8 max-w-md text-warm-white-muted text-base md:text-lg leading-relaxed font-body"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                Da otto anni la nostra missione è scolpire la tua identità. Taglio, barba e rituali esclusivi
                nel cuore di Olbia.
            </motion.p>

            <motion.div
                className="mt-10 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                <a
                    href="#booking"
                    className="group relative inline-flex items-center gap-3 bg-accent-warm text-black px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white"
                >
                    <span>{t.hero.primaryCta}</span>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </a>
                <a
                    href="#servizi"
                    className="inline-flex items-center gap-3 border border-line text-warm-white px-8 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] transition-colors hover:border-warm-white hover:bg-warm-white/5"
                >
                    {t.hero.secondaryCta}
                </a>
            </motion.div>

            {/* Trust badges (rating + certified + premium) */}
            <motion.div
                className="mt-12 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.95 }}
            >
                <a
                    href="#recensioni"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-black/30 backdrop-blur-md hover:border-accent-warm transition-colors group"
                    aria-label={t.badges.rating}
                >
                    <span className="text-accent-warm" aria-hidden="true">★</span>
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-body font-semibold text-warm-white whitespace-nowrap">
                        {t.badges.rating}
                    </span>
                </a>
                <span
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-line bg-black/30 backdrop-blur-md"
                    aria-label={t.badges.certified}
                >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3 6-6m1.5-2.25c0 5-7.5 9-7.5 9s-7.5-4-7.5-9V5.25l7.5-2.5 7.5 2.5v2.25Z" />
                    </svg>
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-body font-semibold text-warm-white whitespace-nowrap">
                        {t.badges.certified}
                    </span>
                </span>
                <AvailabilityPulse variant="ribbon" />
            </motion.div>

            {/* Live social proof (counter) */}
            <motion.div
                className="mt-7"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1.2 }}
            >
                <BookingPulse variant="counter" />
            </motion.div>

            <motion.dl
                className="mt-12 grid grid-cols-3 gap-8 max-w-md"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 1.4 }}
            >
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.open}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">{t.hero.openHours}</dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.phone}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">0789·1891049</dd>
                </div>
                <div>
                    <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        {t.hero.info.location}
                    </dt>
                    <dd className="text-warm-white text-sm font-body mt-1">Via Regina Elena</dd>
                </div>
            </motion.dl>
        </div>
    );
}

export function HeroSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imagesReady, setImagesReady] = useState(false);
    const imagesRef = useRef<HTMLImageElement[]>([]);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    const frameIndex = useTransform(scrollYProgress, [0, 0.85], [1, FRAME_COUNT]);

    // Preload frames
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

    const drawFrame = (img?: HTMLImageElement) => {
        if (!img || !img.naturalWidth || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hRatio = canvas.width / img.naturalWidth;
        const vRatio = canvas.height / img.naturalHeight;
        const ratio = Math.max(hRatio, vRatio); // cover
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
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

    const { lang, t } = useT();
    const homeHref = lang === "it" ? "/" : `/${lang}/`;

    return (
        <section className="relative bg-black" aria-label="Hero">
            {/* ── Top header: wordmark a sinistra + nav + lang switcher ─── */}
            <header className="absolute top-0 left-0 right-0 z-40 grid grid-cols-3 items-center px-6 md:px-12 lg:px-20 pt-5 md:pt-7 pointer-events-none">
                <a
                    href={homeHref}
                    className="pointer-events-auto justify-self-start"
                    aria-label="Hair Rich · home"
                >
                    <Wordmark variant="wordmark" size="sm" className="md:[&>img]:h-12" />
                </a>
                <nav className="hidden md:flex items-center justify-center gap-9 text-xs uppercase tracking-[0.3em] font-body font-semibold text-silver pointer-events-auto">
                    <a href="#about" className="hover:text-warm-white transition-colors">{t.nav.about}</a>
                    <a href="#servizi" className="hover:text-warm-white transition-colors">{t.nav.services}</a>
                    <a href="#galleria" className="hover:text-warm-white transition-colors">{t.nav.gallery}</a>
                    <a href="#prezzi" className="hover:text-warm-white transition-colors">{t.nav.pricing}</a>
                    <a href="#booking" className="hover:text-warm-white transition-colors">{t.nav.booking}</a>
                </nav>
                <div className="justify-self-end pointer-events-auto">
                    <LangSwitcher current={lang} variant="navbar" />
                </div>
            </header>

            {/* ── Tall scroller with sticky canvas ───────────────────────────── */}
            <div ref={sectionRef} className="relative h-[200vh] md:h-[220vh]">
                <div className="sticky top-0 h-[100dvh] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 lg:gap-12 h-full md:px-12 lg:px-20 md:pt-28 md:pb-20">
                        {/* Text DESKTOP only (mobile shows it after the scroller) */}
                        <div className="hidden md:flex md:col-span-7 flex-col justify-center">
                            <HeroTextBlock />
                        </div>

                        {/* Canvas wrapper */}
                        <div className="relative md:col-span-5 h-[100dvh] md:h-full">
                            <div className="absolute inset-0 md:rounded-[var(--radius-md)] overflow-hidden md:border md:border-line bg-black-2">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full block"
                                    aria-hidden="true"
                                />

                                {/* Loading shimmer */}
                                {!imagesReady && (
                                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-carbon to-carbon-2 flex items-center justify-center">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                            Caricamento…
                                        </span>
                                    </div>
                                )}

                                {/* Vignette */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                                <div className="absolute inset-0 hidden md:block bg-gradient-to-l from-transparent via-transparent to-black/30 pointer-events-none" />

                                {/* Mobile wordmark overlay (visible only on mobile, on top of canvas) */}
                                <div className="md:hidden absolute inset-x-0 top-0 pt-20 px-6 pointer-events-none flex justify-center">
                                    <Wordmark variant="mark" size="lg" className="opacity-90" animated />
                                </div>

                                {/* Caption (desktop only) */}
                                <motion.div
                                    className="hidden md:block absolute bottom-6 left-6 bg-black/70 backdrop-blur-md border border-line rounded-[var(--radius-md)] p-4 max-w-[220px]"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 1.6 }}
                                >
                                    <span className="text-display-alt text-lg text-accent-warm">Premium</span>
                                    <p className="text-display text-xs text-warm-white tracking-widest mt-0.5">
                                        MASTER BARBER
                                    </p>
                                </motion.div>

                                {/* Vertical brand mark */}
                                <span className="hidden md:block absolute right-3 top-6 text-[10px] tracking-[0.5em] uppercase text-silver-dark font-body font-semibold rotate-180 [writing-mode:vertical-rl]">
                                    EST. 2017
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
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
                </div>
            </div>

            {/* ── MOBILE only: text block AFTER frames ───────────────────────── */}
            <div className="md:hidden px-6 pt-16 pb-20 bg-black relative z-10">
                <HeroTextBlock />
            </div>
        </section>
    );
}
