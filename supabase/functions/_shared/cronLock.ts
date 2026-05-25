// Cron idempotency helpers.
//
// Each scheduled Edge Function calls `acquireCronLock(supabase, name, period)`
// at startup. If the function has already executed for the same
// (name, period) tuple it returns false → the cron exits silently.
//
// Period granularity is the cron's responsibility — pick the one that
// matches your schedule:
//   • todayKey()       — daily crons
//   • isoWeekKey()     — weekly crons (Monday-anchored ISO week)
//   • monthKey()       — monthly crons
//   • bucket15Key()    — every-15-minutes crons
//   • bucket30Key()    — every-30-minutes crons
//   • bucket10Key()    — every-10-minutes crons

interface SupabaseLike {
    rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export async function acquireCronLock(
    supabase: SupabaseLike,
    name: string,
    periodKey: string,
): Promise<boolean> {
    const { data, error } = await supabase.rpc("fn_try_acquire_cron_lock", {
        p_name: name,
        p_period_key: periodKey,
    });
    if (error) {
        // Fail open: if we can't talk to the DB, allow the cron to proceed
        // rather than silently skip a critical operation.
        console.warn("[cron-lock] acquire failed, proceeding:", error);
        return true;
    }
    return Boolean(data);
}

export async function releaseCronLock(
    supabase: SupabaseLike,
    name: string,
    periodKey: string,
    succeeded: boolean,
    notes?: string,
): Promise<void> {
    try {
        await supabase.rpc("fn_release_cron_lock", {
            p_name: name,
            p_period_key: periodKey,
            p_succeeded: succeeded,
            p_notes: notes ?? null,
        });
    } catch (e) {
        console.warn("[cron-lock] release failed:", e);
    }
}

export function todayKey(d: Date = new Date()): string {
    return d.toISOString().slice(0, 10);
}

export function monthKey(d: Date = new Date()): string {
    return d.toISOString().slice(0, 7);
}

// ISO-week key like "2026-W21" anchored Monday.
export function isoWeekKey(d: Date = new Date()): string {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function bucketKey(d: Date, minutes: number): string {
    const m = Math.floor(d.getUTCMinutes() / minutes) * minutes;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}-${pad(m)}`;
}

export function bucket10Key(d: Date = new Date()): string { return bucketKey(d, 10); }
export function bucket15Key(d: Date = new Date()): string { return bucketKey(d, 15); }
export function bucket30Key(d: Date = new Date()): string { return bucketKey(d, 30); }
