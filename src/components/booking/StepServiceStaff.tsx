"use client";

import { motion } from "framer-motion";
import { useBookingStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export const SERVICES = [
    { id: "1", name: "Taglio classico", price: 2000, duration: 30, badge: null as string | null },
    { id: "2", name: "Fade & Sfumatura", price: 2500, duration: 45, badge: "Più scelto" },
    { id: "3", name: "Razor cut", price: 3000, duration: 50, badge: null },
    { id: "4", name: "Barba sartoriale", price: 1500, duration: 30, badge: null },
    { id: "5", name: "Taglio + Barba", price: 3500, duration: 60, badge: "Combo · risparmi €5" },
    { id: "6", name: "Taglio a domicilio", price: 4500, duration: 60, badge: "🏡 Su prenotazione" },
];

export const STAFF = [
    { id: "any", name: "Chiunque", role: "Prima disponibilità" },
    { id: "1", name: "Federico Asara", role: "Master Barber" },
    { id: "2", name: "Luca", role: "Senior Barber" },
];

export function StepServiceStaff({ onNext }: { onNext: () => void }) {
    const { serviceId, staffId, setService, setStaff } = useBookingStore();

    const canContinue = !!serviceId; // staff opzionale: any = qualunque

    return (
        <div className="space-y-10">
            <div>
                <span className="text-display-alt text-xl text-accent-warm">01</span>
                <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1">
                    Servizio &amp; Barber
                </h3>
                <p className="mt-2 text-warm-white-muted text-sm">
                    Scegli il rituale e (opzionale) il barber che preferisci.
                </p>
            </div>

            {/* Servizi */}
            <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                    Servizio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SERVICES.map((s) => {
                        const active = serviceId === s.id;
                        return (
                            <motion.button
                                key={s.id}
                                onClick={() => setService(s.id)}
                                whileTap={{ scale: 0.985 }}
                                className={`relative text-left p-4 md:p-5 rounded-[var(--radius-md)] border transition-all ${
                                    active
                                        ? "bg-accent-warm/10 border-accent-warm shadow-[0_8px_24px_-8px_rgba(212,165,116,0.4)]"
                                        : "bg-black-2 border-line hover:bg-carbon hover:border-silver-dark"
                                }`}
                                aria-pressed={active}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-body font-semibold text-warm-white">{s.name}</span>
                                    <span className="text-display text-base md:text-lg text-accent-warm tabular-nums">
                                        {formatPrice(s.price)}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                    {s.duration} min
                                </div>
                                {s.badge && (
                                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-accent-warm text-black text-[9px] uppercase tracking-[0.2em] font-body font-bold rounded-full whitespace-nowrap">
                                        {s.badge}
                                    </span>
                                )}
                                {active && (
                                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent-warm text-black flex items-center justify-center" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Staff (chip-style) */}
            <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                    Barber (opzionale)
                </h4>
                <div className="flex flex-wrap gap-2">
                    {STAFF.map((p) => {
                        const active =
                            (p.id === "any" && staffId === null) || staffId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setStaff(p.id === "any" ? null : p.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-colors ${
                                    active
                                        ? "bg-warm-white text-black border-warm-white"
                                        : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                                }`}
                                aria-pressed={active}
                            >
                                {p.id !== "any" && (
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center text-[10px] font-display text-warm-white">
                                        {p.name.charAt(0)}
                                    </span>
                                )}
                                <span className="font-body font-semibold">{p.name}</span>
                                <span className={`text-[10px] uppercase tracking-[0.2em] ${active ? "text-black/70" : "text-silver-dark"}`}>
                                    · {p.role}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4 border-t border-line">
                <button
                    disabled={!canContinue}
                    onClick={onNext}
                    className="inline-flex items-center gap-3 px-7 py-3 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-white"
                >
                    Continua
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
