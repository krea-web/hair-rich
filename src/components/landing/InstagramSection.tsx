"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { SmartImage } from "./_shared/SmartImage";

const INSTA_FEED = [
    {
        src: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=600&auto=format&fit=crop",
        caption: "Razor fade del giovedì",
        likes: 421,
    },
    {
        src: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop",
        caption: "Beard sculpt — full ritual",
        likes: 287,
    },
    {
        src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
        caption: "Editorial #07",
        likes: 612,
    },
    {
        src: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&auto=format&fit=crop",
        caption: "Backstage tools",
        likes: 198,
    },
    {
        src: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=600&auto=format&fit=crop",
        caption: "Mid skin fade",
        likes: 533,
    },
    {
        src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop",
        caption: "Side part classico",
        likes: 348,
    },
];

import { useT } from "@/i18n/useLang";

export function InstagramSection() {
    const { t } = useT();
    return (
        <section
            aria-label="Instagram"
            className="relative py-16 md:py-28 px-6 md:px-12 lg:px-20 bg-black-2 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
                    <EditorialHeading
                        eyebrow={t.instagram.eyebrow}
                        title={
                            <>
                                {t.instagram.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.instagram.titleB}</em>
                            </>
                        }
                    />
                    <a
                        href={SITE.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 text-warm-white border-b border-warm-white pb-2 text-xs uppercase tracking-[0.3em] font-body font-semibold hover:text-accent-warm hover:border-accent-warm transition-colors w-fit"
                    >
                        {t.instagram.cta}
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                    {INSTA_FEED.map((item, i) => (
                        <motion.a
                            key={i}
                            href={SITE.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            aria-label={`Vedi su Instagram: ${item.caption}`}
                        >
                            <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-110">
                                <SmartImage src={item.src} alt={item.caption} className="h-full grayscale-[15%]" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-end p-3">
                                <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-warm-white">
                                    <p className="text-xs font-body line-clamp-2">{item.caption}</p>
                                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-silver">
                                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                        </svg>
                                        {item.likes}
                                    </div>
                                </div>
                            </div>
                            <span aria-hidden="true" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-warm-white" fill="currentColor">
                                    <path d="M7.5 2C4.46 2 2 4.46 2 7.5v9C2 19.54 4.46 22 7.5 22h9c3.04 0 5.5-2.46 5.5-5.5v-9C22 4.46 19.54 2 16.5 2h-9zm9 18h-9c-1.93 0-3.5-1.57-3.5-3.5v-9C4 5.57 5.57 4 7.5 4h9C18.43 4 20 5.57 20 7.5v9c0 1.93-1.57 3.5-3.5 3.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm5.5-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </span>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
