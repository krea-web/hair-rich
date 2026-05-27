"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";
import { EditorialHeading } from "./_shared/EditorialHeading";
import { useT } from "@/i18n/useLang";

const GOOGLE_MAPS_LINK = "https://maps.app.goo.gl/TCGSzjyUdSMtUVDj9";
const EMBED_QUERY = encodeURIComponent(`${SITE.name} ${SITE.address}`);
const EMBED_SRC = `https://www.google.com/maps?q=${EMBED_QUERY}&output=embed`;

export function MapSection() {
    const { t } = useT();
    return (
        <section
            id="dove-siamo"
            aria-label={t.map.eyebrow}
            className="relative py-16 md:py-32 lg:py-40 xl:py-48 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 bg-black overflow-hidden"
        >
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-20 items-start">
                    <div className="lg:col-span-4">
                        <EditorialHeading
                            eyebrow={t.map.eyebrow}
                            title={
                                <>
                                    {t.map.titleA}{" "}
                                    <em className="text-display-alt not-italic text-silver">
                                        {t.map.titleB}
                                    </em>
                                </>
                            }
                        />
                        <p className="mt-6 text-warm-white-muted text-base md:text-lg leading-relaxed max-w-md">
                            {t.map.intro}
                        </p>

                        <dl className="mt-10 space-y-5">
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    {t.map.labels.address}
                                </dt>
                                <dd className="text-warm-white text-base font-body mt-1">
                                    {SITE.address}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                    {t.map.labels.hours}
                                </dt>
                                <dd className="text-warm-white text-base font-body mt-1">
                                    {t.map.hoursSummary}
                                </dd>
                            </div>
                        </dl>

                        <motion.a
                            href={GOOGLE_MAPS_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cta-shine cta-pulse mt-10 group inline-flex items-center gap-3 bg-accent-warm text-black px-7 py-4 rounded-full font-body font-semibold text-sm uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                                />
                            </svg>
                            <span>{t.map.cta}</span>
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                />
                            </svg>
                        </motion.a>
                    </div>

                    <motion.div
                        className="lg:col-span-8 relative rounded-[var(--radius-lg)] overflow-hidden border border-line"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <iframe
                            src={EMBED_SRC}
                            title={`${SITE.name} · ${SITE.address}`}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full h-[360px] md:h-[480px] lg:h-[560px] xl:h-[640px] 2xl:h-[720px] block bg-carbon-2 grayscale-[40%] contrast-[1.05]"
                        />
                        {/* Subtle frame tint to match the editorial palette */}
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-accent-warm/15 rounded-[var(--radius-lg)]" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
