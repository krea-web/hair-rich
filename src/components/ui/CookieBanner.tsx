"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/useLang";

const STORAGE_KEY = "hr-cookie-consent";

interface Consent {
    essentials: boolean;
    analytics: boolean;
    marketing: boolean;
    decidedAt: string;
}

export function CookieBanner() {
    const { t, lang } = useT();
    const [open, setOpen] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) setOpen(true);
        } catch {
            /* ignore */
        }
    }, []);

    const persist = (c: Consent) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
        } catch {
            /* ignore */
        }
        setOpen(false);
    };

    const acceptAll = () =>
        persist({ essentials: true, analytics: true, marketing: true, decidedAt: new Date().toISOString() });
    const onlyEssentials = () =>
        persist({ essentials: true, analytics: false, marketing: false, decidedAt: new Date().toISOString() });
    const saveCustom = () =>
        persist({ essentials: true, analytics, marketing, decidedAt: new Date().toISOString() });

    const customLabels: Record<string, { analytics: string; marketing: string; analyticsBody: string; marketingBody: string; saveLabel: string }> = {
        it: {
            analytics: "Analytics",
            marketing: "Marketing",
            analyticsBody: "Aiutaci a capire come usi il sito (anonimizzato)",
            marketingBody: "Annunci e offerte personalizzate",
            saveLabel: "Salva preferenze",
        },
        en: {
            analytics: "Analytics",
            marketing: "Marketing",
            analyticsBody: "Help us understand how you use the site (anonymized)",
            marketingBody: "Personalized ads and offers",
            saveLabel: "Save preferences",
        },
        fr: {
            analytics: "Analyse",
            marketing: "Marketing",
            analyticsBody: "Aidez-nous à comprendre votre utilisation du site (anonymisé)",
            marketingBody: "Publicités et offres personnalisées",
            saveLabel: "Enregistrer",
        },
        de: {
            analytics: "Analyse",
            marketing: "Marketing",
            analyticsBody: "Hilf uns, deine Nutzung zu verstehen (anonymisiert)",
            marketingBody: "Personalisierte Anzeigen und Angebote",
            saveLabel: "Einstellungen speichern",
        },
    };
    const labels = customLabels[lang] ?? customLabels.it!;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    role="dialog"
                    aria-labelledby="cookie-banner-title"
                    aria-modal="false"
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed z-[90] bottom-4 left-4 right-4 md:left-6 md:right-auto md:bottom-6 md:max-w-md bg-black-2 border border-line rounded-[var(--radius-lg)] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden"
                >
                    <div className="p-5 md:p-6">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-9 h-9 rounded-full bg-accent-warm/15 border border-accent-warm/40 flex items-center justify-center text-accent-warm">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z" />
                                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                                    <circle cx="14.5" cy="9" r="1" fill="currentColor" />
                                    <circle cx="13" cy="14" r="1" fill="currentColor" />
                                    <circle cx="9" cy="15" r="0.7" fill="currentColor" />
                                </svg>
                            </span>
                            <div className="flex-1 min-w-0">
                                <h2 id="cookie-banner-title" className="text-display text-base text-warm-white tracking-wide">
                                    {t.cookies.title}
                                </h2>
                                <p className="mt-1.5 text-warm-white-muted text-sm leading-snug">
                                    {t.cookies.body}
                                </p>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {showCustomize && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden mt-4 space-y-2"
                                >
                                    <CookieToggle
                                        label={labels.analytics}
                                        body={labels.analyticsBody}
                                        checked={analytics}
                                        onChange={setAnalytics}
                                    />
                                    <CookieToggle
                                        label={labels.marketing}
                                        body={labels.marketingBody}
                                        checked={marketing}
                                        onChange={setMarketing}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-5 flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={acceptAll}
                                className="flex-1 px-5 py-2.5 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:brightness-110 transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white"
                            >
                                {t.cookies.accept}
                            </button>
                            {showCustomize ? (
                                <button
                                    onClick={saveCustom}
                                    className="flex-1 px-5 py-2.5 bg-warm-white text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-silver transition-colors active:scale-95"
                                >
                                    {labels.saveLabel}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowCustomize(true)}
                                    className="flex-1 px-5 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                                >
                                    {t.cookies.customize}
                                </button>
                            )}
                            <button
                                onClick={onlyEssentials}
                                className="flex-1 sm:flex-none px-5 py-2.5 text-silver hover:text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold transition-colors"
                            >
                                {t.cookies.essentials}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function CookieToggle({
    label,
    body,
    checked,
    onChange,
}: {
    label: string;
    body: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-4 p-3 bg-carbon border border-line rounded-[var(--radius-sm)] cursor-pointer">
            <div className="flex-1 min-w-0">
                <p className="text-warm-white text-xs font-body font-semibold">{label}</p>
                <p className="text-silver-dark text-[11px] mt-0.5 leading-snug">{body}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative shrink-0 w-10 h-6 rounded-full border transition-colors ${
                    checked ? "bg-accent-warm border-accent-warm" : "bg-black-2 border-line"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                        checked ? "translate-x-4 bg-black" : "translate-x-0 bg-silver"
                    }`}
                />
            </button>
        </label>
    );
}
