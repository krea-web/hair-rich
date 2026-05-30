"use client";

import { useEffect, useState } from "react";
import { useBookingDrawer, useBookingStore } from "@/lib/store";
import AdminAgendaDayView from "./agenda-day";
import AdminAgendaMonthView from "./agenda-month";
import AdminAgendaWeekView from "./agenda-week";

type AgendaView = "month" | "week" | "day";

const VIEW_KEY = "hairrich:admin:agenda_view";

function readSavedView(): AgendaView {
    if (typeof window === "undefined") return "month";
    const v = window.localStorage.getItem(VIEW_KEY);
    if (v === "month" || v === "week" || v === "day") return v;
    return "month"; // default mensile come richiesto
}

/**
 * Shell di /admin/agenda. Espone uno switcher 3-button (Mese ·
 * Settimana · Giorno) e renderizza la vista corrispondente. La
 * preferenza viene persistita in localStorage cosi' la scelta
 * sopravvive ai refresh — utile per il titolare che lavora in
 * settimana e per il dipendente che lavora in giorno.
 *
 * Mese e' il default per la prima apertura cosi' il titolare ha la
 * visione macro del salone appena entra in agenda.
 */
export default function AdminAgendaPage() {
    const [view, setView] = useState<AgendaView>(() => readSavedView());
    const openDrawer = useBookingDrawer((s) => s.open);
    const setBookingDate = useBookingStore((s) => s.setDate);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(VIEW_KEY, view);
    }, [view]);

    // Da month-view: jump alla day-view del giorno cliccato.
    const handleJumpToDay = (iso: string) => {
        try {
            const url = new URL(window.location.href);
            url.searchParams.set("date", iso);
            window.history.replaceState({}, "", url.toString());
        } catch {
            /* ignore */
        }
        setView("day");
    };

    // Apre il BookingDrawer in modalita' admin. Se `iso` arriva dal
    // click su una cella mese, lo preselezioniamo come data dello
    // appointment cosi' l'admin non deve ridigitarlo nel drawer.
    const handleAddAppointment = (iso: string | null) => {
        if (iso) {
            setBookingDate(iso);
        }
        openDrawer();
    };

    return (
        <div className="relative flex flex-col h-[100dvh] overflow-hidden">
            {/* View switcher tab — overlay sticky in alto */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 bg-black/90 backdrop-blur-md border border-line rounded-full">
                {(["month", "week", "day"] as AgendaView[]).map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-body font-semibold transition-all ${
                            view === v
                                ? "bg-accent-warm text-black"
                                : "text-silver hover:text-warm-white"
                        }`}
                        aria-pressed={view === v}
                    >
                        {v === "month" ? "Mese" : v === "week" ? "Settimana" : "Giorno"}
                    </button>
                ))}
            </div>

            {view === "month" && (
                <AdminAgendaMonthView
                    onJumpToDay={handleJumpToDay}
                    onAddAppointment={handleAddAppointment}
                />
            )}
            {view === "week" && <AdminAgendaWeekView />}
            {view === "day" && <AdminAgendaDayView />}
        </div>
    );
}
