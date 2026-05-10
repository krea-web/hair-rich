"use client";

import { useEffect, useState } from "react";
import { useClientPath } from "@/lib/clientRouter";
import { ProfiloLayout } from "./ProfiloLayout";

import ProfiloDashboardPage from "./views/dashboard";
import ProfiloAppuntamentiPage from "./views/appuntamenti";
import ProfiloImpostazioniPage from "./views/impostazioni";
import ProfiloReferralPage from "./views/referral";

function pickView(pathname: string) {
    const p = pathname.replace(/\/$/, "");
    switch (p) {
        case "/profilo":
            return <ProfiloDashboardPage />;
        case "/profilo/appuntamenti":
            return <ProfiloAppuntamentiPage />;
        case "/profilo/impostazioni":
            return <ProfiloImpostazioniPage />;
        case "/profilo/referral":
            return <ProfiloReferralPage />;
        default:
            return (
                <div className="p-12 text-center text-silver">
                    <h1 className="text-display text-3xl text-warm-white mb-4">404 · Pagina non trovata</h1>
                    <a href="/profilo" className="underline text-accent-warm">Torna al Profilo</a>
                </div>
            );
    }
}

export function ProfiloApp() {
    const pathname = useClientPath();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const url = import.meta.env.PUBLIC_SUPABASE_URL;
            const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
            if (!url || !key) {
                if (!cancelled) setReady(true);
                return;
            }
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data } = await supabase.auth.getSession();
                if (cancelled) return;
                if (!data.session) {
                    window.location.replace("/login");
                    return;
                }
                setReady(true);
            } catch {
                if (!cancelled) setReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!ready) {
        return (
            <div className="min-h-[100dvh] bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-silver-dark border-t-warm-white rounded-full animate-spin" />
            </div>
        );
    }

    return <ProfiloLayout>{pickView(pathname)}</ProfiloLayout>;
}
