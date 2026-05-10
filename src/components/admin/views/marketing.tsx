"use client";

import { motion } from "framer-motion";

export default function AdminMarketingPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">Marketing & Trend</h1>
                    <p className="text-silver-dark text-sm mt-1">Gestisci i trend in home page, la galleria tagli e analizza le recensioni dei clienti.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-line text-warm-white rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:bg-carbon transition-colors shrink-0">
                        Nuova Foto Trend
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── Recensioni Recenti ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden">
                    <div className="p-4 border-b border-line bg-carbon/50 flex justify-between items-center">
                        <h2 className="text-sm font-semibold font-body text-warm-white uppercase tracking-widest text-xs">Recensioni (Gatekeeper attivi)</h2>
                        <span className="text-success text-xs font-bold">Respinte 2 critiche prima di Google</span>
                    </div>
                    <div className="divide-y divide-line">
                        {[
                            { client: "Giovanni R.", rating: 5, date: "Oggi", text: "Taglio perfetto, clima fantastico", public: true },
                            { client: "Matteo B.", rating: 2, date: "Ieri", text: "Atteso 20 minuti", public: false },
                        ].map((rev, i) => (
                            <div key={i} className="p-4 hover:bg-carbon-2 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="font-body text-warm-white font-semibold">{rev.client}</span>
                                    <div className="flex text-accent-warm text-sm">
                                        {Array.from({ length: 5 }).map((_, idx) => <span key={idx} className={idx < rev.rating ? 'opacity-100' : 'opacity-20'}>★</span>)}
                                    </div>
                                </div>
                                <p className="text-silver-dark text-sm mt-2">"{rev.text}"</p>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-[10px] text-silver-dark uppercase tracking-widest">{rev.date}</span>
                                    {rev.public ? (
                                        <span className="px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded uppercase text-[10px] font-bold">Su Google My Business</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-error/10 text-error border border-error/20 rounded uppercase text-[10px] font-bold">Trattenuta (Interna)</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Trend Radar (Home Page) ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden">
                    <div className="p-4 border-b border-line bg-carbon/50">
                        <h2 className="text-sm font-semibold font-body text-warm-white uppercase tracking-widest text-xs">Trend In Home Page</h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((t) => (
                            <div key={t} className="relative aspect-[3/4] bg-carbon rounded-[var(--radius-sm)] border border-line overflow-hidden group cursor-pointer">
                                <div className="absolute inset-0 bg-black-2 opacity-50"></div>
                                <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="font-body text-sm font-bold text-warm-white">Sfumatura Bassa</span>
                                </div>
                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button className="p-2 bg-error text-white rounded"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
