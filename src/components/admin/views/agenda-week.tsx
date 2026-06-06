"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";
import { handleClientLink } from "@/lib/clientRouter";

interface WeekAppt {
    id: string;
    startISO: string;
    endISO: string;
    staffId: string | null;
    customer: string;
    serviceName: string;
    status: string;
}

function startOfWeek(d: Date): Date {
    const result = new Date(d);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay(); // 0..6 Sun..Sat
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    result.setDate(result.getDate() + diff);
    return result;
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function isoDate(d: Date): string {
    return d.toISOString().split("T")[0]!;
}

function formatHour(iso: string): string {
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AdminAgendaWeekPage() {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [staff, setStaff] = useState<Staff[]>([]);
    const [appts, setAppts] = useState<WeekAppt[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const staffRows = await fetchStaff();
            setStaff(staffRows);

            const supabase = createClient();
            const start = weekStart;
            const end = addDays(weekStart, 7);

            const { data, error } = await supabase
                .from("appointments")
                .select(
                    `id, start_at, end_at, status, staff_id,
                    customer:customer_id ( first_name, last_name ),
                    appointment_services ( service:service_id ( name ) )`
                )
                .gte("start_at", start.toISOString())
                .lt("start_at", end.toISOString())
                .order("start_at", { ascending: true });
            if (error) throw error;

            const mapped: WeekAppt[] = (data ?? []).map((r: any) => ({
                id: r.id,
                startISO: r.start_at,
                endISO: r.end_at,
                staffId: r.staff_id ?? null,
                customer: `${r.customer?.first_name ?? "?"}${
                    r.customer?.last_name ? " " + r.customer.last_name[0] + "." : ""
                }`,
                serviceName: r.appointment_services?.[0]?.service?.name ?? "Servizio",
                status: r.status,
            }));
            setAppts(mapped);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [weekStart, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const days = useMemo(() => {
        const out: { date: Date; iso: string; appts: WeekAppt[] }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = addDays(weekStart, i);
            const iso = isoDate(d);
            const dayAppts = appts.filter((a) => isoDate(new Date(a.startISO)) === iso);
            out.push({ date: d, iso, appts: dayAppts });
        }
        return out;
    }, [appts, weekStart]);

    const staffById = useMemo(() => {
        const m: Record<string, Staff> = {};
        for (const s of staff) m[s.id] = s;
        return m;
    }, [staff]);

    const goPrev = () => setWeekStart((d) => addDays(d, -7));
    const goNext = () => setWeekStart((d) => addDays(d, 7));
    const goThisWeek = () => setWeekStart(startOfWeek(new Date()));

    // Stampa/PDF: genera un documento HTML pulito (bianco) in un iframe
    // nascosto ed esegue print(). Evita di combattere col tema scuro
    // dell'admin e dà una resa A4 leggibile.
    const handlePrint = () => {
        const esc = (s: unknown) =>
            String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] ?? c));
        const range = `${weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} – ${addDays(
            weekStart,
            6,
        ).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}`;
        const cols = days
            .map((d, i) => {
                const items = [...d.appts]
                    .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
                    .sort((a, b) => (a.startISO < b.startISO ? -1 : 1));
                const rows = items.length
                    ? items
                          .map((a) => {
                              const st = a.staffId ? staffById[a.staffId]?.name?.split(" ")[0] ?? "" : "";
                              return `<li><span class="t">${formatHour(a.startISO)}</span> <span class="c">${esc(
                                  a.customer,
                              )}</span><span class="s">${esc(a.serviceName)}${st ? ` · ${esc(st)}` : ""}</span></li>`;
                          })
                          .join("")
                    : '<li class="empty">— libero —</li>';
                return `<div class="day"><h2>${WEEKDAY_LABELS[i]} ${d.date.getDate()}<span class="n">${items.length}</span></h2><ul>${rows}</ul></div>`;
            })
            .join("");
        const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Agenda ${esc(
            range,
        )}</title><style>
            @page{size:A4 landscape;margin:12mm}
            *{box-sizing:border-box}
            body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0}
            h1{font-size:18px;margin:0 0 2px}
            .sub{color:#666;font-size:12px;margin:0 0 12px}
            .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
            .day{border:1px solid #ddd;border-radius:6px;overflow:hidden;page-break-inside:avoid}
            .day h2{font-size:12px;margin:0;padding:6px 8px;background:#f3f3f3;border-bottom:1px solid #eee;display:flex;justify-content:space-between}
            .day h2 .n{color:#999;font-weight:normal}
            ul{list-style:none;margin:0;padding:6px;font-size:10px}
            li{padding:3px 0;border-bottom:1px dashed #eee}
            li:last-child{border-bottom:0}
            .t{font-weight:bold}
            .c{display:block}
            .s{color:#666;display:block}
            .empty{color:#bbb;font-style:italic}
        </style></head><body>
            <h1>Hair Rich Olbia — Agenda settimanale</h1>
            <p class="sub">${esc(range)}</p>
            <div class="grid">${cols}</div>
        </body></html>`;
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) {
            iframe.remove();
            return;
        }
        doc.open();
        doc.write(html);
        doc.close();
        const win = iframe.contentWindow;
        setTimeout(() => {
            win?.focus();
            win?.print();
            setTimeout(() => iframe.remove(), 1000);
        }, 300);
    };

    const todayISO = isoDate(new Date());

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Settimana</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Agenda · vista settimanale.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Sguardo d'insieme su 7 giorni. Tap su un giorno per aprirlo nella vista
                    dettagliata con drag&drop.
                </p>
            </motion.div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goPrev}
                        aria-label="Settimana precedente"
                        className="w-9 h-9 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <span className="text-warm-white font-body font-semibold text-sm min-w-[200px] text-center">
                        {weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} →{" "}
                        {addDays(weekStart, 6).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </span>
                    <button
                        onClick={goNext}
                        aria-label="Settimana successiva"
                        className="w-9 h-9 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={goThisWeek}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                    >
                        Questa settimana
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 hover:text-warm-white transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
                        </svg>
                        Stampa
                    </button>
                    <a
                        href="/admin/agenda"
                        onClick={handleClientLink}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-accent-warm border border-accent-warm/40 rounded-full hover:bg-accent-warm/10 transition-colors"
                    >
                        Vista giorno →
                    </a>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="h-64 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {days.map((d, i) => {
                        const isToday = d.iso === todayISO;
                        const isWeekend = i >= 5;
                        const sortedAppts = [...d.appts].sort((a, b) =>
                            a.startISO < b.startISO ? -1 : 1
                        );
                        return (
                            <a
                                key={d.iso}
                                href={`/admin/agenda?date=${d.iso}`}
                                onClick={handleClientLink}
                                className={`block bg-carbon border rounded-[var(--radius-md)] overflow-hidden hover:border-silver-mid transition-colors ${
                                    isToday ? "border-accent-warm" : "border-line"
                                }`}
                            >
                                <header
                                    className={`px-3 py-2 border-b border-line ${
                                        isToday ? "bg-accent-warm/10" : isWeekend ? "bg-black-2" : ""
                                    }`}
                                >
                                    <div className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                        {WEEKDAY_LABELS[i]}
                                    </div>
                                    <div className="text-warm-white font-display text-xl tabular-nums">
                                        {d.date.getDate()}
                                    </div>
                                    <div className="text-[10px] text-silver-dark tabular-nums mt-0.5">
                                        {sortedAppts.length}{" "}
                                        {sortedAppts.length === 1 ? "appt" : "appt"}
                                    </div>
                                </header>
                                <div className="p-2 space-y-1 max-h-[20rem] overflow-y-auto">
                                    {sortedAppts.length === 0 && (
                                        <p className="text-silver-dark text-xs italic px-1 py-2">
                                            Libero
                                        </p>
                                    )}
                                    {sortedAppts.map((a) => {
                                        const staffName = a.staffId
                                            ? staffById[a.staffId]?.name?.split(" ")[0]
                                            : null;
                                        const isCancelled =
                                            a.status === "cancelled" || a.status === "no_show";
                                        const isCompleted = a.status === "completed";
                                        return (
                                            <div
                                                key={a.id}
                                                className={`px-1.5 py-1 rounded text-[10px] leading-tight ${
                                                    isCancelled
                                                        ? "bg-error/10 text-error line-through"
                                                        : isCompleted
                                                          ? "bg-carbon-2 text-silver"
                                                          : "bg-accent-warm/10 text-warm-white"
                                                }`}
                                            >
                                                <div className="font-mono text-[10px] opacity-70">
                                                    {formatHour(a.startISO)}
                                                    {staffName && (
                                                        <span className="ml-1 text-accent-warm">
                                                            · {staffName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="truncate font-body">{a.customer}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
