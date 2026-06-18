"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchMyAppointmentsWithDetails, fetchServices, type AppointmentWithDetails } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { useBookingDrawer, useBookingStore, useToastStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { romeDateStr, romeToUTC, formatRome } from "@/lib/time";
import { AppointmentPhotos } from "../_shared/AppointmentPhotos";

type DisplayStatus = "upcoming" | "completed" | "cancelled";

interface DisplayAppt {
    id: string;
    date: string;
    serviceName: string;
    serviceId: string | null;
    staffName: string;
    staffId: string | null;
    staffInitial: string;
    status: DisplayStatus;
    priceCents: number;
    duration: number;
}

const FILTERS = ["Tutti", "Confermati", "Completati", "Annullati"] as const;

const STATUS_LABEL: Record<DisplayStatus, string> = {
    upcoming: "Confermato",
    completed: "Completato",
    cancelled: "Annullato",
};

const STATUS_CLASS: Record<DisplayStatus, string> = {
    upcoming: "bg-success/15 text-success border-success/30",
    completed: "bg-warm-white-faint text-silver border-line",
    cancelled: "bg-error/10 text-error border-error/30",
};

function mapStatus(s: string): DisplayStatus {
    if (s === "completed") return "completed";
    if (s === "cancelled" || s === "no_show") return "cancelled";
    return "upcoming"; // booked / confirmed
}

function toDisplay(row: AppointmentWithDetails): DisplayAppt {
    const firstService = row.services[0];
    return {
        id: row.id,
        date: row.start_at,
        serviceName: firstService?.name ?? "Servizio",
        serviceId: firstService?.id ?? null,
        staffName: row.staff?.name ?? "Prima disponibilità",
        staffId: row.staff?.id ?? null,
        staffInitial: (row.staff?.name ?? "?").charAt(0),
        status: mapStatus(row.status),
        priceCents: row.total_cents,
        duration: firstService?.duration_min ?? 30,
    };
}

function formatItalian(d: string) {
    const date = new Date(d);
    return {
        day: date.getDate().toString().padStart(2, "0"),
        weekday: date.toLocaleString("it", { weekday: "short" }),
        month: date.toLocaleString("it", { month: "short" }),
        time: date.toLocaleString("it", { hour: "2-digit", minute: "2-digit" }),
    };
}

