"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

interface EnrichedStaff extends Staff {
    yearsActive: string;
    expertise: string[];
    quote: string;
    fullBio: string;
}

const STAFF_ENRICHMENT: Record<string, Omit<EnrichedStaff, keyof Staff>> = {
    "federico-asara": {
        yearsActive: "Dal 2017",
        expertise: ["Fade chirurgico", "Editorial cuts", "Razor cut", "Consulenza forma viso"],
        quote: "Un taglio non si esegue, si costruisce. Prima sulla persona, poi sui capelli.",
        fullBio:
            "Federico è il fondatore di Hair Rich. Ha aperto il salone nel 2017 dopo dieci anni passati tra Milano, Londra e i set editorial italiani. La sua specialità è il fade chirurgico e il razor cut su capelli medi — ma quello che lo distingue è il consulto iniziale: prima di toccare le forbici dedica sempre due minuti a capire chi hai davanti, come vivi, che tempo dedichi al mattino. Quel dialogo è la parte più importante del servizio.",
    },
    luca: {
        yearsActive: "Dal 2019",
        expertise: ["Barba sartoriale", "Rasoio classico", "Skin fade", "Modellatura sopracciglia"],
        quote: "Sulla barba si fa la differenza nei millimetri, non nei centimetri.",
        fullBio:
            "Luca è il nostro specialista barba e rasoio. Formato a Roma alla scuola Mascotte, in Hair Rich dal 2019. La modellatura barba è la sua cifra: lavora a rasoio classico per i contorni, forbice-trama per la rifinitura, e finisce con un olio scelto sulla base del tuo tipo di pelle. È anche il barber più richiesto per i tagli scuola classica italiana — chi cerca il pompadour, il side part, il lavoro a forbice pulito chiede lui.",
    },
};

export function TeamShowcase() {
    const [staff, setStaff] = useState<EnrichedStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setStaffSelection = useBookingStore((s) => s.setStaff);

    useEffect(() => {
        let alive = true;
        fetchStaff()
            .then((rows) => {
                if (!alive) return;
                setStaff(
                    rows.map((r) => ({
                        ...r,
                        ...(STAFF_ENRICHMENT[r.slug] ?? {
                            yearsActive: "",
                            expertise: [],
                            quote: "",
                            fullBio: r.bio ?? "",
                        }),
                    }))
                );
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
        <section className="relative py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
            <div className="max-w-6xl mx-auto">
                <div className="mb-16 md:mb-24 max-w-3xl">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                        Master barber
                    </span>
                    <h2 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-3 leading-[1.05]">
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
                        {staff.map((member, i) => (
                            <motion.article
                                key={member.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.7 }}
                                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start ${
                                    i % 2 === 1 ? "lg:[direction:rtl] [&>*]:[direction:ltr]" : ""
                                }`}
                            >
                                {/* Portrait + role badge */}
                                <div className="lg:col-span-5">
                                    <div className="relative aspect-[4/5] rounded-[var(--radius-md)] border border-line bg-gradient-to-br from-carbon to-black-2 overflow-hidden">
                                        {member.avatar_url ? (
                                            <img
                                                src={member.avatar_url}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-display-alt text-[12rem] text-accent-warm/30 leading-none">
                                                    {member.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-line px-3 py-1.5 rounded-full">
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                                {member.yearsActive}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="lg:col-span-7">
                                    <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                        {member.role}
                                    </span>
                                    <h3 className="text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-2 leading-[1.05]">
                                        {member.name}
                                    </h3>

                                    {member.quote && (
                                        <blockquote className="mt-6 pl-4 border-l-2 border-accent-warm/60 text-display-alt text-xl md:text-2xl text-warm-white-muted italic leading-snug">
                                            «{member.quote}»
                                        </blockquote>
                                    )}

                                    <p className="mt-6 text-warm-white-muted text-base leading-relaxed max-w-2xl">
                                        {member.fullBio}
                                    </p>

                                    {member.expertise.length > 0 && (
                                        <div className="mt-7">
                                            <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                                Specializzazioni
                                            </span>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {member.expertise.map((ex) => (
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

                                    <button
                                        onClick={() => handleBookWith(member.id)}
                                        className="mt-8 inline-flex items-center gap-3 px-7 py-3.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                                    >
                                        Prenota con {member.name.split(" ")[0]}
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
