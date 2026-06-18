"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    type DragEndEvent,
} from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import { fetchBookableStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";
import { romeDateStr } from "@/lib/time";

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
    totalCents: number;
}

interface TimeBlock {
    id: string;
    staffId: string | null; // null = tutto il salone
    startISO: string;
    endISO: string;
    reason: string | null;
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

function PaymentModal({
    appt,
    onConfirm,
    onClose,
}: {
    appt: AgendaAppt;
    onConfirm: (method: string, priceCents: number) => void;
    onClose: () => void;
}) {
    const [eur, setEur] = useState((appt.totalCents / 100).toFixed(2));
    const cents = Math.round((parseFloat(eur.replace(",", ".")) || 0) * 100);
    const discount = Math.max(0, appt.totalCents - cents);
    const methods = [
        { v: "cash", l: "Contanti" },
        { v: "pos", l: "POS / carta" },
        { v: "package_credit", l: "Credito pacchetto" },
        { v: "free", l: "Gratis / omaggio" },
    ];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-black-2 border border-line rounded-[var(--radius-md)] p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-display text-xl text-warm-white tracking-tight">Incasso appuntamento</h3>
                <p className="text-warm-white-muted text-sm mt-1">{appt.title}</p>
                <label className="block mt-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body font-semibold">Prezzo incassato €</span>
                    <input value={eur} onChange={(e) => setEur(e.target.value)} inputMode="decimal"
                        className="mt-1 w-full bg-black border border-line rounded-md px-3 py-2 text-warm-white text-lg" />
                </label>
                <p className="text-[11px] text-silver-dark mt-1">
                    Listino: {(appt.totalCents / 100).toFixed(2)}€{discount > 0 ? ` · sconto ${(discount / 100).toFixed(2)}€` : ""}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {methods.map((m) => (
                        <button key={m.v} type="button" onClick={() => onConfirm(m.v, cents)}
                            className="px-3 py-2.5 rounded-full bg-accent-warm text-black text-xs uppercase tracking-[0.15em] font-body font-semibold hover:scale-[1.02] transition-transform">
                            {m.l}
                        </button>
                    ))}
                </div>
                <button type="button" onClick={onClose} className="mt-3 w-full text-silver-dark text-xs uppercase tracking-[0.2em] hover:text-warm-white transition-colors">
                    Annulla
                </button>
            </div>
        </div>
    );
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
    return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}

function isoDate(d: Date): string {
    // Giorno in fuso Europe/Rome (NON UTC): altrimenti la mezzanotte locale
    // veniva letta come il giorno prima → "oggi" e la linea-ora sballavano.
    return romeDateStr(d);
}

function makeDropId(hour: string, staffId: string): string {
    return `slot:${hour}|${staffId}`;
}

function parseDropId(id: string): { hour: string; staffId: string } | null {
    if (!id.startsWith("slot:")) return null;
    const [hour, staffId] = id.slice(5).split("|");
    if (!hour || !staffId) return null;
    return { hour, staffId };
}

function DroppableCell({ hour, staffId }: { hour: string; staffId: string }) {
    const { isOver, setNodeRef } = useDroppable({ id: makeDropId(hour, staffId) });
    return (
        <div
            ref={setNodeRef}
            className={`flex-1 border-r border-line/50 transition-colors ${
                isOver ? "bg-accent-warm/15" : ""
            }`}
        />
    );
}

