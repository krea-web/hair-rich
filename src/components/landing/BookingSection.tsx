"use client";

import { motion } from "framer-motion";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { AvailabilityPulse } from "./_shared/AvailabilityPulse";
import { SITE } from "@/lib/constants";
import { useT } from "@/i18n/useLang";

export function BookingSection() {
    const { t } = useT();
    return (
        <section
            id="booking"
            aria-label={t.nav.booking}
            className="relative py-16 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden"
        >
            {/* Editorial mark */}
            <div className="absolute -top-20 -left-10 text-display-alt text-[20vw] md:text-[15vw] text-warm-white/[0.025] leading-none pointer-events-none select-none">
                Booking
            </div>

            {/* Logo icona watermark in alto a destra */}
            <motion.img
                src="/logo-icona.png"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute top-12 right-6 md:top-20 md:right-16 w-32 md:w-44 h-auto opacity-[0.06] pointer-events-none select-none"
                initial={{ opacity: 0, rotate: -8 }}
                whileInView={{ opacity: 0.06, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
            />

            <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
                {/* ── Left: title + info ──────────────────────────────────── */}
                <div className="md:col-span-5 md:sticky md:top-24">
                    <EditorialHeading
                        eyebrow={t.booking.eyebrow}
                        title={
                            <>
                                {t.booking.titleA}{" "}
                                <em className="text-display-alt not-italic text-silver">{t.booking.titleB}</em>
                            </>
                        }
                    />
                    <p className="mt-6 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-md">
                        {t.booking.intro}
                    </p>

                    <div className="mt-6">
                        <AvailabilityPulse variant="block" />
                    </div>

                    <div className="mt-12 space-y-6 border-t border-line pt-8">
                        {[
                            { k: t.booking.contactLabels.salon, v: SITE.address },
                            { k: t.booking.contactLabels.phone, v: SITE.phone },
                            { k: t.booking.contactLabels.email, v: SITE.email },
                        ].map((row) => (
                            <div key={row.k} className="grid grid-cols-[100px_1fr] gap-4 items-baseline">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    {row.k}
                                </span>
                                <span className="text-warm-white text-sm md:text-base font-body">
                                    {row.v}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex items-center gap-3 text-warm-white-muted text-xs">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span>{t.booking.responseHint}</span>
                    </div>
                </div>

                {/* ── Right: wizard ───────────────────────────────────────── */}
                <motion.div
                    className="md:col-span-7 relative"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {/* Stamp badge sopra il wizard */}
                    <motion.div
                        className="absolute -top-10 right-6 md:-top-14 md:right-10 z-10 w-20 h-20 md:w-28 md:h-28 rounded-full bg-black border border-accent-warm/40 flex items-center justify-center shadow-[0_15px_40px_-10px_rgba(212,165,116,0.35)]"
                        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                        <img
                            src="/logo-icona.png"
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                            className="w-[78%] h-auto select-none pointer-events-none"
                        />
                    </motion.div>

                    <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
                        <BookingWizard />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
