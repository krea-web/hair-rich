"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchStaffForTeamPage, assetImageUrl, assetImageSrcset } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import { handleClientLink } from "@/lib/clientRouter";
import { StickyOnDesktop } from "./_shared/StickyOnDesktop";

const ROLE_TYPE_LABEL: Record<string, string> = {
    founder: "Founder",
    co_founder: "Co-founder",
    master_barber: "Master barber",
    barber: "Barber",
    apprentice: "Apprendista",
    receptionist: "Reception",
    employee: "Team",
};

export function TeamShowcase() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setStaffSelection = useBookingStore((s) => s.setStaff);

    useEffect(() => {
        let alive = true;
        fetchStaffForTeamPage()
            .then((rows) => {
                if (!alive) return;
                setStaff(rows);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        return () => {
            alive = false;
        };
    }, []);

    const handleBookWith = (staffId: string) => {
        setStaffSelection(staffId);
        openDrawer();
    };

    return (
        <section className="relative py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 px-6 md:px-12 lg:px-20 bg-black">
            <div className="max-w-6xl mx-auto">
                <div className="mb-16 md:mb-24 max-w-3xl">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        Master barber
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl 2xl:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
                        Mani diverse, standard condiviso.
                    </h2>
                    <p className="mt-5 text-warm-white-muted text-base md:text-lg leading-relaxed">
                        Conoscere chi ti taglierà i capelli non è un dettaglio. È il primo passo per
                        capire perché il risultato sarà quello giusto per te — e non solo "un taglio".
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-12">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="h-96 bg-black-2 border border-line rounded-[var(--radius-md)] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-24 md:space-y-32">
                        {staff.map((member, i) => {
                            const expertise = member.expertise ?? [];
                            const qa = member.qa ?? [];
                            const yearsActive = member.years_active ?? "";
                            const tagline = member.tagline ?? "";
                            const signature = member.signature ?? "";
                            const fullBio = member.full_bio ?? member.bio ?? "";
                            const roleLabel = ROLE_TYPE_LABEL[member.role_type] ?? member.role;
                            return (
                                <article
                                    key={member.id}
                                    className={`relative grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start p-6 md:p-10 lg:p-12 rounded-[var(--radius-lg)] border border-line bg-gradient-to-br ${
                                        i % 2 === 0
                                            ? "from-[#1a0e0a] via-black to-black"
                                            : "from-black via-black to-[#0e1416]"
                                    } ${i % 2 === 1 ? "lg:[direction:rtl] [&>*]:[direction:ltr]" : ""}`}
                                >
                                    {/* Numero gigante watermark dietro */}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute pointer-events-none select-none text-display-alt text-[28vw] md:text-[18vw] lg:text-[14vw] xl:text-[12vw] 2xl:text-[10vw] text-warm-white/[0.035] leading-none ${
                                            i % 2 === 0
                                                ? "right-3 -bottom-6 md:right-6 md:-bottom-10"
                                                : "left-3 -bottom-6 md:left-6 md:-bottom-10"
                                        }`}
                                    >
                                        0{i + 1}
                                    </span>
                                    {/* Portrait + role badge — la cella e' alta sui PC
                                        (min-h) per dare scroll budget al testo sticky a
                                        destra, ma la foto interna mantiene il suo
                                        aspect originale e si vede normalmente. Lo spazio
                                        extra sotto la foto resta nero del gradient della
                                        card cosi' visivamente si percepisce solo il
                                        movimento della foto verso l'alto. */}
                                    <div className="lg:col-span-5 lg:min-h-[820px] xl:min-h-[920px] 2xl:min-h-[1000px]">
                                        <a
                                            href={`/team/${member.slug}`}
                                            onClick={handleClientLink}
                                            aria-label={`Scopri ${member.name}`}
                                            className="block group"
                                        >
                                            <div className="relative aspect-[4/5] lg:aspect-[3/4] xl:aspect-[2/3] rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-carbon to-black-2 overflow-hidden">
                                                {member.avatar_url ? (
                                                    <img
                                                        src={
                                                            member.avatar_url.startsWith("http")
                                                                ? member.avatar_url
                                                                : assetImageUrl(member.avatar_url, { width: 900, quality: 82, format: "webp" })
                                                        }
                                                        srcSet={
                                                            member.avatar_url.startsWith("http")
                                                                ? undefined
                                                                : assetImageSrcset(member.avatar_url, 82)
                                                        }
                                                        sizes="(min-width: 1024px) 42vw, 100vw"
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-display-alt text-[12rem] text-accent-warm/30 leading-none">
                                                            {member.name.charAt(0)}
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
                                                <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-warm-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] uppercase tracking-[0.3em] font-body font-semibold">Scopri</span>
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </a>
                                    </div>

                                    {/* Body */}
                                    <div
                                        className="lg:col-span-7"
                                        data-sticky-pin
                                    >
                                        <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                            {roleLabel}
                                        </span>
                                        <h3 className="text-display text-3xl md:text-5xl lg:text-4xl xl:text-4xl 2xl:text-5xl text-warm-white tracking-tight mt-2 leading-[1.05]">
                                            <a
                                                href={`/team/${member.slug}`}
                                                onClick={handleClientLink}
                                                className="hover:text-accent-warm transition-colors"
                                            >
                                                {member.name}
                                            </a>
                                        </h3>

                                        {tagline && (
                                            <blockquote className="mt-6 pl-4 border-l-2 border-accent-warm/60 text-display-alt text-xl md:text-2xl text-warm-white-muted italic leading-snug">
                                                «{tagline}»
                                            </blockquote>
                                        )}

                                        {fullBio && (
                                            <p className="mt-6 text-warm-white-muted text-base leading-relaxed max-w-2xl">
                                                {fullBio}
                                            </p>
                                        )}

                                        {expertise.length > 0 && (
                                            <div className="mt-7">
                                                <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                                    Specializzazioni
                                                </span>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {expertise.map((ex) => (
                                                        <span
                                                            key={ex}
                                                            className="inline-flex items-center px-3 py-1.5 rounded-full border border-line text-warm-white-muted text-xs font-body"
                                                        >
                                                            {ex}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {signature && (
                                            <div className="mt-7 inline-flex items-center gap-3 px-4 py-2.5 border border-accent-warm/30 bg-accent-warm/5 rounded-full">
                                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.06 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
                                                </svg>
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                                    Signature · {signature}
                                                </span>
                                            </div>
                                        )}

                                        <div className="mt-8 flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => handleBookWith(member.id)}
                                                className="cta-shine cta-pulse inline-flex items-center gap-3 px-7 py-3.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                            >
                                                Prenota con {member.name.split(" ")[0]}
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                </svg>
                                            </button>
                                            <a
                                                href={`/team/${member.slug}`}
                                                onClick={handleClientLink}
                                                className="inline-flex items-center gap-2 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-colors"
                                            >
                                                Profilo completo
                                            </a>
                                        </div>

                                        {qa.length > 0 && (
                                            <div className="mt-12 pt-8 border-t border-line">
                                                <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                                    Quattro domande a {member.name.split(" ")[0]}
                                                </span>
                                                <dl className="mt-6 space-y-6">
                                                    {qa.slice(0, 4).map((item, idx) => (
                                                        <div key={idx} className="border-l-2 border-accent-warm/40 pl-5 py-1">
                                                            <dt className="text-warm-white text-sm md:text-base font-body font-semibold">
                                                                {item.q}
                                                            </dt>
                                                            <dd className="mt-2 text-warm-white-muted text-sm md:text-base leading-relaxed">
                                                                {item.a}
                                                            </dd>
                                                        </div>
                                                    ))}
                                                </dl>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
