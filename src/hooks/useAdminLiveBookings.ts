"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminNotifyStore, useToastStore } from "@/lib/store";

const LAST_SEEN_KEY = "hairrich.admin.lastSeenBookingISO";
const POLL_INTERVAL_MS = 30_000;

interface NewBookingRow {
    id: string;
    created_at: string;
    start_at: string;
    customer: { first_name: string | null; last_name: string | null } | null;
    appointment_services: Array<{ service: { name: string } | null } | null> | null;
}

function formatStart(iso: string): string {
    return new Date(iso).toLocaleString("it-IT", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Polls the appointments table every 30s for rows created since the last
 * seen timestamp. For each new row: pushes a toast and (if granted) fires
 * a native browser notification. Increments the admin notify store counter
 * so the sidebar can badge "Agenda".
 *
 * Not using Supabase Realtime: it requires explicit publication of the
 * appointments table to supabase_realtime, which isn't configured. Polling
 * at 30s is good enough for an admin tool that's open on a desk.
 */
export function useAdminLiveBookings() {
    const bump = useAdminNotifyStore((s) => s.bump);
    const addToast = useToastStore((s) => s.addToast);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Initialize last-seen marker on first run so we don't notify for
        // every historical row.
        let lastSeen = typeof window !== "undefined" ? localStorage.getItem(LAST_SEEN_KEY) : null;
        if (!lastSeen) {
            lastSeen = new Date().toISOString();
            if (typeof window !== "undefined") localStorage.setItem(LAST_SEEN_KEY, lastSeen);
        }

        // Ask for notification permission once. The Notification API throws
        // on iOS Safari pre-16.4 if called from a non-secure or non-https
        // context — guard accordingly.
        try {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
                Notification.requestPermission().catch(() => {
                    /* user declined or unsupported */
                });
            }
        } catch {
            /* unsupported */
        }

        const supabase = createClient();
        let cancelled = false;

        const poll = async () => {
            if (cancelled) return;
            try {
                const { data, error } = await supabase
                    .from("appointments")
                    .select(
                        `id, created_at, start_at,
                        customer:customer_id ( first_name, last_name ),
                        appointment_services ( service:service_id ( name ) )`
                    )
                    .gt("created_at", lastSeen!)
                    .order("created_at", { ascending: true })
                    .limit(20);

                if (cancelled) return;
                if (error) return;
                const rows = (data ?? []) as unknown as NewBookingRow[];
                if (rows.length === 0) return;

                for (const row of rows) {
                    const customer = row.customer
                        ? `${row.customer.first_name ?? ""} ${row.customer.last_name ?? ""}`.trim() ||
                          "Cliente"
                        : "Cliente";
                    const service = row.appointment_services?.[0]?.service?.name ?? "Servizio";
                    const when = formatStart(row.start_at);
                    const message = `Nuova prenotazione · ${customer} · ${service} · ${when}`;
                    addToast(message, "success");
                    try {
                        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                            new Notification("Hair Rich · nuova prenotazione", {
                                body: `${customer} · ${service} · ${when}`,
                                icon: "/logo-mark.webp?v=2",
                                tag: row.id,
                            });
                        }
                    } catch {
                        /* notification failed, toast already shown */
                    }
                }

                bump(rows.length);
                lastSeen = rows[rows.length - 1]!.created_at;
                if (typeof window !== "undefined") {
                    localStorage.setItem(LAST_SEEN_KEY, lastSeen);
                }
            } catch {
                /* swallow — next tick retries */
            }
        };

        // Run once on mount, then on interval.
        poll();
        const id = window.setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [bump, addToast]);
}
