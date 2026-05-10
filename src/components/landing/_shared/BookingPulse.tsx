"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/useLang";

const NAMES = [
    "Marco",
    "Luca",
    "Andrea",
    "Giovanni",
    "Stefano",
    "Roberto",
    "Paolo",
    "Davide",
    "Simone",
    "Antonio",
    "Riccardo",
    "Tommaso",
    "Federico",
    "Matteo",
];

const SERVICES_BY_LANG = {
    it: ["Razor Fade", "Taglio + Barba", "Taglio classico", "Barba sartoriale", "Razor Cut"],
    en: ["Razor Fade", "Cut + Beard", "Classic Cut", "Tailored Beard", "Razor Cut"],
    fr: ["Razor Fade", "Coupe + Barbe", "Coupe classique", "Barbe sur mesure", "Razor Cut"],
    de: ["Razor Fade", "Schnitt + Bart", "Klassischer Schnitt", "Maßgeschneiderter Bart", "Razor Cut"],
} as const;

interface Props {
    variant?: "counter" | "popup" | "both";
    className?: string;
}

/**
 * Live social proof: mostra contatore "N prenotazioni questa settimana" + popup
 * occasionali "Marco ha appena prenotato un Razor Fade".
 *
 * Mock realistico: counter incrementa lento (1-2 ogni ~30s) per simulare attività;
 * popup ogni 25-40s con nome random + servizio random.
 */
export function BookingPulse({ variant = "both", className = "" }: Props) {
    const reduced = useReducedMotion();
    const { t, lang } = useT();
    const [count, setCount] = useState(0);
    const [popup, setPopup] = useState<{ name: string; service: string; key: number } | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const popupKeyRef = useRef(0);

    // Counter init + slow increment
    useEffect(() => {
        const day = Math.floor(Date.now() / 86_400_000);
        const base = 28 + ((day * 7919) % 17); // 28-44
        setCount(base);

        if (reduced) return;
        const interval = setInterval(() => {
            setCount((c) => c + (Math.random() > 0.6 ? 1 : 0));
        }, 32_000);
        return () => clearInterval(interval);
    }, [reduced]);

    // Popup loop
    useEffect(() => {
        if (variant === "counter" || dismissed || reduced) return;
        const services = SERVICES_BY_LANG[lang] ?? SERVICES_BY_LANG.it;

        let timeout: ReturnType<typeof setTimeout>;
        const fire = () => {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)];
            const service = services[Math.floor(Math.random() * services.length)];
            popupKeyRef.current += 1;
            setPopup({ name: `${name} ${name![0]}.`, service: service!, key: popupKeyRef.current });
            // Auto-hide popup dopo 5.5s, poi schedula prossimo
            timeout = setTimeout(() => {
                setPopup(null);
                timeout = setTimeout(fire, 28_000 + Math.random() * 12_000);
            }, 5_500);
        };
        timeout = setTimeout(fire, 8_000); // primo dopo 8s
        return () => clearTimeout(timeout);
    }, [variant, dismissed, reduced, lang]);

    return (
        <>
            {(variant === "counter" || variant === "both") && count > 0 && (
                <div
                    className={`inline-flex items-center gap-3 ${className}`}
                    role="status"
                    aria-live="polite"
                >
                    {/* Pile of avatars */}
                    <div className="flex -space-x-2">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                aria-hidden="true"
                                className="w-7 h-7 rounded-full border-2 border-black bg-gradient-to-br from-accent-warm to-warning"
                                style={{ opacity: 0.85 - i * 0.18 }}
                            />
                        ))}
                    </div>
                    <span className="text-[11px] md:text-xs text-warm-white-muted font-body">
                        <strong className="text-warm-white">{t.socialProof.weekly(count)}</strong>
                    </span>
                </div>
            )}

            {(variant === "popup" || variant === "both") && (
                <AnimatePresence>
                    {popup && !dismissed && (
                        <motion.div
                            key={popup.key}
                            initial={{ opacity: 0, y: 30, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.95 }}
                            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                            className="fixed top-20 md:bottom-24 md:top-auto left-4 md:left-6 z-[54] max-w-[280px] md:max-w-[300px] bg-black-2 border border-line rounded-[var(--radius-md)] p-3 pr-9 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md"
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-3">
                                <span className="relative flex h-2.5 w-2.5 mt-1.5 flex-shrink-0">
                                    <motion.span
                                        className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60"
                                        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                                    />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-warm-white text-sm font-body leading-snug">
                                        {t.socialProof.recentBooking(popup.name, popup.service)}
                                    </p>
                                    <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mt-1 block">
                                        Live
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDismissed(true)}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full text-silver-dark hover:text-warm-white transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-warm"
                                aria-label="Chiudi notifica"
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
