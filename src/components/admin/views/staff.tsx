"use client";

import { motion } from "framer-motion";

const MOCK_STAFF = [
    { id: "1", name: "Marco Draghi", role: "Master Barber", tag: "Titolare", active: true },
    { id: "2", name: "Luca Esposito", role: "Barber", tag: "Dipendente", active: true },
];

export default function AdminStaffPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            {/* ── Header ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Il Team</h1>
                    <p className="text-silver-dark text-sm mt-1">Gestisci i collaboratori, le loro agende e i ruoli.</p>
                </div>
                <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all shrink-0">
                    + Aggiungi Collaboratore
                </button>
            </motion.div>

            {/* ── Cards ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_STAFF.map(staff => (
                    <div key={staff.id} className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 flex gap-2">
                            {staff.tag === "Titolare" && (
                                <span className="px-2 py-0.5 bg-accent-warm/20 text-accent-warm border border-accent-warm/30 rounded text-[10px] uppercase font-bold tracking-widest">Titolare</span>
                            )}
                            <button className="text-silver-dark hover:text-warm-white transition-colors"><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg></button>
                        </div>

                        <div className="w-20 h-20 rounded-[var(--radius-md)] bg-black-2 border border-line flex items-center justify-center mb-4">
                            <span className="text-display text-2xl text-warm-white">{staff.name.charAt(0)}</span>
                        </div>

                        <h3 className="text-xl font-body font-semibold text-warm-white">{staff.name}</h3>
                        <p className="text-sm text-silver-dark italic mb-6">{staff.role}</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-silver-dark">Appuntamenti Oggi</span>
                                <span className="text-warm-white font-mono">12</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-silver-dark">Stato</span>
                                <span className="text-success text-xs font-semibold uppercase tracking-wider">Operativo</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-line flex gap-3">
                            <button className="flex-1 py-2 bg-carbon-2 hover:bg-black-2 border border-line rounded text-xs uppercase tracking-widest text-warm-white transition-colors">
                                Visualizza Agenda
                            </button>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
