"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface ReviewRow {
    id: string;
    rating: number;
    public_text: string | null;
    internal_feedback: string | null;
    is_public: boolean;
    priority_sort: number;
    author_name: string | null;
    source: string;
    created_at: string;
    appointment_id: string | null;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="inline-flex items-center gap-0.5" aria-label={`${rating} su 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 ${i <= rating ? "text-accent-warm" : "text-line"}`}
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
            ))}
        </div>
    );
}

export default function AdminMarketingPage() {
    const [rows, setRows] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"all" | "public" | "hidden">("all");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .order("priority_sort", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            setRows((data ?? []) as ReviewRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const update = async (id: string, patch: Partial<ReviewRow>) => {
        setSavingId(id);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("reviews").update(patch).eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSavingId(null);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm("Eliminare definitivamente questa recensione?")) return;
        try {
            const supabase = createClient();
            const { error } = await supabase.from("reviews").delete().eq("id", id);
            if (error) throw error;
            setRows((rs) => rs.filter((r) => r.id !== id));
            addToast("Recensione rimossa", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    const filtered = useMemo(() => {
        if (tab === "public") return rows.filter((r) => r.is_public);
        if (tab === "hidden") return rows.filter((r) => !r.is_public);
        return rows;
    }, [rows, tab]);

    const stats = useMemo(() => {
        if (rows.length === 0) return { total: 0, public: 0, avg: 0 };
        const publicCount = rows.filter((r) => r.is_public).length;
        const avg = rows.reduce((sum, r) => sum + r.rating, 0) / rows.length;
        return { total: rows.length, public: publicCount, avg: Math.round(avg * 10) / 10 };
    }, [rows]);

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Reputazione</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Recensioni.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Modera quali recensioni appaiono sul sito pubblico. Il bottone "Pin" porta una
                    recensione in cima all'elenco. Puoi anche importare recensioni esterne
                    (Google, social) inserendo l'autore manualmente.
                </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-3 md:gap-5">
                {[
                    { label: "Totali", value: stats.total },
                    { label: "Pubbliche", value: stats.public },
                    { label: "Media", value: stats.total ? `${stats.avg.toFixed(1)}★` : "—" },
                ].map((s) => (
                    <div key={s.label} className="p-4 bg-carbon border border-line rounded-[var(--radius-md)]">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            {s.label}
                        </span>
                        <p className="mt-1 text-display text-2xl text-warm-white tabular-nums">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-1.5 bg-carbon border border-line rounded-full p-1">
                    {[
                        { key: "all" as const, label: "Tutte" },
                        { key: "public" as const, label: "Pubbliche" },
                        { key: "hidden" as const, label: "Nascoste" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full transition-colors ${
                                tab === t.key ? "bg-warm-white text-black" : "text-silver hover:text-warm-white"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setComposerOpen((v) => !v)}
                    className="px-4 py-2 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors"
                >
                    {composerOpen ? "Annulla" : "+ Importa recensione"}
                </button>
            </div>

            {composerOpen && (
                <Composer
                    onCreated={async () => {
                        setComposerOpen(false);
                        await load();
                    }}
                />
            )}

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessuna recensione in questa vista.
                </p>
            ) : (
                <ul className="space-y-3">
                    {filtered.map((r) => {
                        const saving = savingId === r.id;
                        const isPinned = r.priority_sort > 0;
                        return (
                            <li
                                key={r.id}
                                className={`bg-carbon border rounded-[var(--radius-md)] p-5 transition-opacity ${
                                    !r.is_public ? "opacity-60 border-line" : "border-line"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Stars rating={r.rating} />
                                            <span className="text-warm-white text-sm font-body font-semibold">
                                                {r.author_name ?? "Anonimo"}
                                            </span>
                                            <span className="text-[9px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold border border-line px-2 py-0.5 rounded-full">
                                                {r.source}
                                            </span>
                                            <span className="text-xs text-silver-dark">{formatDate(r.created_at)}</span>
                                            {isPinned && (
                                                <span className="text-[9px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold border border-accent-warm/40 px-2 py-0.5 rounded-full bg-accent-warm/10">
                                                    In primo piano
                                                </span>
                                            )}
                                        </div>
                                        {r.public_text && (
                                            <p className="text-warm-white text-sm leading-relaxed">
                                                {r.public_text}
                                            </p>
                                        )}
                                        {r.internal_feedback && (
                                            <p className="text-silver-dark text-xs leading-relaxed border-l-2 border-line pl-3">
                                                <span className="uppercase tracking-wider font-semibold">Note interne · </span>
                                                {r.internal_feedback}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => update(r.id, { is_public: !r.is_public })}
                                            disabled={saving}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full border transition-colors disabled:opacity-50 ${
                                                r.is_public
                                                    ? "bg-accent-warm/15 text-accent-warm border-accent-warm/40"
                                                    : "border-line text-silver hover:text-warm-white"
                                            }`}
                                        >
                                            {r.is_public ? "Visibile" : "Nascondi"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                update(r.id, { priority_sort: isPinned ? 0 : 100 })
                                            }
                                            disabled={saving || !r.is_public}
                                            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] font-body font-semibold rounded-full border transition-colors disabled:opacity-30 ${
                                                isPinned
                                                    ? "border-accent-warm text-accent-warm"
                                                    : "border-line text-silver hover:text-warm-white"
                                            }`}
                                        >
                                            {isPinned ? "Unpin" : "Pin"}
                                        </button>
                                        <button
                                            onClick={() => remove(r.id)}
                                            disabled={saving}
                                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-error border border-error/40 rounded-full hover:bg-error/10 transition-colors disabled:opacity-50"
                                        >
                                            Elimina
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function Composer({ onCreated }: { onCreated: () => void }) {
    const [author, setAuthor] = useState("");
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [source, setSource] = useState("google");
    const [submitting, setSubmitting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        if (!text.trim() || !author.trim()) {
            addToast("Autore e testo sono richiesti", "error");
            return;
        }
        setSubmitting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("reviews").insert({
                rating,
                public_text: text.trim(),
                author_name: author.trim(),
                source,
                is_public: true,
                priority_sort: 0,
            });
            if (error) throw error;
            addToast("Recensione importata", "success");
            onCreated();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 space-y-4"
        >
            <h3 className="text-display text-lg text-warm-white tracking-tight">
                Importa recensione esterna
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Autore
                    </span>
                    <input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Es. Marco P."
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    />
                </label>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Voto
                    </span>
                    <select
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value, 10))}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    >
                        {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                                {n} stelle
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                        Fonte
                    </span>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                    >
                        <option value="google">Google</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="tripadvisor">TripAdvisor</option>
                        <option value="internal">Interno</option>
                    </select>
                </label>
            </div>
            <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    Testo
                </span>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Testo della recensione…"
                    className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm leading-relaxed resize-none"
                />
            </label>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                >
                    {submitting ? "Importazione…" : "Importa"}
                </button>
            </div>
        </form>
    );
}
