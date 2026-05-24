"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Sentiment = "happy" | "neutral" | "sad";

const OPTIONS: { value: Sentiment; emoji: string; label: string }[] = [
    { value: "happy", emoji: "😊", label: "Bene" },
    { value: "neutral", emoji: "😐", label: "Così così" },
    { value: "sad", emoji: "😞", label: "Male" },
];

export function SurveyResponder() {
    const [token, setToken] = useState<string>("");
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        setToken(params.get("token") ?? "");
    }, []);
    const [sentiment, setSentiment] = useState<Sentiment | null>(null);
    const [freeText, setFreeText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (s: Sentiment) => {
        setSubmitting(true);
        setError(null);
        const supabase = createClient();
        const { error: err } = await supabase
            .from("customer_surveys")
            .update({
                sentiment: s,
                responded_at: new Date().toISOString(),
                free_text: freeText.trim() || null,
            })
            .eq("token", token);
        setSubmitting(false);
        if (err) {
            setError(err.message);
            return;
        }
        setSentiment(s);
        setDone(true);
    };

    if (done) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="text-6xl mb-4">
                    {OPTIONS.find((o) => o.value === sentiment)?.emoji}
                </div>
                <h1 className="text-display text-2xl text-warm-white tracking-tight">
                    Grazie del feedback
                </h1>
                <p className="mt-2 text-silver">
                    {sentiment === "happy"
                        ? "Felice di sentirlo. Ci vediamo al prossimo!"
                        : sentiment === "neutral"
                        ? "Lo prendiamo come spunto per migliorare."
                        : "Mi spiace davvero. Cristian ti scriverà personalmente."}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="text-center max-w-md w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                Resta tra noi
            </p>
            <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-2">
                Com'è andata oggi?
            </h1>
            <p className="mt-2 text-silver text-sm">
                Un click. Non va su Google, mi serve solo per migliorare.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4 md:gap-6">
                {OPTIONS.map((o) => (
                    <button
                        key={o.value}
                        disabled={submitting}
                        onClick={() => submit(o.value)}
                        className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] bg-carbon border border-line hover:border-accent-warm transition-colors active:scale-95 disabled:opacity-50"
                    >
                        <span className="text-5xl" aria-hidden="true">
                            {o.emoji}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-silver font-body font-semibold">
                            {o.label}
                        </span>
                    </button>
                ))}
            </div>

            <details className="mt-8 text-left">
                <summary className="text-[10px] uppercase tracking-[0.3em] text-silver-dark hover:text-warm-white font-body font-semibold cursor-pointer text-center">
                    Aggiungi una nota
                </summary>
                <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    rows={3}
                    maxLength={400}
                    placeholder="Cosa potremmo fare meglio?"
                    className="mt-3 w-full p-3 bg-carbon border border-line rounded-[var(--radius-sm)] text-warm-white text-sm focus:outline-none focus:border-accent-warm resize-none"
                />
            </details>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 text-xs text-error"
                    >
                        Errore: {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
