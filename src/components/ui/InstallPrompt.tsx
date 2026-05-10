"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/i18n/useLang";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const STORAGE_KEY = "hr-install-dismissed";
const STORAGE_INSTALLED = "hr-pwa-installed";

export function InstallPrompt() {
    const { t } = useT();
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Skip se già installata o utente ha dismesso
        try {
            if (localStorage.getItem(STORAGE_INSTALLED) === "1") return;
            const dismissed = localStorage.getItem(STORAGE_KEY);
            if (dismissed) {
                const ts = parseInt(dismissed, 10);
                if (Date.now() - ts < 14 * 24 * 60 * 60 * 1000) return; // re-prompt dopo 14 giorni
            }
        } catch {
            /* ignore */
        }

        // Skip su standalone display (già installata)
        if (
            typeof window !== "undefined" &&
            (window.matchMedia("(display-mode: standalone)").matches ||
                (navigator as any).standalone === true)
        ) {
            try {
                localStorage.setItem(STORAGE_INSTALLED, "1");
            } catch {
                /* ignore */
            }
            return;
        }

        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
            // Mostra prompt dopo 30s di engagement
            setTimeout(() => setVisible(true), 30_000);
        };
        const onInstalled = () => {
            setVisible(false);
            try {
                localStorage.setItem(STORAGE_INSTALLED, "1");
            } catch {
                /* ignore */
            }
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const onInstall = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const result = await deferred.userChoice;
        setDeferred(null);
        setVisible(false);
        if (result.outcome === "dismissed") {
            try {
                localStorage.setItem(STORAGE_KEY, Date.now().toString());
            } catch {
                /* ignore */
            }
        }
    };

    const onDismiss = () => {
        setVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } catch {
            /* ignore */
        }
    };

    return (
        <AnimatePresence>
            {visible && deferred && (
                <motion.div
                    role="dialog"
                    aria-labelledby="install-title"
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed z-[85] bottom-24 md:bottom-6 right-4 md:right-6 max-w-sm bg-black-2 border border-accent-warm/40 rounded-[var(--radius-lg)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden"
                >
                    <div className="p-5">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-10 h-10 rounded-[var(--radius-sm)] bg-accent-warm/15 border border-accent-warm/40 flex items-center justify-center">
                                <img
                                    src="/icon-192.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="w-7 h-7 rounded-sm"
                                />
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 id="install-title" className="text-display text-base text-warm-white tracking-wide">
                                    {t.install.title}
                                </h3>
                                <p className="mt-1.5 text-warm-white-muted text-sm leading-snug">
                                    {t.install.body}
                                </p>
                            </div>
                            <button
                                onClick={onDismiss}
                                className="flex-shrink-0 w-6 h-6 rounded-full text-silver-dark hover:text-warm-white transition-colors flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-warm"
                                aria-label="Chiudi"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={onInstall}
                                className="flex-1 px-5 py-2.5 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:brightness-110 transition-all active:scale-95"
                            >
                                {t.install.cta}
                            </button>
                            <button
                                onClick={onDismiss}
                                className="px-5 py-2.5 text-silver hover:text-warm-white text-[10px] uppercase tracking-[0.3em] font-body font-semibold transition-colors"
                            >
                                {t.install.notNow}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
