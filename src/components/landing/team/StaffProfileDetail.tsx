"use client";

import { motion } from "framer-motion";
import { assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { handleClientLink } from "@/lib/clientRouter";

const ROLE_TYPE_LABEL: Record<string, string> = {
    founder: "Founder",
    co_founder: "Co-founder",
    master_barber: "Master barber",
    barber: "Barber",
    apprentice: "Apprendista",
    receptionist: "Reception",
    employee: "Team",
};

interface Props {
    staff: Staff;
}

export function StaffProfileDetail({ staff }: Props) {
    const openDrawer = useBookingDrawer((s) => s.open);
    const setStaffSelection = useBookingStore((s) => s.setStaff);

    const expertise = staff.expertise ?? [];
    const qa = staff.qa ?? [];
    const yearsActive = staff.years_active ?? "";
    const tagline = staff.tagline ?? "";
    const signature = staff.signature ?? "";
    const fullBio = staff.full_bio ?? staff.bio ?? "";
    const roleLabel = ROLE_TYPE_LABEL[staff.role_type] ?? staff.role;
    const photoStorage = staff.cover_url ?? staff.avatar_url ?? "";
    const photoSrc = photoStorage.startsWith("http")
        ? photoStorage
        : photoStorage
            ? assetImageUrl(photoStorage, { width: 1600, quality: 82, format: "webp" })
            : "";
    const photoSrcSet = photoStorage.startsWith("http")
        ? undefined
        : photoStorage
            ? assetImageSrcset(photoStorage, 82)
            : undefined;

    const handleBook = () => {
        setStaffSelection(staff.id);
        openDrawer();
    };

    return (
        <article className="relative bg-black">
            {/* Breadcrumb back link */}
            <div className="px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-24 md:pt-32 lg:pt-36 max-w-7xl 2xl:max-w-[1600px] mx-auto">
                <a
                    href="/team"
                    onClick={handleClientLink}
                    className="inline-flex items-center gap-2 text-silver-dark hover:text-warm-white transition-colors group"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-body font-semibold">Tutto il team</span>
                </a>
            </div>

            {/* Hero */}
            <section className="relative px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 pt-8 md:pt-12 pb-16 md:pb-24 max-w-7xl 2xl:max-w-[1600px] mx-auto overflow-hidden">
                {/* Decorative warm gradient halo dietro il portrait */}
                <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-accent-warm/[0.06] blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-0 w-[520px] h-[520px] rounded-full bg-warning/[0.04] blur-3xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 lg:gap-20 items-center">
                    {/* Portrait */}
                    <motion.div
                        className="lg:col-span-5"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        <div className="relative aspect-[4/5] max-h-[680px] lg:max-h-[760px] xl:max-h-[820px] mx-auto rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-carbon to-black-2 overflow-hidden">
                            {photoSrc ? (
                                <img
                                    src={photoSrc}
                                    srcSet={photoSrcSet}
                                    sizes="(min-width: 1024px) 42vw, 100vw"
                                    alt={staff.name}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    decoding="async"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-display-alt text-[14rem] text-accent-warm/30 leading-none">
                                        {staff.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            {yearsActive && (
                                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-line px-3 py-1.5 rounded-full">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                        {yearsActive}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Identity */}
                    <motion.div
                        className="lg:col-span-7"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                    >
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            {roleLabel}
                        </span>
                        <h1 className="text-display text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight mt-3 leading-[0.95]">
                            {staff.name}
                        </h1>
                        {staff.role && staff.role !== roleLabel && (
                            <p className="mt-3 text-warm-white-muted text-base md:text-lg font-body">
                                {staff.role}
                            </p>
                        )}

                        {tagline && (
                            <blockquote className="mt-8 pl-5 border-l-2 border-accent-warm/60 text-display-alt text-2xl md:text-3xl text-warm-white italic leading-snug">
                                «{tagline}»
                            </blockquote>
                        )}

                        <div className="mt-10 flex flex-wrap items-center gap-3">
                            {yearsActive && (
                                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-accent-warm/40 bg-accent-warm/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-warm animate-pulse" aria-hidden="true" />
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                        {yearsActive}
                                    </span>
                                </span>
                            )}
                            {staff.instagram_handle && (
                                <a
                                    href={`https://instagram.com/${staff.instagram_handle.replace(/^@/, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-colors"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </svg>
                                    @{staff.instagram_handle.replace(/^@/, "")}
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Bio */}
            {fullBio && (
                <section className="relative px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-16 md:py-24 border-t border-line bg-gradient-to-b from-black via-[#0a0805] to-black overflow-hidden">
                    <span
                        aria-hidden="true"
                        className="absolute -top-8 right-2 md:right-10 text-display-alt text-[26vw] md:text-[16vw] lg:text-[13vw] xl:text-[11vw] 2xl:text-[10vw] text-warm-white/[0.025] leading-none pointer-events-none select-none"
                    >
                        01
                    </span>
                    <div className="relative max-w-3xl mx-auto">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Chi è
                        </span>
                        <p className="mt-6 text-warm-white text-lg md:text-xl leading-relaxed font-body">
                            {fullBio}
                        </p>
                    </div>
                </section>
            )}

            {/* Expertise + signature */}
            {(expertise.length > 0 || signature) && (
                <section className="relative px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-16 md:py-20 border-t border-line overflow-hidden">
                    <span
                        aria-hidden="true"
                        className="absolute -top-8 left-2 md:left-10 text-display-alt text-[26vw] md:text-[16vw] lg:text-[13vw] xl:text-[11vw] 2xl:text-[10vw] text-warm-white/[0.025] leading-none pointer-events-none select-none"
                    >
                        02
                    </span>
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
                        {expertise.length > 0 && (
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                    Specializzazioni
                                </span>
                                <ul className="mt-5 space-y-3">
                                    {expertise.map((ex) => (
                                        <li key={ex} className="flex items-start gap-3 text-warm-white">
                                            <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-accent-warm flex-shrink-0" />
                                            <span className="font-body text-base md:text-lg leading-snug">{ex}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {signature && (
                            <div>
                                <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                    Cavallo di battaglia
                                </span>
                                <div className="mt-5 p-6 bg-accent-warm/5 border border-accent-warm/30 rounded-[var(--radius-md)]">
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-accent-warm mb-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.06 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
                                    </svg>
                                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight leading-snug">
                                        {signature}
                                    </h3>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Q&A */}
            {qa.length > 0 && (
                <section className="relative px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-16 md:py-24 border-t border-line bg-gradient-to-b from-black via-[#06090c] to-black overflow-hidden">
                    <span
                        aria-hidden="true"
                        className="absolute -top-8 right-2 md:right-10 text-display-alt text-[26vw] md:text-[16vw] lg:text-[13vw] xl:text-[11vw] 2xl:text-[10vw] text-warm-white/[0.025] leading-none pointer-events-none select-none"
                    >
                        03
                    </span>
                    <div className="relative max-w-3xl mx-auto">
                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                            Domande a {staff.name.split(" ")[0]}
                        </span>
                        <dl className="mt-8 space-y-10">
                            {qa.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-80px" }}
                                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                                    className="border-l-2 border-accent-warm/40 pl-6"
                                >
                                    <dt className="text-warm-white text-lg md:text-xl font-display font-semibold">
                                        {item.q}
                                    </dt>
                                    <dd className="mt-3 text-warm-white-muted text-base md:text-lg leading-relaxed">
                                        {item.a}
                                    </dd>
                                </motion.div>
                            ))}
                        </dl>
                    </div>
                </section>
            )}

            {/* Closing — quote editoriale al posto del CTA */}
            <section className="relative px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-20 md:py-28 border-t border-line text-center overflow-hidden">
                <span
                    aria-hidden="true"
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-display-alt text-[36vw] md:text-[22vw] lg:text-[18vw] xl:text-[15vw] 2xl:text-[13vw] text-warm-white/[0.03] leading-none pointer-events-none select-none whitespace-nowrap"
                >
                    {staff.name.split(" ")[0]}
                </span>
                <div className="relative max-w-2xl mx-auto">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        In poltrona da
                    </span>
                    <h2 className="text-display text-3xl md:text-5xl lg:text-4xl xl:text-5xl text-warm-white tracking-tight mt-4 leading-tight">
                        {yearsActive || "Anni nel mestiere"}.
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Tutto il team Hair Rich condivide gli stessi standard. {staff.name.split(" ")[0]} ti aspetta in salone.
                    </p>
                    <a
                        href="/team"
                        onClick={handleClientLink}
                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-all"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Scopri il resto del team
                    </a>
                </div>
            </section>
        </article>
    );
}
