"use client";

import { motion } from "framer-motion";
import type { Skill } from "@/lib/skills/registry";
import { SKILL_TUTORIALS, type SkillTutorial } from "@/lib/skills/tutorials";

interface Props {
    skill: Skill;
    onClose: () => void;
    onToggle?: () => void;
    enabled?: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
    comunicazione: "Comunicazione",
    booking: "Booking",
    ai: "AI",
    analytics: "Analytics",
    clienti: "Clienti",
    team: "Team",
    marketing: "Marketing",
    vendite: "Vendite",
    integrazioni: "Integrazioni",
    avanzata: "Avanzata",
};

function buildFallbackTutorial(skill: Skill): SkillTutorial {
    return {
        whyMatters:
            skill.benefitIT ??
            "Una funzionalità del gestionale Hair Rich. Per il dettaglio completo contattaci o consulta la documentazione tecnica.",
        pros: [skill.descriptionIT],
        steps: [
            "Verifica i requisiti tecnici (vedi 'Cosa serve' qui sotto).",
            "Attiva il toggle nello Skills Hub.",
            "Configura i parametri se richiesto (apri il modale di configurazione).",
        ],
        realScenario: skill.exampleIT,
    };
}

export function SkillTutorialModal({ skill, onClose, onToggle, enabled }: Props) {
    const tutorial: SkillTutorial = SKILL_TUTORIALS[skill.key] ?? buildFallbackTutorial(skill);
    const hasDeepTutorial = SKILL_TUTORIALS[skill.key] !== undefined;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-lg)] max-w-3xl w-full max-h-[90dvh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-carbon border-b border-line px-6 md:px-8 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                        <span className="text-4xl md:text-5xl leading-none flex-shrink-0">{skill.icon}</span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                    {CATEGORY_LABEL[skill.category] ?? skill.category}
                                </span>
                                {!hasDeepTutorial && (
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold border border-line rounded-full px-2 py-0.5">
                                        Guida rapida
                                    </span>
                                )}
                                {skill.alwaysOn && (
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-warning font-body font-semibold border border-warning/40 rounded-full px-2 py-0.5">
                                        Sempre on
                                    </span>
                                )}
                            </div>
                            <h2 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight mt-1 leading-tight">
                                {skill.nameIT}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-silver-dark hover:text-warm-white text-2xl leading-none flex-shrink-0"
                        aria-label="Chiudi"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 md:px-8 py-6 space-y-8">
                    {/* Why matters */}
                    <section>
                        <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                            Perché conta
                        </span>
                        <p className="mt-3 text-warm-white text-base md:text-lg leading-relaxed">
                            {tutorial.whyMatters}
                        </p>
                    </section>

                    {/* Pros */}
                    {tutorial.pros.length > 0 && (
                        <section>
                            <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                Cosa ti dà
                            </span>
                            <ul className="mt-3 space-y-2.5">
                                {tutorial.pros.map((p, i) => (
                                    <li key={i} className="flex items-start gap-3 text-warm-white-muted">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent-warm flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm md:text-base leading-relaxed">{p}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Real scenario */}
                    {tutorial.realScenario && (
                        <section className="p-4 md:p-5 bg-black-2 border border-line rounded-[var(--radius-md)]">
                            <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                Scenario reale in salone
                            </span>
                            <p className="mt-3 text-warm-white-muted text-sm md:text-base leading-relaxed italic">
                                {tutorial.realScenario}
                            </p>
                        </section>
                    )}

                    {/* Cons */}
                    {tutorial.cons && tutorial.cons.length > 0 && (
                        <section>
                            <span className="text-[10px] uppercase tracking-[0.35em] text-warning font-body font-semibold">
                                Cosa sapere prima
                            </span>
                            <ul className="mt-3 space-y-2.5">
                                {tutorial.cons.map((c, i) => (
                                    <li key={i} className="flex items-start gap-3 text-warm-white-muted">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-warning flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span className="text-sm md:text-base leading-relaxed">{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Steps */}
                    <section>
                        <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                            Come attivarla
                        </span>
                        <ol className="mt-3 space-y-3">
                            {tutorial.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-warm text-black text-xs font-body font-bold inline-flex items-center justify-center tabular-nums">
                                        {i + 1}
                                    </span>
                                    <span className="text-warm-white text-sm md:text-base leading-relaxed">
                                        {s}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Expected impact */}
                    {tutorial.expectedImpact && tutorial.expectedImpact.length > 0 && (
                        <section className="p-4 md:p-5 bg-accent-warm/5 border border-accent-warm/30 rounded-[var(--radius-md)]">
                            <span className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                                Impatto atteso
                            </span>
                            <ul className="mt-3 space-y-2">
                                {tutorial.expectedImpact.map((imp, i) => (
                                    <li key={i} className="flex items-start gap-3 text-warm-white">
                                        <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-accent-warm flex-shrink-0" />
                                        <span className="text-sm md:text-base leading-relaxed">{imp}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* FAQ */}
                    {tutorial.faq && tutorial.faq.length > 0 && (
                        <section>
                            <span className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold">
                                Domande frequenti
                            </span>
                            <dl className="mt-3 space-y-4">
                                {tutorial.faq.map((item, i) => (
                                    <div key={i} className="border-l-2 border-line pl-4">
                                        <dt className="text-warm-white text-sm md:text-base font-body font-semibold">
                                            {item.q}
                                        </dt>
                                        <dd className="mt-1.5 text-warm-white-muted text-sm leading-relaxed">
                                            {item.a}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    {/* Spec card (always visible — dati strutturati) */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-line">
                        <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Effort sviluppo
                            </span>
                            <p className="mt-1 text-warm-white text-sm font-body">{skill.effortHours}h</p>
                        </div>
                        <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Costo mese
                            </span>
                            <p className="mt-1 text-warm-white text-sm font-body">
                                {skill.monthlyCostEur === 0 ? "Gratis" : `€${skill.monthlyCostEur}`}
                            </p>
                        </div>
                        <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Status
                            </span>
                            <p className="mt-1 text-warm-white text-xs font-body capitalize">{skill.status.replace(/_/g, " ")}</p>
                        </div>
                        <div className="p-3 bg-black-2 border border-line rounded-[var(--radius-sm)]">
                            <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                Servizi esterni
                            </span>
                            <p className="mt-1 text-warm-white text-xs font-body leading-snug">
                                {skill.requiresAccount && skill.requiresAccount.length > 0
                                    ? skill.requiresAccount.join(", ")
                                    : "Nessuno"}
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer actions */}
                <div className="sticky bottom-0 bg-carbon border-t border-line px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-silver-dark">
                        Skill key: <code className="font-mono text-accent-warm">{skill.key}</code>
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-carbon-2 transition-colors"
                        >
                            Chiudi
                        </button>
                        {onToggle && !skill.alwaysOn && (
                            <button
                                onClick={onToggle}
                                className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold transition-transform hover:scale-[1.02] active:scale-95 ${
                                    enabled
                                        ? "border border-error/40 text-error"
                                        : "bg-accent-warm text-black"
                                }`}
                            >
                                {enabled ? "Disattiva" : "Attiva ora"}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
