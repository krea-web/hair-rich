"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { handleClientLink } from "@/lib/clientRouter";

interface Stats {
    revenueTodayCents: number;
    apptToday: number;
    apptCompletedToday: number;
    newCustomersToday: number;
    pendingOrders: number;
    lowStockCount: number;
    lowStockProducts: { name: string; stock: number }[];
}

interface UpcomingAppt {
    id: string;
    time: string;
    customer: string;
    service: string;
    staff: string;
    status: string;
}

interface AtRiskCustomer {
    customer_id: string;
    first_name: string;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    completed_count: number;
    last_visit_at: string | null;
    days_since_last: number;
    lifetime_value_cents: number;
}

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfToday(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [next, setNext] = useState<UpcomingAppt[]>([]);
    const [atRisk, setAtRisk] = useState<AtRiskCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const supabase = createClient();
                const dayStart = startOfToday().toISOString();
                const dayEnd = endOfToday().toISOString();

                // Parallel queries
                const [todayApptRes, lowStockRes, newCustRes, pendingRes] = await Promise.all([
                    supabase
                        .from("appointments")
                        .select(
                            `id, start_at, status, total_cents,
                            customer:customer_id ( first_name, last_name ),
                            staff:staff_id ( name ),
                            appointment_services ( service:service_id ( name ) )`
                        )
                        .gte("start_at", dayStart)
                        .lte("start_at", dayEnd)
                        .order("start_at"),
                    supabase
                        .from("products")
                        .select("name, stock")
                        .eq("is_active", true)
                        .lt("stock", 5)
                        .order("stock"),
                    supabase
                        .from("customers")
                        .select("id", { count: "exact", head: true })
                        .gte("created_at", dayStart),
                    supabase
                        .from("orders")
                        .select("id", { count: "exact", head: true })
                        .eq("status", "pending"),
                ]);

                if (todayApptRes.error) throw todayApptRes.error;

                const todayAppts = (todayApptRes.data ?? []) as any[];
                const revenue = todayAppts
                    .filter((a) => a.status === "completed")
                    .reduce((s, a) => s + (a.total_cents || 0), 0);

                if (!alive) return;

                setStats({
                    revenueTodayCents: revenue,
                    apptToday: todayAppts.length,
                    apptCompletedToday: todayAppts.filter((a) => a.status === "completed").length,
                    newCustomersToday: newCustRes.count ?? 0,
                    pendingOrders: pendingRes.count ?? 0,
                    lowStockCount: lowStockRes.data?.length ?? 0,
                    lowStockProducts: (lowStockRes.data ?? []) as { name: string; stock: number }[],
                });

                // Upcoming = today's appointments that are still booked/confirmed and in the future
                const now = Date.now();
                const upcoming = todayAppts
                    .filter(
                        (a) =>
                            (a.status === "booked" || a.status === "confirmed") &&
                            new Date(a.start_at).getTime() > now
                    )
                    .slice(0, 6)
                    .map((a) => ({
                        id: a.id,
                        time: new Date(a.start_at).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        customer:
                            `${a.customer?.first_name ?? "—"}${
                                a.customer?.last_name ? " " + a.customer.last_name[0] + "." : ""
                            }`,
                        service: a.appointment_services?.[0]?.service?.name ?? "Rituale",
                        staff: a.staff?.name ?? "—",
                        status: a.status,
                    }));
                setNext(upcoming);

                // At-risk customers (parallel fire-and-forget — non-blocking)
                supabase
                    .rpc("fn_customers_at_risk", { p_min_visits: 2, p_days_silent: 90 })
                    .then(({ data }) => {
                        if (alive && Array.isArray(data)) setAtRisk(data as AtRiskCustomer[]);
                    });
            } catch {
                /* swallow */
            } finally {
                if (alive) setLoading(false);
            }
        };
        load();
        return () => {
            alive = false;
        };
    }, []);

    const KPIS = stats
        ? [
              {
                  label: "Incasso oggi",
                  value: formatPrice(stats.revenueTodayCents),
                  sub: `${stats.apptCompletedToday}/${stats.apptToday} completati`,
                  color: stats.revenueTodayCents > 0 ? "text-success" : "text-silver-dark",
              },
              {
                  label: "Appuntamenti oggi",
                  value: String(stats.apptToday),
                  sub:
                      stats.apptToday === 0
                          ? "Nessuno"
                          : stats.apptCompletedToday === stats.apptToday
                              ? "Tutti chiusi"
                              : `${stats.apptToday - stats.apptCompletedToday} da gestire`,
                  color: "text-silver",
              },
              {
                  label: "Nuovi clienti",
                  value: String(stats.newCustomersToday),
                  sub: "Iscritti oggi",
                  color: stats.newCustomersToday > 0 ? "text-success" : "text-silver-dark",
              },
              {
                  label: "Ordini Shop",
                  value: String(stats.pendingOrders),
                  sub: stats.pendingOrders === 0 ? "Niente da preparare" : "Da preparare",
                  color: stats.pendingOrders > 0 ? "text-accent-warm" : "text-silver-dark",
              },
          ]
        : [];

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-xl text-accent-warm">
                    {new Date().toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                    })}
                </span>
                <h1 className="text-display text-4xl text-warm-white mt-1">Dashboard</h1>
            </motion.div>

            {/* KPI Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
                {loading
                    ? [0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-32 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                      ))
                    : KPIS.map((kpi, i) => (
                          <div
                              key={i}
                              className="p-6 bg-carbon border border-line rounded-[var(--radius-md)] flex flex-col justify-between h-32"
                          >
                              <span className="text-xs uppercase font-semibold text-silver-dark tracking-widest">
                                  {kpi.label}
                              </span>
                              <div>
                                  <span className="text-2xl md:text-3xl font-display tabular-nums text-warm-white leading-tight block truncate">
                                      {kpi.value}
                                  </span>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${kpi.color}`}>
                                      {kpi.sub}
                                  </span>
                              </div>
                          </div>
                      ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prossimi appuntamenti */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-[#111111] border border-line rounded-[var(--radius-md)] overflow-hidden"
                >
                    <div className="p-4 border-b border-line flex justify-between items-center bg-carbon/50">
                        <h2 className="text-sm font-semibold font-body">Prossimi arrivi · oggi</h2>
                        <a
                            href="/admin/agenda"
                            onClick={handleClientLink}
                            className="text-xs text-silver hover:text-warm-white transition-colors"
                        >
                            Vedi agenda →
                        </a>
                    </div>
                    <div className="divide-y divide-line">
                        {loading &&
                            [0, 1, 2].map((i) => (
                                <div key={i} className="p-4">
                                    <div className="h-12 bg-carbon-2 rounded animate-pulse" />
                                </div>
                            ))}
                        {!loading && next.length === 0 && (
                            <p className="p-6 text-center text-warm-white-muted text-sm">
                                Nessun appuntamento futuro oggi.
                            </p>
                        )}
                        {!loading &&
                            next.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between p-4 hover:bg-carbon-2 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-12 bg-black-2 rounded flex items-center justify-center font-mono text-sm text-silver font-bold group-hover:bg-accent-warm group-hover:text-black transition-colors">
                                            {apt.time}
                                        </div>
                                        <div>
                                            <div className="text-warm-white font-medium text-sm">{apt.customer}</div>
                                            <div className="text-silver-dark text-xs mt-0.5">
                                                {apt.service} · {apt.staff}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 border border-line text-silver text-[10px] uppercase rounded text-center min-w-[70px]">
                                        Confermato
                                    </span>
                                </div>
                            ))}
                    </div>
                </motion.div>

                {/* Sidebar with quick actions + low stock alert */}
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    <div className="bg-[#111111] border border-line rounded-[var(--radius-md)] p-6">
                        <h2 className="text-xs uppercase font-semibold text-silver-dark tracking-widest mb-4">
                            Azioni rapide
                        </h2>
                        <div className="space-y-2">
                            <a
                                href="/admin/agenda"
                                onClick={handleClientLink}
                                className="block w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors"
                            >
                                <span className="text-accent-warm mr-2">→</span>Apri agenda
                            </a>
                            <a
                                href="/admin/ordini"
                                onClick={handleClientLink}
                                className="block w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors"
                            >
                                <span className="text-accent-warm mr-2">→</span>Gestisci ordini shop
                            </a>
                            <a
                                href="/admin/foto-risultati"
                                onClick={handleClientLink}
                                className="block w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors"
                            >
                                <span className="text-accent-warm mr-2">→</span>Carica foto taglio
                            </a>
                            <a
                                href="/admin/prodotti"
                                onClick={handleClientLink}
                                className="block w-full text-left px-4 py-3 bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-sm)] text-sm transition-colors"
                            >
                                <span className="text-accent-warm mr-2">→</span>Aggiorna prodotti
                            </a>
                        </div>
                    </div>

                    {stats && stats.lowStockCount > 0 && (
                        <div className="bg-error/10 border border-error/30 rounded-[var(--radius-md)] p-6">
                            <h2 className="text-xs uppercase font-semibold text-error tracking-widest mb-3 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                Scorte basse · {stats.lowStockCount}
                            </h2>
                            <ul className="space-y-2 text-sm">
                                {stats.lowStockProducts.slice(0, 5).map((p) => (
                                    <li key={p.name} className="flex justify-between gap-2">
                                        <span className="text-warm-white truncate">{p.name}</span>
                                        <span className="text-error tabular-nums">{p.stock} pz</span>
                                    </li>
                                ))}
                            </ul>
                            <a
                                href="/admin/prodotti"
                                onClick={handleClientLink}
                                className="mt-4 inline-block text-[10px] uppercase tracking-[0.3em] text-error font-body font-semibold hover:text-error/80 transition-colors"
                            >
                                Riassortisci →
                            </a>
                        </div>
                    )}

                    {atRisk.length > 0 && (
                        <div className="bg-accent-warm/10 border border-accent-warm/30 rounded-[var(--radius-md)] p-6">
                            <h2 className="text-xs uppercase font-semibold text-accent-warm tracking-widest mb-1 flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                Da richiamare · {atRisk.length}
                            </h2>
                            <p className="text-[11px] text-warm-white-muted mb-3 leading-snug">
                                Clienti abituali silenti da oltre 90 giorni e senza appuntamenti in agenda.
                            </p>
                            <ul className="space-y-3 text-sm">
                                {atRisk.slice(0, 5).map((c) => {
                                    const name = `${c.first_name}${c.last_name ? " " + c.last_name : ""}`;
                                    return (
                                        <li key={c.customer_id} className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-warm-white font-medium truncate">{name}</div>
                                                <div className="text-[10px] text-silver-dark tabular-nums">
                                                    {c.days_since_last}g · {c.completed_count} visite · {formatPrice(c.lifetime_value_cents)}
                                                </div>
                                            </div>
                                            {c.phone && (
                                                <a
                                                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                                                    className="shrink-0 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-accent-warm border border-accent-warm/40 rounded-full hover:bg-accent-warm/15 transition-colors"
                                                >
                                                    Chiama
                                                </a>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <a
                                href="/admin/clienti"
                                onClick={handleClientLink}
                                className="mt-4 inline-block text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold hover:text-accent-warm/80 transition-colors"
                            >
                                Vedi tutti →
                            </a>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
