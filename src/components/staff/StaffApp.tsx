"use client";

import { useEffect, useState } from "react";
import { useClientPath } from "@/lib/clientRouter";
import { StaffLayout } from "./StaffLayout";

import StaffDashboardPage from "./views/dashboard";
import StaffAppuntamentiPage from "./views/appuntamenti";
import StaffClientiPage from "./views/clienti";
import StaffIncassiPage from "./views/incassi";
import StaffFeriePage from "./views/ferie";
import StaffTimbraturaPage from "./views/timbratura";

interface StaffMe {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
    commission_pct: number;
}

function pickView(pathname: string) {
    const p = pathname.replace(/\/$/, "");
    switch (p) {
        case "/staff":
            return <StaffDashboardPage />;
        case "/staff/appuntamenti":
            return <StaffAppuntamentiPage />;
        case "/staff/clienti":
            return <StaffClientiPage />;
        case "/staff/incassi":
            return <StaffIncassiPage />;
        case "/staff/ferie":
            return <StaffFeriePage />;
        case "/staff/timbratura":
            return <StaffTimbraturaPage />;
        default:
            return (
                <div className="p-12 text-center text-silver">
                    <h1 className="text-display text-3xl text-warm-white mb-4">
                        404 · Sezione non trovata
                    </h1>
                    <a href="/staff" className="underline text-accent-warm">Torna al pannello</a>
                </div>
            );
    }
}

export function StaffApp() {
    const pathname = useClientPath();
    const [ready, setReady] = useState(false);
    const [me, setMe] = useState<StaffMe | null>(null);
    const [errorState, setErrorState] = useState<string | null>(null);

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
                const { data: session } = await supabase.auth.getSession();
                if (cancelled) return;
                if (!session.session) {
                    window.location.replace("/login?next=/staff");
                    return;
                }

                const { data: staffRow, error } = await supabase
                    .from("staff")
                    .select("id, name, role, avatar_url, commission_pct")
                    .eq("user_id", session.session.user.id)
                    .maybeSingle();

                if (cancelled) return;
                if (error) throw error;

                if (!staffRow) {
                    setErrorState("no_staff");
                    setReady(true);
                    return;
                }

                setMe(staffRow as StaffMe);
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

    if (errorState === "no_staff") {
        return (
            <div className="min-h-[100dvh] bg-black flex items-center justify-center p-6">
                <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-display text-2xl text-warm-white mb-3">
                        Accesso non autorizzato
                    </h1>
                    <p className="text-warm-white-muted text-sm mb-6">
                        Il tuo account non è collegato a nessun operatore. Chiedi al titolare di
                        abilitarti dall'admin → Staff.
                    </p>
                    <a
                        href="/"
                        className="inline-block px-5 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-carbon-2"
                    >
                        Torna al sito
                    </a>
                </div>
            </div>
        );
    }

    if (!me) {
        return null;
    }

    return <StaffLayout me={me}>{pickView(pathname)}</StaffLayout>;
}
