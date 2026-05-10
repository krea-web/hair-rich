"use client";

import { motion } from "framer-motion";

export default function AdminCmsPage() {
    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 h-full flex flex-col">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-display text-4xl text-warm-white">CMS Landing Page</h1>
                    <p className="text-silver-dark text-sm mt-1">Aggiorna i testi della tua landing page pubblica. (Supporta TipTap)</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 flex-1">

                <div className="bg-[#111111] border border-line rounded-[var(--radius-md)] p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-4 border-b border-line bg-carbon/50 flex gap-4 overflow-x-auto">
                        {["Sezione Manifesto", "Footer", "Comunicazioni FAQ", "Orari & Contatti"].map((tab, i) => (
                            <button key={tab} className={`px-4 py-2 text-sm font-semibold rounded-[var(--radius-sm)] transition-colors whitespace-nowrap ${i === 0 ? 'bg-carbon-2 text-warm-white border border-line' : 'text-silver hover:text-warm-white'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Mock TipTap Editor */}
                    <div className="p-4 border-b border-line flex gap-2 bg-black-2">
                        <button className="w-8 h-8 rounded hover:bg-carbon flex items-center justify-center font-serif font-bold text-warm-white">B</button>
                        <button className="w-8 h-8 rounded hover:bg-carbon flex items-center justify-center font-serif italic text-warm-white">I</button>
                        <button className="w-8 h-8 rounded hover:bg-carbon flex items-center justify-center font-serif underline text-warm-white">U</button>
                        <div className="w-px h-6 bg-line self-center mx-2"></div>
                        <button className="px-2 h-8 rounded hover:bg-carbon flex items-center justify-center text-xs font-semibold uppercase text-warm-white text-silver tracking-widest">H1</button>
                        <button className="px-2 h-8 rounded hover:bg-carbon flex items-center justify-center text-xs font-semibold uppercase text-warm-white text-silver tracking-widest">H2</button>
                        <div className="w-px h-6 bg-line self-center mx-2"></div>
                        <button className="p-2 h-8 rounded hover:bg-carbon flex items-center justify-center text-silver"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></button>
                    </div>

                    <div className="flex-1 p-6 bg-carbon/20 relative">
                        <textarea
                            className="w-full h-full bg-transparent text-warm-white resize-none outline-none font-body text-lg leading-relaxed placeholder:text-silver-dark"
                            defaultValue={"Entrare da Hair Rich significa immergersi in un\'esperienza editoriale.\n\nNon siamo solo barbiere, siamo curatori della tua immagine.\nFatto su misura per gentlemen moderni."}
                        />
                        <div className="absolute bottom-6 right-6">
                            <button className="px-6 py-3 bg-accent-warm text-black font-bold uppercase tracking-widest rounded-[var(--radius-sm)] hover:brightness-110 transition-colors shadow-lg shadow-accent-warm/20">
                                Salva Bozza
                            </button>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
