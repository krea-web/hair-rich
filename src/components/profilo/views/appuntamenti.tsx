"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SmartImage } from "@/components/landing/_shared/SmartImage";
import { fetchServices } from "@/lib/supabase/queries";
import { useBookingDrawer, useBookingStore, useToastStore } from "@/lib/store";

interface Appt {
    id: string;
    date: string;
    service: string;
    staff: string;
    staffImg: string;
    status: "upcoming" | "completed" | "cancelled";
    price: number;
    duration: number;
}

const UPCOMING: Appt[] = [
    {
        id: "u1",
        date: "2026-05-24T15:30:00Z",
        service: "Taglio + Barba",
        staff: "Marco",
        staffImg: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=200&auto=format&fit=crop",
        status: "upcoming",
        price: 3000,
        duration: 60,
    },
];

const PAST: Appt[] = [
    {
        id: "p1",
        date: "2024-09-12T10:00:00Z",
        service: "Taglio + Barba",
        staff: "Marco",
        staffImg: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=200&auto=format&fit=crop",
        status: "completed",
        price: 3000,
        duration: 60,
    },
    {
        id: "p2",
        date: "2024-08-05T15:30:00Z",
        service: "Razor Fade",
        staff: "Luca",
        staffImg: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop",
        status: "completed",
        price: 2500,
        duration: 45,
    },
    {
        id: "p3",
        date: "2024-07-20T09:00:00Z",
        service: "Barba",
        staff: "Marco",
        staffImg: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=200&auto=format&fit=crop",
        status: "cancelled",
        price: 1500,
        duration: 30,
    },
];

const FILTERS = ["Tutti", "Confermati", "Completati", "Annullati"] as const;

const STATUS_LABEL: Record<Appt["status"], string> = {
    upcoming: "Confermato",
    completed: "Completato",
    cancelled: "Annullato",
};

const STATUS_CLASS: Record<Appt["status"], string> = {
    upcoming: "bg-success/15 text-success border-success/30",
    completed: "bg-warm-white-faint text-silver border-line",
    cancelled: "bg-error/10 text-error border-error/30",
};

function formatItalian(d: string) {
    const date = new Date(d);
    return {
        day: date.getDate().toString().padStart(2, "0"),
        weekday: date.toLocaleString("it", { weekday: "short" }),
        month: date.toLocaleString("it", { month: "short" }),
        time: date.toLocaleString("it", { hour: "2-digit", minute: "2-digit" }),
    };
}

function ApptCard({ apt }: { apt: Appt }) {
    const f = formatItalian(apt.date);
    const openDrawer = useBookingDrawer((s) => s.open);
    const setService = useBookingStore((s) => s.setService);
    const addToast = useToastStore((s) => s.addToast);

    // Quick rebook: try to match the past appointment's service name against
    // the live services table and pre-fill the drawer with that service +
    // suggest a slot ~4 weeks from the original date. Falls back to a plain
    // drawer open if matching fails.
    const handleRebook = async () => {
        try {
            const services = await fetchServices();
            const match = services.find(
                (s) =>
                    s.name.toLowerCase() === apt.service.toLowerCase() ||
                    apt.service.toLowerCase().includes(s.name.toLowerCase())
            );
            if (match) {
                setService(match.id);
                addToast(`Rituale ${match.name} pre-selezionato. Scegli data e ora.`, "info");
            } else {
                addToast("Scegli il rituale per la nuova prenotazione.", "info");
            }
            openDrawer();
        } catch {
            openDrawer();
        }
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
                {/* Date */}
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

                {/* Service info */}
                <div className="min-w-0">
                    <h3 className="text-display text-lg md:text-xl text-warm-white tracking-tight truncate">
                        {apt.service}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-line">
                            <SmartImage src={apt.staffImg} alt={apt.staff} className="h-full" />
                        </div>
                        <span className="text-silver-dark text-xs uppercase tracking-[0.2em] font-body font-semibold truncate">
                            {apt.staff} · {f.time} · {apt.duration}'
                        </span>
                    </div>
                </div>

                {/* Status + action */}
                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-body font-semibold ${STATUS_CLASS[apt.status]}`}
                    >
                        {STATUS_LABEL[apt.status]}
                    </span>
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
                    {apt.status === "upcoming" && (
                        <button className="text-[10px] uppercase tracking-[0.25em] text-silver hover:text-warm-white font-body font-semibold transition-colors">
                            Modifica
                        </button>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

export default function ProfiloAppuntamentiPage() {
    const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tutti");
    const openDrawer = useBookingDrawer((s) => s.open);

    const all = [...UPCOMING, ...PAST];
    const filtered = all.filter((a) => {
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
                        Gestisci le prenotazioni future o rivedi lo storico dei tuoi tagli, barba e rituali.
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

            {/* Filters */}
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

            {/* Lists */}
            {filter === "Tutti" || filter === "Confermati" ? (
                <section className="mt-10">
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-4 ml-1">
                        Futuri
                    </h2>
                    <div className="space-y-3">
                        {UPCOMING.length === 0 || filter === "Confermati" && UPCOMING.length === 0 ? (
                            <p className="text-warm-white-muted text-sm p-6 bg-carbon border border-line rounded-[var(--radius-md)]">
                                Nessun appuntamento futuro. Prenota il tuo prossimo rituale.
                            </p>
                        ) : (
                            UPCOMING.map((a) => <ApptCard key={a.id} apt={a} />)
                        )}
                    </div>
                </section>
            ) : null}

            {filter !== "Confermati" && (
                <section className="mt-12">
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-4 ml-1">
                        Storico
                    </h2>
                    <div className="space-y-3">
                        {filtered.filter((a) => a.status !== "upcoming").length === 0 ? (
                            <p className="text-warm-white-muted text-sm p-6 bg-carbon border border-line rounded-[var(--radius-md)]">
                                Nessun appuntamento in questa categoria.
                            </p>
                        ) : (
                            filtered.filter((a) => a.status !== "upcoming").map((a) => <ApptCard key={a.id} apt={a} />)
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
