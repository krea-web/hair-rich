"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAdminInboxStore, useToastStore } from "@/lib/store";

const SUBSCRIBE_RETRY_MS = 5000;

/**
 * Maintains admin_inbox_items unread count via Supabase Realtime.
 * Falls back to an initial RPC read if the channel hasn't connected yet
 * and re-reads on each INSERT/UPDATE.
 */
export function useAdminInbox() {
    const setUnreadCount = useAdminInboxStore((s) => s.setUnreadCount);
    const incUnread = useAdminInboxStore((s) => s.incUnread);
    const addToast = useToastStore((s) => s.addToast);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const supabase = createClient();
        let cancelled = false;

        const refreshCount = async () => {
            try {
                const { data, error } = await supabase.rpc("fn_admin_inbox_unread_count");
                if (cancelled || error) return;
                setUnreadCount(Number(data) || 0);
            } catch {
                /* swallow — next event refreshes */
            }
        };

        refreshCount();

        const channel = supabase
            .channel("admin-inbox-items")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "admin_inbox_items" },
                (payload) => {
                    if (cancelled) return;
                    const row = payload.new as {
                        title?: string;
                        priority?: string;
                        read_at?: string | null;
                    };
                    if (row.read_at == null) {
                        incUnread(1);
                        if (row.priority === "critical" || row.priority === "high") {
                            addToast(row.title ?? "Nuova notifica", "info");
                        }
                    }
                },
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "admin_inbox_items" },
                () => {
                    if (cancelled) return;
                    refreshCount();
                },
            )
            .subscribe();

        // Periodic safety refresh in case realtime drops a frame
        const safety = window.setInterval(refreshCount, 60_000);

        return () => {
            cancelled = true;
            window.clearInterval(safety);
            void supabase.removeChannel(channel);
        };
    }, [setUnreadCount, incUnread, addToast]);
}
