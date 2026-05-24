"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { useToastStore } from "@/lib/store";

const STEPS = [
    {
        n: "01",
        title: "Condividi il codice",
        body: "Manda il tuo codice o il link agli amici, via WhatsApp o email.",
    },
    {
        n: "02",
        title: "L'amico prenota",
        body: "Lui usa il codice in fase di registrazione e ottiene 5€ di sconto sul primo taglio.",
    },
    {
        n: "03",
        title: "Riceviamo entrambi",
        body: "Quando si presenta in salone, tu ricevi 5€ di credito sul tuo portafoglio. Cumulabili.",
    },
];

interface Stats {
    friends_invited: number;
    friends_completed: number;
    credits_earned_cents: number;
    credits_pending_cents: number;
}

interface InvitedRow {
    id: string;
    code: string;
    invited_email: string | null;
    invited_phone: string | null;
    status: "pending" | "signed_up" | "first_visit_completed" | "rewarded" | "expired";
    credit_cents: number;
    created_at: string;
    invited: { first_name: string; last_name: string | null } | null;
}

const STATUS_LABEL: Record<InvitedRow["status"], string> = {
    pending: "In attesa di click",
    signed_up: "Iscritto",
    first_visit_completed: "Premio in arrivo",
    rewarded: "Premio ricevuto",
    expired: "Scaduto",
};

