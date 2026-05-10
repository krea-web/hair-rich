"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/i18n/useLang";

const PHONE = "393331234567"; // E.164 senza + (sostituire con numero reale Hair Rich)

const PRESET_MESSAGE: Record<string, string> = {
    it: "Ciao Hair Rich! Vorrei informazioni sulla prenotazione.",
    en: "Hi Hair Rich! I'd like info about booking an appointment.",
    fr: "Bonjour Hair Rich ! Je souhaite des informations sur la réservation.",
    de: "Hallo Hair Rich! Ich möchte Infos zur Buchung.",
};

export function WhatsAppFAB() {
    const { lang } = useT();
    const [hidden, setHidden] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith("/admin")) setHidden(true);
    }, []);

    if (hidden) return null;

    const message = PRESET_MESSAGE[lang] ?? PRESET_MESSAGE.it!;
    const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

    const labelByLang: Record<string, string> = {
        it: "Chatta su WhatsApp",
        en: "Chat on WhatsApp",
        fr: "Discutez sur WhatsApp",
        de: "Auf WhatsApp chatten",
    };
    const label = labelByLang[lang] ?? labelByLang.it!;

    return (
        <motion.div
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-50"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
            <div className="relative">
                <AnimatePresence>
                    {tooltipOpen && (
                        <motion.span
                            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black-2 border border-line text-warm-white text-xs uppercase tracking-[0.25em] font-body font-semibold px-3 py-2 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.18 }}
                            role="tooltip"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>

                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setTooltipOpen(true)}
                    onMouseLeave={() => setTooltipOpen(false)}
                    onFocus={() => setTooltipOpen(true)}
                    onBlur={() => setTooltipOpen(false)}
                    className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-[0_15px_40px_-10px_rgba(37,211,102,0.6)] hover:scale-[1.08] hover:shadow-[0_20px_50px_-10px_rgba(37,211,102,0.85)] active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white"
                    aria-label={label}
                >
                    {/* Pulsing ring */}
                    <motion.span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border-2 border-[#25D366]"
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                    />
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                </a>
            </div>
        </motion.div>
    );
}
