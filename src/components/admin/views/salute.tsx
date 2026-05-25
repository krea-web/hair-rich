"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface SaluteSnapshot {
    skills_enabled: number;
    skills_total: number;
    notifications_24h_sent: number;
    notifications_24h_failed: number;
    notifications_7d_failed: number;
    inbox_unread: number;
    customers_total: number;
    appointments_today: number;
    appointments_tomorrow: number;
    telegram_configured: boolean;
    google_place_id_set: boolean;
    google_calendar_staff: number;
    last_email_at: string | null;
    last_telegram_at: string | null;
    crons: CronStatus[];
}

interface CronStatus {
    name: string;
    label: string;
    schedule: string;
    expected_period_seconds: number;
    last_acquired_at: string | null;
    last_released_at: string | null;
    last_succeeded: boolean | null;
    is_stale: boolean;
}

const CRON_DEFS = [
    { name: "birthday-sender", label: "Auguri di compleanno", schedule: "ogni giorno 09:00", expected: 86400 },
    { name: "reactivation-sender", label: "Riattivazione clienti persi", schedule: "ogni lunedì 09:00", expected: 86400 * 7 },
    { name: "reviews-harvester", label: "Raccolta recensioni Google", schedule: "ogni 30 min", expected: 1800 },
    { name: "segments-classifier", label: "Classificatore segmenti", schedule: "ogni giorno 02:00", expected: 86400 },
    { name: "bookings-drop-alert", label: "Allarme calo prenotazioni", schedule: "ogni lunedì 09:00", expected: 86400 * 7 },
    { name: "ai-weekly-suggestions", label: "Suggerimenti AI settimanali", schedule: "ogni lunedì 09:00", expected: 86400 * 7 },
    { name: "ai-monthly-report", label: "Report AI mensile", schedule: "1° del mese 09:00", expected: 86400 * 31 },
    { name: "stock-low-alert", label: "Avviso scorte basse", schedule: "ogni giorno 08:00", expected: 86400 },
    { name: "waitlist-matcher", label: "Match lista d'attesa", schedule: "ogni 15 min", expected: 900 },
    { name: "package-expiry-reminders", label: "Promemoria scadenza pacchetti", schedule: "ogni giorno 10:00", expected: 86400 },
    { name: "post-visit-survey-sender", label: "Invio sondaggio post-visita", schedule: "ogni 30 min", expected: 1800 },
    { name: "gcal-sync", label: "Sync Google Calendar staff", schedule: "ogni 10 min", expected: 600 },
];

