"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import { useToastStore } from "@/lib/store";

const COLORS: Record<string, string> = {
    success: "border-success/40 bg-success/10",
    error: "border-error/40 bg-error/10",
    info: "border-line bg-black-2",
};

const ICONS: Record<string, ReactElement> = {
    success: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-error" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
    ),
    info: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-warm-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
    ),
};

export function ToastViewport() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="fixed z-[80] top-20 right-4 md:right-6 left-4 md:left-auto flex flex-col items-end gap-2 pointer-events-none"
        >
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: 60, scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.92 }}
                        transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`pointer-events-auto flex items-start gap-3 max-w-sm md:max-w-md p-4 pr-9 rounded-[var(--radius-md)] border backdrop-blur-md shadow-[0_15px_40px_-10px_rgba(0,0,0,0.7)] ${COLORS[t.type]}`}
                        role={t.type === "error" ? "alert" : "status"}
                    >
                        <span className="mt-0.5 flex-shrink-0">{ICONS[t.type]}</span>
                        <p className="flex-1 text-warm-white text-sm font-body leading-snug">
                            {t.message}
                        </p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full text-silver-dark hover:text-warm-white transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-warm"
                            aria-label="Chiudi"
                        >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
