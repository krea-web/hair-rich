"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Stage = "loading" | "rate" | "google_redirect" | "internal_form" | "thanks" | "error";

interface TokenData {
    found: boolean;
    request_id?: string;
    first_name?: string;
    already_rated?: boolean;
    rating_selected?: number;
    routed_to?: "google" | "internal" | "dismissed";
    google_review_url?: string | null;
    reason?: string;
}

export function ReviewCuscinetto() {
    const [stage, setStage] = useState<Stage>("loading");
    const [data, setData] = useState<TokenData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        const token = extractToken();
        if (!token) {
            setStage("error");
            return;
        }
        const supabase = createClient();
        supabase
            .rpc("fn_review_request_by_token", { p_token: token })
            .then(({ data: row, error }) => {
                if (error || !row?.found) {
                    setStage("error");
                    return;
                }
                setData(row);
                if (row.already_rated) {
                    setStage("thanks");
                } else {
                    setStage("rate");
                }
            });
    }, []);

    const submitRating = async (rating: number) => {
        const token = extractToken();
        if (!token) return;
        setSubmitting(true);
        try {
            const supabase = createClient();
            const { data: res, error } = await supabase.rpc("fn_review_request_submit", {
                p_token: token,
                p_rating: rating,
                p_internal_feedback: null,
            });
            if (error) throw error;

            if (res?.routed_to === "google" && res?.google_review_url) {
                setStage("google_redirect");
                setTimeout(() => {
                    window.location.href = res.google_review_url;
                }, 1600);
            } else {
                setStage("internal_form");
            }
        } catch {
            setStage("error");
        } finally {
            setSubmitting(false);
        }
    };

    const submitInternalFeedback = async () => {
        const token = extractToken();
        if (!token || !feedback.trim()) return;
        setSubmitting(true);
        try {
            const supabase = createClient();
            await supabase.rpc("fn_review_request_submit", {
                p_token: token,
                p_rating: data?.rating_selected ?? 2,
                p_internal_feedback: feedback.trim(),
            });
            setStage("thanks");
        } catch {
            setStage("error");
        } finally {
            setSubmitting(false);
        }
    };

    if (stage === "loading") {
        return (
            <div className="min-h-[70dvh] grid place-items-center px-6">
                <div className="w-12 h-12 border-2 border-accent-warm border-r-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (stage === "error" || !data?.found) {
        return (
            <div className="min-h-[70dvh] grid place-items-center px-6 text-center">
                <div>
                    <h1 className="text-display text-3xl text-warm-white tracking-tight">
                        Link non valido
                    </h1>
                    <p className="mt-3 text-warm-white-muted text-base">
                        Il link che hai aperto è scaduto o errato. Se vuoi lasciarci comunque un
                        feedback, scrivici da contatti.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[70dvh] grid place-items-center px-6 py-14">
            <AnimatePresence mode="wait">
                {stage === "rate" && (
                    <motion.div
                        key="rate"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="max-w-md text-center"
                    >
                        <span className="text-display-alt text-2xl text-accent-warm">Hair Rich Olbia</span>
                        <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                            Com'è andata, {data.first_name}?
                        </h1>
                        <p className="mt-4 text-warm-white-muted text-base">
                            Un tap basta. Se è stata buona, ti chiediamo una recensione su Google.
                            Se no, lo diciamo solo a noi.
                        </p>

                        <div className="mt-10 flex items-center justify-center gap-3">
                            {[
                                { v: 5, emoji: "😍", label: "Top" },
                                { v: 4, emoji: "🙂", label: "Bene" },
                                { v: 3, emoji: "😐", label: "Boh" },
                                { v: 2, emoji: "😕", label: "Male" },
                                { v: 1, emoji: "😞", label: "Pessimo" },
                            ].map((r) => (
                                <button
                                    key={r.v}
                                    disabled={submitting}
                                    onClick={() => submitRating(r.v)}
                                    aria-label={r.label}
                                    className="group flex flex-col items-center gap-1 p-3 rounded-2xl border border-line bg-carbon hover:border-accent-warm hover:bg-accent-warm/10 transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    <span className="text-4xl group-hover:scale-110 transition-transform">
                                        {r.emoji}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-silver-dark">
                                        {r.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {stage === "google_redirect" && (
                    <motion.div
                        key="google_redirect"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-md text-center"
                    >
                        <span className="text-display-alt text-2xl text-accent-warm">Grazie!</span>
                        <h2 className="text-display text-3xl text-warm-white tracking-tight mt-1">
                            Ti porto su Google…
                        </h2>
                        <p className="mt-4 text-warm-white-muted text-sm">
                            Se non si apre,{" "}
                            <a
                                href={data.google_review_url ?? "#"}
                                className="underline text-accent-warm"
                            >
                                tap qui
                            </a>
                            .
                        </p>
                    </motion.div>
                )}

                {stage === "internal_form" && (
                    <motion.div
                        key="internal_form"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="max-w-md w-full text-center"
                    >
                        <span className="text-display-alt text-2xl text-accent-warm">Spiacenti</span>
                        <h2 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-1 leading-[1.05]">
                            Cos'è andato storto?
                        </h2>
                        <p className="mt-3 text-warm-white-muted text-sm">
                            Resta tra noi. Ci aiuti a fare meglio la prossima volta.
                        </p>

                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={5}
                            placeholder="Raccontaci…"
                            className="mt-6 w-full bg-black-2 border border-line rounded-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none resize-none"
                        />

                        <button
                            onClick={submitInternalFeedback}
                            disabled={submitting || !feedback.trim()}
                            className="mt-4 w-full px-6 py-3 bg-accent-warm text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold disabled:opacity-50"
                        >
                            {submitting ? "Invio…" : "Invia"}
                        </button>
                    </motion.div>
                )}

                {stage === "thanks" && (
                    <motion.div
                        key="thanks"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md text-center"
                    >
                        <div className="mx-auto w-20 h-20 rounded-full bg-success/20 border-2 border-success grid place-items-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10 text-success" fill="none" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-display text-3xl text-warm-white tracking-tight">
                            Grazie!
                        </h2>
                        <p className="mt-3 text-warm-white-muted text-base">
                            Il tuo feedback è arrivato. Ti aspettiamo presto in salone.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function extractToken(): string | null {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname.replace(/\/$/, "");
    const idx = path.lastIndexOf("/");
    if (idx < 0) return null;
    const tail = path.slice(idx + 1);
    return tail || null;
}
