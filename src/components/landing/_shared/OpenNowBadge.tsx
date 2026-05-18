"use client";

import { useEffect, useState } from "react";

// Hair Rich opening hours by JS weekday (0=Sun, 1=Mon, ..., 6=Sat).
// Same source as Footer — kept inline to avoid coupling.
// Each open day has two windows (morning + afternoon).
type Window = { open: string; close: string };
const HOURS: Record<number, Window[]> = {
    0: [], // Sun closed
    1: [], // Mon closed
    2: [{ open: "09:00", close: "13:00" }, { open: "14:30", close: "19:30" }],
    3: [{ open: "09:00", close: "13:00" }, { open: "14:30", close: "19:30" }],
    4: [{ open: "09:00", close: "13:00" }, { open: "14:30", close: "19:30" }],
    5: [{ open: "09:00", close: "13:00" }, { open: "14:30", close: "19:30" }],
    6: [{ open: "09:00", close: "13:00" }, { open: "14:30", close: "19:30" }],
};

const DAY_NAMES_IT: Record<number, string> = {
    0: "domenica",
    1: "lunedì",
    2: "martedì",
    3: "mercoledì",
    4: "giovedì",
    5: "venerdì",
    6: "sabato",
};

function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

interface Status {
    open: boolean;
    label: string;
}

function computeStatus(now: Date): Status {
    const dow = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const todayWindows = HOURS[dow] ?? [];

    // Check if we're inside a window right now
    for (const w of todayWindows) {
        const start = timeToMinutes(w.open);
        const end = timeToMinutes(w.close);
        if (minutes >= start && minutes < end) {
            return { open: true, label: `Aperto fino alle ${w.close}` };
        }
    }

    // Closed right now — find next opening
    // First: check if there's a later window today (e.g. before-lunch period)
    for (const w of todayWindows) {
        const start = timeToMinutes(w.open);
        if (minutes < start) {
            return { open: false, label: `Riapriamo oggi alle ${w.open}` };
        }
    }

    // Otherwise scan up to 7 days forward for first open day
    for (let i = 1; i <= 7; i++) {
        const future = (dow + i) % 7;
        const ws = HOURS[future] ?? [];
        if (ws.length > 0 && ws[0]) {
            const dayLabel = i === 1 ? "domani" : DAY_NAMES_IT[future];
            return { open: false, label: `Riapriamo ${dayLabel} alle ${ws[0].open}` };
        }
    }
    return { open: false, label: "Chiuso" };
}

/**
 * Compact "Open / Closed" pill driven by current weekday + hour. Renders a
 * pulsing accent-warm dot when open, a flat silver dot when closed, with a
 * one-line natural-language label after it. Updates every minute.
 */
export function OpenNowBadge({ className = "" }: { className?: string }) {
    const [status, setStatus] = useState<Status | null>(null);

    useEffect(() => {
        const tick = () => setStatus(computeStatus(new Date()));
        tick();
        const id = window.setInterval(tick, 60_000);
        return () => window.clearInterval(id);
    }, []);

    if (!status) return null;

    return (
        <div
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border ${
                status.open
                    ? "bg-accent-warm/10 border-accent-warm/40"
                    : "bg-black/30 border-line"
            } ${className}`}
            aria-live="polite"
        >
            <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full ${
                    status.open ? "bg-accent-warm animate-pulse" : "bg-silver-dark"
                }`}
            />
            <span
                className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold ${
                    status.open ? "text-accent-warm" : "text-silver-dark"
                }`}
            >
                {status.open ? "Aperto · " : "Chiuso · "}
                <span className={status.open ? "text-warm-white" : "text-silver"}>
                    {status.label.replace(/^Aperto fino alle |^Riapriamo /, "")}
                </span>
            </span>
        </div>
    );
}