function DraggableWrapper({
    id,
    children,
    style,
    className,
}: {
    id: string;
    children: React.ReactNode;
    style: React.CSSProperties;
    className: string;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const dragStyle: React.CSSProperties = {
        ...style,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.85 : 1,
        cursor: isDragging ? "grabbing" : "grab",
    };
    return (
        <div ref={setNodeRef} style={dragStyle} className={className} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

export default function AdminAgendaDayView() {
    const [currentDate, setCurrentDate] = useState(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const q = params.get("date");
            if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
                const [y, m, d] = q.split("-").map((n) => parseInt(n, 10));
                return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
            }
        }
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [staff, setStaff] = useState<Staff[]>([]);
    const [appts, setAppts] = useState<AgendaAppt[]>([]);
    const [blocks, setBlocks] = useState<TimeBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const dateStr = isoDate(currentDate);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Solo barbieri in poltrona (esclude founder/receptionist es. Riccardo):
            // niente più colonna vuota che sballava la griglia.
            const [staffRows] = await Promise.all([fetchBookableStaff()]);
            setStaff(staffRows);

            const supabase = createClient();
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const { data, error } = await supabase
                .from("appointments")
                .select(
                    `id, start_at, end_at, status, staff_id, is_first_visit, total_cents,
                    customer:customer_id ( first_name, last_name, phone ),
                    appointment_services ( service:service_id ( name ) )`
                )
                .gte("start_at", dayStart.toISOString())
                .lt("start_at", dayEnd.toISOString())
                .order("start_at", { ascending: true });
            if (error) throw error;

            const mapped: AgendaAppt[] = (data ?? []).map((r: any) => ({
                id: r.id,
                title: `${r.appointment_services?.[0]?.service?.name ?? "Servizio"} · ${
                    r.customer?.first_name ?? "?"
                }${r.customer?.last_name ? " " + r.customer.last_name[0] + "." : ""}`,
                staffId: r.staff_id ?? null,
                startISO: r.start_at,
                endISO: r.end_at,
                status: r.status,
                isFirstVisit: r.is_first_visit ?? false,
                customerPhone: r.customer?.phone ?? null,
                totalCents: r.total_cents ?? 0,
            }));
            setAppts(mapped);

            // Indisponibilità (time_off): impegni/ferie. Distinte dalle prenotazioni.
            const { data: offData } = await supabase
                .from("time_off")
                .select("id, staff_id, starts_at, ends_at, reason")
                .lt("starts_at", dayEnd.toISOString())
                .gt("ends_at", dayStart.toISOString());
            setBlocks(
                (offData ?? []).map((r: any) => ({
                    id: r.id,
                    staffId: r.staff_id ?? null,
                    startISO: r.starts_at,
                    endISO: r.ends_at,
                    reason: r.reason ?? null,
                }))
            );
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

    // Hard delete (appuntamento sbagliato): RPC admin-gated. Conferma esplicita.
    const deleteAppointment = async (apptId: string) => {
        if (
            typeof window !== "undefined" &&
            !window.confirm(
                "Eliminare DEFINITIVAMENTE questo appuntamento? L'azione non si può annullare."
            )
        ) {
            return;
        }
        const supabase = createClient();
        const { error } = await supabase.rpc("fn_admin_delete_appointment", {
            p_id: apptId,
        });
        if (error) {
            addToast(`Errore eliminazione: ${error.message}`, "error");
            return;
        }
        addToast("Appuntamento eliminato", "success");
        load();
    };

    // Completamento con incasso: registra metodo (POS/contanti/credito) + prezzo
    // reale + sconto, poi segna completato. Alimenta il recap POS vs contanti.
    const [payFor, setPayFor] = useState<AgendaAppt | null>(null);
    const completeWithPayment = async (
        appt: AgendaAppt,
        method: string,
        pricePaidCents: number,
    ) => {
        const supabase = createClient();
        const discount = Math.max(0, appt.totalCents - pricePaidCents);
        const { error: e1 } = await supabase.rpc("fn_set_appointment_payment", {
            p_appointment_id: appt.id,
            p_price_paid_cents: method === "free" ? 0 : pricePaidCents,
            p_payment_method: method,
            p_discount_cents: method === "free" ? appt.totalCents : discount,
            p_discount_reason: discount > 0 || method === "free" ? "manual" : null,
        });
        if (e1) {
            addToast(`Errore pagamento: ${e1.message}`, "error");
            return;
        }
        await changeStatus(appt.id, "completed");
        setPayFor(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const apptId = String(event.active.id);
        const target = event.over ? parseDropId(String(event.over.id)) : null;
        if (!target) return;
        const appt = appts.find((a) => a.id === apptId);
        if (!appt) return;

        const [hh, mm] = target.hour.split(":").map((n) => parseInt(n, 10));
        const newStart = new Date(currentDate);
        newStart.setHours(hh!, mm ?? 0, 0, 0);
        const startISO = newStart.toISOString();

        // No-op if dropped on its current slot+staff
        if (
            appt.startISO === startISO &&
            appt.staffId === target.staffId
        ) {
            return;
        }

        // Optimistic update: compute new end by preserving duration
        const durationMs =
            new Date(appt.endISO).getTime() - new Date(appt.startISO).getTime();
        const newEndISO = new Date(newStart.getTime() + durationMs).toISOString();
        const prev = appts;
        setAppts((rs) =>
            rs.map((a) =>
                a.id === apptId
                    ? { ...a, startISO, endISO: newEndISO, staffId: target.staffId }
                    : a
            )
        );

        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_admin_reschedule_appointment", {
                p_id: apptId,
                p_start_at: startISO,
                p_staff_id: target.staffId,
            });
            if (error) throw error;
            addToast("Appuntamento spostato", "success");
        } catch (e: any) {
            setAppts(prev);
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="h-16 border-b border-line px-3 md:px-6 flex items-center justify-between shrink-0 bg-black gap-2">
                <div className="flex items-center gap-2 md:gap-4">
                    <h1 className="hidden md:block text-xl text-warm-white font-display">Agenda</h1>
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-warm-white border border-line rounded-[var(--radius-sm)] hover:bg-carbon transition-colors"
                    >
                        Oggi
                    </button>
                    <a
                        href="/admin/agenda-week"
                        className="px-3 py-1.5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent-warm border border-accent-warm/40 rounded-[var(--radius-sm)] hover:bg-accent-warm/10 transition-colors"
                    >
                        <span className="md:hidden">Sett.</span>
                        <span className="hidden md:inline">Settimana →</span>
                    </a>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <button
                            onClick={goPrev}
                            className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                            aria-label="Giorno precedente"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <h2 className="font-body text-xs md:text-sm font-semibold text-warm-white min-w-[110px] md:min-w-[180px] text-center">
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
                    <span className="hidden md:inline text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        {appts.length} {appts.length === 1 ? "appuntamento" : "appuntamenti"}
                    </span>
                </div>
            </div>

            {/* Mobile list view (touch-friendly fallback for the desktop drag grid) */}
            <div className="md:hidden flex-1 overflow-y-auto bg-[#111111]">
                {blocks.length > 0 && (
                    <div className="p-3 pb-0 space-y-2">
                        {blocks.map((b) => (
                            <div key={b.id} className="rounded-[var(--radius-md)] p-3 border border-dashed border-silver/40 bg-silver/5 text-silver">
                                <div className="text-sm font-body font-semibold">⛔ {b.reason ?? "Non disponibile"}</div>
                                <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 mt-0.5">
                                    {toLocalHHMM(b.startISO)}–{toLocalHHMM(b.endISO)} · {b.staffId ? (staff.find((s) => s.id === b.staffId)?.name ?? "operatore") : "tutto il salone"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {loading ? (
                    <div className="p-4 space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                        ))}
                    </div>
                ) : appts.length === 0 ? (
                    <p className="p-10 text-center text-warm-white-muted text-sm">
                        Nessun appuntamento per oggi.
                    </p>
                ) : (
                    <ul className="p-3 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
                        {[...appts]
                            .sort((a, b) => (a.startISO < b.startISO ? -1 : 1))
                            .map((ev) => {
                                const startHHMM = toLocalHHMM(ev.startISO);
                                const staffName =
                                    staff.find((s) => s.id === ev.staffId)?.name ?? null;
                                const open =
                                    ev.status !== "completed" &&
                                    ev.status !== "cancelled" &&
                                    ev.status !== "no_show";
                                return (
                                    <li
                                        key={ev.id}
                                        className={`rounded-[var(--radius-md)] p-3 ${statusClasses(ev.status)}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono text-base tabular-nums leading-none">
                                                    {startHHMM}
                                                </div>
                                                <div className="mt-1.5 text-sm font-body font-semibold leading-tight">
                                                    {ev.title}
                                                </div>
                                                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-70 flex items-center gap-2 flex-wrap">
                                                    {staffName && <span>· {staffName}</span>}
                                                    {ev.customerPhone && <a href={`tel:${ev.customerPhone.replace(/\s+/g, "")}`} className="underline">{ev.customerPhone}</a>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {ev.isFirstVisit && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded bg-accent-warm/30 text-accent-warm text-[9px] uppercase tracking-wider font-bold">
                                                        1° visita
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => deleteAppointment(ev.id)}
                                                    aria-label="Elimina appuntamento"
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-error/40 text-error hover:bg-error hover:text-black transition-colors"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {open && (
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    onClick={() => setPayFor(ev)}
                                                    className="flex-1 text-[10px] uppercase tracking-[0.25em] py-2 rounded-full bg-success/15 text-success border border-success/40 hover:bg-success hover:text-black transition-colors"
                                                >
                                                    Completa
                                                </button>
                                                <button
                                                    onClick={() => changeStatus(ev.id, "no_show")}
                                                    className="flex-1 text-[10px] uppercase tracking-[0.25em] py-2 rounded-full bg-warning/15 text-warning border border-warning/40 hover:bg-warning hover:text-black transition-colors"
                                                >
                                                    No-show
                                                </button>
                                                <button
                                                    onClick={() => changeStatus(ev.id, "cancelled")}
                                                    className="flex-1 text-[10px] uppercase tracking-[0.25em] py-2 rounded-full bg-error/15 text-error border border-error/40 hover:bg-error hover:text-black transition-colors"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                    </ul>
                )}
            </div>

            {/* Desktop drag grid */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="hidden md:block flex-1 overflow-auto bg-[#111111] relative">
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
                                    <DroppableCell key={s.id} hour={hour} staffId={s.id} />
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
                                            className="absolute z-10 px-3 py-2 rounded shadow-md overflow-hidden group bg-warning/10 border-l-4 border-warning text-warning"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-semibold leading-tight flex-1">
                                                    {ev.title} · da assegnare
                                                </p>
                                                <button
                                                    onClick={() => deleteAppointment(ev.id)}
                                                    aria-label="Elimina appuntamento"
                                                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-error hover:bg-error hover:text-black"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">
                                                {startHHMM}
                                            </p>
                                        </motion.div>
                                    );
                                }

                                return (
                                    <DraggableWrapper
                                        key={ev.id}
                                        id={ev.id}
                                        style={{
                                            position: "absolute",
                                            top: `${top}px`,
                                            height: `${height - 4}px`,
                                            left: `calc(5rem + ${colIdx * (100 / colCount)}%)`,
                                            width: `calc(${100 / colCount}% - 12px)`,
                                            marginTop: "2px",
                                            marginLeft: "6px",
                                        }}
                                        className={`px-3 py-2 rounded shadow-md overflow-hidden group ${statusClasses(ev.status)}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">
                                                {ev.title}
                                            </p>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {ev.isFirstVisit && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-warm/30 text-accent-warm text-[8px] uppercase tracking-wider font-bold">
                                                        1° visita
                                                    </span>
                                                )}
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteAppointment(ev.id);
                                                    }}
                                                    aria-label="Elimina appuntamento"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-error hover:bg-error hover:text-black"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] mt-1 opacity-70 uppercase tracking-wider">
                                            {startHHMM}
                                            {ev.customerPhone && <span className="ml-2">· {ev.customerPhone}</span>}
                                        </p>

                                        {ev.status !== "completed" && ev.status !== "cancelled" && ev.status !== "no_show" && (
                                            <div className="mt-1.5 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPayFor(ev);
                                                    }}
                                                    className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-success/20 text-success hover:bg-success hover:text-black transition-colors"
                                                >
                                                    Completa
                                                </button>
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        changeStatus(ev.id, "no_show");
                                                    }}
                                                    className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-warning/20 text-warning hover:bg-warning hover:text-black transition-colors"
                                                >
                                                    No-show
                                                </button>
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
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
                                    </DraggableWrapper>
                                );
                            })}

                        {/* Indisponibilità (impegni/ferie): blocchi tratteggiati,
                           distinti dalle prenotazioni. staff null = tutto il salone. */}
                        {blocks.map((b) => {
                            const dayMid = new Date(currentDate); dayMid.setHours(0, 0, 0, 0);
                            const GRID_START = 9 * 60, GRID_END = 20 * 60;
                            const topMin = Math.max(GRID_START, Math.min(GRID_END, (new Date(b.startISO).getTime() - dayMid.getTime()) / 60000));
                            const botMin = Math.max(GRID_START, Math.min(GRID_END, (new Date(b.endISO).getTime() - dayMid.getTime()) / 60000));
                            if (botMin <= topMin) return null;
                            const top = (topMin - GRID_START) / 30 * 60;
                            const height = (botMin - topMin) / 30 * 60;
                            const colCount = Math.max(staff.length, 1);
                            const colIdx = b.staffId ? staff.findIndex((st) => st.id === b.staffId) : -1;
                            const pos: React.CSSProperties = b.staffId && colIdx >= 0
                                ? { left: `calc(5rem + ${colIdx * (100 / colCount)}%)`, width: `calc(${100 / colCount}% - 12px)`, marginLeft: "6px" }
                                : { left: "calc(5rem + 6px)", right: "12px" };
                            return (
                                <div
                                    key={b.id}
                                    style={{
                                        position: "absolute",
                                        top: `${top}px`,
                                        height: `${Math.max(height - 4, 18)}px`,
                                        marginTop: "2px",
                                        backgroundImage:
                                            "repeating-linear-gradient(45deg, rgba(160,160,160,0.20) 0, rgba(160,160,160,0.20) 8px, rgba(160,160,160,0.07) 8px, rgba(160,160,160,0.07) 16px)",
                                        ...pos,
                                    }}
                                    className="z-[5] rounded border border-dashed border-silver/50 text-silver overflow-hidden px-2 py-1 pointer-events-none"
                                >
                                    <p className="text-[11px] font-semibold leading-tight">⛔ {b.reason ?? "Non disponibile"}</p>
                                    <p className="text-[9px] uppercase tracking-wider opacity-70">
                                        {toLocalHHMM(b.startISO)}–{toLocalHHMM(b.endISO)}{!b.staffId ? " · salone" : ""}
                                    </p>
                                </div>
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
            </DndContext>
            {payFor && (
                <PaymentModal
                    appt={payFor}
                    onConfirm={(method, cents) => completeWithPayment(payFor, method, cents)}
                    onClose={() => setPayFor(null)}
                />
            )}
        </div>
    );
}
