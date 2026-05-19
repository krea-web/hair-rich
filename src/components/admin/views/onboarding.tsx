"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchSalonSettings } from "@/lib/supabase/queries";
import type { SalonSettings } from "@/lib/supabase/types";
import { useToastStore } from "@/lib/store";

interface StaffDraft {
    name: string;
    role: string;
}

interface ServiceDraft {
    name: string;
    price_euros: number;
    duration_min: number;
    enabled: boolean;
}

const DEFAULT_SERVICES: ServiceDraft[] = [
    { name: "Taglio", price_euros: 25, duration_min: 30, enabled: true },
    { name: "Taglio + Barba", price_euros: 35, duration_min: 60, enabled: true },
    { name: "Barba", price_euros: 15, duration_min: 30, enabled: true },
    { name: "Rasatura tradizionale", price_euros: 25, duration_min: 45, enabled: false },
];

function slugify(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default function AdminOnboardingPage() {
    const [step, setStep] = useState(1);
    const [settings, setSettings] = useState<SalonSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    // Step 1: salon identity
    const [salonName, setSalonName] = useState("Hair Rich Olbia");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    // Step 2: team
    const [teamDrafts, setTeamDrafts] = useState<StaffDraft[]>([{ name: "", role: "Barber" }]);

    // Step 3: services
    const [serviceDrafts, setServiceDrafts] = useState<ServiceDraft[]>(DEFAULT_SERVICES);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSalonSettings();
            setSettings(data);
            if (data) {
                setSalonName(data.display_name);
                setPhone(data.phone ?? "");
                setEmail(data.email ?? "");
                setAddress(data.address ?? "");
            }
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const saveStep1 = async () => {
        if (!settings) return;
        if (!salonName.trim()) {
            addToast("Inserisci il nome salone", "error");
            return;
        }
        setSubmitting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("salon_settings")
                .update({
                    display_name: salonName.trim(),
                    phone: phone.trim() || null,
                    email: email.trim() || null,
                    address: address.trim() || null,
                })
                .eq("id", settings.id);
            if (error) throw error;
            setStep(2);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const saveStep2 = async () => {
        const valid = teamDrafts.filter((t) => t.name.trim().length > 0);
        if (valid.length === 0) {
            addToast("Aggiungi almeno un barber", "error");
            return;
        }
        setSubmitting(true);
        try {
            const supabase = createClient();
            const rows = valid.map((t, i) => ({
                name: t.name.trim(),
                role: t.role.trim() || "Barber",
                slug: slugify(t.name) || `barber-${i + 1}`,
                is_active: true,
                sort_order: i * 10,
            }));
            const { error } = await supabase
                .from("staff")
                .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
            if (error) throw error;
            setStep(3);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const saveStep3 = async () => {
        const valid = serviceDrafts.filter((s) => s.enabled);
        if (valid.length === 0) {
            addToast("Abilita almeno un servizio", "error");
            return;
        }
        setSubmitting(true);
        try {
            const supabase = createClient();
            const rows = valid.map((s, i) => ({
                name: s.name,
                slug: slugify(s.name),
                price_cents: Math.round(s.price_euros * 100),
                duration_min: s.duration_min,
                is_active: true,
                sort_order: i * 10,
            }));
            const { error } = await supabase
                .from("services")
                .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
            if (error) throw error;
            setStep(4);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const finish = async () => {
        if (!settings) return;
        setSubmitting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("salon_settings")
                .update({ onboarding_completed_at: new Date().toISOString() })
                .eq("id", settings.id);
            if (error) throw error;
            addToast("Onboarding completato. Benvenuto!", "success");
            window.location.href = "/admin";
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-2 border-line border-t-warm-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.carbon)_0%,black_100%)] pointer-events-none opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-carbon border border-line rounded-[var(--radius-xl)] p-8 md:p-12 z-10 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-black-2">
                    <div
                        className="h-full bg-accent-warm transition-all duration-500 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>

                <div className="mb-8 text-center">
                    <div className="inline-block px-3 py-1 bg-black text-warm-white border border-line text-[10px] uppercase tracking-[0.3em] font-bold rounded-full mb-4">
                        Passo {step} di 4
                    </div>
                    <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight">
                        {step === 1 && "Identità del salone"}
                        {step === 2 && "Il tuo team"}
                        {step === 3 && "Servizi base"}
                        {step === 4 && "Tutto pronto"}
                    </h1>
                    <p className="text-silver-dark text-sm mt-3 max-w-md mx-auto">
                        {step === 1 && "Nome, contatti, indirizzo. Si possono modificare dopo da Impostazioni."}
                        {step === 2 && "Aggiungi i barbieri. Potrai sempre aggiungerne altri dopo da Staff."}
                        {step === 3 && "Quattro servizi di partenza, abilitali a piacere. Modificabili da Servizi."}
                        {step === 4 && "Il booking è pronto. I clienti possono prenotare da subito."}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            <input
                                value={salonName}
                                onChange={(e) => setSalonName(e.target.value)}
                                placeholder="Nome salone"
                                className="w-full bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                            />
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Telefono · +39 …"
                                className="w-full bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email · info@…"
                                className="w-full bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                            />
                            <input
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Indirizzo"
                                className="w-full bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                            />
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            {teamDrafts.map((t, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        value={t.name}
                                        onChange={(e) => {
                                            const next = [...teamDrafts];
                                            next[i] = { ...next[i]!, name: e.target.value };
                                            setTeamDrafts(next);
                                        }}
                                        placeholder="Nome"
                                        className="flex-1 bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                                    />
                                    <input
                                        value={t.role}
                                        onChange={(e) => {
                                            const next = [...teamDrafts];
                                            next[i] = { ...next[i]!, role: e.target.value };
                                            setTeamDrafts(next);
                                        }}
                                        placeholder="Ruolo"
                                        className="w-32 bg-black-2 border border-line rounded-md px-4 py-3 text-warm-white"
                                    />
                                    {teamDrafts.length > 1 && (
                                        <button
                                            onClick={() => setTeamDrafts(teamDrafts.filter((_, x) => x !== i))}
                                            className="px-3 text-error hover:bg-error/10 rounded-md transition-colors"
                                            aria-label="Rimuovi"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setTeamDrafts([...teamDrafts, { name: "", role: "Barber" }])}
                                className="text-accent-warm text-sm hover:underline"
                            >
                                + Aggiungi barber
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-2"
                        >
                            {serviceDrafts.map((s, i) => (
                                <label
                                    key={i}
                                    className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                                        s.enabled ? "bg-black-2 border-accent-warm/40" : "bg-black-2/50 border-line"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={s.enabled}
                                        onChange={(e) => {
                                            const next = [...serviceDrafts];
                                            next[i] = { ...next[i]!, enabled: e.target.checked };
                                            setServiceDrafts(next);
                                        }}
                                        className="w-4 h-4 accent-accent-warm"
                                    />
                                    <span className="flex-1 text-warm-white font-body font-semibold">{s.name}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={s.price_euros}
                                        onChange={(e) => {
                                            const next = [...serviceDrafts];
                                            next[i] = { ...next[i]!, price_euros: parseFloat(e.target.value) || 0 };
                                            setServiceDrafts(next);
                                        }}
                                        className="w-16 bg-black border border-line rounded px-2 py-1 text-warm-white font-mono text-right"
                                    />
                                    <span className="text-silver-dark text-sm">€</span>
                                    <input
                                        type="number"
                                        min={5}
                                        step={5}
                                        value={s.duration_min}
                                        onChange={(e) => {
                                            const next = [...serviceDrafts];
                                            next[i] = { ...next[i]!, duration_min: parseInt(e.target.value, 10) || 30 };
                                            setServiceDrafts(next);
                                        }}
                                        className="w-16 bg-black border border-line rounded px-2 py-1 text-warm-white font-mono text-right"
                                    />
                                    <span className="text-silver-dark text-sm">min</span>
                                </label>
                            ))}
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="text-6xl">✓</div>
                            <p className="text-warm-white-muted text-base">
                                Hai impostato salone, team e servizi. Il booking pubblico è attivo
                                e i clienti possono prenotare già da ora.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        disabled={step === 1 || submitting}
                        className="px-4 py-2 text-silver text-[10px] uppercase tracking-[0.25em] hover:text-warm-white transition-colors disabled:opacity-30"
                    >
                        ← Indietro
                    </button>
                    {step < 4 ? (
                        <button
                            onClick={step === 1 ? saveStep1 : step === 2 ? saveStep2 : saveStep3}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Salvataggio…" : "Avanti →"}
                        </button>
                    ) : (
                        <button
                            onClick={finish}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-accent-warm text-black rounded-full text-[11px] uppercase tracking-[0.25em] font-body font-semibold hover:bg-accent-warm/90 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Salvataggio…" : "Vai alla dashboard →"}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
