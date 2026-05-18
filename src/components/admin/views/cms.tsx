"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface CmsBlock {
    key: string;
    label: string;
    value: string;
    kind: "text" | "markdown" | "json";
    updated_at: string;
}

export default function AdminCmsPage() {
    const [blocks, setBlocks] = useState<CmsBlock[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("cms_blocks")
                .select("*")
                .order("key", { ascending: true });
            if (error) throw error;
            const rows = (data ?? []) as CmsBlock[];
            setBlocks(rows);
            const next: Record<string, string> = {};
            for (const r of rows) next[r.key] = r.value;
            setDrafts(next);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async (block: CmsBlock) => {
        const value = drafts[block.key] ?? "";
        if (block.kind === "json") {
            try {
                JSON.parse(value);
            } catch (e: any) {
                addToast(`JSON non valido: ${e.message}`, "error");
                return;
            }
        }
        setSavingKey(block.key);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("cms_blocks")
                .update({ value })
                .eq("key", block.key);
            if (error) throw error;
            setBlocks((bs) =>
                bs.map((b) => (b.key === block.key ? { ...b, value, updated_at: new Date().toISOString() } : b))
            );
            addToast("Blocco salvato", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSavingKey(null);
        }
    };

    const isDirty = (b: CmsBlock) => (drafts[b.key] ?? "") !== b.value;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Copy</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Testi del sito.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Manifesto, tagline, FAQ. Le modifiche entrano in linea al prossimo deploy del
                    sito pubblico (build statico).
                </p>
            </motion.div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-32 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                        />
                    ))}
                </div>
            ) : blocks.length === 0 ? (
                <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                    Nessun blocco CMS configurato.
                </p>
            ) : (
                <ul className="space-y-4">
                    {blocks.map((b) => {
                        const draft = drafts[b.key] ?? "";
                        const dirty = isDirty(b);
                        const isLong = b.kind !== "text" || draft.length > 80;
                        return (
                            <li
                                key={b.key}
                                className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-warm-white font-body font-semibold">{b.label}</h3>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body mt-1">
                                            <code>{b.key}</code> · {b.kind}
                                        </p>
                                    </div>
                                    {dirty && (
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                            · modificato
                                        </span>
                                    )}
                                </div>

                                {isLong ? (
                                    <textarea
                                        value={draft}
                                        onChange={(e) =>
                                            setDrafts((d) => ({ ...d, [b.key]: e.target.value }))
                                        }
                                        rows={b.kind === "json" ? 8 : 4}
                                        className={`w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm leading-relaxed resize-none ${
                                            b.kind === "json" ? "font-mono" : ""
                                        }`}
                                    />
                                ) : (
                                    <input
                                        value={draft}
                                        onChange={(e) =>
                                            setDrafts((d) => ({ ...d, [b.key]: e.target.value }))
                                        }
                                        className="w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                                    />
                                )}

                                <div className="flex justify-end gap-2">
                                    {dirty && (
                                        <button
                                            onClick={() =>
                                                setDrafts((d) => ({ ...d, [b.key]: b.value }))
                                            }
                                            disabled={savingKey === b.key}
                                            className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-silver border border-line rounded-full hover:bg-carbon-2 transition-colors"
                                        >
                                            Annulla
                                        </button>
                                    )}
                                    <button
                                        onClick={() => save(b)}
                                        disabled={!dirty || savingKey === b.key}
                                        className="px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] bg-accent-warm text-black font-body font-semibold rounded-full hover:bg-accent-warm/90 transition-colors disabled:opacity-40"
                                    >
                                        {savingKey === b.key ? "Salvataggio…" : "Salva"}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
