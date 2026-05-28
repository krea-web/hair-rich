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
    const [claimName, setClaimName] = useState("");
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);

    const handleClaimOwner = async () => {
        const name = claimName.trim();
        if (!name) {
            setClaimError("Inserisci un nome per continuare.");
            return;
        }
        setClaiming(true);
        setClaimError(null);
        try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data, error } = await supabase.rpc("fn_claim_owner_staff", {
                p_name: name,
                p_role: "Titolare",
            });
            if (error) throw error;
            const row = data as StaffMe;
            setMe({
                id: row.id,
                name: row.name,
                role: row.role,
                avatar_url: row.avatar_url ?? null,
                commission_pct: row.commission_pct ?? 0,
            });
            setErrorState(null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Errore durante la creazione del profilo.";
            // Map the most common Postgres errors to user-friendly text.
            if (/42501/.test(msg)) {
                setClaimError("Serve l'accesso da titolare per creare il profilo principale.");
            } else if (/23505/.test(msg)) {
                setClaimError("Esiste già un profilo per questo account. Ricarica la pagina.");
            } else {
                setClaimError(msg);
            }
        } finally {
            setClaiming(false);
        }
    };

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
                <div className="bg-carbon border border-line rounded-[var(--radius-lg)] p-8 max-w-md w-full">
                    <div className="text-5xl mb-4 text-center">✂️</div>
                    <h1 className="text-display text-2xl text-warm-white mb-3 text-center">
                        Profilo operatore mancante
                    </h1>
                    <p className="text-warm-white-muted text-sm mb-6 text-center leading-relaxed">
                        Il tuo account è autenticato ma non è ancora collegato a un operatore del salone.
                        Se sei il <strong className="text-warm-white">titolare</strong>, crea ora il tuo profilo
                        principale. Se sei un dipendente, chiedi al titolare di abilitarti da
                        <span className="text-accent-warm"> /admin/staff</span>.
                    </p>

                    <div className="space-y-3">
                        <label className="block">
                            <span className="block text-[10px] uppercase tracking-[0.3em] text-silver-dark font-body font-semibold mb-2">
                                Nome e cognome
                            </span>
                            <input
                                type="text"
                                value={claimName}
                                onChange={(e) => setClaimName(e.target.value)}
                                placeholder="es. Federico Asara"
                                disabled={claiming}
                                className="w-full px-4 py-3 bg-black-2 border border-line rounded-[var(--radius-md)] text-warm-white text-sm placeholder:text-silver-dark focus:outline-none focus:border-accent-warm transition-colors"
                            />
                        </label>

                        {claimError && (
                            <p className="text-error text-xs">{claimError}</p>
                        )}

                        <button
                            onClick={handleClaimOwner}
                            disabled={claiming || !claimName.trim()}
                            className="w-full px-5 py-3 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {claiming ? "Creazione in corso…" : "Crea profilo titolare"}
                        </button>

                        <a
                            href="/"
                            className="block text-center px-5 py-2 border border-line text-silver rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:bg-carbon-2 hover:text-warm-white transition-colors"
                        >
                            Torna al sito
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!me) {
        return null;
    }

    return <StaffLayout me={me}>{pickView(pathname)}</StaffLayout>;
}
