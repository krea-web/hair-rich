// Helpers for reading/writing the customer_consents ledger from
// /profilo screens. Consent rows are append-only — every grant or revoke
// is a NEW row with the policy version + source captured. The current
// state per (customer, consent_type) is read from the
// customer_consents_current view.

import { createClient } from "@/lib/supabase/client";

export const CURRENT_POLICY_VERSION = "2026-05-23";

export type ConsentType =
    | "marketing"
    | "appointment_reminders"
    | "photos_pre_post"
    | "profiling"
    | "referral_program";

export type ConsentSource =
    | "onboarding"
    | "profile_settings"
    | "admin"
    | "booking"
    | "import";

export interface ConsentSnapshot {
    consent_type: ConsentType;
    granted: boolean;
    policy_version: string;
    effective_at: string;
}

export const CONSENT_LABELS: Record<ConsentType, { title: string; description: string }> = {
    marketing: {
        title: "Marketing e promozioni",
        description: "Ricevi offerte, anteprime e novità via email/messaggio.",
    },
    appointment_reminders: {
        title: "Promemoria appuntamenti",
        description: "Promemoria 24 ore e 2 ore prima dell'appuntamento. Consigliato.",
    },
    photos_pre_post: {
        title: "Foto prima/dopo del lavoro",
        description: "Permettiamo di archiviare le foto del tuo taglio per consultazioni future. Solo visibili a te.",
    },
    profiling: {
        title: "Profilazione comportamentale",
        description: "Usiamo i tuoi dati di visita per offerte personalizzate (compleanno, riattivazione).",
    },
    referral_program: {
        title: "Programma referral",
        description: "Partecipi al programma porta-un-amico e puoi inviare/ricevere codici.",
    },
};

export async function fetchCurrentConsents(customerId: string): Promise<Map<ConsentType, ConsentSnapshot>> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("customer_consents_current")
        .select("consent_type, granted, policy_version, effective_at")
        .eq("customer_id", customerId);
    if (error) throw error;
    const map = new Map<ConsentType, ConsentSnapshot>();
    for (const row of (data ?? []) as ConsentSnapshot[]) map.set(row.consent_type, row);
    return map;
}

export async function recordConsent(
    customerId: string,
    consent_type: ConsentType,
    granted: boolean,
    source: ConsentSource = "profile_settings",
    notes?: string,
): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("customer_consents").insert({
        customer_id: customerId,
        consent_type,
        granted,
        policy_version: CURRENT_POLICY_VERSION,
        source,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        notes: notes ?? null,
    });
    if (error) throw error;
}

export async function recordOnboardingConsents(
    customerId: string,
    grants: Partial<Record<ConsentType, boolean>>,
): Promise<void> {
    const supabase = createClient();
    const rows = (Object.entries(grants) as [ConsentType, boolean][]).map(
        ([consent_type, granted]) => ({
            customer_id: customerId,
            consent_type,
            granted,
            policy_version: CURRENT_POLICY_VERSION,
            source: "onboarding" as ConsentSource,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
    );
    if (rows.length === 0) return;
    const { error } = await supabase.from("customer_consents").insert(rows);
    if (error) throw error;
}

export async function hasCompletedOnboarding(customerId: string): Promise<boolean> {
    const supabase = createClient();
    const { count, error } = await supabase
        .from("customer_consents")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("source", "onboarding");
    if (error) return false;
    return (count ?? 0) > 0;
}
