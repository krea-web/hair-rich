"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface ReviewRow {
    id: string;
    rating_selected: number | null;
    rating_selected_at: string | null;
    routed_to: string | null;
    routed_to_google_at: string | null;
    confirmed_left_review_at: string | null;
    internal_feedback: string | null;
    sent_at: string;
}

interface SurveyRow {
    id: string;
    sentiment: string | null;
    free_text: string | null;
    responded_at: string | null;
}

const SENTIMENT: Record<string, { emoji: string; label: string }> = {
    happy: { emoji: "😊", label: "Contento" },
    neutral: { emoji: "😐", label: "Così così" },
    sad: { emoji: "😞", label: "Insoddisfatto" },
};

function fmtDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

function Stars({ n }: { n: number }) {
    return (
        <span className="text-accent-warm tracking-wider" aria-label={`${n} su 5`}>
            {"★".repeat(n)}
            <span className="text-line">{"★".repeat(Math.max(0, 5 - n))}</span>
        </span>
    );
}

export default function ProfiloRecensioniPage() {
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [surveys, setSurveys] = useState<SurveyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) {
                setLoading(false);
                return;
            }
            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", user.user.id)
                .maybeSingle();
            if (!customer) {
                setLoading(false);
                return;
            }

            const [{ data: rr }, { data: sv }] = await Promise.all([
                supabase
                    .from("review_requests")
                    .select(
                        "id, rating_selected, rating_selected_at, routed_to, routed_to_google_at, confirmed_left_review_at, internal_feedback, sent_at",
                    )
                    .eq("customer_id", customer.id)
                    .not("rating_selected", "is", null)
                    .order("rating_selected_at", { ascending: false }),
                supabase
                    .from("customer_surveys")
                    .select("id, sentiment, free_text, responded_at")
                    .eq("customer_id", customer.id)
                    .not("responded_at", "is", null)
                    .order("responded_at", { ascending: false }),
            ]);
            setReviews((rr as ReviewRow[]) ?? []);
            setSurveys((sv as SurveyRow[]) ?? []);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const isEmpty = !loading && reviews.length === 0 && surveys.length === 0;

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Feedback</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Le tue recensioni.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-md">
                    Le valutazioni e i feedback che hai lasciato dopo i tuoi appuntamenti.
                </p>
            </motion.div>

            {loading ? (
                <div className="mt-10 space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            ) : isEmpty ? (
                <div className="mt-10 p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center">
                    <div className="text-4xl mb-3">⭐</div>
                    <p className="text-warm-white text-lg font-body font-semibold">Ancora nessuna recensione.</p>
                    <p className="mt-2 text-warm-white-muted text-sm max-w-md mx-auto">
                        Dopo i tuoi prossimi appuntamenti potrai lasciare una valutazione: la troverai qui.
                    </p>
                </div>
            ) : (
                <div className="mt-10 space-y-10">
                    {reviews.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold mb-4">
                                Recensioni
                            </h2>
                            <ul className="space-y-3">
                                {reviews.map((r) => {
                                    const onGoogle = r.routed_to === "google";
                                    const confirmed = Boolean(r.confirmed_left_review_at);
                                    return (
                                        <li key={r.id} className="bg-carbon border border-line rounded-[var(--radius-md)] p-5">
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                {typeof r.rating_selected === "number" && <Stars n={r.rating_selected} />}
                                                <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                    {fmtDate(r.rating_selected_at ?? r.sent_at)}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                {onGoogle ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-[0.2em] uppercase bg-success/15 text-success border border-success/25">
                                                        {confirmed ? "Pubblicata su Google" : "Indirizzata a Google"}
                                                    </span>
                                                ) : r.routed_to === "internal" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-[0.2em] uppercase bg-carbon-2 text-silver border border-line">
                                                        Feedback privato al salone
                                                    </span>
                                                ) : null}
                                            </div>
                                            {r.routed_to === "internal" && r.internal_feedback && (
                                                <p className="mt-3 text-warm-white-muted text-sm leading-relaxed italic">
                                                    «{r.internal_feedback}»
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    {surveys.length > 0 && (
                        <section>
                            <h2 className="text-[10px] uppercase tracking-[0.35em] text-silver-dark font-body font-semibold mb-4">
                                Sondaggi post-visita
                            </h2>
                            <ul className="space-y-3">
                                {surveys.map((s) => {
                                    const sent = s.sentiment ? SENTIMENT[s.sentiment] : null;
                                    return (
                                        <li key={s.id} className="bg-carbon border border-line rounded-[var(--radius-md)] p-5">
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <span className="text-warm-white font-body font-semibold">
                                                    <span className="text-xl mr-2" aria-hidden="true">
                                                        {sent?.emoji ?? "•"}
                                                    </span>
                                                    {sent?.label ?? "Risposta"}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-[0.25em] text-silver-dark font-body font-semibold">
                                                    {fmtDate(s.responded_at)}
                                                </span>
                                            </div>
                                            {s.free_text && (
                                                <p className="mt-3 text-warm-white-muted text-sm leading-relaxed italic">
                                                    «{s.free_text}»
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
