"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchStaff } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";
import { handleClientLink } from "@/lib/clientRouter";
import { romeDateStr } from "@/lib/time";

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
    return romeDateStr(d);
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Toolbar compatta (riempie meglio lo spazio) */}
            <div className="shrink-0 border-b border-line bg-black px-3 md:px-5 py-2.5 flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold mr-1">
                        Settimana
                    </span>
                    <button onClick={goPrev} aria-label="Settimana precedente" className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <span className="text-warm-white font-body font-semibold text-xs md:text-sm min-w-[150px] md:min-w-[190px] text-center tabular-nums">
                        {weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} →{" "}
                        {addDays(weekStart, 6).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    </span>
                    <button onClick={goNext} aria-label="Settimana successiva" className="w-8 h-8 rounded border border-line flex items-center justify-center text-silver hover:text-warm-white hover:bg-carbon transition-colors">
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                    <button onClick={goThisWeek} className="px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors">
                        Oggi
                    </button>
                </div>
                <button onClick={handlePrint} className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-silver border border-line rounded-full hover:bg-carbon-2 hover:text-warm-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
                    <span className="hidden sm:inline">Stampa</span>
                </button>
            </div>

            {loading ? (
                <div className="flex-1 grid grid-cols-2 md:grid-cols-7 gap-2 p-3">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden grid grid-cols-2 md:grid-cols-7 md:grid-rows-1 items-start md:items-stretch gap-2 p-3">
                    {days.map((d, i) => {
                        const isToday = d.iso === todayISO;
                        const isWeekend = i >= 5;
                        const sortedAppts = [...d.appts].sort((a, b) => (a.startISO < b.startISO ? -1 : 1));
                        const liveCount = sortedAppts.filter((a) => a.status !== "cancelled" && a.status !== "no_show").length;
                        return (
                            <a
                                key={d.iso}
                                href={`/admin/agenda?date=${d.iso}`}
                                onClick={handleClientLink}
                                className={`flex flex-col min-h-0 bg-carbon border rounded-[var(--radius-md)] overflow-hidden hover:border-silver-mid transition-colors ${isToday ? "border-accent-warm" : "border-line"}`}
                            >
                                <header className={`shrink-0 px-2.5 py-2 border-b border-line flex items-center justify-between ${isToday ? "bg-accent-warm/10" : isWeekend ? "bg-black-2" : ""}`}>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">{WEEKDAY_LABELS[i]}</div>
                                        <div className={`font-display text-lg tabular-nums ${isToday ? "text-accent-warm" : "text-warm-white"}`}>{d.date.getDate()}</div>
                                    </div>
                                    <span className="text-[10px] tabular-nums text-silver-dark border border-line rounded-full px-2 py-0.5">{liveCount}</span>
                                </header>
                                <div className="flex-1 md:overflow-y-auto p-1.5 space-y-1 scrollbar-hide">
                                    {sortedAppts.length === 0 && (
                                        <p className="text-silver-dark text-xs italic px-1 py-2">Libero</p>
                                    )}
                                    {sortedAppts.map((a) => {
                                        const staffName = a.staffId ? staffById[a.staffId]?.name?.split(" ")[0] : null;
                                        const isCancelled = a.status === "cancelled" || a.status === "no_show";
                                        const isCompleted = a.status === "completed";
                                        return (
                                            <div
                                                key={a.id}
                                                className={`px-2 py-1 rounded text-[11px] leading-tight border-l-2 ${isCancelled ? "bg-error/10 text-error line-through border-error" : isCompleted ? "bg-carbon-2 text-silver border-silver" : "bg-accent-warm/10 text-warm-white border-accent-warm"}`}
                                            >
                                                <div className="font-mono text-[11px] tabular-nums opacity-80">
                                                    {formatHour(a.startISO)}
                                                    {staffName && <span className="ml-1 text-accent-warm">· {staffName}</span>}
                                                </div>
                                                <div className="truncate font-body font-medium">{a.customer}</div>
                                                <div className="truncate text-[10px] opacity-60">{a.serviceName}</div>
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
