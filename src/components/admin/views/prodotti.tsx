"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const MOCK_PRODUCTS = [
    { id: "1", name: "Cera Opaca Forte Hair Rich", price: 2500, stock: 2, status: "low_stock", category: "Styling" },
    { id: "2", name: "Olio da Barba Premium", price: 2200, stock: 15, status: "in_stock", category: "Cura Barba" },
    { id: "3", name: "Shampoo Purificante", price: 1800, stock: 0, status: "out_of_stock", category: "Lavaggio" },
];

export default function AdminProdottiPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const getStatusBadge = (status: string, stock: number) => {
        if (stock === 0) return <span className="px-2 py-1 bg-error/10 text-error border border-error/20 rounded text-[10px] uppercase font-bold tracking-widest">Esaurito</span>;
        if (status === "low_stock") return <span className="px-2 py-1 bg-accent-warm/10 text-accent-warm border border-accent-warm/20 rounded text-[10px] uppercase font-bold tracking-widest">In Esaurimento</span>;
        return <span className="px-2 py-1 bg-success/10 text-success border border-success/20 rounded text-[10px] uppercase font-bold tracking-widest">Disponibile</span>;
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            {/* ── Header ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Inventario Prodotti</h1>
                    <p className="text-silver-dark text-sm mt-1">Gestisci le scorte, modifica i prezzi e attiva la vendita Click & Collect.</p>
                </div>
                <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all shrink-0">
                    + Nuovo Prodotto
                </button>
            </motion.div>

            {/* ── KPI Alert ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 shrink-0">
                <div className="flex-1 bg-error/10 border border-error/20 rounded-[var(--radius-md)] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center text-error">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <div>
                        <h3 className="text-error font-semibold font-body">2 Prodotti in esaurimento</h3>
                        <p className="text-error/80 text-xs mt-0.5">La Cera Opaca e lo Shampoo sono sotto la soglia minima.</p>
                    </div>
                </div>
            </motion.div>

            {/* ── DataTable ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-line bg-carbon/50 flex gap-4">
                    <input type="text" placeholder="Cerca prodotto..." className="w-full max-w-sm bg-black border border-line rounded-[var(--radius-sm)] px-4 py-2 text-sm text-warm-white focus:border-silver-dark focus:outline-none" />
                    <select className="bg-black border border-line rounded-[var(--radius-sm)] px-4 py-2 text-sm text-silver-dark focus:outline-none">
                        <option>Tutte le Categorie</option>
                        <option>Styling</option>
                        <option>Cura Barba</option>
                    </select>
                </div>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-carbon/50 text-xs uppercase tracking-widest text-silver-dark font-semibold border-b border-line sticky top-0 z-10 backdrop-blur">
                            <tr>
                                <th className="px-6 py-4 font-normal">Prodotto</th>
                                <th className="px-6 py-4 font-normal">Categoria</th>
                                <th className="px-6 py-4 font-normal">Prezzo</th>
                                <th className="px-6 py-4 font-normal">Scorta</th>
                                <th className="px-6 py-4 font-normal">Stato</th>
                                <th className="px-6 py-4 font-normal text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {MOCK_PRODUCTS.map(prod => (
                                <tr key={prod.id} className="hover:bg-carbon-2 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4">
                                        <span className="font-body font-semibold text-warm-white">{prod.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-silver">
                                        {prod.category}
                                    </td>
                                    <td className="px-6 py-4 text-warm-white font-mono">{prod.price / 100},00 €</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono text-lg font-bold ${prod.stock < 5 ? 'text-error' : 'text-warm-white'}`}>{prod.stock}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(prod.status, prod.stock)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-silver hover:text-warm-white transition-colors p-2 text-xs uppercase tracking-widest">Mostra</button>
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
