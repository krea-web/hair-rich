"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToggleProps {
    label: string;
    description: string;
    defaultChecked?: boolean;
}

function Toggle({ label, description, defaultChecked = false }: ToggleProps) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <label className="flex items-start justify-between gap-6 p-5 md:p-6 hover:bg-carbon-2 transition-colors cursor-pointer">
            <div className="flex-1 min-w-0">
                <h3 className="text-warm-white text-base font-body font-semibold">{label}</h3>
                <p className="text-silver-dark text-sm mt-1 leading-relaxed">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={(e) => {
                    e.preventDefault();
                    setChecked((v) => !v);
                }}
                className={`relative shrink-0 w-12 h-7 rounded-full border transition-colors ${
                    checked ? "bg-accent-warm border-accent-warm" : "bg-black-2 border-line"
                }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-warm-white transition-transform ${
                        checked ? "translate-x-5" : "translate-x-0"
                    }`}
                    style={{ backgroundColor: checked ? "#0A0A0A" : "var(--silver)" }}
                />
            </button>
        </label>
    );
}

export default function ProfiloImpostazioniPage() {
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-3xl">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Manage your</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Impostazioni.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-md">
                    Profilo, notifiche, privacy. Tutto quello che riguarda il tuo account in un posto solo.
                </p>
            </motion.header>

            {/* ── Profilo card ────────────────────────────────────────────── */}
            <motion.section
                aria-label="Profilo"
                className="mt-10 md:mt-14 bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-8 flex items-center gap-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-accent-warm to-warning text-black flex items-center justify-center font-display text-2xl md:text-3xl font-semibold shrink-0 shadow-[0_10px_30px_-10px_rgba(212,165,116,0.6)]">
                    MD
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">Mario Draghi</h2>
                    <p className="text-silver-dark text-sm mt-1 truncate">mario@email.com · +39 333 1234567</p>
                </div>
                <button className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white hover:bg-warm-white/5 transition-colors">
                    Modifica
                </button>
            </motion.section>

            {/* ── Notifiche ──────────────────────────────────────────────── */}
            <motion.section
                aria-labelledby="notif-heading"
                className="mt-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <span className="text-display-alt text-lg text-accent-warm">Notifications</span>
                        <h2 id="notif-heading" className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                            Comunicazioni
                        </h2>
                    </div>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-lg)] overflow-hidden divide-y divide-line">
                    <Toggle
                        label="Marketing e promozioni"
                        description="Ricevi sconti, anteprime nuovi prodotti e novità via email/WhatsApp"
                        defaultChecked
                    />
                    <Toggle
                        label="Promemoria appuntamenti"
                        description="Ti ricordiamo l'appuntamento via SMS 24h prima"
                        defaultChecked
                    />
                    <Toggle
                        label="Recensioni post-visita"
                        description="Ti chiediamo un feedback dopo ogni servizio"
                    />
                </div>
            </motion.section>

            {/* ── GDPR ───────────────────────────────────────────────────── */}
            <motion.section
                aria-labelledby="gdpr-heading"
                className="mt-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <span className="text-display-alt text-lg text-accent-warm">Privacy</span>
                        <h2 id="gdpr-heading" className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                            Diritti GDPR
                        </h2>
                    </div>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-lg)] overflow-hidden divide-y divide-line">
                    <button className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-carbon-2 transition-colors text-left group">
                        <div>
                            <h3 className="text-warm-white text-base font-body font-semibold">Esporta i miei dati</h3>
                            <p className="text-silver-dark text-sm mt-1">Scarica un file JSON con tutto lo storico</p>
                        </div>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-silver-dark group-hover:text-warm-white transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsDeleting(true)}
                        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-error/10 transition-colors text-left group"
                    >
                        <div>
                            <h3 className="text-error text-base font-body font-semibold">Elimina account</h3>
                            <p className="text-error/70 text-sm mt-1">Diritto all'oblio. Questa azione è irreversibile.</p>
                        </div>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-error/60 group-hover:text-error transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9 14.394 18m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </motion.section>

            {/* ── Confirm modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {isDeleting && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDeleting(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            className="bg-carbon border border-error/40 rounded-[var(--radius-lg)] p-8 max-w-md w-full"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-display-alt text-xl text-error">Attention</span>
                            <h3 className="text-display text-2xl text-warm-white tracking-tight mt-1">
                                Elimino l'account?
                            </h3>
                            <p className="text-warm-white-muted text-sm mt-3 leading-relaxed">
                                Tutti gli appuntamenti futuri, lo storico e i crediti saranno persi per sempre.
                                Questa azione non può essere annullata.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsDeleting(false)}
                                    className="flex-1 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white/5 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button className="flex-1 px-5 py-3 bg-error text-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:brightness-110 transition-all">
                                    Sì, elimina
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
