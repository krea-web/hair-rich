"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MOCK_CLIENTS = [
    { id: "1", name: "Mario Rossi", phone: "+39 333 1234567", email: "mario@email.com", visits: 12, lastVisit: "2023-10-12", ltv: 350 },
    { id: "2", name: "Luca Bianchi", phone: "+39 344 9876543", email: "luca.b@email.com", visits: 3, lastVisit: "2023-10-15", ltv: 65 },
    { id: "3", name: "Andrea Verdi", phone: "+39 322 5556667", email: "andrea@email.com", visits: 24, lastVisit: "2023-09-30", ltv: 720 },
];

export default function AdminClientiPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            {/* ── Header ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Clienti</h1>
                    <p className="text-silver-dark text-sm mt-1">Gestisci anagrafica, storico appuntamenti e note.</p>
                </div>
                <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all shrink-0">
                    + Aggiungi Cliente
                </button>
            </motion.div>

            {/* ── Filtri ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 shrink-0">
                <div className="relative flex-1 max-w-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-silver-dark" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Cerca nome, telefono, email..."
                        className="w-full bg-carbon border border-line rounded-[var(--radius-sm)] pl-10 pr-4 py-2 text-sm text-warm-white focus:border-silver-dark focus:outline-none transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-4 py-2 bg-carbon border border-line rounded-[var(--radius-sm)] text-sm text-silver hover:text-warm-white transition-colors">
                    Filtri
                </button>
            </motion.div>

            {/* ── DataTable ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-carbon/50 text-xs uppercase tracking-widest text-silver-dark font-semibold border-b border-line sticky top-0 z-10 backdrop-blur">
                            <tr>
                                <th className="px-6 py-4 font-normal">Cliente</th>
                                <th className="px-6 py-4 font-normal">Contatti</th>
                                <th className="px-6 py-4 font-normal">Visite</th>
                                <th className="px-6 py-4 font-normal">Ultima Visita</th>
                                <th className="px-6 py-4 font-normal">LTV (€)</th>
                                <th className="px-6 py-4 font-normal text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {MOCK_CLIENTS.map(client => (
                                <tr key={client.id} className="hover:bg-carbon-2 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-black-2 text-silver flex items-center justify-center font-bold text-xs uppercase border border-line">
                                                {client.name.substring(0, 2)}
                                            </div>
                                            <span className="font-body font-semibold text-warm-white">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-silver">
                                        {client.phone}<br />
                                        <span className="text-xs text-silver-dark">{client.email}</span>
                                    </td>
                                    <td className="px-6 py-4 text-warm-white">{client.visits}</td>
                                    <td className="px-6 py-4 text-silver">
                                        {new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(new Date(client.lastVisit))}
                                    </td>
                                    <td className="px-6 py-4 text-success font-mono">{client.ltv},00 €</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-silver hover:text-warm-white transition-colors p-2">
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-line p-4 flex items-center justify-between text-xs text-silver-dark bg-carbon/30">
                    <span>Mostrando {MOCK_CLIENTS.length} di 1.234 clienti</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-line rounded hover:bg-carbon transition-colors disabled:opacity-50" disabled>Prec</button>
                        <button className="px-3 py-1 border border-line rounded hover:bg-carbon transition-colors">Succ</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