function ApptCard({ apt, onChanged }: { apt: DisplayAppt; onChanged: () => void }) {
    const f = formatItalian(apt.date);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);
    const setStaff = useBookingStore((s) => s.setStaff);
    const addToast = useToastStore((s) => s.addToast);
    const [showCancel, setShowCancel] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleCancel = async (reason?: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_cancel_appointment_by_customer", {
                p_id: apt.id,
                p_reason: reason ?? null,
            });
            if (error) throw error;
            addToast("Appuntamento cancellato", "success");
            setShowCancel(false);
            onChanged();
        } catch (e: any) {
            addToast(e?.message ?? "Errore", "error");
        } finally {
            setBusy(false);
        }
    };

    const handleReschedule = async (newStart: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc("fn_reschedule_appointment_by_customer", {
                p_id: apt.id,
                p_start_at: newStart,
            });
            if (error) throw error;
            addToast("Appuntamento spostato", "success");
            setShowReschedule(false);
            onChanged();
        } catch (e: any) {
            addToast(e?.message ?? "Errore", "error");
        } finally {
            setBusy(false);
        }
    };

    const handleRebook = async () => {
        try {
            if (apt.serviceId) {
                setService(apt.serviceId);
            } else {
                // Fall back to fuzzy match if the service id wasn't joined
                const services = await fetchServices();
                const match = services.find((s) =>
                    s.name.toLowerCase() === apt.serviceName.toLowerCase()
                );
                if (match) setService(match.id);
            }
            if (apt.staffId) setStaff(apt.staffId);
            addToast(`${apt.serviceName} pre-selezionato`, "info");
        } catch {
            /* still open drawer */
        }
        openDrawer();
    };

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="group relative bg-carbon border border-line hover:border-silver-dark transition-colors rounded-[var(--radius-lg)] overflow-hidden"
        >
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-center p-5 md:p-6">
                <div className="flex flex-col items-center justify-center w-16 md:w-20 h-16 md:h-20 bg-black-2 border border-line rounded-[var(--radius-md)] shrink-0">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                        {f.weekday}
                    </span>
                    <span className="text-display text-2xl md:text-3xl text-warm-white leading-none">
                        {f.day}
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-0.5">
                        {f.month}
                    </span>
                </div>

                <div className="min-w-0">
                    <h3 className="text-display text-lg md:text-xl text-warm-white tracking-tight truncate">
                        {apt.serviceName}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-line bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center">
                            <span className="text-[10px] font-display text-warm-white">
                                {apt.staffInitial}
                            </span>
                        </div>
                        <span className="text-silver-dark text-xs uppercase tracking-[0.2em] font-body font-semibold truncate">
                            {apt.staffName} · {f.time} · {apt.duration}'
                        </span>
                    </div>
                    {apt.priceCents > 0 && (
                        <span className="block mt-1 text-[10px] text-silver-dark font-body">
                            {formatPrice(apt.priceCents)}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-body font-semibold ${STATUS_CLASS[apt.status]}`}
                    >
                        {STATUS_LABEL[apt.status]}
                    </span>
                    {apt.status === "upcoming" && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowReschedule(true)}
                                className="text-[10px] uppercase tracking-[0.25em] text-accent-warm hover:text-warm-white font-body font-semibold transition-colors"
                            >
                                Sposta
                            </button>
                            <button
                                onClick={() => setShowCancel(true)}
                                className="text-[10px] uppercase tracking-[0.25em] text-error hover:brightness-110 font-body font-semibold transition-colors"
                            >
                                Cancella
                            </button>
                        </div>
                    )}
                    {apt.status === "completed" && (
                        <button
                            onClick={handleRebook}
                            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-accent-warm hover:text-warm-white font-body font-semibold transition-colors active:scale-95"
                        >
                            Prenota di nuovo
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showCancel && (
                    <CancelModal
                        apt={apt}
                        busy={busy}
                        onConfirm={handleCancel}
                        onClose={() => setShowCancel(false)}
                    />
                )}
                {showReschedule && (
                    <RescheduleModal
                        apt={apt}
                        busy={busy}
                        onConfirm={handleReschedule}
                        onClose={() => setShowReschedule(false)}
                    />
                )}
            </AnimatePresence>

            {/* Photo memory: per-appointment strip, self-hides when empty */}
            {apt.status === "completed" && (
                <div className="px-5 md:px-6 pb-5">
                    <AppointmentPhotos appointmentId={apt.id} />
                </div>
            )}
        </motion.article>
    );
}

export default function ProfiloAppuntamentiPage() {
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tutti");
    const [items, setItems] = useState<DisplayAppt[]>([]);
    const [loading, setLoading] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);

    const reload = () => {
        fetchMyAppointmentsWithDetails()
            .then((rows) => {
                setItems(rows.map(toDisplay));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        let alive = true;
        fetchMyAppointmentsWithDetails()
            .then((rows) => {
                if (!alive) return;
                setItems(rows.map(toDisplay));
                setLoading(false);
            })
            .catch(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const now = Date.now();
    const upcoming = items.filter(
        (a) => a.status === "upcoming" && new Date(a.date).getTime() > now
    );
    const history = items.filter(
        (a) =>
            a.status === "completed" ||
            a.status === "cancelled" ||
            (a.status === "upcoming" && new Date(a.date).getTime() <= now)
    );

    const filtered = items.filter((a) => {
        if (filter === "Tutti") return true;
        if (filter === "Confermati") return a.status === "upcoming";
        if (filter === "Completati") return a.status === "completed";
        if (filter === "Annullati") return a.status === "cancelled";
        return true;
    });

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-5xl">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
                <div>
                    <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Your</span>
                    <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                        Appuntamenti.
                    </h1>
                    <p className="mt-4 text-warm-white-muted text-base max-w-md">
                        Gestisci le prenotazioni future o rivedi lo storico dei tuoi tagli, barba e trattamenti.
                    </p>
                </div>
                <button
                    onClick={openDrawer}
                    className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-warm-white text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm transition-colors whitespace-nowrap active:scale-95"
                >
                    Nuovo
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </motion.header>

            <motion.div
                className="mt-10 flex flex-wrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-body font-semibold rounded-full border transition-colors ${
                            filter === f
                                ? "bg-warm-white text-black border-warm-white"
                                : "border-line text-silver hover:border-silver-mid hover:text-warm-white"
                        }`}
                        aria-pressed={filter === f}
                    >
                        {f}
                    </button>
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold self-center">
                    {filtered.length} {filtered.length === 1 ? "appuntamento" : "appuntamenti"}
                </span>
            </motion.div>

            {loading && (
                <div className="mt-10 space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-28 bg-carbon border border-line rounded-[var(--radius-lg)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="mt-10 p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                    <p className="text-warm-white text-lg font-body font-semibold">
                        Ancora nessuna prenotazione.
                    </p>
                    <p className="mt-2 text-warm-white-muted text-sm max-w-md mx-auto">
                        Quando avrai il primo appuntamento, lo trovi qui. Riceverai un promemoria 24h prima e potrai rivedere foto e dettagli post-servizio.
                    </p>
                    <button
                        onClick={openDrawer}
                        className="cta-shine cta-pulse mt-6 inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                    >
                        Prenota il primo
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </div>
            )}

            {!loading && items.length > 0 && (
                <>
                    {(filter === "Tutti" || filter === "Confermati") && upcoming.length > 0 && (
                        <section className="mt-10">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-4 ml-1">
                                Futuri
                            </h2>
                            <div className="space-y-3">
                                {upcoming.map((a) => (
                                    <ApptCard key={a.id} apt={a} onChanged={reload} />
                                ))}
                            </div>
                        </section>
                    )}

                    {filter !== "Confermati" && history.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-4 ml-1">
                                Storico
                            </h2>
                            <div className="space-y-3">
                                {history
                                    .filter((a) => {
                                        if (filter === "Tutti") return true;
                                        if (filter === "Completati") return a.status === "completed";
                                        if (filter === "Annullati") return a.status === "cancelled";
                                        return true;
                                    })
                                    .map((a) => (
                                        <ApptCard key={a.id} apt={a} onChanged={reload} />
                                    ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function CancelModal({
    apt,
    busy,
    onConfirm,
    onClose,
}: {
    apt: DisplayAppt;
    busy: boolean;
    onConfirm: (reason?: string) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");
    const f = formatItalian(apt.date);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-8 max-w-md w-full"
            >
                <span className="text-display-alt text-xl text-error">Confermi?</span>
                <h3 className="text-display text-2xl text-warm-white tracking-tight mt-1">
                    Cancellare l'appuntamento del {f.day} {f.month} alle {f.time}?
                </h3>
                <p className="text-warm-white-muted text-sm mt-3">
                    Per ricontattarti subito, faccelo sapere il motivo (opzionale).
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Es. è uscito un imprevisto"
                    className="mt-3 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm placeholder:text-silver-dark"
                />
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold"
                    >
                        Indietro
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={busy}
                        className="flex-1 px-5 py-3 bg-error text-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold disabled:opacity-50"
                    >
                        {busy ? "..." : "Sì, cancella"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function RescheduleModal({
    apt,
    busy,
    onConfirm,
    onClose,
}: {
    apt: DisplayAppt;
    busy: boolean;
    onConfirm: (newStart: string) => void;
    onClose: () => void;
}) {
    const cur = new Date(apt.date);
    // Giorno e ora SEMPRE letti in fuso Europe/Rome (no shift UTC, no DST bug).
    const [date, setDate] = useState(romeDateStr(cur));
    const [time, setTime] = useState(
        formatRome(cur, { hour: "2-digit", minute: "2-digit", hour12: false })
    );

    const submit = () => {
        if (!date || !time) return;
        // L'istante esatto si costruisce in ora di Rome, poi va al RPC in UTC.
        const iso = romeToUTC(date, time);
        if (!iso) return;
        onConfirm(iso);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-8 max-w-md w-full"
            >
                <span className="text-display-alt text-xl text-accent-warm">Sposta</span>
                <h3 className="text-display text-2xl text-warm-white tracking-tight mt-1">
                    Quando preferisci?
                </h3>
                <p className="text-warm-white-muted text-sm mt-3">
                    Scegli un nuovo giorno e orario. Se lo slot non è disponibile,
                    te lo diciamo subito.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Data
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Ora
                        </span>
                        <input
                            type="time"
                            step={1800}
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm"
                        />
                    </label>
                </div>
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={submit}
                        disabled={busy}
                        className="flex-1 px-5 py-3 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold disabled:opacity-50"
                    >
                        {busy ? "..." : "Conferma"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
