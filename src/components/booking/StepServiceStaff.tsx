"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useBookingStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { fetchServices, fetchStaff } from "@/lib/supabase/queries";

const STAFF_ANY_ID = "any";

export function StepServiceStaff({ onNext }: { onNext: () => void }) {
    const {
        serviceId,
        staffId,
        setService,
        setStaff,
        services,
        staff,
        setCatalog,
    } = useBookingStore();
    const [loading, setLoading] = useState(services.length === 0);

    useEffect(() => {
        let alive = true;
        if (services.length > 0) return;
        Promise.all([fetchServices(), fetchStaff()])
            .then(([svc, st]) => {
                if (!alive) return;
                setCatalog(svc, st);
                setLoading(false);
            })
            .catch(() => {
                if (!alive) return;
                setLoading(false);
            });
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const canContinue = !!serviceId;

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
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[88px] rounded-[var(--radius-md)] bg-black-2 border border-line animate-pulse"
                            />
                        ))}
                    </div>
                ) : services.length === 0 ? (
                    <p className="text-warm-white-muted text-sm">Nessun servizio disponibile al momento.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((s) => {
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
                                            {formatPrice(s.price_cents)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                        <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        {s.duration_min} min
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
                )}
            </div>

            {/* Staff (chip-style) */}
            <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                    Barber (opzionale)
                </h4>
                <div className="flex flex-wrap gap-2">
                    <StaffChip
                        id={STAFF_ANY_ID}
                        name="Chiunque"
                        role="Prima disponibilità"
                        active={staffId === null}
                        onClick={() => setStaff(null)}
                    />
                    {staff.map((p) => (
                        <StaffChip
                            key={p.id}
                            id={p.id}
                            name={p.name}
                            role={p.role}
                            active={staffId === p.id}
                            onClick={() => setStaff(p.id)}
                        />
                    ))}
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

function StaffChip({
    id,
    name,
    role,
    active,
    onClick,
}: {
    id: string;
    name: string;
    role: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-colors ${
                active
                    ? "bg-warm-white text-black border-warm-white"
                    : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
            }`}
            aria-pressed={active}
        >
            {id !== STAFF_ANY_ID && (
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center text-[10px] font-display text-warm-white">
                    {name.charAt(0)}
                </span>
            )}
            <span className="font-body font-semibold">{name}</span>
            <span
                className={`text-[10px] uppercase tracking-[0.2em] ${
                    active ? "text-black/70" : "text-silver-dark"
                }`}
            >
                · {role}
            </span>
        </button>
    );
}
