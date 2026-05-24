"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

interface Batch {
    id: string;
    name: string;
    description: string | null;
    channel: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    prefix: string;
    codes_count: number;
    printed_at: string | null;
    created_at: string;
}

interface BatchCoupon {
    id: string;
    code: string;
    redeemed_count: number;
    max_redemptions: number;
    valid_until: string | null;
}

const EMPTY = {
    name: "",
    description: "",
    channel: "",
    utm_source: "",
    utm_medium: "qr",
    utm_campaign: "",
    prefix: "VOLA",
    codes_count: 50,
    discount_percent: 10,
    validity_days: 60,
};

const SITE_URL = "https://hairrich.it";

function qrPngDataUrl(text: string, size = 360): string {
    const params = new URLSearchParams({ data: text, size: `${size}x${size}` });
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export default function AdminQrPromoPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
    const [expanded, setExpanded] = useState<string | null>(null);
    const [batchCoupons, setBatchCoupons] = useState<Record<string, BatchCoupon[]>>({});
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("coupon_qr_batches")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) addToast(`Errore: ${error.message}`, "error");
        else setBatches((data ?? []) as Batch[]);
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const loadCoupons = async (batchId: string) => {
        if (batchCoupons[batchId]) return;
        const supabase = createClient();
        const { data } = await supabase
            .from("coupons")
            .select("id, code, redeemed_count, max_redemptions, valid_until")
            .eq("qr_batch_id", batchId)
            .order("code");
        setBatchCoupons((prev) => ({ ...prev, [batchId]: (data ?? []) as BatchCoupon[] }));
    };

    const generate = async () => {
        if (!form.name.trim() || !form.prefix.trim() || form.codes_count <= 0) {
            addToast("Compila nome, prefisso e numero codici", "error");
            return;
        }
        if (form.codes_count > 500) {
            addToast("Max 500 codici per batch", "error");
            return;
        }
        setCreating(true);
        try {
            const supabase = createClient();
            const { data: batch, error: batchErr } = await supabase
                .from("coupon_qr_batches")
                .insert({
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    channel: form.channel.trim() || null,
                    utm_source: form.utm_source.trim() || null,
                    utm_medium: form.utm_medium.trim() || null,
                    utm_campaign: form.utm_campaign.trim() || null,
                    prefix: form.prefix.trim().toUpperCase(),
                    codes_count: form.codes_count,
                })
                .select("id")
                .single();
            if (batchErr) throw batchErr;

            const validUntil = new Date();
            validUntil.setUTCDate(validUntil.getUTCDate() + form.validity_days);

            const coupons = Array.from({ length: form.codes_count }, () => ({
                code: `${form.prefix.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                description: `QR batch · ${form.name}`,
                kind: "percent" as const,
                value_percent: form.discount_percent,
                valid_from: new Date().toISOString().slice(0, 10),
                valid_until: validUntil.toISOString().slice(0, 10),
                max_redemptions: 1,
                origin: "qr_batch" as const,
                single_use_per_customer: true,
                qr_batch_id: batch.id,
                utm_source: form.utm_source.trim() || null,
                utm_medium: form.utm_medium.trim() || null,
                utm_campaign: form.utm_campaign.trim() || null,
                is_active: true,
            }));

            const { error: cErr } = await supabase.from("coupons").insert(coupons);
            if (cErr) throw cErr;

            addToast(`${form.codes_count} QR generati`, "success");
            setForm({ ...EMPTY });
            await load();
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setCreating(false);
        }
    };

    const markPrinted = async (batchId: string) => {
        const supabase = createClient();
        await supabase
            .from("coupon_qr_batches")
            .update({ printed_at: new Date().toISOString() })
            .eq("id", batchId);
        await load();
    };

    const printBatch = (batchId: string) => {
        const coupons = batchCoupons[batchId] ?? [];
        if (coupons.length === 0) return;
        const html = `<!doctype html><html><head><title>QR Hair Rich</title><style>
            @page { size: A4; margin: 12mm; }
            body { font-family: sans-serif; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; }
            .card { border: 1px dashed #aaa; padding: 6mm; text-align: center; page-break-inside: avoid; }
            .card img { width: 100%; height: auto; max-width: 50mm; }
            .card p { font-size: 9pt; margin: 4mm 0 0; }
            .code { font-family: monospace; font-weight: bold; font-size: 11pt; }
        </style></head><body><div class="grid">
            ${coupons.map((c) => `
                <div class="card">
                    <img src="${qrPngDataUrl(`${SITE_URL}/coupon/${c.code}`)}" alt="${c.code}"/>
                    <p class="code">${c.code}</p>
                    <p>Hair Rich Olbia</p>
                </div>`).join("")}
        </div></body></html>`;
        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 800);
        }
        markPrinted(batchId);
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl text-accent-warm">Volantini smart</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    QR Promotions.
                </h1>
                <p className="mt-3 text-warm-white-muted text-base max-w-2xl">
                    Genera batch di QR univoci per stampare volantini, cartoline o vetrine
                    partner. Ogni scansione passa per /coupon/[code] con UTM tracking.
                </p>
            </motion.div>

            <div className="bg-carbon border border-line rounded-[var(--radius-md)] p-5 md:p-6 space-y-4">
                <h3 className="text-display text-xl text-warm-white tracking-tight">Nuovo batch QR</h3>
                <div className="grid md:grid-cols-3 gap-3">
                    <Input
                        label="Nome batch*"
                        value={form.name}
                        onChange={(v) => setForm({ ...form, name: v })}
                    />
                    <Input
                        label="Canale (bar/hotel/palestra…)"
                        value={form.channel}
                        onChange={(v) => setForm({ ...form, channel: v })}
                    />
                    <Input
                        label="Prefisso codice*"
                        value={form.prefix}
                        onChange={(v) => setForm({ ...form, prefix: v.toUpperCase() })}
                    />
                    <Input
                        label="Numero codici (max 500)"
                        type="number"
                        value={String(form.codes_count)}
                        onChange={(v) =>
                            setForm({ ...form, codes_count: Math.max(1, Math.min(500, parseInt(v, 10) || 1)) })
                        }
                    />
                    <Input
                        label="Sconto %"
                        type="number"
                        value={String(form.discount_percent)}
                        onChange={(v) =>
                            setForm({
                                ...form,
                                discount_percent: Math.max(1, Math.min(50, parseInt(v, 10) || 10)),
                            })
                        }
                    />
                    <Input
                        label="Validità (gg)"
                        type="number"
                        value={String(form.validity_days)}
                        onChange={(v) =>
                            setForm({ ...form, validity_days: Math.max(1, parseInt(v, 10) || 60) })
                        }
                    />
                    <Input
                        label="UTM source"
                        value={form.utm_source}
                        onChange={(v) => setForm({ ...form, utm_source: v })}
                    />
                    <Input
                        label="UTM medium"
                        value={form.utm_medium}
                        onChange={(v) => setForm({ ...form, utm_medium: v })}
                    />
                    <Input
                        label="UTM campaign"
                        value={form.utm_campaign}
                        onChange={(v) => setForm({ ...form, utm_campaign: v })}
                    />
                </div>
                <Input
                    label="Descrizione"
                    value={form.description}
                    onChange={(v) => setForm({ ...form, description: v })}
                />
                <div className="flex justify-end">
                    <button
                        onClick={generate}
                        disabled={creating || !form.name.trim()}
                        className="px-5 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold disabled:opacity-50 hover:bg-accent-warm/90"
                    >
                        {creating ? "Generazione…" : "Genera batch"}
                    </button>
                </div>
            </div>

            <section>
                <h2 className="text-display text-2xl text-warm-white tracking-tight">Batch esistenti</h2>
                {loading ? (
                    <div className="mt-4 space-y-3">
                        {[0, 1].map((i) => (
                            <div
                                key={i}
                                className="h-24 bg-carbon border border-line rounded-[var(--radius-md)] animate-pulse"
                            />
                        ))}
                    </div>
                ) : batches.length === 0 ? (
                    <p className="mt-4 p-10 bg-carbon border border-line border-dashed rounded-[var(--radius-md)] text-center text-warm-white-muted">
                        Nessun batch ancora.
                    </p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {batches.map((b) => (
                            <li
                                key={b.id}
                                className="bg-carbon border border-line rounded-[var(--radius-md)] overflow-hidden"
                            >
                                <details
                                    open={expanded === b.id}
                                    onToggle={(e) => {
                                        const open = (e.currentTarget as HTMLDetailsElement).open;
                                        if (open) {
                                            setExpanded(b.id);
                                            loadCoupons(b.id);
                                        } else if (expanded === b.id) {
                                            setExpanded(null);
                                        }
                                    }}
                                >
                                    <summary className="cursor-pointer list-none p-4 md:p-5 flex items-center gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-warm-white font-body font-semibold">{b.name}</h3>
                                            <p className="text-silver-dark text-xs mt-0.5">
                                                {b.codes_count} codici · prefisso {b.prefix}
                                                {b.channel && ` · ${b.channel}`}
                                                {b.printed_at && (
                                                    <span className="ml-2 text-success">
                                                        Stampato {new Date(b.printed_at).toLocaleDateString("it-IT")}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="w-6 h-6 rounded-full border border-line text-silver flex items-center justify-center group-open:rotate-45 transition-transform">
                                            +
                                        </span>
                                    </summary>
                                    <div className="px-4 md:px-5 pb-5 border-t border-line/60 pt-4 space-y-3">
                                        {batchCoupons[b.id] && (
                                            <>
                                                <div className="flex flex-wrap gap-3 text-sm">
                                                    <span className="text-warm-white">
                                                        Riscattati:{" "}
                                                        <strong>
                                                            {batchCoupons[b.id].filter((c) => c.redeemed_count > 0).length}
                                                        </strong>{" "}
                                                        / {batchCoupons[b.id].length}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => printBatch(b.id)}
                                                    className="px-4 py-2 bg-accent-warm/15 border border-accent-warm/40 text-accent-warm rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold"
                                                >
                                                    Stampa griglia QR
                                                </button>
                                                <ul className="max-h-[300px] overflow-y-auto space-y-1">
                                                    {batchCoupons[b.id].map((c) => (
                                                        <li
                                                            key={c.id}
                                                            className="flex items-center justify-between text-xs py-1.5 border-b border-line/30"
                                                        >
                                                            <code className="text-warm-white font-mono">{c.code}</code>
                                                            <span
                                                                className={
                                                                    c.redeemed_count > 0
                                                                        ? "text-success"
                                                                        : "text-silver-dark"
                                                                }
                                                            >
                                                                {c.redeemed_count > 0
                                                                    ? "Riscattato"
                                                                    : "Disponibile"}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </details>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full bg-black-2 border border-line rounded-md px-3 py-2 text-warm-white text-sm"
            />
        </label>
    );
}
