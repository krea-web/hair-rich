"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import type { Customer } from "./types";

export interface MeState {
    loading: boolean;
    customer: Customer | null;
    completedAppointments: number;
    error: Error | null;
}

/**
 * Hook for the /profilo subtree. Resolves the current Supabase session's
 * customer row (auth.users → customers via user_id) and counts how many
 * appointments the customer has completed. Returns null/0 when there's no
 * session (the ProfiloApp shell already redirects in that case, so this is
 * defensive).
 *
 * Reused by birthday banner, loyalty progress, photo memory, and any
 * future personalised widget.
 */
export function useCurrentCustomer(): MeState {
    const [state, setState] = useState<MeState>({
        loading: true,
        customer: null,
        completedAppointments: 0,
        error: null,
    });

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const supabase = createClient();
                const { data: sessionData } = await supabase.auth.getSession();
                const uid = sessionData.session?.user.id;
                if (!uid) {
                    if (alive) setState({ loading: false, customer: null, completedAppointments: 0, error: null });
                    return;
                }
                const { data: customer, error } = await supabase
                    .from("customers")
                    .select("*")
                    .eq("user_id", uid)
                    .maybeSingle();
                if (error) throw error;

                let count = 0;
                if (customer) {
                    const { count: c } = await supabase
                        .from("appointments")
                        .select("*", { count: "exact", head: true })
                        .eq("customer_id", customer.id)
                        .eq("status", "completed");
                    count = c ?? 0;
                }

                if (!alive) return;
                setState({
                    loading: false,
                    customer: (customer as Customer) ?? null,
                    completedAppointments: count,
                    error: null,
                });
            } catch (e: any) {
                if (!alive) return;
                setState({
                    loading: false,
                    customer: null,
                    completedAppointments: 0,
                    error: e instanceof Error ? e : new Error(String(e)),
                });
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return state;
}

/** True if today's month + year overlaps the customer's birth month. */
export function isBirthdayMonth(customer: Customer | null): boolean {
    if (!customer?.birthdate) return false;
    const bday = new Date(customer.birthdate);
    if (Number.isNaN(bday.getTime())) return false;
    return bday.getMonth() === new Date().getMonth();
}
