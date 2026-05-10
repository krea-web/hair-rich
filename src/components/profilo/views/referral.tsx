"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { formatPrice } from "@/lib/format";

const STEPS = [
    {
        n: "01",
        title: "Condividi il codice",
        body: "Manda il tuo codice o il link agli amici, via WhatsApp o email.",
    },
    {
        n: "02",
        title: "L'amico prenota",
        body: "Lui usa il codice in fase di registrazione e ottiene 5€ di sconto sul primo taglio.",
    },
    {
        n: "03",
        title: "Riceviamo entrambi",
        body: "Quando si presenta in salone, tu ricevi 5€ di credito sul tuo portafoglio. Cumulabili.",
    },
];

export default function ProfiloReferralPage() {
    const [copied, setCopied] = useState(false);
    const code = "MARIO24";
    const link = `hairrich.it/i/${code}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`https://${link}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            /* ignore */
        }
    };

    const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
        `Ti consiglio Hair Rich Olbia. Usa il mio codice e ricevi 5€ di sconto sul primo taglio: https://${link}`
    )}`;

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-5xl">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
            >
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Word of mouth</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Passaparola.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base md:text-lg leading-relaxed">
                    Invita un amico, guadagnate <strong className="text-accent-warm">entrambi 5€</strong>.
                    Lui sul primo taglio, tu in credito spendibile in salone.
                </p>
            </motion.header>

            {/* ── Code card hero ─────────────────────────────────────────── */}
            <motion.section
                aria-label="Il tuo codice referral"
                className="mt-10 md:mt-14 relative overflow-hidden bg-gradient-to-br from-accent-warm/15 via-carbon to-black-2 border border-accent-warm/30 rounded-[var(--radius-xl)] p-6 md:p-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                {/* Decorative big code in bg */}
                <div
                    aria-hidden="true"
                    className="absolute -bottom-8 right-2 md:right-8 text-display text-[18vw] md:text-[10vw] font-semibold text-accent-warm/[0.06] leading-none tracking-tight pointer-events-none select-none"
                >
                    {code}
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end">
                    <div>
                        <span className="text-display-alt text-lg md:text-xl text-accent-warm">
                            Il tuo codice invito
                        </span>

                        <div className="mt-3 inline-block">
                            <div className="bg-black border border-accent-warm/40 rounded-[var(--radius-md)] px-6 py-4 md:px-8 md:py-5">
                                <span className="text-display text-3xl md:text-5xl text-warm-white tracking-[0.2em] tabular-nums select-all">
                                    {code}
                                </span>
                            </div>
                        </div>

                        <p className="mt-4 text-silver-dark text-xs uppercase tracking-[0.25em] font-body font-semibold">
                            {link}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 md:items-stretch w-full md:w-auto">
                        <button
                            onClick={handleCopy}
                            className="relative inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-warm-white text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm transition-colors active:scale-95 min-w-[180px]"
                        >
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.span
                                        key="copied"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="inline-flex items-center gap-2"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copiato
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="copy"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="inline-flex items-center gap-2"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                        Copia link
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                        <a
                            href={whatsappShare}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 border border-line text-warm-white rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white/5 hover:border-warm-white transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                        </a>
                    </div>
                </div>
            </motion.section>

            {/* ── Stats + How it works ───────────────────────────────────── */}
            <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
                {/* Stats */}
                <motion.div
                    className="md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-3"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-7">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Amici invitati
                        </span>
                        <div className="mt-3 flex items-baseline gap-3">
                            <span className="text-display text-5xl md:text-6xl text-warm-white tabular-nums leading-none">
                                0
                            </span>
                            <span className="text-display-alt text-xl text-accent-warm">friends</span>
                        </div>
                    </div>
                    <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-7">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Crediti guadagnati
                        </span>
                        <div className="mt-3 flex items-baseline gap-3">
                            <span className="text-display text-5xl md:text-6xl text-success tabular-nums leading-none">
                                {formatPrice(0)}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Steps */}
                <motion.div
                    className="md:col-span-3"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <span className="text-display-alt text-xl text-accent-warm">How it works</span>
                    <h2 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">
                        Come funziona
                    </h2>

                    <ol className="mt-8 space-y-6">
                        {STEPS.map((step) => (
                            <li key={step.n} className="grid grid-cols-[auto_1fr] gap-5 group">
                                <span className="text-display text-3xl text-accent-warm/70 tabular-nums leading-none group-hover:text-accent-warm transition-colors">
                                    {step.n}
                                </span>
                                <div className="border-l border-line pl-5 pb-2">
                                    <h3 className="text-display text-lg text-warm-white tracking-tight">{step.title}</h3>
                                    <p className="mt-1.5 text-warm-white-muted text-sm leading-relaxed max-w-md">
                                        {step.body}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </motion.div>
            </div>
        </div>
    );
}
