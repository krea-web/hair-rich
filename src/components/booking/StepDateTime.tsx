"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useBookingStore } from "@/lib/store";
import { fetchAvailableSlots, fetchDayDensity } from "@/lib/supabase/queries";
import type { AvailableSlot } from "@/lib/supabase/types";
import { romeDateStr } from "@/lib/time";
import { WaitlistOptIn } from "./WaitlistOptIn";

// Mezzogiorno locale: stabilizza il giorno della settimana ed evita gli edge
// di DST/mezzanotte quando si genera la lista date.
const today = new Date();
today.setHours(12, 0, 0, 0);
// Orizzonte di prenotazione esteso a ~2 mesi: consente sia il long-term sia le
// ricorrenze settimanali (es. "ogni venerdì"). Il salone è aperto Lun–Sab e
// chiuso SOLO la domenica (0) — il lunedì prima era escluso per errore.
const dates = Array.from({ length: 63 })
    .map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    })
    .filter((d) => d.getDay() !== 0)
    .slice(0, 54);

export function StepDateTime({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
    const { date, time, serviceId, staffId, setDate, setTime } = useBookingStore();
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(date || null);
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (!selectedDateStr || !serviceId) {
            setSlots([]);
            return;
        }
        let alive = true;
        setLoadingSlots(true);
        fetchAvailableSlots({
            date: selectedDateStr,
            serviceId,
            staffId,
        })
            .then((rows) => {
                if (!alive) return;
                setSlots(rows);
                setLoadingSlots(false);
            })
            .catch(() => {
                if (!alive) return;
                setSlots([]);
                setLoadingSlots(false);
            });
        return () => {
            alive = false;
        };
    }, [selectedDateStr, serviceId, staffId]);

    const uniqueTimes = Array.from(
        new Set(slots.map((s) => s.slot_time.slice(0, 5)))
    ).sort();

    // Fetch density map for each candidate day so we can hint at which days
    // are quiet vs busy before the user taps. One RPC per day, called in
    // parallel and cached in state for the wizard session.
    const [density, setDensity] = useState<Record<string, number>>({});
    useEffect(() => {
        if (!serviceId) return;
        let alive = true;
        Promise.all(
            // Solo i primi giorni: con un orizzonte di ~2 mesi non ha senso (ed è
            // pesante) chiamare l'RPC densità per ogni giorno. I pallini compaiono
            // sui giorni vicini; i lontani mostrano solo la data.
            dates.slice(0, 12).map(async (d) => {
                const ds = romeDateStr(d);
                try {
                    const v = await fetchDayDensity(ds, serviceId);
                    return [ds, v] as const;
                } catch {
                    return [ds, 0] as const;
                }
            })
        ).then((pairs) => {
            if (!alive) return;
            setDensity(Object.fromEntries(pairs));
        });
        return () => {
            alive = false;
        };
    }, [serviceId]);

    const handleNext = () => {
        if (selectedDateStr && time) {
            setDate(selectedDateStr);
            onNext();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="text-display-alt text-xl text-accent-warm">02</span>
                    <h3 className="text-display text-xl md:text-2xl text-warm-white tracking-tight mt-1">
                        Data &amp; Ora
                    </h3>
                    <p className="mt-2 text-warm-white-muted text-sm">
                        Disponibilità aggiornata in tempo reale.
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Indietro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 lg:gap-12">
                <div className="md:w-56">
                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-3">
                        Giorno
                    </h4>
                    <div className="md:max-h-[400px] md:overflow-y-auto md:pr-2 grid grid-cols-2 md:grid-cols-1 gap-2 scrollbar-hide">
                        {dates.map((d, i) => {
                            const dayStr = romeDateStr(d);
                            const active = selectedDateStr === dayStr;
                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => {
                                        setSelectedDateStr(dayStr);
                                        setTime("");
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-sm)] border text-left transition-colors ${
                                        active
                                            ? "bg-accent-warm/10 border-accent-warm text-warm-white"
                                            : "bg-black-2 border-line text-silver hover:bg-carbon hover:border-silver-dark"
                                    }`}
                                    aria-pressed={active}
                                >
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                            {new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(d)}
                                        </div>
                                        <div className="text-display text-lg leading-none mt-0.5">
                                            {d.getDate()}{" "}
                                            <span className="text-xs text-silver-dark">
                                                {new Intl.DateTimeFormat("it-IT", { month: "short" }).format(d)}
                                            </span>
                                        </div>
                                        {/* Density dots — 4 cells filled by `density[dayStr]` ratio.
                                            Visible inline so the user spots quiet days instantly. */}
                                        {density[dayStr] !== undefined && (
                                            <div
                                                className="mt-2 flex items-center gap-1"
                                                aria-label={
                                                    density[dayStr]! < 0.25
                                                        ? "Giorno libero"
                                                        : density[dayStr]! < 0.6
                                                            ? "Mezzo pieno"
                                                            : density[dayStr]! < 0.9
                                                                ? "Quasi pieno"
                                                                : "Pieno"
                                                }
                                            >
                                                {[0, 1, 2, 3].map((idx) => {
                                                    const filled = Math.round(density[dayStr]! * 4) > idx;
                                                    return (
                                                        <span
                                                            key={idx}
                                                            aria-hidden="true"
                                                            className={`w-1 h-1 rounded-full ${
                                                                filled
                                                                    ? density[dayStr]! < 0.6
                                                                        ? "bg-accent-warm/70"
                                                                        : "bg-silver-dark"
                                                                    : "bg-line"
                                                            }`}
                                                        />
                                                    );
                                                })}
                                                <span className="text-[8px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold ml-1">
                                                    {density[dayStr]! < 0.25
                                                        ? "libero"
                                                        : density[dayStr]! < 0.6
                                                            ? "ok"
                                                            : density[dayStr]! < 0.9
                                                                ? "denso"
                                                                : "pieno"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {active && (
                                        <span className="w-5 h-5 rounded-full bg-accent-warm text-black flex items-center justify-center" aria-hidden="true">
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

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Orario
                        </h4>
                        {selectedDateStr && !loadingSlots && (
                            <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                {uniqueTimes.length} slot liberi
                            </span>
                        )}
                    </div>

                    {!selectedDateStr ? (
                        <div className="h-32 flex items-center justify-center p-6 bg-black-2 border border-line border-dashed rounded-[var(--radius-md)]">
                            <span className="text-sm text-silver-dark text-center">
                                Seleziona un giorno per vedere gli orari.
                            </span>
                        </div>
                    ) : loadingSlots ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="h-[46px] rounded-[var(--radius-sm)] bg-black-2 border border-line animate-pulse" />
                            ))}
                        </div>
                    ) : uniqueTimes.length === 0 ? (
                        <div>
                            <div className="h-32 flex items-center justify-center p-6 bg-black-2 border border-line border-dashed rounded-[var(--radius-md)]">
                                <span className="text-sm text-silver-dark text-center">
                                    Nessuno slot libero per questo giorno. Prova un'altra data.
                                </span>
                            </div>
                            <WaitlistOptIn fallbackDate={selectedDateStr} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {uniqueTimes.map((s) => {
                                const active = time === s;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            if (typeof navigator !== "undefined" && navigator.vibrate) {
                                                navigator.vibrate(6);
                                            }
                                            setTime(s);
                                        }}
                                        className={`relative px-3 py-4 md:py-3 rounded-[var(--radius-sm)] border text-center font-mono text-base md:text-sm tracking-wider transition-colors min-h-[48px] ${
                                            active
                                                ? "bg-accent-warm border-accent-warm text-black"
                                                : "bg-carbon border-line text-warm-white hover:border-silver-mid"
                                        }`}
                                        aria-pressed={active}
                                        aria-label={`${s} disponibile`}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
                <button
                    onClick={onBack}
                    className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold transition-colors"
                >
                    ← Indietro
                </button>
                <button
                    disabled={!selectedDateStr || !time}
                    onClick={handleNext}
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
