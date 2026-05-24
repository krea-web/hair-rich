"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";
import { downloadCsv, todayStamp } from "@/lib/csv";
import { SellPackageModal } from "../SellPackageModal";
import { AnimatePresence } from "framer-motion";

interface CustomerRow {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    is_guest: boolean;
    birthdate: string | null;
    notes: string | null;
    noshow_count: number;
    created_at: string;
    completed_count: number;
    last_visit_at: string | null;
    lifetime_value_cents: number;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminClientiPage() {
    const [customers, setCustomers] = useState<CustomerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "ltv" | "visits">("recent");
    const [sellTarget, setSellTarget] = useState<{ id: string; name: string } | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: custData, error: custErr } = await supabase
                .from("customers")
                .select("id, first_name, last_name, email, phone, is_guest, birthdate, notes, noshow_count, created_at")
                .order("created_at", { ascending: false });
            if (custErr) throw custErr;

            const { data: apptData, error: apptErr } = await supabase
                .from("appointments")
                .select("customer_id, status, total_cents, start_at");
            if (apptErr) throw apptErr;

            const aggMap = new Map<string, { completed: number; lastVisit: string | null; ltv: number }>();
            for (const a of (apptData ?? []) as any[]) {
                const entry = aggMap.get(a.customer_id) ?? { completed: 0, lastVisit: null, ltv: 0 };
                if (a.status === "completed") {
                    entry.completed += 1;
                    entry.ltv += a.total_cents || 0;
                    if (!entry.lastVisit || a.start_at > entry.lastVisit) {
                        entry.lastVisit = a.start_at;
                    }
                }
                aggMap.set(a.customer_id, entry);
            }

            const rows: CustomerRow[] = ((custData ?? []) as any[]).map((c) => {
                const agg = aggMap.get(c.id) ?? { completed: 0, lastVisit: null, ltv: 0 };
                return {
                    ...c,
                    completed_count: agg.completed,
                    last_visit_at: agg.lastVisit,
                    lifetime_value_cents: agg.ltv,
                };
            });

            setCustomers(rows);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = q
            ? customers.filter((c) => {
                  const name = `${c.first_name} ${c.last_name ?? ""}`.toLowerCase();
                  return (
                      name.includes(q) ||
                      (c.email ?? "").toLowerCase().includes(q) ||
                      (c.phone ?? "").includes(q)
                  );
              })
            : customers;

