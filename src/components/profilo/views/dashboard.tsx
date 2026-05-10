"use client";

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { SmartImage } from "@/components/landing/_shared/SmartImage";
import { handleClientLink } from "@/lib/clientRouter";

const NEXT_APPT = {
    date: { day: "24", weekday: "Gio", month: "Mag" },
    time: "15:30",
    duration: 60,
    service: "Taglio + Barba",
    barber: "Marco Sanna",
    barberImg: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e3?q=80&w=300&auto=format&fit=crop",
    status: "Confermato",
};

const RECENT_ACTIVITY = [
    { icon: "✂️", label: "Taglio + Barba completato", date: "12 Set 2024", price: 3000 },
    { icon: "🎁", label: "Bonus referral ricevuto", date: "5 Set 2024", price: 500 },
    { icon: "🛒", label: "Pomade Opaca acquistata", date: "5 Set 2024", price: 2500 },
];

export default function ProfiloDashboardPage() {
    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-6xl">
            {/* ── Greeting ────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
                <div>
                    <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Bentornato,</span>
                    <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                        Mario.
                    </h1>
                    <p className="mt-4 text-warm-white-muted text-base max-w-md">
                        Il tuo prossimo rituale è già fissato. Ecco un riepilogo veloce dei tuoi crediti e dell'attività recente.
                    </p>
                </div>
                <a
                    href="/#booking"
                    className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] transition-transform whitespace-nowrap self-start md:self-end"
                >
                    Nuovo appuntamento
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </a>
            </motion.div>

            {/* ── KPI strip ──────────────────────────────────────────────── */}
            <motion.div
                className="mt-10 md:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                {[
                    { label: "Portafoglio", value: formatPrice(2500), trend: "+20%", trendKind: "up" },
                    { label: "Visite tot.", value: "12", trend: "Quest'anno", trendKind: "neutral" },
                    { label: "Taglio prefer.", value: "Razor Fade", trend: "5x", trendKind: "neutral" },
                    { label: "Trust score", value: "98", trend: "/100", trendKind: "up" },
                ].map((k) => (
                    <div
                        key={k.label}
                        className="relative p-5 bg-carbon border border-line rounded-[var(--radius-lg)] flex flex-col justify-between gap-3 min-h-[120px]"
                    >
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {k.label}
                        </span>
                        <div className="flex items-end justify-between gap-2">
                            <span className="text-display text-2xl md:text-3xl text-warm-white tabular-nums leading-none">
                                {k.value}
                            </span>
                            <span
                                className={`text-[10px] font-body font-semibold uppercase tracking-wider ${
                                    k.trendKind === "up" ? "text-success" : "text-silver-dark"
                                }`}
                            >
                                {k.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* ── Next appointment hero card ─────────────────────────────── */}
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
                </div>

                <div className="relative bg-gradient-to-br from-carbon to-black-2 border border-accent-warm/30 rounded-[var(--radius-xl)] overflow-hidden">
                    {/* Decorative ring */}
                    <div
                        aria-hidden="true"
                        className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-accent-warm/20 pointer-events-none"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-accent-warm/10 pointer-events-none"
                    />

                    <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-center p-6 md:p-8">
                        {/* Date stamp */}
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-[var(--radius-md)] bg-black border border-accent-warm/40 shrink-0">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                    {NEXT_APPT.date.weekday}
                                </span>
                                <span className="text-display text-3xl md:text-4xl text-warm-white leading-none mt-1">
                                    {NEXT_APPT.date.day}
                                </span>
                                <span className="text-[9px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold mt-1">
                                    {NEXT_APPT.date.month}
                                </span>
                            </div>

                            <div className="md:hidden">
                                <p className="text-display text-xl text-warm-white tracking-tight">{NEXT_APPT.service}</p>
                                <p className="text-silver-dark text-xs uppercase tracking-[0.2em] font-body font-semibold mt-1">
                                    {NEXT_APPT.time} · {NEXT_APPT.duration}'
                                </p>
                            </div>
                        </div>

                        {/* Service info (desktop) */}
                        <div className="hidden md:block">
                            <span className="text-display-alt text-xl text-accent-warm">Sartoriale</span>
                            <h3 className="text-display text-2xl text-warm-white tracking-tight">{NEXT_APPT.service}</h3>

                            <div className="mt-3 flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-line">
                                        <SmartImage
                                            src={NEXT_APPT.barberImg}
                                            alt={NEXT_APPT.barber}
                                            className="h-full"
                                            eager
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-warm-white font-body font-semibold">{NEXT_APPT.barber}</p>
                                        <p className="text-silver-dark text-xs uppercase tracking-widest font-body font-semibold">
                                            {NEXT_APPT.time} · {NEXT_APPT.duration} min
                                        </p>
                                    </div>
                                </div>
                                <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-success/15 text-success border border-success/25 rounded-full text-[10px] font-body font-semibold tracking-[0.2em] uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    {NEXT_APPT.status}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row md:flex-col gap-2 md:gap-3 md:items-stretch">
                            <button className="flex-1 md:flex-none px-5 py-3 border border-line bg-black/50 backdrop-blur-md text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white hover:text-black hover:border-warm-white transition-colors">
                                Sposta
                            </button>
                            <button className="flex-1 md:flex-none px-5 py-3 border border-error/40 text-error rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-error/10 transition-colors">
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ── Recent activity timeline ───────────────────────────────── */}
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
                        Ultimi movimenti tra appuntamenti, ordini e crediti.
                    </p>
                </div>

                <ol className="md:col-span-2 relative pl-6 md:pl-8 border-l border-line space-y-6">
                    {RECENT_ACTIVITY.map((item, i) => (
                        <li key={i} className="relative">
                            <span
                                aria-hidden="true"
                                className="absolute -left-[27px] md:-left-[35px] top-1.5 w-3 h-3 rounded-full bg-accent-warm border-4 border-black"
                            />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-warm-white font-body text-base">
                                        <span className="mr-2" aria-hidden="true">{item.icon}</span>
                                        {item.label}
                                    </p>
                                    <p className="text-silver-dark text-xs uppercase tracking-[0.25em] font-body font-semibold mt-1">
                                        {item.date}
                                    </p>
                                </div>
                                <span className="text-display text-base text-accent-warm tabular-nums whitespace-nowrap">
                                    {formatPrice(item.price)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            </motion.section>
        </div>
    );
}
