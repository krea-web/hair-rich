"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const STAFF = [
    { id: "1", name: "Marco", role: "Master Barber" },
    { id: "2", name: "Luca", role: "Barber" },
];

const HOURS = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9; // starts at 9:00
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour}:${min}`;
});

const FAKE_EVENTS = [
    { id: "e1", title: "Taglio + Barba (Andrea M.)", staffId: "1", start: "09:00", span: 2, status: "completed" },
    { id: "e2", title: "Taglio Uomo (Simone)", staffId: "1", start: "14:30", span: 1, status: "confirmed" },
    { id: "e3", title: "Barba (Giorgio)", staffId: "2", start: "10:00", span: 1, status: "arrived" },
    { id: "e4", title: "Taglio Bambino", staffId: "2", start: "15:00", span: 1, status: "confirmed" },
];

export default function AdminAgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-carbon border-l-4 border-silver text-silver";
            case "arrived": return "bg-success/10 border-l-4 border-success text-success";
            case "confirmed": return "bg-accent-warm/10 border-l-4 border-accent-warm text-warm-white";
            default: return "bg-carbon-2 border-l-4 border-line text-silver";
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div className="h-16 border-b border-line px-6 flex items-center justify-between shrink-0 bg-black">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl text-warm-white font-display">Agenda</h1>
                    <div className="hidden md:flex bg-carbon border border-line rounded-[var(--radius-sm)] overflow-hidden">
                        <button className="px-3 py-1.5 text-xs text-warm-white hover:bg-carbon-2 border-r border-line transition-colors">Giorno</button>
                        <button className="px-3 py-1.5 text-xs text-silver-dark hover:bg-carbon-2 transition-colors">Settimana</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <h2 className="font-body text-sm font-semibold text-warm-white min-w-[120px] text-center">
                            {currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h2>
                        <button className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                    </div>
                    <button className="px-4 py-2 bg-accent-warm text-black rounded-[var(--radius-sm)] text-xs uppercase tracking-wider font-bold hover:brightness-110 transition-all">
                        + Appuntamento
                    </button>
                </div>
            </div>

            {/* ── Grid ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto bg-[#111111] relative">
                <div className="min-w-[800px] h-full flex flex-col">
                    {/* Header Colonne Barber */}
                    <div className="flex border-b border-line sticky top-0 bg-[#111111] z-20 shadow-sm">
                        <div className="w-20 shrink-0 border-r border-line bg-carbon/50 backdrop-blur" /> {/* Lato orari */}
                        {STAFF.map(staff => (
                            <div key={staff.id} className="flex-1 border-r border-line text-center py-3 bg-carbon/50 backdrop-blur">
                                <div className="font-body font-semibold text-warm-white">{staff.name}</div>
                                <div className="text-[10px] text-silver-dark uppercase tracking-widest">{staff.role}</div>
                            </div>
                        ))}
                    </div>

                    {/* Righe Orari */}
                    <div className="flex-1 relative">
                        {HOURS.map((hour, i) => (
                            <div key={hour} className="flex border-b border-line/50 min-h-[60px]">
                                <div className="w-20 shrink-0 border-r border-line flex items-start justify-center pt-2">
                                    <span className="text-xs text-silver-dark font-mono">{hour}</span>
                                </div>
                                {STAFF.map(staff => (
                                    <div key={staff.id} className="flex-1 border-r border-line/50 relative group">
                                        {/* Hover Overlay slot vuoto */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-carbon cursor-pointer transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] uppercase text-silver-dark tracking-widest">+ Aggiungi</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Eventi Overlay */}
                        {FAKE_EVENTS.map(ev => {
                            const startIdx = HOURS.indexOf(ev.start);
                            const colIdx = STAFF.findIndex(s => s.id === ev.staffId);
                            if (startIdx === -1 || colIdx === -1) return null;

                            const top = startIdx * 60; // 60px height per slot
                            const height = ev.span * 60;
                            const left = `calc(5rem + ${colIdx * (100 / STAFF.length)}% - 5rem * ${colIdx / STAFF.length})`; // 5rem = w-20

                            return (
                                <motion.div
                                    key={ev.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        top: `${top}px`,
                                        height: `${height - 4}px`, // -4 for padding
                                        left: `calc(5rem + ${colIdx * (100 / STAFF.length)}%)`,
                                        width: `calc(${100 / STAFF.length}% - 12px)`, // -12px margin
                                        marginTop: '2px',
                                        marginLeft: '6px'
                                    }}
                                    className={`absolute z-10 px-3 py-2 rounded shadow-md cursor-pointer overflow-hidden ${getStatusColor(ev.status)}`}
                                >
                                    <p className="text-xs font-semibold leading-tight line-clamp-2">{ev.title}</p>
                                    <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">{ev.start}</p>
                                </motion.div>
                            );
                        })}

                        {/* Current Time Line */}
                        {currentDate.getHours() >= 9 && currentDate.getHours() <= 19 && (
                            <div
                                className="absolute left-20 right-0 h-px bg-error z-10 pointer-events-none drop-shadow-md"
                                style={{
                                    top: `${((currentDate.getHours() - 9) * 2 + (currentDate.getMinutes() >= 30 ? 1 : 0) + (currentDate.getMinutes() % 30) / 30) * 60}px`
                                }}
                            >
                                <div className="w-2 h-2 rounded-full bg-error absolute -left-1 -top-1 shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
