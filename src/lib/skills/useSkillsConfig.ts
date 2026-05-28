"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

let cache: { enabled: Set<string> } | null = null;
let inflight: Promise<Set<string>> | null = null;

async function loadEnabledSkills(): Promise<Set<string>> {
    if (cache) return cache.enabled;
    if (inflight) return inflight;
    inflight = (async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from("skills_config")
                .select("skill_key,enabled")
                .eq("enabled", true);
            const enabled = new Set<string>((data ?? []).map((r: { skill_key: string }) => r.skill_key));
            cache = { enabled };
            return enabled;
        } catch {
            // If the table doesn't exist yet (fresh DB) or RLS denies, treat
            // all skills as inactive — UI hides gated items rather than crash.
            const fallback = new Set<string>();
            cache = { enabled: fallback };
            return fallback;
        } finally {
            inflight = null;
        }
    })();
    return inflight;
}

export interface SkillsState {
    enabled: Set<string>;
    ready: boolean;
    isActive: (key: string) => boolean;
    anyActive: (keys: string[]) => boolean;
}

/**
 * Client-side reader for the `skills_config` table. Returns the set of
 * enabled skill keys plus convenience checkers. The result is cached at
 * module level so mounting the hook in many components only hits the DB
 * once per page load.
 *
 * `ready` flips to true after the first fetch resolves; use it to decide
 * whether to show optional UI now or wait (avoids flashing a feature that
 * is actually disabled).
 */
export function useSkillsConfig(): SkillsState {
    const [state, setState] = useState<{ enabled: Set<string>; ready: boolean }>(() =>
        cache ? { enabled: cache.enabled, ready: true } : { enabled: new Set(), ready: false }
    );
    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;
        if (cache) return;
        loadEnabledSkills().then((enabled) => {
            if (alive.current) setState({ enabled, ready: true });
        });
        return () => {
            alive.current = false;
        };
    }, []);

    return {
        enabled: state.enabled,
        ready: state.ready,
        isActive: (key: string) => state.enabled.has(key),
        anyActive: (keys: string[]) => keys.some((k) => state.enabled.has(k)),
    };
}
