"use client";

import { motion } from "framer-motion";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";

interface Shot {
    file: string;
    alt: string;
    caption: string;
}

// Le 4 foto curate dello storage 'asset' caricate dall'utente. Mostrate
// in formato naturale portrait (aspect-[3/4], lo stesso ratio originale
// degli scatti iPhone) cosi' non vengono croppate o zoomate male.
const SHOTS: Shot[] = [
    {
        file: "servizi-hero-bg.jpeg",
        alt: "Vista dall'alto del salone con neon",
        caption: "Lo studio",
    },
    {
        file: "federico-al-lavoro.jpeg",
        alt: "Federico al lavoro con la macchinetta",
        caption: "Federico",
    },
    {
        file: "taglio-capelli.jpeg",
        alt: "Mani tatuate del barber durante il taglio",
        caption: "La precisione",
    },
    {
        file: "taglio-barba.jpeg",
        alt: "Taglio capelli riflesso nello specchio marmoreo",
        caption: "Il riflesso",
    },
];

export function AtelierGallery() {
    return (
        <section
            aria-label="Atelier · in bottega"
            className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 bg-black-2 border-y border-line overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <div className="mb-10 md:mb-14 max-w-2xl">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        In bottega
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Frammenti di salone.
                    </h2>
                    <p className="mt-4 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Dietro le quinte: la mano che corregge, lo specchio che restituisce, la luce che taglia.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
                    {SHOTS.map((shot, i) => (
                        <motion.figure
                            key={shot.file}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                            className="relative group"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-line bg-black">
                                <img
                                    src={assetImageUrl(shot.file, { width: 800, quality: 82, format: "webp" })}
                                    srcSet={assetImageSrcset(shot.file, 82)}
                                    sizes="(min-width: 768px) 24vw, 50vw"
                                    alt={shot.alt}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[var(--ease-cinema)] group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                                <figcaption className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.3em] text-warm-white font-body font-semibold">
                                    0{i + 1} · {shot.caption}
                                </figcaption>
                            </div>
                        </motion.figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
