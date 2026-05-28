"use client";

import { portfolioImageSrcset, portfolioImageUrl } from "@/lib/supabase/queries";

interface Props {
    /** storage_path inside the portfolio bucket */
    image: string;
    badge?: string;
    title: string;
    subtitle?: string;
    body: string;
    meta: { label: string; value: string }[];
}

/**
 * Full-bleed editorial feature card. Used at the top of /lavori to lead
 * the gallery with a curated piece (e.g. "Caso del mese") before the
 * filter grid takes over. Designed mobile-first: stacked photo + text,
 * generous spacing, no decorations that crowd small viewports.
 */
export function FeaturedWork({ image, badge, title, subtitle, body, meta }: Props) {
    return (
        <section className="relative bg-black overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-12 md:pb-16 lg:pb-20 xl:pb-24 2xl:pb-36">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
                    {/* Foto SX — aspect fisso + max-h su PC così sta in
                        viewport. Niente più `natural` height che ingigantiva. */}
                    <div className="lg:col-span-6 relative">
                        <div className="relative aspect-[3/4] lg:aspect-[4/5] xl:aspect-[3/4] max-h-[520px] lg:max-h-[440px] xl:max-h-[500px] 2xl:max-h-[560px] mx-auto rounded-[var(--radius-md)] overflow-hidden border border-line">
                            <img
                                src={portfolioImageUrl(image, { width: 1400, quality: 82, format: "webp" })}
                                srcSet={portfolioImageSrcset(image, 82)}
                                sizes="(min-width: 1024px) 48vw, 100vw"
                                alt={title}
                                loading="eager"
                                decoding="async"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                            {badge && (
                                <div className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-accent-warm/40 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                                    <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                                        {badge}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Body DX */}
                    <div className="lg:col-span-6">
                        {subtitle && (
                            <span className="text-[10px] uppercase tracking-[0.5em] text-accent-warm font-body font-semibold">
                                {subtitle}
                            </span>
                        )}
                        <h2 className="text-display text-3xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-5xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                            {title}
                        </h2>
                        <p className="mt-5 text-warm-white-muted text-base md:text-lg lg:text-base xl:text-lg leading-relaxed max-w-xl">
                            {body}
                        </p>

                        {meta.length > 0 && (
                            <dl className="mt-8 grid grid-cols-2 gap-y-5 gap-x-6 pt-6 border-t border-line">
                                {meta.map((m) => (
                                    <div key={m.label}>
                                        <dt className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                            {m.label}
                                        </dt>
                                        <dd className="mt-1 text-warm-white text-base font-body">
                                            {m.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
