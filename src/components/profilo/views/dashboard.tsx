"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { handleClientLink } from "@/lib/clientRouter";
import { BirthdayBanner } from "../_shared/BirthdayBanner";
import { LoyaltyProgress } from "../_shared/LoyaltyProgress";
import { fetchMyAppointmentsWithDetails, type AppointmentWithDetails } from "@/lib/supabase/queries";
import { useCurrentCustomer } from "@/lib/supabase/me";
import { useBookingDrawer } from "@/lib/store";

interface DashboardStats {
    nextAppt: AppointmentWithDetails | null;
    completedCount: number;
    favouriteService: string | null;
    totalSpentCents: number;
    memberSinceYear: number | null;
    recent: AppointmentWithDetails[];
}

function computeStats(rows: AppointmentWithDetails[], memberSince: string | null): DashboardStats {
    const now = Date.now();
    const upcoming = rows
        .filter(
            (a) =>
                (a.status === "booked" || a.status === "confirmed") &&
                new Date(a.start_at).getTime() > now
        )
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    const completed = rows.filter((a) => a.status === "completed");

    // Most common service across completed appointments
    const counts = new Map<string, number>();
    for (const a of completed) {
        const name = a.services[0]?.name;
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let favourite: string | null = null;
    let max = 0;
    counts.forEach((c, name) => {
        if (c > max) {
            max = c;
            favourite = name;
        }
    });

    const totalSpent = completed.reduce((s, a) => s + (a.total_cents || 0), 0);

    return {
        nextAppt: upcoming[0] ?? null,
        completedCount: completed.length,
        favouriteService: favourite,
        totalSpentCents: totalSpent,
        memberSinceYear: memberSince ? new Date(memberSince).getFullYear() : null,
        recent: rows
            .filter((a) => a.status === "completed" || a.status === "cancelled")
            .slice(0, 5),
    };
}

function formatStamp(iso: string): { day: string; weekday: string; month: string; time: string } {
    const d = new Date(iso);
    return {
        day: d.getDate().toString().padStart(2, "0"),
        weekday: d.toLocaleString("it", { weekday: "short" }),
        month: d.toLocaleString("it", { month: "short" }),
        time: d.toLocaleString("it", { hour: "2-digit", minute: "2-digit" }),
    };
}

export default function ProfiloDashboardPage() {
    const { customer } = useCurrentCustomer();
    const openDrawer = useBookingDrawer((s) => s.open);
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        let alive = true;
        fetchMyAppointmentsWithDetails()
            .then((rows) => {
                if (!alive) return;
                setStats(computeStats(rows, customer?.created_at ?? null));
            })
            .catch(() => {
                if (alive) setStats(computeStats([], customer?.created_at ?? null));
            });
        return () => {
            alive = false;
        };
    }, [customer?.created_at]);

    const firstName = customer?.first_name ?? "Ciao";
    const next = stats?.nextAppt ?? null;
    const nextStamp = next ? formatStamp(next.start_at) : null;
    const nextService = next?.services[0]?.name ?? "Rituale";
    const nextDuration = next?.services[0]?.duration_min ?? 30;
    const nextStaff = next?.staff?.name ?? "Prima disponibilità";

    const KPIS = [
        {
            label: "Tagli totali",
            value: stats ? String(stats.completedCount) : "—",
            sub: stats?.completedCount === 1 ? "appuntamento" : "appuntamenti",
        },
        {
            label: "Speso totale",
            value: stats ? formatPrice(stats.totalSpentCents) : "—",
            sub: "Da quando ci conosci",
        },
        {
            label: "Taglio preferito",
            value: stats?.favouriteService ?? "—",
            sub: stats?.favouriteService ? "Il più richiesto da te" : "Niente ancora",
        },
        {
            label: "Membro dal",
            value: stats?.memberSinceYear ? String(stats.memberSinceYear) : "—",
            sub: "Hair Rich Club",
        },
    ];

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-6xl">
            {/* Greeting */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
                <div>
                    <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">
                        {next ? "Bentornato," : "Ciao,"}
                    </span>
                    <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                        {firstName}.
                    </h1>
                    <p className="mt-4 text-warm-white-muted text-base max-w-md">
                        {next
                            ? "Il tuo prossimo rituale è già fissato. Ecco un riepilogo veloce."
                            : "Non hai prenotazioni attive. Quando vuoi, il tuo prossimo rituale è un tap di distanza."}
                    </p>
                </div>
                <button
                    onClick={openDrawer}
                    className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] transition-transform whitespace-nowrap self-start md:self-end active:scale-95"
                >
                    Nuovo appuntamento
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </motion.div>

            {/* Birthday + loyalty */}
            <div className="mt-8 md:mt-10 space-y-4 md:space-y-5">
                <BirthdayBanner />
                <LoyaltyProgress />
            </div>

            {/* KPI strip — real */}
            <motion.div
                className="mt-10 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                {KPIS.map((k) => (
                    <div
                        key={k.label}
                        className="relative p-5 bg-carbon border border-line rounded-[var(--radius-lg)] flex flex-col justify-between gap-3 min-h-[120px]"
                    >
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {k.label}
                        </span>
                        <div>
                            <span className="text-display text-xl md:text-2xl text-warm-white tabular-nums leading-tight block truncate">
                                {k.value}
                            </span>
                            <span className="text-[10px] text-silver-dark font-body uppercase tracking-wider mt-1 block">
                                {k.sub}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Next appointment hero card */}
            <motion.section
                aria-labelledby="next-appt-heading"
                className="mt-12 md:mt-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="flex items-end justify-between mb-5">
                    <div>
                        <span className="text-display-alt text-xl text-accent-warm">Up next</span>
                        <h2 id="next-appt-heading" className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">
                            Prossimo appuntamento
                        </h2>
                    </div>
                    {next && (
                        <a
                            href="/profilo/appuntamenti"
                            onClick={handleClientLink}
                            className="hidden md:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-body font-semibold text-silver hover:text-warm-white border-b border-line hover:border-warm-white pb-1 transition-colors"
                        >
                            Tutti gli appuntamenti
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </a>
                    )}
                </div>

                {next && nextStamp ? (
                    <div className="relative bg-gradient-to-br from-carbon to-black-2 border border-accent-warm/30 rounded-[var(--radius-xl)] overflow-hidden">
                        <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-accent-warm/20 pointer-events-none" />
                        <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-accent-warm/10 pointer-events-none" />

                        <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center p-6 md:p-8">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-[var(--radius-md)] bg-black border border-accent-warm/40 shrink-0">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                        {nextStamp.weekday}
                                    </span>
                                    <span className="text-display text-3xl md:text-4xl text-warm-white leading-none mt-1">
                                        {nextStamp.day}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                        {nextStamp.month}
                                    </span>
                                </div>

                                <div className="md:hidden">
                                    <p className="text-display text-xl text-warm-white tracking-tight">{nextService}</p>
                                    <p className="text-silver-dark text-xs uppercase tracking-[0.2em] font-body font-semibold mt-1">
                                        {nextStamp.time} · {nextDuration}'
                                    </p>
                                </div>
                            </div>

                            <div className="hidden md:block">
                                <span className="text-display-alt text-xl text-accent-warm">Sartoriale</span>
                                <h3 className="text-display text-2xl text-warm-white tracking-tight">{nextService}</h3>

                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-line bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center">
                                            <span className="text-xs font-display text-warm-white">{nextStaff.charAt(0)}</span>
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-warm-white font-body font-semibold">{nextStaff}</p>
                                            <p className="text-silver-dark text-xs uppercase tracking-widest font-body font-semibold">
                                                {nextStamp.time} · {nextDuration} min
                                            </p>
                                        </div>
                                    </div>
                                    <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-success/15 text-success border border-success/25 rounded-full text-[10px] font-body font-semibold tracking-[0.2em] uppercase">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                        Confermato
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:items-stretch">
                                <a
                                    href="/profilo/appuntamenti"
                                    onClick={handleClientLink}
                                    className="flex-1 md:flex-none text-center px-5 py-3 border border-line bg-black/50 backdrop-blur-md text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white hover:text-black hover:border-warm-white transition-colors"
                                >
                                    Dettagli
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                        <p className="text-warm-white text-lg font-body font-semibold">
                            Nessun appuntamento in programma.
                        </p>
                        <p className="mt-2 text-warm-white-muted text-sm max-w-md mx-auto">
                            Prenota il tuo prossimo rituale e ti diamo conferma immediata.
                        </p>
                        <button
                            onClick={openDrawer}
                            className="mt-6 inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                        >
                            Prenota ora
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    </div>
                )}
            </motion.section>

            {/* Recent activity from real appointments */}
            {stats && stats.recent.length > 0 && (
                <motion.section
                    aria-labelledby="activity-heading"
                    className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <div>
                        <span className="text-display-alt text-xl text-accent-warm">History</span>
                        <h2 id="activity-heading" className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">
                            Attività recente
                        </h2>
                        <p className="mt-3 text-warm-white-muted text-sm max-w-xs">
                            Gli ultimi {stats.recent.length} appuntamenti, in ordine.
                        </p>
                    </div>

                    <ol className="md:col-span-2 relative pl-6 md:pl-8 border-l border-line space-y-6">
                        {stats.recent.map((row) => {
                            const stamp = formatStamp(row.start_at);
                            const svc = row.services[0]?.name ?? "Rituale";
                            const cancelled = row.status === "cancelled" || row.status === "no_show";
                            return (
                                <li key={row.id} className="relative">
                                    <span
                                        aria-hidden="true"
                                        className={`absolute -left-[27px] md:-left-[35px] top-1.5 w-3 h-3 rounded-full border-4 border-black ${
                                            cancelled ? "bg-silver-dark" : "bg-accent-warm"
                                        }`}
                                    />
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-warm-white font-body text-base">
                                                <span className="mr-2" aria-hidden="true">
                                                    {cancelled ? "✕" : "✂️"}
                                                </span>
                                                {svc} {cancelled ? "annullato" : "completato"}
                                            </p>
                                            <p className="text-silver-dark text-xs uppercase tracking-[0.25em] font-body font-semibold mt-1">
                                                {stamp.weekday} {stamp.day} {stamp.month} · {stamp.time}
                                            </p>
                                        </div>
                                        {!cancelled && row.total_cents > 0 && (
                                            <span className="text-display text-base text-accent-warm tabular-nums whitespace-nowrap">
                                                {formatPrice(row.total_cents)}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </motion.section>
            )}
        </div>
    );
}