export default function ProfiloReferralPage() {
    const [code, setCode] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [invited, setInvited] = useState<InvitedRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [skillEnabled, setSkillEnabled] = useState(true);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const supabase = createClient();

                const { data: skillRow } = await supabase
                    .from("skills_config")
                    .select("enabled")
                    .eq("skill_key", "referrals")
                    .maybeSingle();
                if (cancelled) return;
                if (skillRow && !skillRow.enabled) {
                    setSkillEnabled(false);
                    setLoading(false);
                    return;
                }

                const [{ data: codeRes }, { data: statsRes }] = await Promise.all([
                    supabase.rpc("fn_get_or_create_my_referral_code"),
                    supabase.rpc("fn_my_referral_stats"),
                ]);
                if (cancelled) return;
                if (codeRes?.code) setCode(codeRes.code);
                if (statsRes) setStats(statsRes as Stats);

                const { data: rows } = await supabase
                    .from("referrals")
                    .select(
                        "id, code, invited_email, invited_phone, status, credit_cents, created_at, invited:customers!referrals_invited_customer_id_fkey(first_name,last_name)"
                    )
                    .order("created_at", { ascending: false })
                    .limit(20);
                if (!cancelled) setInvited((rows ?? []) as InvitedRow[]);
            } catch (e: any) {
                if (!cancelled) addToast(`Errore: ${e?.message ?? "?"}`, "error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [addToast]);

    if (!skillEnabled) {
        return (
            <div className="px-6 md:px-12 lg:px-16 py-16 max-w-3xl">
                <span className="text-display-alt text-2xl text-accent-warm">Coming soon</span>
                <h1 className="text-display text-4xl md:text-5xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Programma referral in arrivo.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-xl">
                    Stiamo definendo i dettagli del programma invita-un-amico. Torna a trovarci
                    presto: ti scriveremo non appena sarà attivo.
                </p>
            </div>
        );
    }

    const link = code ? `hairrich.it/i/${code}` : "";
    const shareText = code
        ? `Ti consiglio Hair Rich Olbia. Usa il mio codice e ricevi 5€ di sconto sul primo taglio: https://${link}`
        : "";

    const handleCopy = async () => {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(`https://${link}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            /* ignore */
        }
    };

    const handleNativeShare = async () => {
        if (!shareText) return;
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({ title: "Hair Rich Olbia", text: shareText });
                return;
            } catch {
                /* user cancelled */
            }
        }
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            /* ignore */
        }
    };

    const handleWhatsApp = () => {
        if (!shareText) return;
        const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-5xl">
            <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
            >
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Word of mouth</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Passaparola.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base md:text-lg leading-relaxed">
                    Invita un amico, guadagnate <strong className="text-accent-warm">entrambi 5€</strong>.
                    Lui sul primo taglio, tu in credito spendibile in salone.
                </p>
            </motion.header>

            <motion.section
                aria-label="Il tuo codice referral"
                className="mt-10 md:mt-14 relative overflow-hidden bg-gradient-to-br from-accent-warm/15 via-carbon to-black-2 border border-accent-warm/30 rounded-[var(--radius-xl)] p-6 md:p-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                <div
                    aria-hidden="true"
                    className="absolute -bottom-8 right-2 md:right-8 text-display text-[18vw] md:text-[10vw] font-semibold text-accent-warm/[0.06] leading-none tracking-tight pointer-events-none select-none"
                >
                    {code ?? "•••"}
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end">
                    <div>
                        <span className="text-display-alt text-lg md:text-xl text-accent-warm">
                            Il tuo codice invito
                        </span>

                        <div className="mt-3 inline-block">
                            <div className="bg-black border border-accent-warm/40 rounded-[var(--radius-md)] px-6 py-4 md:px-8 md:py-5 min-h-[88px] flex items-center">
                                {loading ? (
                                    <span className="text-silver-dark text-sm">Caricamento…</span>
                                ) : (
                                    <span className="text-display text-3xl md:text-5xl text-warm-white tracking-[0.2em] tabular-nums select-all">
                                        {code}
                                    </span>
                                )}
                            </div>
                        </div>

                        {code && (
                            <p className="mt-4 text-silver-dark text-xs uppercase tracking-[0.25em] font-body font-semibold">
                                {link}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 md:items-stretch w-full md:w-auto">
                        <button
                            onClick={handleCopy}
                            disabled={!code}
                            className="relative inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-warm-white text-black rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-accent-warm transition-colors active:scale-95 min-w-[180px] disabled:opacity-50"
                        >
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.span
                                        key="copied"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="inline-flex items-center gap-2"
                                    >
                                        Copiato
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="copy"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                    >
                                        Copia link
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            disabled={!code}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-[#25D366]/20 transition-colors disabled:opacity-50"
                        >
                            WhatsApp
                        </button>
                        <button
                            onClick={handleNativeShare}
                            disabled={!code}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3.5 border border-line text-warm-white rounded-full text-xs uppercase tracking-[0.3em] font-body font-semibold hover:bg-warm-white/5 hover:border-warm-white transition-colors disabled:opacity-50"
                        >
                            Condividi
                        </button>
                    </div>
                </div>
            </motion.section>

            <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
                <motion.div
                    className="md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-3"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-7">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Amici invitati
                        </span>
                        <div className="mt-3 flex items-baseline gap-3">
                            <span className="text-display text-5xl md:text-6xl text-warm-white tabular-nums leading-none">
                                {stats?.friends_invited ?? 0}
                            </span>
                            <span className="text-display-alt text-xl text-accent-warm">friends</span>
                        </div>
                    </div>
                    <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-7">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                            Crediti guadagnati
                        </span>
                        <div className="mt-3 flex items-baseline gap-3">
                            <span className="text-display text-5xl md:text-6xl text-success tabular-nums leading-none">
                                {formatPrice(stats?.credits_earned_cents ?? 0)}
                            </span>
                        </div>
                        {stats && stats.credits_pending_cents > 0 && (
                            <p className="mt-2 text-silver-dark text-xs">
                                + {formatPrice(stats.credits_pending_cents)} in arrivo
                            </p>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    className="md:col-span-3"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <span className="text-display-alt text-xl text-accent-warm">How it works</span>
                    <h2 className="text-display text-2xl md:text-3xl text-warm-white tracking-tight">
                        Come funziona
                    </h2>

                    <ol className="mt-8 space-y-6">
                        {STEPS.map((step) => (
                            <li key={step.n} className="grid grid-cols-[auto_1fr] gap-5 group">
                                <span className="text-display text-3xl text-accent-warm/70 tabular-nums leading-none group-hover:text-accent-warm transition-colors">
                                    {step.n}
                                </span>
                                <div className="border-l border-line pl-5 pb-2">
                                    <h3 className="text-display text-lg text-warm-white tracking-tight">{step.title}</h3>
                                    <p className="mt-1.5 text-warm-white-muted text-sm leading-relaxed max-w-md">
                                        {step.body}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </motion.div>
            </div>

            {invited.length > 0 && (
                <motion.section
                    className="mt-12"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <h2 className="text-display text-2xl text-warm-white tracking-tight">I tuoi inviti</h2>
                    <ul className="mt-6 space-y-2">
                        {invited.map((r) => (
                            <li
                                key={r.id}
                                className="flex items-center justify-between gap-4 bg-carbon border border-line rounded-[var(--radius-md)] p-4"
                            >
                                <div className="min-w-0">
                                    <p className="text-warm-white text-sm font-semibold truncate">
                                        {r.invited
                                            ? `${r.invited.first_name} ${r.invited.last_name ?? ""}`
                                            : r.invited_email || r.invited_phone || "Invito non ancora reclamato"}
                                    </p>
                                    <p className="text-silver-dark text-xs mt-0.5">
                                        {new Date(r.created_at).toLocaleDateString("it-IT", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-body font-semibold border ${
                                            r.status === "rewarded"
                                                ? "border-success/40 text-success bg-success/10"
                                                : r.status === "pending"
                                                ? "border-line text-silver"
                                                : "border-accent-warm/40 text-accent-warm bg-accent-warm/10"
                                        }`}
                                    >
                                        {STATUS_LABEL[r.status]}
                                    </span>
                                    {r.status === "rewarded" && (
                                        <span className="text-accent-warm tabular-nums text-sm font-semibold">
                                            +{formatPrice(r.credit_cents)}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </motion.section>
            )}
        </div>
    );
}
