"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import {
    CONSENT_LABELS,
    fetchCurrentConsents,
    recordConsent,
    type ConsentSnapshot,
    type ConsentType,
} from "@/lib/profilo/consents";

interface CustomerData {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    birthdate: string | null;
}

export default function ProfiloImpostazioniPage() {
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [consents, setConsents] = useState<Map<ConsentType, ConsentSnapshot>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [savingKey, setSavingKey] = useState<ConsentType | null>(null);
    const addToast = useToastStore((s) => s.addToast);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: auth } = await supabase.auth.getUser();
            if (!auth.user) return;
            const { data: cust, error: e1 } = await supabase
                .from("customers")
                .select("id, first_name, last_name, email, phone, birthdate")
                .eq("user_id", auth.user.id)
                .maybeSingle();
            if (e1) throw e1;
            if (!cust) return;
            setCustomer(cust as CustomerData);

            const consentMap = await fetchCurrentConsents(cust.id);
            setConsents(consentMap);
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleConsent = async (type: ConsentType, next: boolean) => {
        if (!customer || savingKey) return;
        setSavingKey(type);
        try {
            await recordConsent(customer.id, type, next);
            // Mirror onto legacy marketing_consent column for backwards-compat.
            if (type === "marketing") {
                const supabase = createClient();
                await supabase.from("customers").update({ marketing_consent: next }).eq("id", customer.id);
            }
            setConsents((m) => {
                const next2 = new Map(m);
                next2.set(type, {
                    consent_type: type,
                    granted: next,
                    policy_version: m.get(type)?.policy_version ?? "2026-05-23",
                    effective_at: new Date().toISOString(),
                });
                return next2;
            });
            addToast(next ? "Consenso accordato" : "Consenso revocato", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        } finally {
            setSavingKey(null);
        }
    };

    const exportData = async () => {
        if (!customer) return;
        try {
            const supabase = createClient();
            const [appts, ords, cons] = await Promise.all([
                supabase.from("appointments").select("*").eq("customer_id", customer.id),
                supabase.from("orders").select("*").eq("customer_id", customer.id),
                supabase.from("customer_consents").select("*").eq("customer_id", customer.id),
            ]);
            const payload = {
                exported_at: new Date().toISOString(),
                policy_version: "2026-05-23",
                customer,
                appointments: appts.data ?? [],
                orders: ords.data ?? [],
                consents: cons.data ?? [],
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hair-rich-data-${customer.id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            addToast("Esportazione pronta", "success");
        } catch (e: any) {
            addToast(`Errore: ${e?.message ?? "?"}`, "error");
        }
    };

    if (loading) {
        return (
            <div className="px-6 md:px-12 py-8 max-w-3xl space-y-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-32 bg-carbon border border-line rounded-[var(--radius-lg)] animate-pulse" />
                ))}
            </div>
        );
    }

    // Se loading è false ma customer manca, vuol dire che l'utente è
    // autenticato ma non ha ancora una riga in `customers`. Era un bug
    // visibile su mobile: skeleton infinita. Adesso CTA chiara per
    // completare il profilo (l'OnboardingWizard a ProfiloApp lo gestisce
    // tornando al / profilo).
    if (!customer) {
        return (
            <div className="px-6 md:px-12 py-12 max-w-3xl">
                <h1 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight">
                    Profilo da completare
                </h1>
                <p className="mt-4 text-warm-white-muted text-base">
                    Il tuo account è collegato ma il profilo cliente non è ancora stato creato.
                    Completa l'onboarding per attivare le impostazioni.
                </p>
                <a
                    href="/profilo"
                    className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    Vai alla dashboard
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </a>
            </div>
        );
    }

    const initials = `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`.toUpperCase() || "?";
    const fullName = `${customer.first_name} ${customer.last_name ?? ""}`.trim();

    // I 5 consensi GDPR sono troppi se renderizzati come una lista flat
    // (l'utente non riesce a leggerli tutti). Li raggruppiamo in 3
    // famiglie: Notifiche / Dati personali / Programmi. Ogni gruppo e'
    // un accordion espandibile con riepilogo "X di Y attivi" come
    // anteprima — di default chiuso, l'utente apre solo quello che vuole.
    const CONSENT_GROUPS: {
        key: string;
        title: string;
        eyebrow: string;
        description: string;
        types: ConsentType[];
    }[] = [
        {
            key: "notifiche",
            eyebrow: "01 · Notifiche",
            title: "Promemoria e comunicazioni",
            description: "Come ti contattiamo prima e dopo i tuoi appuntamenti.",
            types: ["appointment_reminders", "marketing"],
        },
        {
            key: "dati",
            eyebrow: "02 · Dati personali",
            title: "Foto e personalizzazione",
            description: "Cosa salviamo del tuo passaggio in salone.",
            types: ["photos_pre_post", "profiling"],
        },
        {
            key: "programmi",
            eyebrow: "03 · Programmi",
            title: "Iniziative facoltative",
            description: "A cosa scegli di partecipare attivamente.",
            types: ["referral_program"],
        },
    ];

    return (
        <div className="px-6 md:px-12 lg:px-16 py-8 md:py-14 max-w-3xl">
            <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-display-alt text-2xl md:text-3xl text-accent-warm">Manage your</span>
                <h1 className="text-display text-4xl md:text-6xl text-warm-white tracking-tight mt-1 leading-[0.95]">
                    Impostazioni.
                </h1>
                <p className="mt-4 text-warm-white-muted text-base max-w-md">
                    Profilo, consensi e dati. Tutto quello che riguarda il tuo account.
                </p>
            </motion.header>

            <motion.section
                className="mt-10 bg-carbon border border-line rounded-[var(--radius-lg)] p-6 md:p-8 flex items-center gap-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-accent-warm to-warning text-black flex items-center justify-center font-display text-2xl md:text-3xl font-semibold shrink-0 shadow-[0_10px_30px_-10px_rgba(212,165,116,0.6)]">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight truncate">
                        {fullName || "Senza nome"}
                    </h2>
                    <p className="text-silver-dark text-sm mt-1 truncate">
                        {customer.email ?? "—"} · {customer.phone ?? "—"}
                    </p>
                </div>
            </motion.section>

            <motion.section
                aria-labelledby="gdpr-heading"
                className="mt-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="mb-4">
                    <span className="text-display-alt text-lg text-accent-warm">Privacy</span>
                    <h2 id="gdpr-heading" className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                        Consensi
                    </h2>
                    <p className="text-silver-dark text-sm mt-1">
                        Ogni consenso viene registrato con data, versione policy e dispositivo.
                        Puoi revocare tutto in qualsiasi momento.
                    </p>
                </div>
                <div className="space-y-3">
                    {CONSENT_GROUPS.map((group) => {
                        const total = group.types.length;
                        const active = group.types.filter(
                            (t) => consents.get(t)?.granted
                        ).length;
                        return (
                            <details
                                key={group.key}
                                className="group bg-carbon border border-line rounded-[var(--radius-lg)] overflow-hidden"
                            >
                                <summary className="flex items-center justify-between gap-4 p-5 md:p-6 cursor-pointer list-none select-none hover:bg-carbon-2 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold">
                                            {group.eyebrow}
                                        </span>
                                        <h3 className="text-warm-white text-base md:text-lg font-body font-semibold mt-1">
                                            {group.title}
                                        </h3>
                                        <p className="text-silver-dark text-sm mt-1 leading-snug">
                                            {group.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span
                                            className={`text-[10px] uppercase tracking-[0.2em] font-body font-semibold whitespace-nowrap ${
                                                active === total
                                                    ? "text-accent-warm"
                                                    : active > 0
                                                        ? "text-warm-white"
                                                        : "text-silver-dark"
                                            }`}
                                        >
                                            {active}/{total} attivi
                                        </span>
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-4 h-4 text-silver-dark transition-transform group-open:rotate-180"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m6 9 6 6 6-6"
                                            />
                                        </svg>
                                    </div>
                                </summary>

                                <div className="divide-y divide-line border-t border-line">
                                    {group.types.map((type) => {
                                        const snap = consents.get(type);
                                        const granted = Boolean(snap?.granted);
                                        return (
                                            <div
                                                key={type}
                                                className="flex items-start justify-between gap-4 p-5 md:p-6 bg-black-2/40"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-warm-white text-sm md:text-base font-body font-semibold">
                                                        {CONSENT_LABELS[type].title}
                                                    </h4>
                                                    <p className="text-silver-dark text-xs md:text-sm mt-1 leading-relaxed">
                                                        {CONSENT_LABELS[type].description}
                                                    </p>
                                                    {snap && (
                                                        <p className="text-[10px] uppercase tracking-[0.2em] text-silver-dark/70 mt-2 font-body">
                                                            v.{snap.policy_version} ·{" "}
                                                            {new Date(snap.effective_at).toLocaleDateString("it-IT")}
                                                        </p>
                                                    )}
                                                </div>
                                                <Toggle
                                                    value={granted}
                                                    busy={savingKey === type}
                                                    onClick={() => toggleConsent(type, !granted)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })}
                </div>
            </motion.section>

            <motion.section
                className="mt-10"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="mb-4">
                    <span className="text-display-alt text-lg text-accent-warm">Diritti GDPR</span>
                    <h2 className="text-display text-xl md:text-2xl text-warm-white tracking-tight">
                        I tuoi dati
                    </h2>
                </div>
                <div className="bg-carbon border border-line rounded-[var(--radius-lg)] overflow-hidden divide-y divide-line">
                    <button
                        onClick={exportData}
                        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-carbon-2 transition-colors text-left group"
                    >
                        <div>
                            <h3 className="text-warm-white text-base font-body font-semibold">
                                Esporta i miei dati
                            </h3>
                            <p className="text-silver-dark text-sm mt-1">
                                Scarica un file JSON con profilo, appuntamenti, ordini e consensi
                            </p>
                        </div>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-silver-dark group-hover:text-warm-white shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsDeleting(true)}
                        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-error/10 transition-colors text-left group"
                    >
                        <div>
                            <h3 className="text-error text-base font-body font-semibold">Elimina account</h3>
                            <p className="text-error/70 text-sm mt-1">Diritto all'oblio. Questa azione è irreversibile.</p>
                        </div>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-error/60 group-hover:text-error shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9 14.394 18m-4.788 0L9.26 9" />
                        </svg>
                    </button>
                </div>
            </motion.section>

            <AnimatePresence>
                {isDeleting && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDeleting(false)}
                    >
                        <motion.div
                            className="bg-carbon border border-error/40 rounded-[var(--radius-lg)] p-8 max-w-md w-full"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-display-alt text-xl text-error">Attention</span>
                            <h3 className="text-display text-2xl text-warm-white tracking-tight mt-1">
                                Elimino l'account?
                            </h3>
                            <p className="text-warm-white-muted text-sm mt-3 leading-relaxed">
                                Tutti gli appuntamenti futuri, lo storico e i crediti saranno persi
                                per sempre. Per procedere contattaci direttamente al salone — il
                                titolare conferma la richiesta entro 30 giorni come previsto da GDPR.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsDeleting(false)}
                                    className="flex-1 px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold"
                                >
                                    Chiudi
                                </button>
                                <a
                                    href="mailto:info@hairrich.it?subject=Richiesta cancellazione account"
                                    className="flex-1 px-5 py-3 bg-error text-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold text-center"
                                >
                                    Contatta il salone
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Toggle({ value, busy, onClick }: { value: boolean; busy: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            aria-pressed={value}
            className={`relative shrink-0 w-12 h-7 rounded-full border transition-colors ${
                value ? "bg-accent-warm border-accent-warm" : "bg-black-2 border-line"
            } ${busy ? "opacity-50" : ""}`}
        >
            <span
                className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                    value ? "left-[22px] bg-black" : "left-0.5 bg-warm-white"
                }`}
            />
        </button>
    );
}
