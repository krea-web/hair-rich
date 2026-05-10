"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
export default function AdminDashboardPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* ── Header ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-display text-4xl text-warm-white">Dashboard Overview</h1>
            </motion.div>

            {/* ── KPI Grid ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
                {[
                    { label: "Incasso Oggi", value: formatPrice(125000), trend: "+12%", color: "text-success" },
                    { label: "Appuntamenti", value: "34", trend: "Pieni all'80%", color: "text-silver" },
                    { label: "Nuovi Clienti", value: "8", trend: "+2", color: "text-success" },
                    { label: "Ordini Click&Collect", value: "3", trend: "Da preparare", color: "text-accent-warm" },
                ].map((kpi, i) => (
                    <div key={i} className="p-6 bg-carbon border border-line rounded-[var(--radius-md)] flex flex-col justify-between h-32">
                        <span className="text-xs uppercase font-semibold text-silver-dark tracking-widest">{kpi.label}</span>
                        <div className="flex items-end justify-between mt-auto">
                            <span className="text-3xl font-body font-bold text-warm-white">{kpi.value}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${kpi.color}`}>{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Prossimi appuntamenti list ──────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden"
                >
                    <div className="p-4 border-b border-line flex justify-between items-center bg-carbon/50">
                        <h2 className="text-sm font-semibold font-body">Prossimi Arrivi (Oggi)</h2>
                        <a href="/admin/agenda" className="text-xs text-silver hover:text-warm-white">Vedi Agenda &rarr;</a>
                    </div>
                    <div className="divide-y divide-line">
                        {[
                            { time: "14:30", client: "Andrea M.", service: "Taglio + Barba", staff: "Marco", status: "confirmed" },
                            { time: "15:00", client: "Giorgio B.", service: "Taglio Uomo", staff: "Luca", status: "arrived" },
                            { time: "15:30", client: "Simone R.", service: "Barba", staff: "Marco", status: "confirmed" },
                        ].map((apt, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-carbon-2 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black-2 rounded flex items-center justify-center font-mono text-sm text-silver font-bold group-hover:bg-accent-warm group-hover:text-black transition-colors">
                                        {apt.time}
                                    </div>
                                    <div>
                                        <div className="text-warm-white font-medium text-sm">{apt.client}</div>
                                        <div className="text-silver-dark text-xs mt-0.5">{apt.service} • {apt.staff}</div>
                                    </div>
                                </div>
                                {apt.status === "arrived" ? (
                                    <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold uppercase rounded text-center min-w-[70px]">In Salone</span>
                                ) : (
                                    <span className="px-2 py-1 border border-line text-silver text-[10px] uppercase rounded text-center min-w-[70px]">Confermato</span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Azioni rapide e Alert ───────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    <div className="bg-[#111111] border border-line rounded-[var(--radius-md)] p-6">
                        <h2 className="text-xs uppercase font-semibold text-silver-dark tracking-widest mb-4">Azioni Rapide</h2>
                        <div className="space-y-2">
                            <button className="w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors flex items-center gap-3">
                                <span className="text-accent-warm">+</span> Nuova Prenotazione
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors flex items-center gap-3">
                                <span className="text-accent-warm">+</span> Nuovo Cliente
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors flex items-center gap-3">
                                <span className="text-accent-warm">+</span> Vendita Prodotto (Cassa)
                            </button>
                        </div>
                    </div>

                    <div className="bg-error/10 border border-error/20 rounded-[var(--radius-md)] p-6">
                        <h2 className="text-xs uppercase font-semibold text-error tracking-widest mb-2 flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            Alert Scorte
                        </h2>
                        <p className="text-error/80 text-sm">Cera Opaca Forte sotto soglia minima (2 pz rimanenti).</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
