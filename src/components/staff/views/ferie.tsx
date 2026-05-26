"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface RequestRow {
    id: string;
    starts_at: string;
    ends_at: string;
    reason: string | null;
    status: "pending" | "approved" | "rejected" | "cancelled";
    created_at: string;
    decided_at: string | null;
    decision_note: string | null;
}

const STATUS_LABELS: Record<RequestRow["status"], string> = {
    pending: "In attesa",
    approved: "Approvata",
    rejected: "Rifiutata",
    cancelled: "Annullata",
};

const STATUS_COLORS: Record<RequestRow["status"], string> = {
    pending: "text-amber-300 border-amber-400/40",
    approved: "text-green-300 border-green-400/40",
    rejected: "text-red-300 border-red-400/40",
    cancelled: "text-silver border-line",
};

export default function StaffFeriePage() {
    const [rows, setRows] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("staff_time_off_requests")
                .select("id, starts_at, ends_at, reason, status, created_at, decided_at, decision_note")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setRows((data ?? []) as RequestRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const cancel = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("staff_time_off_requests")
                .update({ status: "cancelled" })
                .eq("id", id);
            if (error) throw error;
            addToast("Richiesta annullata", "success");
            load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Tempo libero</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Ferie & permessi.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Le tue richieste. Quando vengono approvate il tuo calendario blocca gli slot
                    automaticamente.
                </p>
            </motion.div>

            <button
                onClick={() => setShowModal(true)}
                className="px-5 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold"
            >
                + Nuova richiesta
            </button>

            {loading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 bg-carbon border border-line rounded-md animate-pulse" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="text-center text-silver-dark py-12 bg-carbon border border-line border-dashed rounded-md">
                    Nessuna richiesta. Premi "+ Nuova richiesta" per chiedere ferie o un permesso.
                </div>
            ) : (
                <ul className="space-y-2">
                    {rows.map((r) => (
                        <li
                            key={r.id}
                            className={`p-4 bg-carbon border rounded-md ${STATUS_COLORS[r.status]}`}
                        >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <div className="text-warm-white font-body font-semibold">
                                        {new Date(r.starts_at).toLocaleDateString("it-IT", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}{" "}
                                        →{" "}
                                        {new Date(r.ends_at).toLocaleDateString("it-IT", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </div>
                                    {r.reason && <p className="text-xs text-warm-white-muted mt-1">{r.reason}</p>}
                                    {r.decision_note && (
                                        <p className="text-xs italic mt-1 text-silver-dark">
                                            Nota titolare: {r.decision_note}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={`text-[10px] uppercase tracking-[0.25em] font-body font-semibold ${STATUS_COLORS[r.status]}`}
                                    >
                                        {STATUS_LABELS[r.status]}
                                    </span>
                                    {r.status === "pending" && (
                                        <button
                                            onClick={() => cancel(r.id)}
                                            className="text-[10px] uppercase tracking-[0.25em] text-silver hover:text-warm-white"
                                        >
                                            Annulla
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <AnimatePresence>
                {showModal && (
                    <NewRequestModal onClose={() => setShowModal(false)} onCreated={load} />
                )}
            </AnimatePresence>
        </div>
    );
}

function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const today = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const submit = async () => {
        if (busy) return;
        if (!from || !to) return;
        if (new Date(to) < new Date(from)) {
            addToast("La data fine deve essere dopo quella di inizio", "error");
            return;
        }
        setBusy(true);
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            const { data: staff } = await supabase
                .from("staff")
                .select("id")
                .eq("user_id", user.user?.id)
                .maybeSingle();
            if (!staff) throw new Error("Profilo staff non trovato");
            const { error } = await supabase.from("staff_time_off_requests").insert({
                staff_id: (staff as any).id,
                starts_at: `${from}T00:00:00`,
                ends_at: `${to}T23:59:59`,
                reason: reason.trim() || null,
            });
            if (error) throw error;
            addToast("Richiesta inviata", "success");
            onCreated();
            onClose();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-carbon border border-line rounded-[var(--radius-md)] p-6 max-w-md w-full space-y-4"
            >
                <h3 className="text-display text-xl text-warm-white">Nuova richiesta</h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">Da</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">A</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        />
                    </label>
                </div>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">Motivo (opzionale)</span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Es. matrimonio, vacanza, motivi personali"
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm placeholder:text-silver-dark"
                    />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="px-4 py-2 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.25em]"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={submit}
                        disabled={busy}
                        className="px-5 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50"
                    >
                        {busy ? "Invio…" : "Invia richiesta"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
