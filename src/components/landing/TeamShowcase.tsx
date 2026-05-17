"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useBookingDrawer, useBookingStore } from "@/lib/store";

interface QA {
    q: string;
    a: string;
}

interface EnrichedStaff extends Staff {
    yearsActive: string;
    expertise: string[];
    quote: string;
    fullBio: string;
    qa: QA[];
    signature: string; // un campo per "Il mio cavallo di battaglia"
}

const STAFF_ENRICHMENT: Record<string, Omit<EnrichedStaff, keyof Staff>> = {
    "federico-asara": {
        yearsActive: "Dal 2017",
        expertise: ["Fade chirurgico", "Editorial cuts", "Razor cut", "Consulenza forma viso"],
        quote: "Un taglio non si esegue, si costruisce. Prima sulla persona, poi sui capelli.",
        fullBio:
            "Federico è il fondatore di Hair Rich. Ha aperto il salone nel 2017 dopo dieci anni passati tra Milano, Londra e i set editorial italiani. La sua specialità è il fade chirurgico e il razor cut su capelli medi — ma quello che lo distingue è il consulto iniziale: prima di toccare le forbici dedica sempre due minuti a capire chi hai davanti, come vivi, che tempo dedichi al mattino.",
        signature: "Razor cut con fade graduato",
        qa: [
            {
                q: "Il taglio che fai meglio?",
                a: "Il razor cut su capelli medi-lunghi con fade graduato alla nuca. È dove la mia formazione editorial italiana si sposa con la tecnica britannica di sfumatura.",
            },
            {
                q: "L'errore che vedi più spesso?",
                a: "Clienti che chiedono uno stile vedendolo su qualcun altro senza considerare la forma del proprio viso. Il consulto iniziale serve esattamente a evitare questa trappola.",
            },
            {
                q: "Il tuo tool preferito?",
                a: "Le forbici Joewell Convex 5.5\" — le uso da 12 anni, una taglia perfetta per il razor cut. Sono tarate sulla mia mano.",
            },
            {
                q: "Un consiglio dopo il taglio?",
                a: "Investi in una sola pomata buona invece di cinque mediocri. La qualità del prodotto fa il 30% del risultato finale al mattino.",
            },
        ],
    },
    luca: {
        yearsActive: "Dal 2019",
        expertise: ["Barba sartoriale", "Rasoio classico", "Skin fade", "Modellatura sopracciglia"],
        quote: "Sulla barba si fa la differenza nei millimetri, non nei centimetri.",
        fullBio:
            "Luca è il nostro specialista barba e rasoio. Formato a Roma alla scuola Mascotte, in Hair Rich dal 2019. La modellatura barba è la sua cifra: lavora a rasoio classico per i contorni, forbice-trama per la rifinitura, e finisce con un olio scelto sulla base del tuo tipo di pelle.",
        signature: "Barba sartoriale a rasoio classico",
        qa: [
            {
                q: "Cosa rende una barba 'sartoriale'?",
                a: "La precisione del contorno e l'armonia con la forma del viso, non la lunghezza. Lavoriamo i millimetri sul collo, sulle gote e sotto lo zigomo — quel triangolo è dove si gioca tutto.",
            },
            {
                q: "Rasoio classico o macchinetta?",
                a: "Per i contorni sempre rasoio: la macchinetta lascia una linea piatta, il rasoio crea un bordo vivo. Per la lunghezza dipende dal tipo di barba, ma forbice-trama nove volte su dieci.",
            },
            {
                q: "Un cliente con problemi di pelle?",
                a: "Pre-shave oil sempre, asciugamano tiepido (non bollente), rasoio in una sola passata nel verso del pelo. Olio post a base di jojoba per chi ha pelle sensibile.",
            },
            {
                q: "Il taglio classico più sottovalutato?",
                a: "Il side part italiano. Lo chiedono in pochi ma sta bene praticamente a tutti gli ovali e quadri. Forbice pulita, scriminatura netta, finitura con cera leggera.",
            },
        ],
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
                            qa: [],
                            signature: "",
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

                                    {member.signature && (
                                        <div className="mt-7 inline-flex items-center gap-3 px-4 py-2.5 border border-accent-warm/30 bg-accent-warm/5 rounded-full">
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.06 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" />
                                            </svg>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                                Signature · {member.signature}
                                            </span>
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

                                    {member.qa.length > 0 && (
                                        <div className="mt-12 pt-8 border-t border-line">
                                            <span className="text-[10px] uppercase tracking-[0.4em] text-accent-warm font-body font-semibold">
                                                Quattro domande a {member.name.split(" ")[0]}
                                            </span>
                                            <dl className="mt-6 space-y-6">
                                                {member.qa.map((item, idx) => (
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
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
