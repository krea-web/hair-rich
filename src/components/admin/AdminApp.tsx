"use client";

import { useEffect, useState } from "react";
import { useClientPath } from "@/lib/clientRouter";
import { useAdminLiveBookings } from "@/hooks/useAdminLiveBookings";
import { useAdminInbox } from "@/hooks/useAdminInbox";
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
import AdminFotoRisultatiPage from "./views/foto-risultati";
import AdminChiusurePage from "./views/chiusure";
import AdminOrariPage from "./views/orari";
import AdminStatistichePage from "./views/statistiche";
import AdminAgendaWeekPage from "./views/agenda-week";
import AdminSkillsHubPage from "./views/skills-hub";
import AdminLogPage from "./views/log";
import AdminInboxPage from "./views/inbox";
import AdminWaitlistPage from "./views/waitlist";
import AdminClientiNoShowPage from "./views/clienti-no-show";
import AdminPacchettiPage from "./views/pacchetti";
import AdminSondaggiPage from "./views/sondaggi";
import AdminClientiCercaPage from "./views/clienti-cerca";
import AdminContenutiAiPage from "./views/contenuti-ai";
import AdminFornitoriPage from "./views/fornitori";
import AdminQrPromoPage from "./views/qr-promo";
import AdminSalutePage from "./views/salute";
import AdminHardwarePage from "./views/hardware";
// Staff-portal views surfaced as /admin/* routes (cantiere 8): impiegati
// e titolare entrano da uno stesso URL space, niente più portal separato.
import StaffTimbraturaPage from "../staff/views/timbratura";
import StaffFeriePage from "../staff/views/ferie";
import StaffMyAppointmentsPage from "../staff/views/appuntamenti";

export type AdminRoleLevel = "owner" | "manager" | "staff";

// Sezioni accessibili al livello "staff" (dipendente). Tutto il resto è
// owner/manager-only. Tenuto qui, accanto al router, perché legato 1-1
// alle voci di menù in AdminLayout.
const EMPLOYEE_ALLOWED: ReadonlySet<string> = new Set([
    "/admin",
    "/admin/agenda",
    "/admin/agenda-week",
    "/admin/agenda-mia",
    "/admin/clienti",
    "/admin/clienti-cerca",
    "/admin/foto-risultati",
    "/admin/chiusure",
    "/admin/timbratura",
    "/admin/ferie",
]);

function isFullAccess(role: AdminRoleLevel): boolean {
    return role === "owner" || role === "manager";
}

function pickView(pathname: string) {
    const p = pathname.replace(/\/$/, "");
    switch (p) {
        case "/admin":
            return <AdminDashboardPage />;
        case "/admin/agenda":
            return <AdminAgendaPage />;
        case "/admin/agenda-week":
            return <AdminAgendaWeekPage />;
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
        case "/admin/foto-risultati":
            return <AdminFotoRisultatiPage />;
        case "/admin/chiusure":
            return <AdminChiusurePage />;
        case "/admin/orari":
            return <AdminOrariPage />;
        case "/admin/statistiche":
            return <AdminStatistichePage />;
        case "/admin/funzionalita":
            return <AdminSkillsHubPage />;
        case "/admin/log":
            return <AdminLogPage />;
        case "/admin/inbox":
            return <AdminInboxPage />;
        case "/admin/waitlist":
            return <AdminWaitlistPage />;
        case "/admin/clienti-no-show":
            return <AdminClientiNoShowPage />;
        case "/admin/pacchetti":
            return <AdminPacchettiPage />;
        case "/admin/sondaggi":
            return <AdminSondaggiPage />;
        case "/admin/clienti-cerca":
            return <AdminClientiCercaPage />;
        case "/admin/contenuti-ai":
            return <AdminContenutiAiPage />;
        case "/admin/fornitori":
            return <AdminFornitoriPage />;
        case "/admin/qr-promo":
            return <AdminQrPromoPage />;
        case "/admin/salute":
            return <AdminSalutePage />;
        case "/admin/hardware":
            return <AdminHardwarePage />;
        case "/admin/timbratura":
            return <StaffTimbraturaPage />;
        case "/admin/ferie":
            return <StaffFeriePage />;
        case "/admin/agenda-mia":
            return <StaffMyAppointmentsPage />;
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
    const [role, setRole] = useState<AdminRoleLevel>("owner");
    useAdminLiveBookings();
    useAdminInbox();

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

                // Determine admin role level: query `admins` for this user.
                // Falls back to "staff" (most restricted) if the row is missing
                // so that an accidental admin landing without a real grant
                // sees the locked-down view, not the full dashboard.
                try {
                    const { data: adminRow } = await supabase
                        .from("admins")
                        .select("role")
                        .eq("user_id", data.session.user.id)
                        .maybeSingle();
                    if (!cancelled) {
                        const raw = (adminRow as { role?: string } | null)?.role;
                        if (raw === "owner" || raw === "manager" || raw === "staff") {
                            setRole(raw);
                        } else {
                            setRole("staff");
                        }
                    }
                } catch {
                    if (!cancelled) setRole("staff");
                }

                // Onboarding guard: redirect to /admin/onboarding if the salon
                // hasn't completed the wizard yet (unless already there).
                const path = typeof window !== "undefined" ? window.location.pathname : "";
                if (!path.startsWith("/admin/onboarding")) {
                    try {
                        const { data: setRow } = await supabase
                            .from("salon_settings")
                            .select("onboarding_completed_at")
                            .limit(1)
                            .maybeSingle();
                        if (!cancelled && setRow && setRow.onboarding_completed_at == null) {
                            window.location.replace("/admin/onboarding");
                            return;
                        }
                    } catch {
                        /* swallow */
                    }
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

    // The onboarding wizard owns the whole viewport — bypass the sidebar
    // so first-time setup isn't visually cluttered by nav links the owner
    // doesn't understand yet.
    if (pathname.startsWith("/admin/onboarding")) {
        return pickView(pathname);
    }

    const fullAccess = isFullAccess(role);
    const cleanPath = pathname.replace(/\/$/, "");
    const blocked = !fullAccess && cleanPath.startsWith("/admin") && !EMPLOYEE_ALLOWED.has(cleanPath);

    return (
        <AdminLayout role={role}>
            {blocked ? <EmployeeBlockedView /> : pickView(pathname)}
        </AdminLayout>
    );
}

function EmployeeBlockedView() {
    return (
        <div className="min-h-[60dvh] flex items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h1 className="text-display text-2xl text-warm-white mb-2">Sezione riservata</h1>
                <p className="text-warm-white-muted text-sm leading-relaxed mb-6">
                    Questa parte del gestionale è accessibile solo al titolare. Tu hai accesso ad
                    agenda, clienti e gestione foto risultati.
                </p>
                <a
                    href="/admin/agenda"
                    className="inline-block px-5 py-2.5 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold"
                >
                    Vai alla tua agenda
                </a>
            </div>
        </div>
    );
}
