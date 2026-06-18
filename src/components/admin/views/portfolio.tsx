"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { persistSortOrder } from "@/lib/sortOrder";
import { portfolioImageUrl } from "@/lib/supabase/queries";

interface PortfolioRow {
    id: string;
    storage_path: string;
    title: string;
    tag: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
}

const NEW_TAG = "__new__";

export default function AdminPortfolioPage() {
    const [rows, setRows] = useState<PortfolioRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("portfolio_images")
                .select("id,storage_path,title,tag,is_active,is_featured,sort_order,created_at")
                .order("sort_order")
                .order("created_at");
            if (error) throw error;
            setRows((data ?? []) as PortfolioRow[]);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    // Tipologie (tag) uniche, ordinate alfabeticamente.
    const tags = useMemo(
        () => Array.from(new Set(rows.map((r) => r.tag))).sort((a, b) => a.localeCompare(b, "it")),
        [rows]
    );

    // Raggruppa per tipologia: sezioni alfabetiche, foto per sort_order.
    const groups = useMemo(() => {
        const byTag = new Map<string, PortfolioRow[]>();
        for (const t of tags) byTag.set(t, []);
        for (const r of rows) byTag.get(r.tag)?.push(r);
        for (const t of tags)
            byTag
                .get(t)!
                .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
        return tags.map((tag) => ({ tag, items: byTag.get(tag)! }));
    }, [rows, tags]);

    const updateField = async (id: string, patch: Partial<PortfolioRow>) => {
        setSavingId(id);
        const supabase = createClient();
        const { error } = await supabase.from("portfolio_images").update(patch).eq("id", id);
        setSavingId(null);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return false;
        }
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        return true;
    };

    // Rinomina un'intera tipologia → aggiorna TUTTE le foto di quel tag.
    const renameTag = async (oldTag: string, raw: string) => {
        const newTag = raw.trim();
        if (!newTag || newTag === oldTag) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("portfolio_images")
            .update({ tag: newTag })
            .eq("tag", oldTag);
        if (error) {
            addToast(`Errore: ${error.message}`, "error");
            return;
        }
        setRows((prev) => prev.map((r) => (r.tag === oldTag ? { ...r, tag: newTag } : r)));
        addToast(`Tipologia rinominata in "${newTag}"`, "success");
    };

    // Una sola foto "in evidenza" alla volta.
    const setFeatured = async (id: string) => {
        const row = rows.find((r) => r.id === id);
        if (!row) return;
        const makeFeatured = !row.is_featured;
        setSavingId(id);
        const supabase = createClient();
        const toUnset = makeFeatured ? rows.filter((r) => r.is_featured && r.id !== id).map((r) => r.id) : [];
        const results = await Promise.all([
            ...toUnset.map((tid) =>
                supabase.from("portfolio_images").update({ is_featured: false }).eq("id", tid)
            ),
            supabase.from("portfolio_images").update({ is_featured: makeFeatured }).eq("id", id),
        ]);
        setSavingId(null);
        if (results.some((r) => r.error)) {
            addToast("Errore nel salvataggio", "error");
            return;
        }
        setRows((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, is_featured: makeFeatured } : makeFeatured ? { ...r, is_featured: false } : r
            )
        );
    };

    // Riordino dentro una tipologia (rinumera sort_order globale a gruppi).
    const move = async (id: string, dir: -1 | 1) => {
        const grp = groups.find((g) => g.items.some((i) => i.id === id));
        if (!grp) return;
        const items = [...grp.items];
        const i = items.findIndex((x) => x.id === id);
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j]!, items[i]!];
        const flat = groups.flatMap((g) => (g.tag === grp.tag ? items : g.items));
        const ids = flat.map((x) => x.id);
        setRows((prev) => prev.map((r) => ({ ...r, sort_order: ids.indexOf(r.id) * 10 })));
        try {
            await persistSortOrder("portfolio_images", ids);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
            load();
        }
    };

    const onPickTag = (id: string, value: string) => {
        if (value === NEW_TAG) {
            const name = window.prompt("Nome della nuova tipologia di taglio:");
            if (name && name.trim()) updateField(id, { tag: name.trim() });
            return;
        }
        updateField(id, { tag: value });
    };

    const total = rows.length;
    const visible = rows.filter((r) => r.is_active).length;

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Lavori</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Portfolio.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Le foto dei tagli mostrate su <span className="text-warm-white">/lavori</span>, divise per
                    tipologia. Tocca il <span className="text-warm-white">nome</span> per rinominare la foto, scegli la{" "}
                    <span className="text-warm-white">tipologia</span> dal menu, usa{" "}
                    <span className="text-warm-white">Mostra/Nascondi</span> per togliere una foto dal sito senza
                    eliminarla. Tocca il titolo di una sezione per rinominare l'intera tipologia.
                </p>
                <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                    {visible} visibili · {total} totali · {tags.length} tipologie
                </div>
            </motion.div>

            {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="aspect-square bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && total === 0 && (
                <div className="text-center text-silver-dark py-16 border border-line rounded-[var(--radius-md)]">
                    Nessuna foto nel portfolio.
                </div>
            )}

            {!loading &&
                groups.map((g) => (
                    <section key={g.tag} className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-line pb-2">
                            <TagTitle value={g.tag} onSave={(v) => renameTag(g.tag, v)} />
                            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                {g.items.length} foto
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {g.items.map((p, idx) => {
                                const saving = savingId === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        className={`group rounded-[var(--radius-md)] border border-line bg-carbon overflow-hidden transition-opacity ${
                                            !p.is_active ? "opacity-50" : ""
                                        }`}
                                    >
                                        <div className="relative aspect-square bg-black-2">
                                            <img
                                                src={portfolioImageUrl(p.storage_path, {
                                                    width: 400,
                                                    height: 400,
                                                    resize: "cover",
                                                    quality: 72,
                                                    format: "webp",
                                                })}
                                                alt={p.title}
                                                loading="lazy"
                                                decoding="async"
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                            {/* In evidenza */}
                                            <button
                                                onClick={() => setFeatured(p.id)}
                                                disabled={saving}
                                                aria-label={p.is_featured ? "Togli da in evidenza" : "Metti in evidenza"}
                                                title="In evidenza (una sola foto)"
                                                className={`absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md transition-colors disabled:opacity-50 ${
                                                    p.is_featured
                                                        ? "bg-accent-warm text-black"
                                                        : "bg-black/55 text-warm-white hover:bg-black/75"
                                                }`}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill={p.is_featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5l2.06 4.18 4.61.67-3.34 3.25.79 4.6-4.12-2.17-4.12 2.17.79-4.6L4.81 8.35l4.61-.67z" />
                                                </svg>
                                            </button>
                                            {!p.is_active && (
                                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] uppercase tracking-[0.25em] text-silver font-body font-semibold">
                                                    Nascosta
                                                </span>
                                            )}
                                            {/* Riordino */}
                                            <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => move(p.id, -1)}
                                                    disabled={idx === 0 || saving}
                                                    aria-label="Sposta indietro"
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/55 text-warm-white hover:bg-black/75 disabled:opacity-25"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => move(p.id, 1)}
                                                    disabled={idx === g.items.length - 1 || saving}
                                                    aria-label="Sposta avanti"
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/55 text-warm-white hover:bg-black/75 disabled:opacity-25"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-2">
                                            <TitleCell
                                                value={p.title}
                                                disabled={saving}
                                                onSave={(v) => updateField(p.id, { title: v })}
                                            />

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={p.tag}
                                                    disabled={saving}
                                                    onChange={(e) => onPickTag(p.id, e.target.value)}
                                                    className="flex-1 min-w-0 bg-black-2 border border-line rounded-md px-2 py-1.5 text-xs text-warm-white focus:border-accent-warm focus:outline-none"
                                                >
                                                    {tags.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                    {!tags.includes(p.tag) && <option value={p.tag}>{p.tag}</option>}
                                                    <option value={NEW_TAG}>➕ Nuova tipologia…</option>
                                                </select>

                                                <button
                                                    role="switch"
                                                    aria-checked={p.is_active}
                                                    aria-label={p.is_active ? "Nascondi dal sito" : "Mostra sul sito"}
                                                    title={p.is_active ? "Visibile sul sito" : "Nascosta"}
                                                    onClick={() => updateField(p.id, { is_active: !p.is_active })}
                                                    disabled={saving}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                                                        p.is_active ? "bg-accent-warm" : "bg-line"
                                                    } disabled:opacity-50`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
                                                            p.is_active ? "translate-x-5" : "translate-x-0.5"
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
        </div>
    );
}

// ─── Celle editabili ───────────────────────────────────────────────

function TitleCell({
    value,
    onSave,
    disabled,
}: {
    value: string;
    onSave: (v: string) => Promise<boolean> | boolean;
    disabled?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => !disabled && setEditing(true)}
                className="block w-full text-left font-body text-sm text-warm-white truncate hover:text-accent-warm transition-colors"
                title={value}
            >
                {value || <span className="italic text-silver-dark">+ nome</span>}
            </button>
        );
    }

    const commit = () => {
        const v = draft.trim();
        if (v) onSave(v);
        else setDraft(value);
        setEditing(false);
    };

    return (
        <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(value);
                    setEditing(false);
                }
            }}
            className="w-full bg-black-2 border border-line rounded-md px-2 py-1 text-sm text-warm-white focus:border-accent-warm focus:outline-none"
        />
    );
}

function TagTitle({
    value,
    onSave,
}: {
    value: string;
    onSave: (v: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    if (!editing) {
        return (
            <button
                onClick={() => setEditing(true)}
                className="text-display text-xl md:text-2xl text-warm-white tracking-tight hover:text-accent-warm transition-colors"
                title="Rinomina questa tipologia"
            >
                {value}
            </button>
        );
    }

    const commit = () => {
        onSave(draft);
        setEditing(false);
    };

    return (
        <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                    setDraft(value);
                    setEditing(false);
                }
            }}
            className="bg-black-2 border border-line rounded-md px-3 py-1.5 text-lg text-warm-white focus:border-accent-warm focus:outline-none"
        />
    );
}