        const sorted = [...list];
        if (sortBy === "ltv") sorted.sort((a, b) => b.lifetime_value_cents - a.lifetime_value_cents);
        else if (sortBy === "visits") sorted.sort((a, b) => b.completed_count - a.completed_count);
        else
            sorted.sort(
                (a, b) =>
                    new Date(b.last_visit_at ?? b.created_at).getTime() -
                    new Date(a.last_visit_at ?? a.created_at).getTime()
            );
        return sorted;
    }, [customers, search, sortBy]);

    const totals = useMemo(
        () => ({
            total: customers.length,
            registered: customers.filter((c) => !c.is_guest).length,
            recurring: customers.filter((c) => c.completed_count >= 2).length,
        }),
        [customers]
    );

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">CRM</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Clienti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Anagrafiche, storico visite e valore. Tap su un cliente per espandere note e
                    dettagli appuntamenti.
                </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 md:gap-5">
                {[
                    { label: "Totali", value: totals.total },
                    { label: "Iscritti", value: totals.registered },
                    { label: "Ricorrenti (≥2)", value: totals.recurring },
                ].map((s) => (
                    <div key={s.label} className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {s.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="search"
                    placeholder="Cerca per nome, email, telefono…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:flex-1 md:w-auto md:min-w-[200px] bg-carbon border border-line rounded-full px-4 py-2 text-sm text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                />
                <div className="flex gap-1.5 bg-carbon border border-line rounded-full p-1">
                    {[
                        { key: "recent" as const, label: "Recenti" },
                        { key: "ltv" as const, label: "Top spesi" },
                        { key: "visits" as const, label: "Top visite" },
                    ].map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setSortBy(s.key)}
                            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full transition-colors ${
                                sortBy === s.key ? "bg-warm-white text-black" : "text-silver hover:text-warm-white"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() =>
                        downloadCsv({
                            filename: `clienti-${todayStamp()}`,
                            rows: filtered,
                            columns: [
                                { key: "first_name", label: "Nome" },
                                { key: "last_name", label: "Cognome" },
                                { key: "email", label: "Email" },
                                { key: "phone", label: "Telefono" },
                                { key: "is_guest", label: "Guest", get: (r) => (r.is_guest ? "Sì" : "No") },
                                { key: "birthdate", label: "Compleanno" },
                                { key: "completed_count", label: "Visite completate" },
                                { key: "lifetime_value_cents", label: "Lifetime value EUR", get: (r) => (r.lifetime_value_cents / 100).toFixed(2) },
                                { key: "last_visit_at", label: "Ultima visita" },
                                { key: "created_at", label: "Cliente dal" },
                                { key: "notes", label: "Note" },
                            ],
                        })
                    }
                    className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                >
                    Export CSV
                </button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun cliente trovato.
                </p>
            )}

            {!loading && filtered.length > 0 && (
                <ul className="space-y-2">
                    {filtered.map((c) => {
                        const name = `${c.first_name}${c.last_name ? " " + c.last_name : ""}`;
                        const isRecurring = c.completed_count >= 2;
                        return (
                            <motion.li
                                key={c.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-carbon border border-line hover:border-silver-dark transition-colors rounded-[var(--radius-md)] overflow-hidden"
                            >
                                <details className="group">
                                    <summary className="cursor-pointer list-none p-4 md:p-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-warm/40 to-warning/40 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg font-display text-warm-white">{c.first_name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-warm-white font-body font-semibold truncate">{name}</h3>
                                                {c.is_guest && (
                                                    <span className="text-[9px] uppercase tracking-wider text-silver-dark border border-line px-1.5 py-0.5 rounded">
                                                        Guest
                                                    </span>
                                                )}
                                                {isRecurring && (
                                                    <span className="text-[9px] uppercase tracking-wider text-accent-warm border border-accent-warm/40 px-1.5 py-0.5 rounded">
                                                        Cliente abituale
                                                    </span>
                                                )}
                                                {c.noshow_count > 0 && (
                                                    <span className="text-[9px] uppercase tracking-wider text-warning border border-warning/40 px-1.5 py-0.5 rounded bg-warning/10">
                                                        {c.noshow_count} no-show
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-silver-dark text-xs mt-0.5 truncate">
                                                {c.phone ?? "—"} {c.email && `· ${c.email}`}
                                            </p>
                                        </div>
                                        <div className="hidden md:flex flex-col items-end gap-0.5 text-right">
                                            <span className="text-warm-white text-sm tabular-nums">{c.completed_count} visite</span>
                                            <span className="text-accent-warm text-sm tabular-nums">
                                                {formatPrice(c.lifetime_value_cents)}
                                            </span>
                                        </div>
                                        <span
                                            aria-hidden="true"
                                            className="w-6 h-6 rounded-full border border-line text-silver flex items-center justify-center group-open:rotate-45 transition-transform"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                            </svg>
                                        </span>
                                    </summary>

                                    <div className="px-4 md:px-5 pb-5 border-t border-line/60 grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Cliente dal
                                            </span>
                                            <p className="text-warm-white text-sm mt-1">{formatDate(c.created_at)}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Ultima visita
                                            </span>
                                            <p className="text-warm-white text-sm mt-1">{formatDate(c.last_visit_at)}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                Compleanno
                                            </span>
                                            <p className="text-warm-white text-sm mt-1">
                                                {c.birthdate
                                                    ? new Date(c.birthdate).toLocaleDateString("it-IT", {
                                                          day: "numeric",
                                                          month: "long",
                                                      })
                                                    : "—"}
                                            </p>
                                        </div>
                                        {c.notes && (
                                            <div className="md:col-span-3 pt-2">
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                                    Note
                                                </span>
                                                <p className="text-warm-white-muted text-sm mt-1 leading-relaxed">{c.notes}</p>
                                            </div>
                                        )}
                                        <div className="md:col-span-3 flex flex-wrap gap-2 pt-2">
                                            {c.phone && (
                                                <a
                                                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 border border-line rounded-full text-[10px] uppercase tracking-[0.25em] text-warm-white font-body font-semibold hover:border-warm-white transition-colors"
                                                >
                                                    Chiama
                                                </a>
                                            )}
                                            {c.email && (
                                                <a
                                                    href={`mailto:${c.email}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 border border-line rounded-full text-[10px] uppercase tracking-[0.25em] text-warm-white font-body font-semibold hover:border-warm-white transition-colors"
                                                >
                                                    Email
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setSellTarget({ id: c.id, name })}
                                                className="inline-flex items-center gap-2 px-4 py-2 border border-accent-warm/40 text-accent-warm rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm hover:text-black transition-colors"
                                            >
                                                Vendi pacchetto
                                            </button>
                                        </div>
                                    </div>
                                </details>
                            </motion.li>
                        );
                    })}
                </ul>
            )}

            <AnimatePresence>
                {sellTarget && (
                    <SellPackageModal
                        customerId={sellTarget.id}
                        customerName={sellTarget.name}
                        onClose={() => setSellTarget(null)}
                        onSold={load}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
