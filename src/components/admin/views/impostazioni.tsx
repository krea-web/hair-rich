"use client";

import { motion } from "framer-motion";

export default function AdminImpostazioniPage() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-display text-4xl text-warm-white">Impostazioni Salone</h1>
                <p className="text-silver-dark text-sm mt-1">Configura orari, indirizzo, permessi e policy di prenotazione.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                {/* Sezione Base */}
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 md:p-8 space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-silver font-semibold border-b border-line pb-2">Informazioni Base</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Nome Salone</label>
                            <input type="text" defaultValue="Hair Rich Olbia" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Telefono Principale</label>
                            <input type="text" defaultValue="+39 0789 123456" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Indirizzo Fisico</label>
                            <input type="text" defaultValue="Via Cavour 12, Olbia, SS" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                        </div>
                    </div>
                </div>

                {/* Sezione Orari */}
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 md:p-8 space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-silver font-semibold border-b border-line pb-2">Orari di Apertura</h2>
                    <div className="space-y-3">
                        {["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"].map((day, i) => (
                            <div key={day} className="flex items-center justify-between gap-4 p-3 bg-black-2 rounded-[var(--radius-sm)]">
                                <div className="flex items-center gap-3 w-1/3">
                                    <input type="checkbox" defaultChecked={i !== 0 && i !== 6} className="w-4 h-4 accent-accent-warm" />
                                    <span className={`font-body ${i !== 0 && i !== 6 ? 'text-warm-white' : 'text-silver-dark line-through'}`}>{day}</span>
                                </div>
                                {i !== 0 && i !== 6 ? (
                                    <div className="flex flex-1 items-center gap-2 relative">
                                        <input type="time" defaultValue="09:00" className="bg-carbon border border-line rounded px-2 py-1 text-sm text-warm-white focus:outline-none" />
                                        <span className="text-silver-dark">-</span>
                                        <input type="time" defaultValue="19:00" className="bg-carbon border border-line rounded px-2 py-1 text-sm text-warm-white focus:outline-none" />
                                    </div>
                                ) : (
                                    <div className="flex-1 text-sm text-silver-dark italic">Chiuso</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sezione Policy */}
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 md:p-8 space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-silver font-semibold border-b border-line pb-2">Policy Prenotazione</h2>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Slot Base (Intervallo Booking Engine)</label>
                        <select className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none">
                            <option value="15">Ogni 15 minuti</option>
                            <option value="30" selected>Ogni 30 minuti</option>
                            <option value="60">Ogni ora</option>
                        </select>
                    </div>

                    <label className="flex items-start gap-4 p-4 border border-line bg-black-2 rounded-[var(--radius-sm)] cursor-pointer group">
                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 accent-accent-warm rounded" />
                        <div>
                            <span className="font-body text-warm-white block font-semibold group-hover:text-accent-warm transition-colors">Abilita Penale No-Show Automatica</span>
                            <span className="text-xs text-silver mt-1 block">Invia alert n8n se il cliente non si presenta, scala il trust o disabilita prenotazioni per i recidivi.</span>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-line">
                    <button className="px-6 py-3 border border-line text-warm-white rounded-[var(--radius-md)] text-xs uppercase tracking-widest hover:bg-carbon transition-colors">
                        Annulla Modifiche
                    </button>
                    <button className="px-8 py-3 bg-warm-white text-black font-bold rounded-[var(--radius-md)] text-xs uppercase tracking-widest hover:bg-white transition-colors">
                        Salva Impostazioni
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
