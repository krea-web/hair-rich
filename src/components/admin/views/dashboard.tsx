"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { handleClientLink } from "@/lib/clientRouter";
import { useBookingDrawer } from "@/lib/store";

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

function recapFmtEur(c: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format((c || 0) / 100);
}

// Recap contabile di oggi (da fn_daily_brief). Si nasconde se la migration 0061
// non è applicata o se l'utente non è admin (RLS).
function TodayRecap() {
    const [data, setData] = useState<any | null>(null);
    const [hide, setHide] = useState(false);
    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const d = now.toISOString().slice(0, 10);
        createClient()
            .rpc("fn_daily_brief", { p_date: d })
            .then(({ data, error }: { data: any; error: any }) => {
                if (error) setHide(true);
                else setData(data);
            });
    }, []);
    if (hide || !data) return null;
    const rev = data.revenue ?? {};
    const margin = (rev.total_cents ?? 0) - (data.expenses_cents ?? 0) - (data.stock_consumed_cost_cents ?? 0);
    const cells = [
        { l: "Incasso oggi", v: recapFmtEur(rev.total_cents ?? 0), accent: true },
        { l: "POS", v: recapFmtEur(rev.pos_cents ?? 0), accent: false },
        { l: "Contanti", v: recapFmtEur(rev.cash_cents ?? 0), accent: false },
        { l: "Spese", v: recapFmtEur(data.expenses_cents ?? 0), accent: false },
        { l: "Margine stimato", v: recapFmtEur(margin), accent: false },
    ];
    return (
        <div className="mb-6 bg-carbon border border-line rounded-[var(--radius-md)] p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold font-body text-warm-white">Recap oggi</h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark">
                    {data.appts_completed ?? 0} completati · {data.no_shows ?? 0} no-show
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cells.map((c) => (
                    <div key={c.l} className="border-l-2 border-accent-warm/40 pl-3">
                        <p className={`text-lg md:text-xl tabular-nums font-display ${c.accent ? "text-accent-warm" : "text-warm-white"}`}>{c.v}</p>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-silver-dark mt-0.5">{c.l}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Ruolo effettivo: base da `admins` + eventuale override "tablet" in localStorage
// (stessa chiave di AdminApp). Usato per mostrare il cassetto posta solo al titolare.
function useEffectiveRole(): "owner" | "manager" | "staff" | null {
    const [role, setRole] = useState<"owner" | "manager" | "staff" | null>(null);
    useEffect(() => {
        let alive = true;
        (async () => {
            const sb = createClient();
            let base: "owner" | "manager" | "staff" = "staff";
            const { data: u } = await sb.auth.getUser();
            if (u?.user?.id) {
                const { data: a } = await sb.from("admins").select("role").eq("user_id", u.user.id).maybeSingle();
                if (a?.role === "owner" || a?.role === "manager" || a?.role === "staff") base = a.role;
            }
            let override: string | null = null;
            try { override = window.localStorage.getItem("hairrich:admin:role_override"); } catch { /* noop */ }
            const eff = override === "owner" || override === "manager" || override === "staff" ? override : base;
            if (alive) setRole(eff as "owner" | "manager" | "staff");
        })();
        return () => { alive = false; };
    }, []);
    return role;
}

// Cassetto posta del TITOLARE: feed di `admin_inbox_items` (eventi bot Telegram +
// sistema) in tempo reale. Visibile solo in vista Titolare.
function OwnerInbox() {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => {
        const sb = createClient();
        const load = () =>
            sb.from("admin_inbox_items")
                .select("id, title, icon, priority, created_at, read_at")
                .is("archived_at", null)
                .order("created_at", { ascending: false })
                .limit(8)
                .then(({ data }: { data: any }) => setItems(data ?? []));
        load();
        const ch = sb
            .channel("dash-inbox")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_inbox_items" }, load)
            .subscribe();
        return () => { sb.removeChannel(ch); };
    }, []);
    const fmt = (iso: string) =>
        new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return (
        <div className="bg-[#111111] border border-line rounded-[var(--radius-md)] p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase font-semibold text-silver-dark tracking-widest">📬 Cassetto posta</h2>
                <a href="/admin/inbox" onClick={handleClientLink} className="text-[11px] text-silver hover:text-warm-white transition-colors">Tutto →</a>
            </div>
            {items.length === 0 ? (
                <p className="text-xs text-silver-dark py-4 text-center">Nessuna notifica per ora.</p>
            ) : (
                <ul className="space-y-2.5">
                    {items.map((it) => (
                        <li key={it.id} className={`flex items-start gap-2.5 ${it.read_at ? "opacity-55" : ""}`}>
                            <span aria-hidden="true" className="text-base leading-none mt-0.5">{it.icon ?? "•"}</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-warm-white text-[13px] leading-snug">{it.title}</p>
                                <p className="text-[10px] text-silver-dark mt-0.5">{fmt(it.created_at)}</p>
                            </div>
                            {!it.read_at && <span aria-label="non letto" className="shrink-0 w-2 h-2 rounded-full bg-accent-warm mt-1.5" />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Mini calendario settimanale (prossimi 7 giorni) con grafico a barre del picco
// prenotazioni per giorno + media giornaliera del mese corrente.
function WeekMini() {
    const [days, setDays] = useState<{ iso: string; label: string; dayNum: string; count: number }[]>([]);
    const [monthAvg, setMonthAvg] = useState<number | null>(null);
    useEffect(() => {
        const sb = createClient();
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 7);
        sb.from("appointments").select("start_at, status")
            .gte("start_at", start.toISOString()).lt("start_at", end.toISOString())
            .neq("status", "cancelled")
            .then(({ data }: { data: any }) => {
                const rows = data ?? [];
                const out = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(start); d.setDate(start.getDate() + i);
                    const iso = d.toISOString().slice(0, 10);
                    const count = rows.filter((r: any) => new Date(r.start_at).toISOString().slice(0, 10) === iso).length;
                    out.push({ iso, label: d.toLocaleDateString("it-IT", { weekday: "short" }), dayNum: String(d.getDate()), count });
                }
                setDays(out);
            });
        // Media giornaliera del mese corrente (su giorni trascorsi).
        const mStart = new Date(); mStart.setDate(1); mStart.setHours(0, 0, 0, 0);
        const now = new Date();
        sb.from("appointments").select("id", { count: "exact", head: true })
            .gte("start_at", mStart.toISOString()).lte("start_at", now.toISOString())
            .neq("status", "cancelled")
            .then(({ count }: { count: number | null }) => {
                const daysElapsed = Math.max(1, now.getDate());
                setMonthAvg((count ?? 0) / daysElapsed);
            });
    }, []);
    const max = Math.max(1, ...days.map((d) => d.count));
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-[#111111] border border-line rounded-[var(--radius-md)] p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase font-semibold text-silver-dark tracking-widest">Prossimi 7 giorni · picco prenotazioni</h2>
                <div className="flex items-center gap-3">
                    {monthAvg !== null && (
                        <span className="text-[10px] uppercase tracking-[0.15em] text-silver-dark">media mese <span className="text-warm-white tabular-nums">{monthAvg.toFixed(1)}/g</span></span>
                    )}
                    <a href="/admin/agenda-week" onClick={handleClientLink} className="text-[11px] text-silver hover:text-warm-white transition-colors">Settimana →</a>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days.map((d) => (
                    <a key={d.iso} href="/admin/agenda" onClick={handleClientLink} className="flex flex-col items-center gap-1.5 group">
                        <span className="text-[9px] uppercase tracking-wider text-silver-dark">{d.label}</span>
                        <span className="text-sm font-display text-warm-white leading-none">{d.dayNum}</span>
                        <span className="w-full h-12 flex items-end" aria-hidden="true">
                            <span className="w-full rounded-sm bg-accent-warm/70 group-hover:bg-accent-warm transition-all" style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }} />
                        </span>
                        <span className="text-[11px] tabular-nums text-silver">{d.count}</span>
                    </a>
                ))}
            </div>
        </motion.div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [next, setNext] = useState<UpcomingAppt[]>([]);
    const [atRisk, setAtRisk] = useState<AtRiskCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const openBooking = useBookingDrawer((s) => s.open);
    const role = useEffectiveRole();
    const isOwner = role === "owner" || role === "manager";

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
                        service: a.appointment_services?.[0]?.service?.name ?? "Servizio",
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <span className="text-display-alt text-xl text-accent-warm">
                        {new Date().toLocaleDateString("it-IT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        })}
                    </span>
                    <h1 className="text-display text-4xl text-warm-white mt-1">Dashboard</h1>
                </div>
                {/* Unico bottone per creare un appuntamento (apre il drawer prenotazione) */}
                <button
                    onClick={() => openBooking()}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.25em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform shadow-[0_14px_40px_-12px_rgba(212,165,116,0.6)]"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                    </svg>
                    Nuovo appuntamento
                </button>
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

            <TodayRecap />

            <WeekMini />

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
                    {/* Cassetto posta — solo titolare (eventi bot Telegram + sistema) */}
                    {isOwner && <OwnerInbox />}

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
