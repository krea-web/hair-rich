"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface Draft {
    id: string;
    source_image_url: string;
    source_kind: string;
    tone: string;
    variants: string[];
    hashtags: string[];
    best_time_to_post: string | null;
    notes_for_owner: string | null;
    selected_variant_idx: number | null;
    posted_at: string | null;
    created_at: string;
    cost_usd_micros: number | null;
}

const KINDS: { value: Draft["source_kind"]; label: string }[] = [
    { value: "instagram_caption", label: "Instagram" },
    { value: "facebook_post", label: "Facebook" },
    { value: "tiktok_caption", label: "TikTok" },
    { value: "whatsapp_status", label: "WhatsApp" },
    { value: "google_post", label: "Google Posts" },
    { value: "generic", label: "Generico" },
];

const TONES = ["casual", "professionale", "ironico", "elegante", "energico"];

export default function AdminContenutiAiPage() {
    const [history, setHistory] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [storagePath, setStoragePath] = useState<string | null>(null);
    const [kind, setKind] = useState<Draft["source_kind"]>("instagram_caption");
    const [tone, setTone] = useState("casual");
    const [latest, setLatest] = useState<Draft | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const loadHistory = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("ai_content_drafts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(30);
        setHistory((data ?? []) as Draft[]);
        setLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const supabase = createClient();
            const path = `ai-content/${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
            const { error } = await supabase.storage
                .from("client-references")
                .upload(path, file, { cacheControl: "3600", upsert: false });
            if (error) throw error;
            const { data } = supabase.storage.from("client-references").getPublicUrl(path);
            setImageUrl(data.publicUrl);
            setStoragePath(path);
        } catch (e: any) {
            addToast(`Upload errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setUploading(false);
        }
    };

    const generate = async () => {
        if (!imageUrl) {
            addToast("Carica una foto prima", "error");
            return;
        }
        setGenerating(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.functions.invoke("ai-content-generator", {
                body: {
                    image_url: imageUrl,
                    source_image_storage_path: storagePath,
                    source_kind: kind,
                    tone,
                    language: "it",
                },
            });
            if (error) throw error;
            if (!data?.ok) throw new Error(data?.error ?? "generazione fallita");

            const draft: Draft = {
                id: data.draft_id,
                source_image_url: imageUrl,
                source_kind: kind,
                tone,
                variants: data.variants ?? [],
                hashtags: data.hashtags ?? [],
                best_time_to_post: data.best_time_to_post,
                notes_for_owner: data.notes_for_owner,
                selected_variant_idx: null,
                posted_at: null,
                created_at: new Date().toISOString(),
                cost_usd_micros: Math.round((data.cost_usd ?? 0) * 1000000),
            };
            setLatest(draft);
            await loadHistory();
            addToast("Bozze generate", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setGenerating(false);
        }
    };

    const copy = (text: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {});
            addToast("Copiato", "info");
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">AI Studio</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Generatore contenuti.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Carica una foto del lavoro, scegli destinazione e tono. L'AI genera 3 caption,
                    hashtag e orario consigliato.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-[1fr_2fr] gap-6">
                <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 space-y-4">
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Foto del lavoro
                        </span>
                        {!imageUrl ? (
                            <label className="mt-2 flex items-center justify-center w-full aspect-square bg-black-2 border-2 border-dashed border-line rounded-[var(--radius-md)] cursor-pointer hover:border-accent-warm transition-colors">
                                <span className="text-silver text-sm">
                                    {uploading ? "Caricamento…" : "Tap per caricare"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleUpload(f);
                                    }}
                                />
                            </label>
                        ) : (
                            <div className="mt-2 relative">
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="w-full aspect-square object-cover rounded-[var(--radius-md)]"
                                />
                                <button
                                    onClick={() => {
                                        setImageUrl(null);
                                        setStoragePath(null);
                                    }}
                                    className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-warm-white text-[10px] uppercase tracking-[0.2em] rounded-full"
                                >
                                    Cambia
                                </button>
                            </div>
                        )}
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Destinazione
                        </span>
                        <select
                            value={kind}
                            onChange={(e) => setKind(e.target.value as Draft["source_kind"])}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white"
                        >
                            {KINDS.map((k) => (
                                <option key={k.value} value={k.value}>
                                    {k.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Tono
                        </span>
                        <select
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white capitalize"
                        >
                            {TONES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        onClick={generate}
                        disabled={generating || !imageUrl}
                        className="w-full px-5 py-3 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50 hover:bg-accent-warm/90"
                    >
                        {generating ? "Generazione…" : "Genera contenuti"}
                    </button>
                </div>

                <div className="space-y-4">
                    {latest ? (
                        <div className="bg-carbon border border-accent-warm/30 rounded-[var(--radius-md)] p-5 space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-display-alt text-xl text-accent-warm">
                                    Bozze
                                </span>
                                {latest.best_time_to_post && (
                                    <span className="text-silver-dark text-xs">
                                        Best time: {latest.best_time_to_post}
                                    </span>
                                )}
                            </div>
                            {latest.variants.map((v, i) => (
                                <div
                                    key={i}
                                    className="bg-black-2 border border-line rounded-md p-4"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-silver">
                                            Variante {i + 1}
                                        </span>
                                        <button
                                            onClick={() => copy(v)}
                                            className="text-[10px] uppercase tracking-[0.2em] text-accent-warm"
                                        >
                                            Copia
                                        </button>
                                    </div>
                                    <p className="text-warm-white text-sm whitespace-pre-wrap">{v}</p>
                                </div>
                            ))}
                            {latest.hashtags.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-silver">
                                            Hashtag
                                        </span>
                                        <button
                                            onClick={() => copy(latest.hashtags.join(" "))}
                                            className="text-[10px] uppercase tracking-[0.2em] text-accent-warm"
                                        >
                                            Copia tutti
                                        </button>
                                    </div>
                                    <p className="text-warm-white-muted text-sm">
                                        {latest.hashtags.join(" ")}
                                    </p>
                                </div>
                            )}
                            {latest.notes_for_owner && (
                                <p className="text-xs text-silver-dark italic">
                                    💡 {latest.notes_for_owner}
                                </p>
                            )}
                            {latest.cost_usd_micros !== null && (
                                <p className="text-[10px] text-silver-dark">
                                    Costo: ${((latest.cost_usd_micros ?? 0) / 1000000).toFixed(4)}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                            Carica una foto e tap Genera per vedere le bozze qui.
                        </p>
                    )}
                </div>
            </div>

            {!loading && history.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-display text-2xl text-warm-white tracking-tight">Storico bozze</h2>
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {history.map((h) => (
                            <li key={h.id} className="bg-carbon border border-line rounded-md overflow-hidden">
                                <img src={h.source_image_url} alt="" className="w-full aspect-square object-cover" />
                                <div className="p-3 space-y-1">
                                    <p className="text-warm-white text-xs truncate">{h.variants[0]}</p>
                                    <p className="text-silver-dark text-[10px] uppercase tracking-[0.2em]">
                                        {h.source_kind.replace(/_/g, " ")}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
