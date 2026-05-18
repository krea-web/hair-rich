"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";

const HOURS = Array.from({ length: 22 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${min}`;
});

interface AgendaAppt {
    id: string;
    title: string;
    staffId: string | null;
    startISO: string;
    endISO: string;
    status: string;
    isFirstVisit: boolean;
    customerPhone: string | null;
}

function toLocalHHMM(iso: string): string {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function durationSlots(startISO: string, endISO: string): number {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return Math.max(1, Math.round((end - start) / (30 * 60 * 1000)));
}

function statusClasses(status: string): string {
    switch (status) {
        case "completed":
            return "bg-carbon border-l-4 border-silver text-silver";
        case "confirmed":
        case "booked":
            return "bg-accent-warm/10 border-l-4 border-accent-warm text-warm-white";
        case "cancelled":
        case "no_show":
            return "bg-error/10 border-l-4 border-error text-error line-through";
        default:
            return "bg-carbon-2 border-l-4 border-line text-silver";
    }
}

function formatDayHeading(d: Date): string {
    return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function isoDate(d: Date): string {
    return d.toISOString().split("T")[0]!;
}

export default function AdminAgendaPage() {
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [staff, setStaff] = useState<Staff[]>([]);
    const [appts, setAppts] = useState<AgendaAppt[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const dateStr = isoDate(currentDate);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [staffRows] = await Promise.all([fetchStaff()]);
            setStaff(staffRows);

            const supabase = createClient();
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const { data, error } = await supabase
                .from("appointments")
                .select(
                    `id, start_at, end_at, status, staff_id, is_first_visit,
                    customer:customer_id ( first_name, last_name, phone ),
                    appointment_services ( service:service_id ( name ) )`
                )
                .gte("start_at", dayStart.toISOString())
                .lt("start_at", dayEnd.toISOString())
                .order("start_at", { ascending: true });
            if (error) throw error;

            const mapped: AgendaAppt[] = (data ?? []).map((r: any) => ({
                id: r.id,
                title: `${r.appointment_services?.[0]?.service?.name ?? "Rituale"} · ${
                    r.customer?.first_name ?? "?"
                }${r.customer?.last_name ? " " + r.customer.last_name[0] + "." : ""}`,
                staffId: r.staff_id ?? null,
                startISO: r.start_at,
                endISO: r.end_at,
                status: r.status,
                isFirstVisit: r.is_first_visit ?? false,
                customerPhone: r.customer?.phone ?? null,
            }));
            setAppts(mapped);
        } catch (e: any) {
            addToast(`Errore agenda: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [currentDate, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const changeStatus = async (apptId: string, newStatus: string) => {
        const supabase = createClient();
        const { error } = await supabase
            .from("appointments")
            .update({ status: newStatus })
            .eq("id", apptId);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        addToast(`Stato aggiornato → ${newStatus}`, "success");
        load();
    };

    const goPrev = () => {
        setCurrentDate((d) => {
            const n = new Date(d);
            n.setDate(n.getDate() - 1);
            return n;
        });
    };
    const goNext = () => {
        setCurrentDate((d) => {
            const n = new Date(d);
            n.setDate(n.getDate() + 1);
            return n;
        });
    };
    const goToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        setCurrentDate(d);
    };

    const now = new Date();
    const isToday = isoDate(now) === dateStr;
    const nowOffsetPx = isToday
        ? ((now.getHours() - 9) * 2 + (now.getMinutes() >= 30 ? 1 : 0) + (now.getMinutes() % 30) / 30) * 60
        : -1;

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            {/* Toolbar */}
            <div className="h-16 border-b border-line px-6 flex items-center justify-between shrink-0 bg-black">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl text-warm-white font-display">Agenda</h1>
                    <button
                        onClick={goToday}
                        className="hidden md:inline px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-warm-white border border-line rounded-[var(--radius-sm)] hover:bg-carbon transition-colors"
                    >
                        Oggi
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goPrev}
                            className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                            aria-label="Giorno precedente"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <h2 className="font-body text-sm font-semibold text-warm-white min-w-[180px] text-center">
                            {formatDayHeading(currentDate)}
                        </h2>
                        <button
                            onClick={goNext}
                            className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                            aria-label="Giorno successivo"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        {appts.length} {appts.length === 1 ? "appuntamento" : "appuntamenti"}
                    </span>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-[#111111] relative">
                <div className="min-w-[800px] h-full flex flex-col">
                    <div className="flex border-b border-line sticky top-0 bg-[#111111] z-20 shadow-sm">
                        <div className="w-20 shrink-0 border-r border-line bg-carbon/50 backdrop-blur" />
                        {staff.length === 0 && (
                            <div className="flex-1 text-center py-3 text-silver-dark text-xs">
                                Nessun barber attivo
                            </div>
                        )}
                        {staff.map((s) => (
                            <div
                                key={s.id}
                                className="flex-1 border-r border-line text-center py-3 bg-carbon/50 backdrop-blur"
                            >
                                <div className="font-body font-semibold text-warm-white">{s.name}</div>
                                <div className="text-[10px] text-silver-dark uppercase tracking-widest">{s.role}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 relative">
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex border-b border-line/50 min-h-[60px]">
                                <div className="w-20 shrink-0 border-r border-line flex items-start justify-center pt-2">
                                    <span className="text-xs text-silver-dark font-mono">{hour}</span>
                                </div>
                                {staff.map((s) => (
                                    <div key={s.id} className="flex-1 border-r border-line/50" />
                                ))}
                            </div>
                        ))}

                        {/* Events */}
                        {!loading &&
                            appts.map((ev) => {
                                const startHHMM = toLocalHHMM(ev.startISO);
                                const startIdx = HOURS.indexOf(startHHMM);
                                const colIdx = ev.staffId ? staff.findIndex((s) => s.id === ev.staffId) : -1;
                                if (startIdx === -1) return null;

                                const top = startIdx * 60;
                                const height = durationSlots(ev.startISO, ev.endISO) * 60;
                                const colCount = Math.max(staff.length, 1);

                                // Unassigned staff → spans across all columns (warning style)
                                if (colIdx === -1) {
                                    return (
                                        <motion.div
                                            key={ev.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                top: `${top}px`,
                                                height: `${height - 4}px`,
                                                left: `calc(5rem + 6px)`,
                                                right: `12px`,
                                                marginTop: "2px",
                                            }}
                                            className="absolute z-10 px-3 py-2 rounded shadow-md cursor-pointer overflow-hidden bg-warning/10 border-l-4 border-warning text-warning"
                                        >
                                            <p className="text-xs font-semibold leading-tight">
                                                {ev.title} · da assegnare
                                            </p>
                                            <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">
                                                {startHHMM}
                                            </p>
                                        </motion.div>
                                    );
                                }

                                return (
                                    <motion.div
                                        key={ev.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            top: `${top}px`,
                                            height: `${height - 4}px`,
                                            left: `calc(5rem + ${colIdx * (100 / colCount)}%)`,
                                            width: `calc(${100 / colCount}% - 12px)`,
                                            marginTop: "2px",
                                            marginLeft: "6px",
                                        }}
                                        className={`absolute z-10 px-3 py-2 rounded shadow-md cursor-pointer overflow-hidden group ${statusClasses(ev.status)}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">
                                                {ev.title}
                                            </p>
                                            {ev.isFirstVisit && (
                                                <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-accent-warm/30 text-accent-warm text-[8px] uppercase tracking-wider font-bold">
                                                    1° visita
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">
                                            {startHHMM}
                                            {ev.customerPhone && <span className="ml-2">· {ev.customerPhone}</span>}
                                        </p>

                                        {/* Status quick actions on hover (desktop) or always on mobile */}
                                        {ev.status !== "completed" && ev.status !== "cancelled" && ev.status !== "no_show" && (
                                            <div className="mt-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        changeStatus(ev.id, "completed");
                                                    }}
                                                    className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-success/20 text-success hover:bg-success hover:text-black transition-colors"
                                                >
                                                    Completa
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        changeStatus(ev.id, "cancelled");
                                                    }}
                                                    className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-error/20 text-error hover:bg-error hover:text-black transition-colors"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}

                        {/* Now line (red) only if viewing today */}
                        {isToday && nowOffsetPx >= 0 && nowOffsetPx < HOURS.length * 60 && (
                            <div
                                className="absolute left-20 right-0 h-px bg-error z-10 pointer-events-none"
                                style={{ top: `${nowOffsetPx}px` }}
                            >
                                <div className="w-2 h-2 rounded-full bg-error absolute -left-1 -top-1 shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                            </div>
                        )}

                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-30">
                                <div className="w-8 h-8 border-2 border-line border-t-warm-white rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
