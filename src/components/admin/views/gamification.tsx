"use client";

import { motion } from "framer-motion";

export default function AdminGamificationPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Gamification & Fidelity</h1>
                    <p className="text-silver-dark text-sm mt-1">Configura crediti passaparola, soglie sconto e VIP program.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                    <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 space-y-4">
                        <h2 className="text-xs uppercase tracking-widest text-silver font-semibold border-b border-line pb-2">Regole "Passaparola"</h2>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Crediti all'Amico Invitato (Nuovo)</label>
                            <div className="relative">
                                <input type="number" defaultValue="5" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-dark font-mono">€</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Crediti al Promotore (Referrer)</label>
                            <div className="relative">
                                <input type="number" defaultValue="5" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-dark font-mono">€</span>
                            </div>
                        </div>
                        <p className="text-[10px] uppercase text-silver-dark tracking-widest leading-relaxed">
                            Questa regola assegna automaticamente il saldo nel portafoglio (`profiles.wallet_balance`) a conversione appuntamento avvenuta.
                        </p>
                        <button className="px-4 py-2 bg-warm-white text-black text-xs uppercase font-bold tracking-widest rounded-[var(--radius-sm)] w-full hover:bg-white transition-colors">
                            Aggiorna Regole
                        </button>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                    <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 space-y-4">
                        <h2 className="text-xs uppercase tracking-widest text-silver font-semibold border-b border-line pb-2">Genera Coupon Esplicito</h2>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Codice Sconto</label>
                            <input type="text" defaultValue="SUMMER24" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white uppercase font-mono focus:border-accent-warm focus:outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Valore Sconto</label>
                                <input type="number" defaultValue="20" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Tipologia</label>
                                <select className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none appearance-none">
                                    <option>Percentuale (%)</option>
                                    <option>Fisso (€)</option>
                                </select>
                            </div>
                        </div>

                        <button className="px-4 py-2 border border-accent-warm text-accent-warm hover:bg-accent-warm hover:text-black text-xs uppercase font-bold tracking-widest rounded-[var(--radius-sm)] w-full transition-colors">
                            Crea Coupon Code
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
