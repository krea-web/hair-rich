"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

// ── Tipi ──────────────────────────────────────────────────────────────────

interface MonthAppt {
    id: string;
    startISO: string;
    endISO: string;
    status: string;
    customerFirstName: string | null;
    customerLastName: string | null;
    staffName: string | null;
    serviceName: string | null;
}

interface DayCell {
    /** ISO date (yyyy-mm-dd) della cella, locale */
    iso: string;
    /** Day number 1..31 */
    day: number;
    /** True se cella appartiene al mese corrente; false = leading/trailing days di mesi adiacenti */
    inMonth: boolean;
    /** True se cella è oggi */
    isToday: boolean;
    /** Appuntamenti che cadono in questa cella, già ordinati per orario */
    appts: MonthAppt[];
}

// ── Helpers calendar ──────────────────────────────────────────────────────

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTHS = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function toISODateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function isSameDate(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** Costruisce la griglia 6x7 di celle (sempre 42 giorni) che inizia
 *  dal lunedì che contiene/precede il giorno 1 del mese. */
function buildMonthGrid(year: number, month: number): DayCell[] {
    const today = new Date();
    const firstOfMonth = new Date(year, month, 1);
    // getDay() restituisce 0=Dom, 1=Lun, ..., 6=Sab. Normalizziamo a
    // lun-based (0=Lun, 6=Dom) per allineare alla settimana italiana.
    const weekdayItalian = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = addDays(firstOfMonth, -weekdayItalian);

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
        const d = addDays(gridStart, i);
        cells.push({
            iso: toISODateLocal(d),
            day: d.getDate(),
            inMonth: d.getMonth() === month,
            isToday: isSameDate(d, today),
            appts: [],
        });
    }
    return cells;
}

function statusDotClass(status: string): string {
    switch (status) {
        case "completed":
            return "bg-silver";
        case "confirmed":
        case "booked":
            return "bg-accent-warm";
        case "cancelled":
        case "no_show":
            return "bg-error";
        default:
            return "bg-line";
    }
}

function localHHMM(iso: string): string {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
    /** Callback per aprire la vista giorno su una data specifica. */
    onJumpToDay?: (iso: string) => void;
    /** Callback per aprire il drawer "Nuovo appuntamento" (data preselezionata). */
    onAddAppointment?: (iso: string | null) => void;
}

/**
 * Vista mese del calendar admin. Griglia 7 colonne × 6 settimane.
 *
 * Mostra fino a 3 appuntamenti per cella come pill cliccabili; il
 * resto e' aggregato come "+N altri" → click apre il giorno in vista
 * Day. Click su cella vuota apre il drawer "Nuovo appuntamento" con
 * la data preselezionata.
 *
 * Lo stato è autonomo: ogni cambio mese (prev/next/jump) fa una sola
 * fetch per il range visibile (incluso il padding di mesi adiacenti
 * che entrano nella griglia). Niente realtime: per quello la day-view
 * usa già la sottoscrizione.
 */
