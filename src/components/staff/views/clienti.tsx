"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface ApptRow {
    appointment_id: string;
    start_at: string;
    end_at: string;
    status: string;
    customer_first_name: string;
    customer_last_name: string | null;
    customer_phone: string | null;
    service_names: string;
    total_cents: number;
    notes: string | null;
}

interface CustomerAggregate {
    key: string;
    name: string;
    phone: string | null;
    visits: number;
    lastVisit: string;
    nextVisit: string | null;
    totalSpent: number;
}

export default function StaffClientiPage() {
    const [rows, setRows] = useState<ApptRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const now = new Date();
            const past = new Date(now);
            past.setDate(past.getDate() - 180); // 6 mesi indietro
            const future = new Date(now);
            future.setDate(future.getDate() + 60);
            const { data, error } = await supabase.rpc("fn_staff_my_appointments", {
                p_from: past.toISOString(),
                p_to: future.toISOString(),
            });
            if (error) throw error;
            setRows((data ?? []) as ApptRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    // Aggregate per customer (name + phone)
    const customers = useMemo(() => {
        const map = new Map<string, CustomerAggregate>();
        const now = Date.now();
        for (const r of rows) {
            if (r.status === "cancelled") continue;
            const name = `${r.customer_first_name} ${r.customer_last_name ?? ""}`.trim();
            const key = `${name}|${r.customer_phone ?? ""}`;
            const existing = map.get(key);
            const startTime = new Date(r.start_at).getTime();
            const isPast = startTime < now;
            if (!existing) {
                map.set(key, {
                    key,
                    name,
                    phone: r.customer_phone,
                    visits: isPast && r.status === "completed" ? 1 : 0,
                    lastVisit: isPast ? r.start_at : "",
                    nextVisit: !isPast ? r.start_at : null,
                    totalSpent: isPast && r.status === "completed" ? r.total_cents : 0,
                });
            } else {
                if (isPast && r.status === "completed") {
                    existing.visits++;
                    existing.totalSpent += r.total_cents;
                    if (!existing.lastVisit || new Date(r.start_at).getTime() > new Date(existing.lastVisit).getTime()) {
                        existing.lastVisit = r.start_at;
                    }
                }
                if (!isPast) {
                    if (!existing.nextVisit || new Date(r.start_at).getTime() < new Date(existing.nextVisit).getTime()) {
                        existing.nextVisit = r.start_at;
                    }
                }
            }
        }
        return Array.from(map.values()).sort((a, b) => {
            // active first, then by recent visit
            const aAct = a.nextVisit ? 1 : 0;
            const bAct = b.nextVisit ? 1 : 0;
            if (aAct !== bAct) return bAct - aAct;
            return (b.lastVisit || "").localeCompare(a.lastVisit || "");
        });
    }, [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q));
    }, [customers, search]);

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Le persone</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    I miei clienti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Chi è passato da te negli ultimi 6 mesi e chi torna nei prossimi 60 giorni.
                </p>
            </motion.div>

            <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca per nome o telefono…"
                className="w-full bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white placeholder:text-silver-dark"
            />

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-silver-dark py-12 bg-carbon border border-line border-dashed rounded-md">
                    {search ? "Nessun cliente trovato." : "Ancora nessun cliente. Quando completi un appuntamento, appare qui."}
                </div>
            ) : (
                <ul className="space-y-2">
                    {filtered.map((c) => (
                        <li
                            key={c.key}
                            className="grid grid-cols-[1fr_auto] gap-4 p-4 bg-carbon border border-line rounded-md hover:border-silver-mid transition-colors"
                        >
                            <div className="min-w-0">
                                <div className="text-warm-white font-body font-semibold truncate">{c.name}</div>
                                <div className="text-xs text-warm-white-muted mt-0.5">
                                    {c.visits} visite{c.totalSpent > 0 ? ` · totale € ${(c.totalSpent / 100).toFixed(0)}` : ""}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-silver-dark font-body mt-1">
                                    {c.nextVisit ? (
                                        <span className="text-accent-warm">
                                            prossimo:{" "}
                                            {new Date(c.nextVisit).toLocaleDateString("it-IT", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    ) : c.lastVisit ? (
                                        `ultima visita: ${new Date(c.lastVisit).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}`
                                    ) : (
                                        "—"
                                    )}
                                </div>
                            </div>
                            {c.phone && (
                                <a
                                    href={`tel:${c.phone}`}
                                    className="text-accent-warm text-sm hover:underline self-center whitespace-nowrap"
                                >
                                    📞 {c.phone}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
