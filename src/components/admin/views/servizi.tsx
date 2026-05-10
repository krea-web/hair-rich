"use client";

import { motion } from "framer-motion";

const MOCK_SERVICES = [
    { id: "1", name: "Taglio Uomo", category: "taglio", price: 2000, duration: 30, active: true },
    { id: "2", name: "Barba", category: "barba", price: 1500, duration: 30, active: true },
    { id: "3", name: "Taglio + Barba", category: "combo", price: 3000, duration: 60, active: true },
    { id: "4", name: "Trattamento Viso VIP", category: "altro", price: 2500, duration: 20, active: false },
];

export default function AdminServiziPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            {/* ── Header ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Servizi Offerti</h1>
                    <p className="text-silver-dark text-sm mt-1">Configura il tuo menu, regola i prezzi e i tempi per i booking slot.</p>
                </div>
                <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all shrink-0">
                    + Nuovo Servizio
                </button>
            </motion.div>

            {/* ── DataTable ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-carbon/50 text-xs uppercase tracking-widest text-silver-dark font-semibold border-b border-line sticky top-0 z-10 backdrop-blur">
                            <tr>
                                <th className="px-6 py-4 font-normal">Nome Servizio</th>
                                <th className="px-6 py-4 font-normal">Categoria</th>
                                <th className="px-6 py-4 font-normal">Prezzo</th>
                                <th className="px-6 py-4 font-normal">Durata (min)</th>
                                <th className="px-6 py-4 font-normal">Stato</th>
                                <th className="px-6 py-4 font-normal text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {MOCK_SERVICES.map(svc => (
                                <tr key={svc.id} className={`hover:bg-carbon-2 transition-colors group cursor-pointer ${!svc.active && 'opacity-60 grayscale'}`}>
                                    <td className="px-6 py-4">
                                        <span className="font-body font-semibold text-warm-white">{svc.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-silver">
                                        <span className="px-2 py-1 bg-black-2 border border-line rounded text-[10px] uppercase tracking-wider">
                                            {svc.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-accent-warm font-mono">{svc.price / 100},00 €</td>
                                    <td className="px-6 py-4 text-silver flex items-center gap-2">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-silver-dark" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        {svc.duration}
                                    </td>
                                    <td className="px-6 py-4">
                                        {svc.active ? (
                                            <span className="w-2 h-2 rounded-full bg-success inline-block shadow-[0_0_8px_rgba(0,255,0,0.5)]"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-error inline-block"></span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-silver hover:text-warm-white transition-colors p-2 text-xs uppercase tracking-widest">Modifica</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
