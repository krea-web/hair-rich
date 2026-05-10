"use client";

import { useEffect, useState } from "react";
import { useClientPath } from "@/lib/clientRouter";
import { AdminLayout } from "./AdminLayout";

import AdminDashboardPage from "./views/dashboard";
import AdminAgendaPage from "./views/agenda";
import AdminClientiPage from "./views/clienti";
import AdminOrdiniPage from "./views/ordini";
import AdminServiziPage from "./views/servizi";
import AdminProdottiPage from "./views/prodotti";
import AdminStaffPage from "./views/staff";
import AdminImpostazioniPage from "./views/impostazioni";
import AdminMarketingPage from "./views/marketing";
import AdminGamificationPage from "./views/gamification";
import AdminOnboardingPage from "./views/onboarding";
import AdminCmsPage from "./views/cms";

function pickView(pathname: string) {
    const p = pathname.replace(/\/$/, "");
    switch (p) {
        case "/admin":
            return <AdminDashboardPage />;
        case "/admin/agenda":
            return <AdminAgendaPage />;
        case "/admin/clienti":
            return <AdminClientiPage />;
        case "/admin/ordini":
            return <AdminOrdiniPage />;
        case "/admin/servizi":
            return <AdminServiziPage />;
        case "/admin/prodotti":
            return <AdminProdottiPage />;
        case "/admin/staff":
            return <AdminStaffPage />;
        case "/admin/impostazioni":
            return <AdminImpostazioniPage />;
        case "/admin/marketing":
            return <AdminMarketingPage />;
        case "/admin/gamification":
            return <AdminGamificationPage />;
        case "/admin/onboarding":
            return <AdminOnboardingPage />;
        case "/admin/cms":
            return <AdminCmsPage />;
        default:
            return (
                <div className="p-12 text-center text-silver">
                    <h1 className="text-display text-3xl text-warm-white mb-4">404 · Sezione non trovata</h1>
                    <a href="/admin" className="underline text-accent-warm">Torna alla Dashboard</a>
                </div>
            );
    }
}

export function AdminApp() {
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

    return <AdminLayout>{pickView(pathname)}</AdminLayout>;
}
