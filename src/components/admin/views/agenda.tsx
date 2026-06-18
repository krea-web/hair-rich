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
    // Default responsive: su MOBILE parte la vista "Giorno" (lista ottimizzata,
    // si vedono subito gli appuntamenti); su DESKTOP "Mese" (visione macro). La
    // griglia mese su telefono mostrava prima le settimane vuote e i pill erano
    // minuscoli → sembrava vuota.
    if (window.innerWidth < 768) return "day";
    return "month";
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Barra switcher dedicata: riga propria in cima (niente più overlay
                assoluto che si sovrapponeva alla toolbar della vista su PC). */}
            <div className="shrink-0 flex items-center justify-center border-b border-line bg-black px-3 py-2">
                <div className="flex items-center gap-1 p-1 bg-black-2 border border-line rounded-full">
                    {(["month", "week", "day"] as AgendaView[]).map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setView(v)}
                            className={`px-4 md:px-5 py-1.5 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-body font-semibold transition-all ${
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
            </div>

            {/* La vista riempie lo spazio rimanente. Giorno/Mese gestiscono lo
                scroll internamente (h-full); Settimana è un blocco che scorre qui. */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                {view === "month" && (
                    <AdminAgendaMonthView
                        onJumpToDay={handleJumpToDay}
                        onAddAppointment={handleAddAppointment}
                    />
                )}
                {view === "week" && <AdminAgendaWeekView />}
                {view === "day" && <AdminAgendaDayView />}
            </div>
        </div>
    );
}