export default function AdminAgendaMonthView({ onJumpToDay, onAddAppointment }: Props) {
    const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [appts, setAppts] = useState<MonthAppt[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
    const rangeStart = cells[0]!.iso;
    const rangeEnd = cells[cells.length - 1]!.iso;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const sb = createClient();
                const startISO = `${rangeStart}T00:00:00`;
                // Fine inclusiva: aggiungiamo 1 giorno e tagliamo il "<" sul successivo.
                const endExclusive = new Date(rangeEnd + "T00:00:00");
                endExclusive.setDate(endExclusive.getDate() + 1);
                const endISO = toISODateLocal(endExclusive) + "T00:00:00";

                const { data, error } = await sb
                    .from("appointments")
                    .select(`
                        id, start_at, end_at, status,
                        customers(first_name, last_name),
                        staff(name),
                        appointment_services(services(name))
                    `)
                    .gte("start_at", startISO)
                    .lt("start_at", endISO)
                    .order("start_at", { ascending: true });

                if (cancelled) return;
                if (error) throw error;

                const mapped: MonthAppt[] = (data ?? []).map((row: any) => ({
                    id: row.id,
                    startISO: row.start_at,
                    endISO: row.end_at,
                    status: row.status ?? "booked",
                    customerFirstName: row.customers?.first_name ?? null,
                    customerLastName: row.customers?.last_name ?? null,
                    staffName: row.staff?.name ?? null,
                    serviceName: row.appointment_services?.[0]?.services?.name ?? null,
                }));
                setAppts(mapped);
            } catch (e) {
                if (!cancelled) {
                    addToast(`Errore caricamento agenda mese: ${e instanceof Error ? e.message : "?"}`, "error");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [rangeStart, rangeEnd, addToast]);

    // Distribuiamo gli appts nelle celle indicizzate per data locale.
    const cellsWithAppts: DayCell[] = useMemo(() => {
        const byDate = new Map<string, MonthAppt[]>();
        for (const a of appts) {
            const isoDay = toISODateLocal(new Date(a.startISO));
            const arr = byDate.get(isoDay) ?? [];
            arr.push(a);
            byDate.set(isoDay, arr);
        }
        return cells.map((c) => ({ ...c, appts: byDate.get(c.iso) ?? [] }));
    }, [cells, appts]);

    // Su mobile (e quando il mese corrente è visibile) la griglia mostrava prima
    // le settimane vuote di inizio mese: portiamo "oggi" in vista all'apertura e
    // a ogni cambio mese, così gli appuntamenti non restano nascosti sotto il fold.
    const gridRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const g = gridRef.current, t = todayRef.current;
        if (g && t) g.scrollTop = Math.max(0, t.offsetTop - g.clientHeight / 3);
    }, [cursor]);

    const goPrev = () => {
        setCursor((c) => {
            const m = c.month - 1;
            if (m < 0) return { year: c.year - 1, month: 11 };
            return { year: c.year, month: m };
        });
    };
    const goNext = () => {
        setCursor((c) => {
            const m = c.month + 1;
            if (m > 11) return { year: c.year + 1, month: 0 };
            return { year: c.year, month: m };
        });
    };
    const goToday = () => {
        const now = new Date();
        setCursor({ year: now.getFullYear(), month: now.getMonth() });
    };

    const monthLabel = `${MONTHS[cursor.month]} ${cursor.year}`;
    const totalAppts = appts.length;

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            {/* Toolbar */}
            <div className="h-16 border-b border-line px-3 md:px-6 flex items-center justify-between shrink-0 bg-black gap-2">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-warm-white border border-line rounded-[var(--radius-sm)] hover:bg-carbon transition-colors"
                    >
                        Oggi
                    </button>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <button
                            onClick={goPrev}
                            className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                            aria-label="Mese precedente"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <h2 className="font-body text-xs md:text-sm font-semibold text-warm-white min-w-[140px] md:min-w-[200px] text-center capitalize">
                            {monthLabel}
                        </h2>
                        <button
                            onClick={goNext}
                            className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                            aria-label="Mese successivo"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="hidden md:inline text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        {totalAppts} {totalAppts === 1 ? "appuntamento" : "appuntamenti"}
                    </span>
                    {onAddAppointment && (
                        <button
                            onClick={() => onAddAppointment(null)}
                            className="cta-shine inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-accent-warm text-black rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                        >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span className="hidden md:inline">Nuovo appuntamento</span>
                            <span className="md:hidden">Nuovo</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-line bg-black shrink-0">
                {WEEKDAYS.map((w) => (
                    <div
                        key={w}
                        className="px-2 py-2 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold text-center border-r border-line last:border-r-0"
                    >
                        {w}
                    </div>
                ))}
            </div>

            {/* Grid 7×6 */}
            <div ref={gridRef} className="flex-1 grid grid-cols-7 grid-rows-6 bg-[#0a0a0a] overflow-y-auto">
                {cellsWithAppts.map((cell) => {
                    const visible = cell.appts.slice(0, 3);
                    const extra = cell.appts.length - visible.length;
                    return (
                        <div
                            key={cell.iso}
                            ref={cell.isToday ? todayRef : undefined}
                            className={`relative border-r border-b border-line p-1.5 md:p-2 flex flex-col gap-1 min-h-[80px] md:min-h-[110px] transition-colors hover:bg-carbon/30 cursor-pointer ${
                                cell.inMonth ? "" : "bg-black/40 text-silver-dark"
                            }`}
                            onClick={() => {
                                if (onJumpToDay) onJumpToDay(cell.iso);
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <span
                                    className={`text-[11px] md:text-xs font-body font-semibold ${
                                        cell.isToday
                                            ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-warm text-black"
                                            : cell.inMonth
                                                ? "text-warm-white"
                                                : "text-silver-dark"
                                    }`}
                                >
                                    {cell.day}
                                </span>
                                {onAddAppointment && cell.inMonth && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddAppointment(cell.iso);
                                        }}
                                        className="opacity-0 hover:opacity-100 group-hover:opacity-100 w-4 h-4 rounded-sm text-silver-dark hover:text-accent-warm transition-opacity"
                                        aria-label={`Aggiungi appuntamento il ${cell.iso}`}
                                    >
                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Pills */}
                            <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                                {visible.map((a) => {
                                    const name = [a.customerFirstName, a.customerLastName].filter(Boolean).join(" ") || "Cliente";
                                    return (
                                        <div
                                            key={a.id}
                                            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-carbon border-l-2 border-accent-warm/70 text-[10px] truncate"
                                            title={`${localHHMM(a.startISO)} · ${name}${a.staffName ? ` · ${a.staffName}` : ""}${a.serviceName ? ` · ${a.serviceName}` : ""}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass(a.status)}`} aria-hidden="true" />
                                            <span className="text-warm-white tabular-nums shrink-0 font-body font-semibold">
                                                {localHHMM(a.startISO)}
                                            </span>
                                            <span className="text-silver truncate font-body">
                                                {name}
                                            </span>
                                        </div>
                                    );
                                })}
                                {extra > 0 && (
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold mt-0.5">
                                        +{extra} altri
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/80 border border-line text-[10px] uppercase tracking-[0.3em] text-silver font-body font-semibold pointer-events-none">
                    Caricamento…
                </div>
            )}
        </div>
    );
}
