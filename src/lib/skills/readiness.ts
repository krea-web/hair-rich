// Skill readiness detection.
//
// A skill is "ready" when every dependency listed in `skill.requiresAccount`
// has been satisfied (env vars set, OAuth completed, etc). We can verify
// some of these from the client (DB-stored config); for others (Edge
// Function secrets, third-party signups) we can only mark them as
// "external — verify manually".

import type { Skill } from "./registry";

export type Readiness = "ready" | "incomplete" | "unverifiable" | "n/a";

export interface ReadinessResult {
    status: Readiness;
    missing: string[];     // short labels e.g. "Telegram chat ID"
    hint?: string;         // one-line action: "Inserisci in /admin/impostazioni"
}

interface ReadinessContext {
    owner_telegram_chat_id: string | null;
    google_place_id: string | null;
    google_calendar_connected_staff: number;  // count of staff with valid OAuth token
    notification_channel_priority: string[];
    timezone: string;
}

// Map a requiresAccount entry → a check name. Items not in this map are
// treated as "external" and reported as unverifiable (the owner must set
// them up themselves, we just remind them).
const CHECKABLE: Record<string, (ctx: ReadinessContext) => { ok: boolean; missing?: string; hint?: string }> = {
    "Telegram Bot Token": (ctx) => ({
        ok: Boolean(ctx.owner_telegram_chat_id),
        missing: "Chat ID Telegram del titolare",
        hint: "Inserisci il chat ID in /admin/impostazioni → Notifiche & Comunicazioni",
    }),
    "Google Place ID": (ctx) => ({
        ok: Boolean(ctx.google_place_id),
        missing: "Google Place ID del salone",
        hint: "Recupera il Place ID da Google Business Profile e inseriscilo in /admin/impostazioni",
    }),
    "Google Calendar": (ctx) => ({
        ok: ctx.google_calendar_connected_staff > 0,
        missing: "Almeno uno staff con Google Calendar connesso",
        hint: "Vai in /admin/staff → ogni operatore può connettere il suo calendario",
    }),
};

// Skills that have an explicit "always ready" carve-out (no external dependency)
function isInherentlyReady(skill: Skill): boolean {
    if (skill.alwaysOn) return true;
    if (!skill.requiresAccount || skill.requiresAccount.length === 0) return true;
    return false;
}

export function checkSkillReadiness(skill: Skill, ctx: ReadinessContext): ReadinessResult {
    if (isInherentlyReady(skill)) {
        return { status: "ready", missing: [] };
    }

    const required = skill.requiresAccount ?? [];
    const missing: string[] = [];
    const hints: string[] = [];
    let externalCount = 0;

    for (const req of required) {
        const checker = CHECKABLE[req];
        if (!checker) {
            externalCount++;
            continue;
        }
        const r = checker(ctx);
        if (!r.ok) {
            missing.push(r.missing ?? req);
            if (r.hint) hints.push(r.hint);
        }
    }

    // All verifiable deps satisfied, but some external ones we can't check
    if (missing.length === 0 && externalCount > 0) {
        return {
            status: "unverifiable",
            missing: [],
            hint: `Richiede ${required.filter(r => !CHECKABLE[r]).join(", ")} — verifica manualmente`,
        };
    }

    if (missing.length === 0) return { status: "ready", missing: [] };

    return { status: "incomplete", missing, hint: hints[0] };
}

export async function loadReadinessContext(supabase: {
    from: (t: string) => any;
}): Promise<ReadinessContext> {
    const [{ data: salon }, { count: gcalCount }] = await Promise.all([
        supabase
            .from("salon_settings")
            .select("owner_telegram_chat_id, google_place_id, notification_channel_priority, timezone")
            .limit(1)
            .maybeSingle(),
        supabase
            .from("staff_gcal_tokens")
            .select("staff_id", { count: "exact", head: true }),
    ]);

    return {
        owner_telegram_chat_id: (salon as any)?.owner_telegram_chat_id ?? null,
        google_place_id: (salon as any)?.google_place_id ?? null,
        google_calendar_connected_staff: Number(gcalCount) || 0,
        notification_channel_priority: (salon as any)?.notification_channel_priority ?? [],
        timezone: (salon as any)?.timezone ?? "Europe/Rome",
    };
}