export default function AdminSalutePage() {
    const [snap, setSnap] = useState<SaluteSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        try {
            const supabase = createClient();
            const now = new Date();
            const t24 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
            const t7d = new Date(now.getTime() - 7 * 86400 * 1000).toISOString();
            const todayISO = now.toISOString().slice(0, 10);
            const tomorrowISO = new Date(now.getTime() + 86400 * 1000).toISOString().slice(0, 10);

            const [
                { data: skills },
                { data: salon },
                { count: gcalStaff },
                { count: sent24 },
                { count: failed24 },
                { count: failed7d },
                { count: inboxUnread },
                { count: customers },
                { count: apptToday },
                { count: apptTomorrow },
                { data: lastEmail },
                { data: lastTelegram },
                { data: crons },
            ] = await Promise.all([
                supabase.from("skills_config").select("enabled"),
                supabase.from("salon_settings").select("owner_telegram_chat_id, google_place_id").limit(1).maybeSingle(),
                supabase.from("staff_gcal_tokens").select("staff_id", { count: "exact", head: true }),
                supabase.from("notifications_sent").select("id", { count: "exact", head: true }).gte("sent_at", t24).in("status", ["sent", "delivered", "opened", "clicked"]),
                supabase.from("notifications_sent").select("id", { count: "exact", head: true }).gte("sent_at", t24).in("status", ["failed", "bounced"]),
                supabase.from("notifications_sent").select("id", { count: "exact", head: true }).gte("sent_at", t7d).in("status", ["failed", "bounced"]),
                supabase.from("admin_inbox_items").select("id", { count: "exact", head: true }).is("read_at", null).is("archived_at", null),
                supabase.from("customers").select("id", { count: "exact", head: true }),
                supabase.from("appointments").select("id", { count: "exact", head: true }).gte("start_at", `${todayISO}T00:00:00`).lt("start_at", `${todayISO}T23:59:59`).not("status", "in", '("cancelled","no_show")'),
                supabase.from("appointments").select("id", { count: "exact", head: true }).gte("start_at", `${tomorrowISO}T00:00:00`).lt("start_at", `${tomorrowISO}T23:59:59`).not("status", "in", '("cancelled","no_show")'),
                supabase.from("notifications_sent").select("sent_at").eq("channel", "email").in("status", ["sent", "delivered"]).order("sent_at", { ascending: false }).limit(1).maybeSingle(),
                supabase.from("notifications_sent").select("sent_at").eq("channel", "telegram").in("status", ["sent", "delivered"]).order("sent_at", { ascending: false }).limit(1).maybeSingle(),
                supabase.from("cron_locks").select("name, acquired_at, released_at, succeeded").order("acquired_at", { ascending: false }).limit(200),
            ]);

            const skillsList = (skills ?? []) as Array<{ enabled: boolean }>;
            const skillsEnabled = skillsList.filter((s) => s.enabled).length;

            const cronMap = new Map<string, { acquired: string; released: string | null; succeeded: boolean | null }>();
            for (const r of (crons ?? []) as Array<{ name: string; acquired_at: string; released_at: string | null; succeeded: boolean | null }>) {
                if (!cronMap.has(r.name)) cronMap.set(r.name, { acquired: r.acquired_at, released: r.released_at, succeeded: r.succeeded });
            }

            const cronStatuses: CronStatus[] = CRON_DEFS.map((def) => {
                const r = cronMap.get(def.name);
                const lastAcq = r?.acquired ?? null;
                let stale = false;
                if (!lastAcq) {
                    stale = true;
                } else {
                    const ageS = (Date.now() - new Date(lastAcq).getTime()) / 1000;
                    // Consider stale if older than 2× expected period (allow some jitter)
                    stale = ageS > def.expected * 2;
                }
                return {
                    name: def.name,
                    label: def.label,
                    schedule: def.schedule,
                    expected_period_seconds: def.expected,
                    last_acquired_at: lastAcq,
                    last_released_at: r?.released ?? null,
                    last_succeeded: r?.succeeded ?? null,
                    is_stale: stale,
                };
            });

            setSnap({
                skills_enabled: skillsEnabled,
                skills_total: skillsList.length,
                notifications_24h_sent: sent24 ?? 0,
                notifications_24h_failed: failed24 ?? 0,
                notifications_7d_failed: failed7d ?? 0,
                inbox_unread: inboxUnread ?? 0,
                customers_total: customers ?? 0,
                appointments_today: apptToday ?? 0,
                appointments_tomorrow: apptTomorrow ?? 0,
                telegram_configured: Boolean((salon as any)?.owner_telegram_chat_id),
                google_place_id_set: Boolean((salon as any)?.google_place_id),
                google_calendar_staff: gcalStaff ?? 0,
                last_email_at: (lastEmail as any)?.sent_at ?? null,
                last_telegram_at: (lastTelegram as any)?.sent_at ?? null,
                crons: cronStatuses,
            });
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading || !snap) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                ))}
            </div>
        );
    }

    const overallStatus = computeOverallStatus(snap);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <span className="text-display-alt text-2xl text-accent-warm">Sistema</span>
                    <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                        Salute.
                    </h1>
                    <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                        Stato in tempo reale del gestionale: canali di notifica, cron job, dati e
                        configurazione. Se vedi tutto verde, dormi tranquillo.
                    </p>
                </div>
                <button
                    onClick={() => { setRefreshing(true); load(); }}
                    disabled={refreshing}
                    className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em] hover:bg-carbon"
                >
                    {refreshing ? "Aggiorno…" : "↻ Aggiorna"}
                </button>
            </motion.div>

            <OverallBanner status={overallStatus} />

            {/* Top KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi
                    label="Funzionalità attive"
                    value={`${snap.skills_enabled}/${snap.skills_total}`}
                    hint={snap.skills_enabled === 0 ? "Nessuna skill attiva — vai in Funzionalità" : "Hai attivato delle skill"}
                    tone={snap.skills_enabled > 0 ? "good" : "warn"}
                    href="/admin/funzionalita"
                />
                <Kpi
                    label="Notifiche 24h"
                    value={String(snap.notifications_24h_sent)}
                    hint={snap.notifications_24h_failed > 0 ? `${snap.notifications_24h_failed} fallite` : "Tutto OK"}
                    tone={snap.notifications_24h_failed > 0 ? "warn" : "good"}
                />
                <Kpi
                    label="Inbox da leggere"
                    value={String(snap.inbox_unread)}
                    hint={snap.inbox_unread > 0 ? "Apri inbox" : "Nessuna nuova"}
                    tone={snap.inbox_unread > 10 ? "warn" : "good"}
                    href="/admin/inbox"
                />
                <Kpi
                    label="Errori 7gg"
                    value={String(snap.notifications_7d_failed)}
                    hint={snap.notifications_7d_failed > 5 ? "Verifica configurazione" : "Sotto controllo"}
                    tone={snap.notifications_7d_failed > 5 ? "error" : snap.notifications_7d_failed > 0 ? "warn" : "good"}
                />
            </div>

            {/* Channels */}
            <section className="space-y-3">
                <h2 className="text-display text-xl text-warm-white tracking-tight">Canali di notifica</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ChannelCard
                        name="Telegram (titolare)"
                        configured={snap.telegram_configured}
                        lastUsedAt={snap.last_telegram_at}
                        configureHref="/admin/impostazioni"
                        notConfiguredHint="Inserisci chat ID in Impostazioni → Notifiche"
                    />
                    <ChannelCard
                        name="Email (Gmail)"
                        configured={true}
                        externalNote="GMAIL_USER + APP_PASSWORD configurati come Edge Function secrets"
                        lastUsedAt={snap.last_email_at}
                    />
                    <ChannelCard
                        name="Google Calendar staff"
                        configured={snap.google_calendar_staff > 0}
                        configureHref="/admin/staff"
                        statusLabel={snap.google_calendar_staff > 0 ? `${snap.google_calendar_staff} operatori connessi` : "Nessuno staff connesso"}
                        notConfiguredHint="Ogni operatore può connettere il suo calendario da /admin/staff"
                    />
                </div>
            </section>

            {/* Cron status */}
            <section className="space-y-3">
                <h2 className="text-display text-xl text-warm-white tracking-tight">Job pianificati</h2>
                <p className="text-sm text-silver-dark">
                    Tutti i job che girano in automatico. Un job "in ritardo" significa che non è
                    girato dal momento previsto — verifica deploy o secrets.
                </p>
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-black-2 text-[10px] uppercase tracking-[0.2em] text-silver-dark">
                            <tr>
                                <th className="px-3 py-2 text-left font-body font-semibold">Job</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Pianificazione</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Ultima esecuzione</th>
                                <th className="px-3 py-2 text-left font-body font-semibold">Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {snap.crons.map((c) => (
                                <tr key={c.name} className="border-t border-line">
                                    <td className="px-3 py-2 text-warm-white">{c.label}</td>
                                    <td className="px-3 py-2 text-warm-white-muted text-xs">{c.schedule}</td>
                                    <td className="px-3 py-2 text-warm-white-muted text-xs font-mono">
                                        {c.last_acquired_at ? formatRelative(c.last_acquired_at) : "—"}
                                    </td>
                                    <td className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-body font-semibold">
                                        {!c.last_acquired_at ? (
                                            <span className="text-silver-dark">mai eseguito</span>
                                        ) : c.is_stale ? (
                                            <span className="text-amber-300">⚠️ in ritardo</span>
                                        ) : c.last_succeeded === false ? (
                                            <span className="text-red-400">✗ fallito</span>
                                        ) : (
                                            <span className="text-green-400">✓ ok</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Operational data */}
            <section className="space-y-3">
                <h2 className="text-display text-xl text-warm-white tracking-tight">Dati operativi</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniStat label="Clienti totali" value={snap.customers_total} />
                    <MiniStat label="Appuntamenti oggi" value={snap.appointments_today} />
                    <MiniStat label="Appuntamenti domani" value={snap.appointments_tomorrow} />
                    <MiniStat label="Place ID Google" value={snap.google_place_id_set ? "✓ impostato" : "non impostato"} />
                </div>
            </section>
        </div>
    );
}

type Tone = "good" | "warn" | "error";

function computeOverallStatus(snap: SaluteSnapshot): Tone {
    if (snap.notifications_7d_failed > 5) return "error";
    if (snap.crons.some((c) => c.is_stale)) return "warn";
    if (snap.notifications_24h_failed > 0) return "warn";
    return "good";
}

function OverallBanner({ status }: { status: Tone }) {
    const config = {
        good: {
            bg: "bg-green-500/10 border-green-400/40",
            icon: "🟢",
            title: "Tutto a posto",
            body: "Canali attivi, job aggiornati, nessun errore recente.",
        },
        warn: {
            bg: "bg-amber-500/10 border-amber-400/40",
            icon: "🟡",
            title: "Attenzione",
            body: "Qualche job in ritardo o un errore recente — controlla i dettagli sotto.",
        },
        error: {
            bg: "bg-red-500/10 border-red-400/40",
            icon: "🔴",
            title: "Problemi attivi",
            body: "Errori multipli negli ultimi 7 giorni. Verifica secrets ed Edge Functions.",
        },
    }[status];
    return (
        <div className={`border rounded-[var(--radius-md)] p-5 ${config.bg} flex items-start gap-3`}>
            <span className="text-3xl">{config.icon}</span>
            <div>
                <h3 className="text-warm-white font-body font-semibold text-lg">{config.title}</h3>
                <p className="text-warm-white-muted text-sm mt-1">{config.body}</p>
            </div>
        </div>
    );
}

function Kpi({
    label,
    value,
    hint,
    tone,
    href,
}: {
    label: string;
    value: string;
    hint?: string;
    tone: Tone;
    href?: string;
}) {
    const toneClass = tone === "good" ? "border-green-400/30" : tone === "warn" ? "border-amber-400/40" : "border-red-400/40";
    const body = (
        <div className={`bg-carbon border ${toneClass} rounded-[var(--radius-md)] p-4`}>
            <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">{label}</div>
            <div className="text-display text-3xl text-warm-white mt-2 tracking-tight">{value}</div>
            {hint && <div className="text-xs text-warm-white-muted mt-1">{hint}</div>}
        </div>
    );
    return href ? (
        <a href={href} className="block hover:scale-[1.01] transition-transform">{body}</a>
    ) : body;
}

function ChannelCard({
    name,
    configured,
    lastUsedAt,
    configureHref,
    statusLabel,
    notConfiguredHint,
    externalNote,
}: {
    name: string;
    configured: boolean;
    lastUsedAt?: string | null;
    configureHref?: string;
    statusLabel?: string;
    notConfiguredHint?: string;
    externalNote?: string;
}) {
    return (
        <div className={`bg-carbon border rounded-[var(--radius-md)] p-4 ${configured ? "border-line" : "border-amber-400/40"}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-warm-white font-body font-semibold">{name}</h3>
                {configured ? (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-body font-semibold">✓ ok</span>
                ) : (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-body font-semibold">da configurare</span>
                )}
            </div>
            <p className="text-xs text-warm-white-muted mt-1">{statusLabel}</p>
            {lastUsedAt && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body mt-2">
                    Ultimo invio: {formatRelative(lastUsedAt)}
                </p>
            )}
            {!configured && notConfiguredHint && (
                <p className="text-xs text-amber-200/80 mt-2">{notConfiguredHint}</p>
            )}
            {externalNote && configured && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body mt-2">{externalNote}</p>
            )}
            {!configured && configureHref && (
                <a href={configureHref} className="text-xs text-accent-warm hover:underline mt-2 inline-block">
                    Configura →
                </a>
            )}
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="bg-carbon border border-line rounded-md p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">{label}</div>
            <div className="text-warm-white text-xl font-display mt-1">{value}</div>
        </div>
    );
}

function formatRelative(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "adesso";
    if (min < 60) return `${min}m fa`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h fa`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}g fa`;
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}
