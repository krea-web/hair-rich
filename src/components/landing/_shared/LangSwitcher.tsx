"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOCALES, LOCALE_META, localizePath, type Locale } from "@/i18n";

interface Props {
    /** Lingua attualmente attiva (calcolata server-side e passata via prop). */
    current: Locale;
    /** Variante visiva: "navbar" compatto su sfondo scuro · "footer" più largo. */
    variant?: "navbar" | "footer";
    className?: string;
}

const STORAGE_KEY = "hr-locale-pref";

export function LangSwitcher({ current, variant = "navbar", className = "" }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Outside click + ESC to close
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const onSelect = (loc: Locale) => {
        try {
            localStorage.setItem(STORAGE_KEY, loc);
        } catch {
            /* ignore */
        }
        const target = localizePath(window.location.pathname, loc);
        window.location.href = target + window.location.hash;
    };

    if (variant === "footer") {
        return (
            <div ref={ref} className={`relative inline-block ${className}`}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-3 px-4 py-2.5 border border-line rounded-full text-sm text-warm-white hover:border-warm-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span aria-hidden="true">{LOCALE_META[current].flag}</span>
                    <span>{LOCALE_META[current].native}</span>
                    <svg
                        viewBox="0 0 24 24"
                        className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                <Menu open={open} current={current} onSelect={onSelect} placement="up" />
            </div>
        );
    }

    // navbar (default): compact pill
    return (
        <div ref={ref} className={`relative inline-block ${className}`}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-line bg-black/30 backdrop-blur-md text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-warm"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Cambia lingua"
            >
                <span aria-hidden="true">{LOCALE_META[current].flag}</span>
                <span>{current.toUpperCase()}</span>
                <svg
                    viewBox="0 0 24 24"
                    className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <Menu open={open} current={current} onSelect={onSelect} placement="down" />
        </div>
    );
}

function Menu({
    open,
    current,
    onSelect,
    placement,
}: {
    open: boolean;
    current: Locale;
    onSelect: (loc: Locale) => void;
    placement: "up" | "down";
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.ul
                    role="listbox"
                    initial={{ opacity: 0, y: placement === "down" ? -8 : 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: placement === "down" ? -8 : 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`absolute right-0 ${
                        placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
                    } z-50 min-w-[180px] bg-black-2 border border-line rounded-[var(--radius-md)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden`}
                >
                    {LOCALES.map((loc) => {
                        const meta = LOCALE_META[loc];
                        const active = loc === current;
                        return (
                            <li key={loc} role="option" aria-selected={active}>
                                <button
                                    onClick={() => onSelect(loc)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-body transition-colors ${
                                        active
                                            ? "bg-accent-warm/10 text-warm-white"
                                            : "text-silver hover:bg-carbon hover:text-warm-white"
                                    }`}
                                >
                                    <span aria-hidden="true" className="text-base">{meta.flag}</span>
                                    <span className="flex-1">{meta.native}</span>
                                    {active && (
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-accent-warm"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </motion.ul>
            )}
        </AnimatePresence>
    );
}
