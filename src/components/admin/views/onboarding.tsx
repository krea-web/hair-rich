"use client";

import { motion } from "framer-motion";
import { useState } from "react";
export default function AdminOnboardingPage() {
    const [step, setStep] = useState(1);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">

            {/* ── Background Aesthetics ── */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.carbon)_0%,black_100%)] pointer-events-none opacity-50" />
            <div className="fixed inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 512 512%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22512%22 height=%22512%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-carbon border border-line rounded-[var(--radius-xl)] p-8 md:p-12 z-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-black-2">
                    <div className="h-full bg-accent-warm transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
                </div>

                <div className="mb-10 text-center">
                    <div className="inline-block px-3 py-1 bg-black text-warm-white border border-line text-[10px] uppercase tracking-[0.3em] font-bold rounded-full mb-4">
                        Passo {step} di 4
                    </div>
                    <h1 className="text-display text-3xl md:text-5xl text-warm-white tracking-widest">
                        {step === 1 && "Nome del Salone"}
                        {step === 2 && "Il tuo Team"}
                        {step === 3 && "Servizi Base"}
                        {step === 4 && "Tutto Pronto!"}
                    </h1>
                    <p className="text-silver-dark text-sm mt-3 max-w-md mx-auto">
                        {step === 1 && "Decidi il nome che vedranno i tuoi clienti sull'app e nei link WhatsApp."}
                        {step === 2 && "Aggiungi i barbieri. Potrai sempre aggiungerne altri dopo."}
                        {step === 3 && "I servizi più popolari configurati automaticamente per te."}
                        {step === 4 && "Il tuo engine di booking è pronto ad accogliere i clienti."}
                    </p>
                </div>

                {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <input type="text" defaultValue="Hair Rich Olbia" className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-4 text-warm-white text-xl text-center focus:border-accent-warm focus:outline-none" />
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div className="flex gap-4">
                            <input type="text" placeholder="Nome Barbiere" className="flex-1 bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white focus:border-accent-warm focus:outline-none" />
                            <button className="px-6 py-3 bg-carbon-2 border border-line text-warm-white text-sm uppercase tracking-widest font-bold rounded hover:bg-black-2">Aggiungi</button>
                        </div>
                        <div className="p-4 border border-line bg-black-2 rounded flex justify-between items-center">
                            <span className="font-body text-warm-white font-semibold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-accent-warm text-black flex items-center justify-center text-xs">M</span> Marco (Tu)</span>
                            <span className="text-[10px] uppercase text-silver tracking-widest px-2 py-0.5 border border-line rounded">Owner</span>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                        <div className="flex items-center justify-between p-4 border border-accent-warm/50 bg-accent-warm/5 rounded group cursor-pointer hover:bg-accent-warm/10">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-accent-warm flex items-center justify-center"><svg className="w-3 h-3 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-warm-white font-body font-semibold">Taglio Uomo</span>
                            </div>
                            <span className="font-mono text-accent-warm">20€</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-accent-warm/50 bg-accent-warm/5 rounded group cursor-pointer hover:bg-accent-warm/10">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-accent-warm flex items-center justify-center"><svg className="w-3 h-3 text-accent-warm" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></div>
                                <span className="text-warm-white font-body font-semibold">Barba</span>
                            </div>
                            <span className="font-mono text-accent-warm">15€</span>
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center my-8">
                        <div className="w-32 h-32 rounded-full border border-line flex items-center justify-center bg-black-2 shadow-2xl relative">
                            <div className="absolute inset-0 bg-accent-warm/20 rounded-full blur-xl animate-pulse" />
                            <svg viewBox="0 0 24 24" className="w-16 h-16 text-accent-warm z-10" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </motion.div>
                )}

                <div className="mt-12 flex items-center justify-between">
                    {step > 1 && step < 4 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="text-silver hover:text-warm-white text-xs uppercase tracking-widest font-bold transition-colors"
                        >
                            Indietro
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="px-8 py-3 bg-warm-white text-black text-xs uppercase tracking-widest font-bold rounded-[var(--radius-sm)] hover:bg-white transition-colors"
                        >
                            Continua
                        </button>
                    ) : (
                        <a
                            href="/admin"
                            className="px-8 py-3 w-full bg-accent-warm text-black text-xs uppercase tracking-widest font-bold rounded-[var(--radius-sm)] hover:brightness-110 transition-colors text-center"
                        >
                            Vai alla Dashboard
                        </a>
                    )}
                </div>

            </motion.div>
        </div>
    );
}
