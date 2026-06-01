"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";
import {
    fetchPortfolio,
    portfolioImageUrl,
    portfolioImageSrcset,
    assetImageUrl,
    assetImageSrcset,
} from "@/lib/supabase/queries";
import type { PortfolioImage } from "@/lib/supabase/types";
import { useBookingDrawer } from "@/lib/store";
import { useT } from "@/i18n/useLang";

const HIGHLIGHT_INDEX = 1;
const DOMICILIO_INDEX = 2;
const DOMICILIO_ASSET = "taglio-domicilio-yacht.webp";

// Custom hero shots per card 0 (TAGLIO) e 1 (BARBA). Sostituiscono i
// portfolio shots casuali che venivano caricati prima — adesso una
// foto curata in salone per ogni categoria.
const CARD_ASSETS: Record<number, string> = {
    0: "taglio-capelli.jpeg",
    1: "taglio-barba.jpeg",
};

export function ServicesSection() {
    const { t } = useT();
    const openDrawer = useBookingDrawer((s) => s.open);
    const [photos, setPhotos] = useState<PortfolioImage[]>([]);

    // Pull 3 real shots from the portfolio bucket — featured first, then
    // the most recent. One per category card.
    useEffect(() => {
        let alive = true;
        fetchPortfolio()
            .then((rows) => {
                if (!alive) return;
                const feat = rows.filter((r) => r.is_featured).slice(0, 3);
                const rest = rows.filter((r) => !r.is_featured);
                setPhotos([...feat, ...rest].slice(0, 3));
            })
            .catch(() => undefined);
        return () => {
            alive = false;
        };
    }, []);

    return (
        <section
            id="servizi"
            aria-label="Servizi"
            className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 md:mb-20 lg:mb-24">
                    <EditorialHeading
                        eyebrow={t.services.eyebrow}
                        title={
                            <>
                                {t.services.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">
                                    {t.services.titleB}
                                </em>
                            </>
                        }
                    />
                    <motion.p
                        className="md:max-w-md text-warm-white-muted text-base leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {t.services.intro}
                    </motion.p>
                </div>

                {/* ── 3 category cards. Photos pulled from the portfolio
                       bucket. The middle card carries a gold-accent border
                       instead of a y-offset so neighbouring cards never
                       overlap on any breakpoint. */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 xl:gap-10 items-stretch">
                    {t.services.items.map((cat, i) => {
                        const highlight = i === HIGHLIGHT_INDEX;
                        const isDomicilio = i === DOMICILIO_INDEX;
                        const customAsset = CARD_ASSETS[i];
                        const photo = photos[i];
                        return (
                            <motion.article
                                key={cat.title}
                                className={`group relative overflow-hidden rounded-[var(--radius-lg)] border flex flex-col ${
                                    highlight
                                        ? "bg-warm-white text-black border-accent-warm shadow-[0_22px_60px_-25px_rgba(212,165,116,0.45)]"
                                        : "bg-carbon text-warm-white border-line"
                                }`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                            >
                                <div className="relative aspect-[4/3] lg:aspect-[5/3] xl:aspect-[16/9] overflow-hidden">
                                    <div className="absolute inset-0 transition-transform duration-[var(--dur-cinema)] ease-[var(--ease-cinema)] group-hover:scale-110">
                                        {isDomicilio ? (
                                            <SmartImage
                                                src={assetImageUrl(DOMICILIO_ASSET, {
                                                    width: 900,
                                                    height: 675,
                                                    resize: "cover",
                                                    quality: 80,
                                                    format: "webp",
                                                })}
                                                srcSet={assetImageSrcset(DOMICILIO_ASSET, 80)}
                                                sizes="(min-width: 768px) 33vw, 100vw"
                                                alt={`${cat.title} — Hair Rich Olbia`}
                                                className="h-full grayscale-[15%]"
                                            />
                                        ) : customAsset ? (
                                            <SmartImage
                                                src={assetImageUrl(customAsset, {
                                                    width: 900,
                                                    height: 675,
                                                    resize: "cover",
                                                    quality: 80,
                                                    format: "webp",
                                                })}
                                                srcSet={assetImageSrcset(customAsset, 80)}
                                                sizes="(min-width: 768px) 33vw, 100vw"
                                                alt={`${cat.title} — Hair Rich Olbia`}
                                                className="h-full grayscale-[10%]"
                                            />
                                        ) : photo ? (
                                            <SmartImage
                                                src={portfolioImageUrl(photo.storage_path, {
                                                    width: 900,
                                                    height: 675,
                                                    resize: "cover",
                                                    quality: 80,
                                                    format: "webp",
                                                })}
                                                srcSet={portfolioImageSrcset(photo.storage_path, 80)}
                                                sizes="(min-width: 768px) 33vw, 100vw"
                                                alt={`${cat.title} — Hair Rich Olbia`}
                                                className="h-full grayscale-[15%]"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-carbon to-black-2" />
                                        )}
                                    </div>
                                    <div
                                        className={`absolute inset-0 ${
                                            highlight
                                                ? "bg-gradient-to-t from-warm-white/90 via-warm-white/30 to-transparent"
                                                : "bg-gradient-to-t from-carbon via-carbon/30 to-transparent"
                                        }`}
                                    />
                                    <span
                                        className={`absolute top-5 left-5 text-display text-xl tracking-widest ${
                                            highlight ? "text-black/60" : "text-silver-dark"
                                        }`}
                                    >
                                        0{i + 1}
                                    </span>
                                </div>

                                <div className="p-7 md:p-8 flex-1 flex flex-col">
                                    <span
                                        className={`text-display-alt text-2xl ${
                                            highlight ? "text-black/70" : "text-accent-warm"
                                        }`}
                                    >
                                        {cat.eyebrow}
                                    </span>
                                    <h3 className="text-display text-3xl md:text-4xl mt-1 tracking-tight">
                                        {cat.title}
                                    </h3>
                                    <p
                                        className={`mt-3 text-sm leading-relaxed ${
                                            highlight ? "text-black/70" : "text-warm-white-muted"
                                        }`}
                                    >
                                        {cat.description}
                                    </p>

                                    <ul
                                        className={`mt-6 space-y-2 text-sm font-body ${
                                            highlight ? "text-black/80" : "text-silver"
                                        }`}
                                    >
                                        {cat.items.map((it) => (
                                            <li key={it} className="flex items-center gap-2">
                                                <span
                                                    className={`w-1 h-1 rounded-full ${
                                                        highlight ? "bg-black" : "bg-accent-warm"
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                                {it}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (typeof navigator !== "undefined" && navigator.vibrate)
                                                navigator.vibrate(6);
                                            openDrawer();
                                        }}
                                        className={`mt-auto pt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-semibold border-b pb-1 transition-colors w-fit ${
                                            highlight
                                                ? "border-black hover:text-black/70"
                                                : "border-warm-white text-warm-white hover:text-accent-warm hover:border-accent-warm"
                                        }`}
                                    >
                                        {t.services.bookFromCard}
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
