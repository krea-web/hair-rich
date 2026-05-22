"use client";

import { motion } from "framer-motion";
import { portfolioImageUrl } from "@/lib/supabase/queries";
import { BookingCtaButton } from "@/components/ui/BookingCtaButton";

/**
 * Minimal hero for /servizi. Photo backdrop, watermark numeral, and one
 * single primary CTA — "Prenota ora". No headline / body / price strip
 * here, the listino lives in the StyleQuiz block below and the page
 * doesn't need to repeat itself in the hero.
 */
export function ServicesHero() {
    return (
        <section className="relative bg-black overflow-hidden border-b border-line">
            <div className="absolute inset-0" aria-hidden="true">
                <img
                    src={portfolioImageUrl("tagli/mid-fade-01.jpeg", {
                        width: 1920,
                        quality: 70,
                        format: "webp",
                    })}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale"
                    loading="eager"
                    fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/30" />
            </div>

            {/* Giant ordinal — sits behind the CTA */}
            <div
                aria-hidden="true"
                className="absolute right-2 md:right-8 top-16 md:top-12 text-display-alt text-[35vw] md:text-[20vw] lg:text-[15vw] text-accent-warm/[0.07] leading-none pointer-events-none select-none"
            >
                01
            </div>

            <div className="relative max-w-5xl mx-auto px-6 md:px-12 lg:px-20 pt-28 md:pt-44 pb-16 md:pb-24 min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-end">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <BookingCtaButton label="Prenota ora" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-8 md:mt-10 w-full flex items-end justify-between gap-4"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        Conferma immediata
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-silver-dark font-body font-semibold">
                        01 / Servizi
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
