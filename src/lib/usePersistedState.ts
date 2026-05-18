"use client";

import { useEffect, useState } from "react";

interface Stored<T> {
    value: T;
    savedAt: number;
}

/**
 * useState that mirrors its value into localStorage under `key`, with a TTL.
 * On mount, if a saved value exists and is younger than `ttlMs`, the hook
 * boots with that value instead of the default. Older entries are wiped.
 *
 * Intended for ephemeral UX state (filter choices, quiz answers) — NOT for
 * authentication or anything that requires durability beyond a soft "the
 * site remembers what I was doing last week".
 */
export function usePersistedState<T>(
    key: string,
    initial: T,
    ttlMs: number = 1000 * 60 * 60 * 24 * 30 // 30 days
): [T, (next: T | ((prev: T) => T)) => void] {
    const [value, setValue] = useState<T>(initial);

    // Read once on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Stored<T>;
            if (
                parsed &&
                typeof parsed.savedAt === "number" &&
                Date.now() - parsed.savedAt < ttlMs
            ) {
                setValue(parsed.value);
            } else {
                localStorage.removeItem(key);
            }
        } catch {
            try { localStorage.removeItem(key); } catch { /* ignore */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Write whenever value changes
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const payload: Stored<T> = { value, savedAt: Date.now() };
            localStorage.setItem(key, JSON.stringify(payload));
        } catch {
            /* ignore */
        }
    }, [key, value]);

    return [value, setValue];
}
