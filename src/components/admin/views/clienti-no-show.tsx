"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface NoShowRow {
    id: string;
    customer_id: string;
    start_at: string;
    notes: string | null;
    customers: { first_name: string; last_name: string | null; email: string | null; phone: string | null } | null;
    appointment_services: { services: { name: string | null } | null }[];
}

interface CustomerAgg {
    customer_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    count: number;
    last_at: string;
    history: NoShowRow[];
}

const BADGE = (n: number) => {
    if (n >= 3) return { dot: "🔴", label: "3+ no-show", className: "bg-red-500/15 text-red-300 border-red-500/40" };
    if (n === 2) return { dot: "🟠", label: "2 no-show", className: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
    return { dot: "🟡", label: "1 no-show", className: "bg-yellow-500/15 text-yellow-200 border-yellow-500/40" };
};

export default function AdminClientiNoShowPage() {
    const [rows, setRows] = useState<NoShowRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CustomerAgg | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("appointments")
                .select(`
                    id, customer_id, start_at, notes,
                    customers ( first_name, last_name, email, phone ),
                    appointment_services ( services ( name ) )
                `)
                .eq("status", "no_show")
                .order("start_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            setRows((data ?? []) as unknown as NoShowRow[]);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const aggregated = useMemo<CustomerAgg[]>(() => {
        const map = new Map<string, CustomerAgg>();
        for (const r of rows) {
            if (!r.customers) continue;
            const cur = map.get(r.customer_id);
            const name = `${r.customers.first_name}${r.customers.last_name ? ` ${r.customers.last_name}` : ""}`;
            if (cur) {
                cur.count += 1;
                cur.history.push(r);
                if (r.start_at > cur.last_at) cur.last_at = r.start_at;
            } else {
                map.set(r.customer_id, {
                    customer_id: r.customer_id,
                    name,
                    email: r.customers.email,
                    phone: r.customers.phone,
                    count: 1,
                    last_at: r.start_at,
                    history: [r],
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => b.count - a.count || b.last_at.localeCompare(a.last_at));
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
            <header className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.35em] text-accent-warm font-body font-semibold">
                    Clienti · no-show
                </p>
                <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1">
                    Chi non si è presentato
                </h1>
                <p className="mt-2 text-sm text-silver max-w-3xl">
                    Nessun blocco automatico. Visibile solo qui. Click su un
                    cliente per vedere lo storico e proporgli un messaggio
                    AI editabile prima dell'invio.
                </p>
            </header>

            <div className="rounded-[var(--radius-md)] border border-line overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                    <thead className="bg-black-2">
                        <tr className="text-left text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Contatti</th>
                            <th className="px-4 py-3">Conteggio</th>
                            <th className="px-4 py-3">Ultimo no-show</th>
                            <th className="px-4 py-3">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="bg-carbon">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-silver-dark">
                                    Carico...
                                </td>
                            </tr>
                        ) : aggregated.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-silver-dark">
                                    Nessun no-show registrato.
                                </td>
                            </tr>
                        ) : (
                            aggregated.map((c) => {
                                const badge = BADGE(c.count);
                                return (
                                    <tr key={c.customer_id} className="border-t border-line hover:bg-black-2/60">
                                        <td className="px-4 py-3 text-warm-white font-medium">{c.name}</td>
                                        <td className="px-4 py-3 text-silver text-[12px]">
                                            {c.phone && <div className="font-mono">{c.phone}</div>}
                                            {c.email && <div>{c.email}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-[0.2em] font-body font-semibold ${badge.className}`}
                                            >
                                                {badge.dot} {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-silver font-mono text-[12px]">
                                            {new Date(c.last_at).toLocaleDateString("it-IT", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelected(c)}
                                                className="text-[10px] uppercase tracking-[0.25em] text-accent-warm hover:text-warm-white font-body font-semibold"
                                            >
                                                Apri →
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {selected && (
                    <NoShowDetailModal
                        customer={selected}
                        onClose={() => setSelected(null)}
                        onRefresh={load}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

interface ModalProps {
    customer: CustomerAgg;
    onClose: () => void;
    onRefresh: () => void;
}

function NoShowDetailModal({ customer, onClose, onRefresh }: ModalProps) {
    const [composing, setComposing] = useState(false);
    const [draft, setDraft] = useState("");
    const [draftLoading, setDraftLoading] = useState(false);
    const [channel, setChannel] = useState<"email" | "telegram" | "whatsapp">("email");
    const [sending, setSending] = useState(false);
    const [aiUsed, setAiUsed] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const generateDraft = async () => {
        setDraftLoading(true);
        try {
            const supabase = createClient();
            const apptId = customer.history[0]?.id;
            if (!apptId) return;
            const { data, error } = await supabase.functions.invoke("ai-noshow-draft", {
                body: { appointmentId: apptId, channel },
            });
            if (error) throw error;
            const result = data as { ok: boolean; draft?: string; ai_used?: boolean; error?: string };
            if (!result.ok) throw new Error(result.error ?? "Draft failed");
            setDraft(result.draft ?? "");
            setAiUsed(Boolean(result.ai_used));
            setComposing(true);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore bozza: ${msg}`, "error");
        } finally {
            setDraftLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!draft.trim()) {
            addToast("Messaggio vuoto", "warning");
            return;
        }
        setSending(true);
        try {
            const supabase = createClient();
            const apptId = customer.history[0]?.id;
            if (!apptId) throw new Error("Appointment mancante");

            // Audit row first (idempotent log of what we tried to send).
            const { data: outreach, error: outreachErr } = await supabase
                .from("noshow_outreach")
                .insert({
                    appointment_id: apptId,
                    customer_id: customer.customer_id,
                    channel,
                    message_text: draft,
                    ai_drafted: aiUsed,
                    ai_model: aiUsed ? "gpt-4o-mini" : null,
                })
                .select("id")
                .single();
            if (outreachErr) throw outreachErr;

            // Route the actual message via the Router. Falls back to the
            // raw channel if Router is offline.
            await supabase.functions.invoke("notifications-router", {
                body: {
                    mode: "customer",
                    customerId: customer.customer_id,
                    eventType: "noshow_outreach",
                    payload: {
                        message: draft,
                        sender: "Cristian",
                    },
                    overrideChannels: [channel],
                },
            });

            await supabase
                .from("noshow_outreach")
                .update({ sent_at: new Date().toISOString() })
                .eq("id", outreach.id);

            addToast("Messaggio inviato", "success");
            onClose();
            onRefresh();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-2xl bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-8 max-h-[90dvh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-silver hover:text-warm-white"
                    aria-label="Chiudi"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-display text-2xl text-warm-white tracking-tight">{customer.name}</h2>
                <p className="text-sm text-silver mt-1">
                    {customer.count} no-show — ultimo il{" "}
                    {new Date(customer.last_at).toLocaleDateString("it-IT")}
                </p>

                <h3 className="mt-6 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    Storico
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-silver">
                    {customer.history.map((h) => (
                        <li key={h.id} className="flex gap-2 border-b border-line/40 pb-1">
                            <span className="font-mono text-[12px] text-silver-dark min-w-[88px]">
                                {new Date(h.start_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                            </span>
                            <span>
                                {h.appointment_services?.[0]?.services?.name ?? "—"}
                            </span>
                        </li>
                    ))}
                </ul>

                {!composing ? (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <label className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                            Canale
                        </label>
                        <select
                            value={channel}
                            onChange={(e) => setChannel(e.target.value as typeof channel)}
                            className="px-3 py-1.5 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white text-sm focus:outline-none focus:border-accent-warm"
                        >
                            <option value="email">Email</option>
                            <option value="telegram">Telegram</option>
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                        <button
                            onClick={generateDraft}
                            disabled={draftLoading}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {draftLoading ? "..." : "📧 Genera bozza AI"}
                        </button>
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold flex items-center gap-2">
                            Bozza · {channel}
                            {aiUsed && (
                                <span className="px-1.5 py-0.5 rounded-full bg-accent-warm/20 text-accent-warm text-[9px] font-semibold">
                                    AI
                                </span>
                            )}
                        </div>
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={8}
                            className="w-full p-3 bg-black-2 border border-line rounded-[var(--radius-sm)] text-warm-white font-body text-sm focus:outline-none focus:border-accent-warm resize-none"
                        />
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setComposing(false)}
                                className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                            >
                                Indietro
                            </button>
                            <button
                                onClick={sendMessage}
                                disabled={sending}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {sending ? "..." : "Invia"}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
