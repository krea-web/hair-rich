"use client";

import { motion } from "framer-motion";

const MOCK_ORDERS = [
    { id: "HR00125", date: "2023-10-24 10:30", client: "Mario Rossi", total: 4500, type: "servizio+prodotto", status: "paid" },
    { id: "HR00126", date: "2023-10-24 11:15", client: "Andrea Verdi", total: 2000, type: "servizio", status: "pending" },
    { id: "HR00127", date: "2023-10-24 14:00", client: "Luca Neri", total: 2500, type: "click_collect", status: "ready_pickup" },
];

export default function AdminOrdiniPage() {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <span className="px-2 py-1 bg-success/10 text-success border border-success/20 rounded text-[10px] uppercase font-bold tracking-widest">Pagato</span>;
            case "pending": return <span className="px-2 py-1 bg-carbon-2 text-silver border border-line rounded text-[10px] uppercase font-bold tracking-widest">Da Pagare</span>;
            case "ready_pickup": return <span className="px-2 py-1 bg-accent-warm/10 text-accent-warm border border-accent-warm/20 rounded text-[10px] uppercase font-bold tracking-widest">Pronto (Ritiro)</span>;
            default: return null;
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Ordini e Cassa</h1>
                    <p className="text-silver-dark text-sm mt-1">Gestisci i pagamenti dei servizi in salone e gli ordini Click & Collect.</p>
                </div>
                <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all shrink-0">
                    + Nuova Ricevuta
                </button>
            </motion.div>

            {/* ── KPI ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6">
                    <span className="text-xs uppercase tracking-widest text-silver-dark">Incasso Totale Oggi</span>
                    <div className="text-display text-4xl text-warm-white mt-2">125,00 €</div>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6">
                    <span className="text-xs uppercase tracking-widest text-silver-dark">Ordini Da Pagare</span>
                    <div className="text-display text-4xl text-warm-white mt-2">20,00 €</div>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-6">
                    <span className="text-xs uppercase tracking-widest text-silver-dark">Click & Collect in sospeso</span>
                    <div className="text-display text-4xl text-accent-warm mt-2">1</div>
                </div>
            </motion.div>

            {/* ── DataTable ────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-carbon/50 text-xs uppercase tracking-widest text-silver-dark font-semibold border-b border-line sticky top-0 z-10 backdrop-blur">
                            <tr>
                                <th className="px-6 py-4 font-normal">Ordine ID</th>
                                <th className="px-6 py-4 font-normal">Data / Ora</th>
                                <th className="px-6 py-4 font-normal">Cliente</th>
                                <th className="px-6 py-4 font-normal">Totale</th>
                                <th className="px-6 py-4 font-normal">Tipologia</th>
                                <th className="px-6 py-4 font-normal">Stato</th>
                                <th className="px-6 py-4 font-normal text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {MOCK_ORDERS.map(order => (
                                <tr key={order.id} className="hover:bg-carbon-2 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-mono text-silver">{order.id}</td>
                                    <td className="px-6 py-4 text-silver-dark">{order.date}</td>
                                    <td className="px-6 py-4 font-body font-semibold text-warm-white">{order.client}</td>
                                    <td className="px-6 py-4 text-warm-white font-mono">{order.total / 100},00 €</td>
                                    <td className="px-6 py-4 text-silver">
                                        {order.type === "click_collect" ? "Prodotto (ritiro)" : "Servizi Salone"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-silver hover:text-warm-white transition-colors p-2 text-xs uppercase tracking-widest">
                                            Dettagli
                                        </button>
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
