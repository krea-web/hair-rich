"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

const DISMISS_KEY = "hr-push-dismissed-at";
const DISMISS_DAYS = 14;

/**
 * Soft prompt asking the customer to allow web push. Mounted on
 * /profilo so it only ever appears for logged-in customers. Honours:
 *   - salon_settings.push_enabled master flag
 *   - browser support (Notification API + PushManager)
 *   - dismissal cool-down (14 days) via localStorage
 *
 * On subscribe we POST the PushSubscription to push_subscriptions
 * with the customer_id resolved from auth.uid().
 */
export function PushOptInPrompt() {
    const [shown, setShown] = useState(false);
    const [vapidKey, setVapidKey] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const addToast = useToastStore((s) => s.addToast);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
        if (Notification.permission !== "default") return;

        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
        if (Date.now() - dismissedAt < DISMISS_DAYS * 86400 * 1000) return;

        let cancelled = false;
        (async () => {
            const supabase = createClient();
            const [{ data: salon }, { data: auth }] = await Promise.all([
                supabase
                    .from("salon_settings")
                    .select("push_enabled, push_vapid_public_key")
                    .limit(1)
                    .maybeSingle(),
                supabase.auth.getUser(),
            ]);
            if (cancelled) return;
            if (!salon?.push_enabled || !salon?.push_vapid_public_key) return;
            if (!auth.user) return;

            const { data: customer } = await supabase
                .from("customers")
                .select("id")
                .eq("user_id", auth.user.id)
                .maybeSingle();
            if (cancelled) return;
            if (!customer?.id) return;

            setVapidKey(salon.push_vapid_public_key);
            setCustomerId(customer.id);
            setShown(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubscribe = async () => {
        if (!vapidKey || !customerId) return;
        setSubmitting(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                handleDismiss();
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });
            const json = sub.toJSON();
            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
                throw new Error("Subscription incompleta");
            }

            const supabase = createClient();
            const { error } = await supabase.from("push_subscriptions").upsert(
                {
                    customer_id: customerId,
                    endpoint: json.endpoint,
                    p256dh: json.keys.p256dh,
                    auth_key: json.keys.auth,
                    user_agent: navigator.userAgent,
                    enabled: true,
                },
                { onConflict: "endpoint" },
            );
            if (error) throw error;
            addToast("Notifiche attivate", "success");
            setShown(false);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "?";
            addToast(`Errore: ${msg}`, "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDismiss = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
        }
        setShown(false);
    };

    return (
        <AnimatePresence>
            {shown && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="mb-6 p-5 rounded-[var(--radius-md)] bg-gradient-to-br from-accent-warm/10 to-accent-warm/5 border border-accent-warm/40"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                                Notifiche browser
                            </p>
                            <h3 className="mt-1 text-display text-lg text-warm-white tracking-tight">
                                Promemoria 1h prima dell'appuntamento
                            </h3>
                            <p className="mt-1 text-sm text-warm-white-muted">
                                Niente email, niente SMS. Una notifica veloce sul tuo browser.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            onClick={handleDismiss}
                            className="text-[10px] uppercase tracking-[0.3em] text-silver hover:text-warm-white font-body font-semibold"
                        >
                            Non ora
                        </button>
                        <button
                            onClick={handleSubscribe}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent-warm text-black text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {submitting ? "..." : "Attiva"}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const out = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
    return out;
}
