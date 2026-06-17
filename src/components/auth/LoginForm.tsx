"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginEmailSchema, loginPhoneSchema, otpSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { assetImageUrl } from "@/lib/supabase/queries";

const LOGIN_BG_URL = assetImageUrl("salone-esterno.webp", {
    width: 2070,
    quality: 70,
    format: "webp",
});

type LoginMethod = "email" | "phone";
type LoginStep = "method" | "input" | "otp";

export function LoginForm() {
    const [step, setStep] = useState<LoginStep>("method");
    const [method, setMethod] = useState<LoginMethod>("email");
    const [identifier, setIdentifier] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const { register: regEmail, handleSubmit: handleEmail, formState: { errors: errEmail } } = useForm({
        resolver: zodResolver(loginEmailSchema),
    });

    const { register: regPhone, handleSubmit: handlePhone, formState: { errors: errPhone } } = useForm({
        resolver: zodResolver(loginPhoneSchema),
    });

    const { register: regOtp, handleSubmit: handleOtp, formState: { errors: errOtp } } = useForm({
        resolver: zodResolver(otpSchema),
    });

    const onSubmitIdentifier = async (data: any) => {
        setIsLoading(true);
        setAuthError(null);
        const val = method === "email" ? data.email : data.phone;
        setIdentifier(val);

        try {
            const supabase = createClient();
            const { error } =
                method === "email"
                    ? await supabase.auth.signInWithOtp({
                          email: val,
                          options: { shouldCreateUser: true },
                      })
                    : await supabase.auth.signInWithOtp({
                          phone: val,
                          options: { shouldCreateUser: true },
                      });
            if (error) throw error;
            setStep("otp");
        } catch (e: any) {
            setAuthError(e?.message ?? "Errore durante l'invio del codice");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitOtp = async (data: any) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const supabase = createClient();
            const { error, data: verifyData } =
                method === "email"
                    ? await supabase.auth.verifyOtp({
                          email: identifier,
                          token: data.code,
                          type: "email",
                      })
                    : await supabase.auth.verifyOtp({
                          phone: identifier,
                          token: data.code,
                          type: "sms",
                      });
            if (error) throw error;

            // Honour ?next= query param when present; otherwise route
            // admins to /admin and customers to /profilo.
            const params = new URLSearchParams(window.location.search);
            const explicitNext = params.get("next");
            if (explicitNext && explicitNext.startsWith("/")) {
                window.location.href = explicitNext;
                return;
            }

            const userId = verifyData?.user?.id;
            if (userId) {
                const { data: adminRow } = await supabase
                    .from("admins")
                    .select("user_id")
                    .eq("user_id", userId)
                    .maybeSingle();
                if (adminRow) {
                    window.location.href = "/admin";
                    return;
                }
            }
            window.location.href = "/profilo";
        } catch (e: any) {
            setAuthError(e?.message ?? "Codice non valido");
            setIsLoading(false);
        }
    };

    const onGoogleSignIn = async () => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const supabase = createClient();
            const redirectTo =
                typeof window !== "undefined"
                    ? `${window.location.origin}/profilo`
                    : undefined;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo },
            });
            if (error) throw error;
        } catch (e: any) {
            setAuthError(e?.message ?? "Errore Google Sign-In");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col md:flex-row bg-black selection:bg-carbon selection:text-warm-white">
            <div className="hidden md:flex flex-1 relative bg-carbon overflow-hidden border-r border-line">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity grayscale"
                    style={{ backgroundImage: `url('${LOGIN_BG_URL}')` }}
                />

                <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-transparent to-black/80" />
                <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 512 512%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22512%22 height=%22512%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')]"></div>

                <div className="relative z-10 p-12 flex flex-col justify-between w-full h-full">
                    <a href="/" className="text-display text-2xl text-warm-white tracking-[0.2em]">
                        HAIR RICH
                    </a>
                    <div>
                        <h1 className="text-display text-5xl lg:text-7xl text-warm-white leading-tight">
                            Il tuo <br /> stile,<br />senza attese.
                        </h1>
                        <p className="font-body text-silver mt-6 max-w-sm">
                            Accedi al tuo profilo per gestire appuntamenti, ordini e vantaggi esclusivi.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-20 lg:px-32 relative">
                <div className="md:hidden absolute top-0 left-0 w-full p-6 flex justify-center">
                    <a href="/" className="text-display text-xl text-warm-white tracking-[0.2em]">
                        HAIR RICH
                    </a>
                </div>

                <div className="w-full max-w-md mx-auto space-y-8">
                    <AnimatePresence mode="wait">
                        {step === "method" && (
                            <motion.div
                                key="method"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h2 className="text-display text-4xl text-warm-white mb-2">Accedi</h2>
                                    <p className="text-silver-dark text-sm">Un solo passaggio. Se non hai ancora un account, lo creiamo al volo — niente registrazione separata.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Google — metodo principale (un account Google È già un'email) */}
                                    <button
                                        type="button"
                                        onClick={onGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-body font-semibold px-6 py-4 rounded-[var(--radius-md)] hover:bg-white/90 transition-colors disabled:opacity-60"
                                    >
                                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Continua con Google
                                    </button>

                                    {/* Telefono */}
                                    <button
                                        onClick={() => { setMethod("phone"); setStep("input"); }}
                                        className="w-full relative group overflow-hidden bg-carbon hover:bg-carbon-2 border border-line rounded-[var(--radius-md)] px-4 py-4 md:px-6 md:py-5 flex items-center justify-between transition-all duration-300"
                                    >
                                        <span className="font-body text-warm-white font-semibold">Continua con il telefono</span>
                                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-silver group-hover:text-warm-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>

                                    {/* Email — fallback discreto */}
                                    <button
                                        type="button"
                                        onClick={() => { setMethod("email"); setStep("input"); }}
                                        className="w-full text-center text-xs text-silver-dark hover:text-warm-white underline underline-offset-4 decoration-line hover:decoration-warm-white transition-colors pt-1"
                                    >
                                        Preferisci l'email? Accedi via email
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "input" && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <button onClick={() => setStep("method")} className="text-silver-dark hover:text-warm-white flex items-center gap-2 text-xs uppercase tracking-widest mb-6 transition-colors">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                        </svg>
                                        Indietro
                                    </button>
                                    <h2 className="text-display text-4xl text-warm-white mb-2">
                                        {method === "email" ? "Email" : "Telefono"}
                                    </h2>
                                    <p className="text-silver-dark text-sm">
                                        {method === "email"
                                            ? "Ti invieremo un link magico o un codice."
                                            : "Riceverai un SMS con il codice di accesso."}
                                    </p>
                                </div>

                                <form onSubmit={method === "email" ? handleEmail(onSubmitIdentifier) : handlePhone(onSubmitIdentifier)} className="space-y-6">
                                    <div>
                                        <input
                                            {...(method === "email" ? regEmail("email") : regPhone("phone"))}
                                            type={method === "email" ? "email" : "tel"}
                                            placeholder={method === "email" ? "nome@email.com" : "+39 333 1234567"}
                                            className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-5 text-xl text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none focus:bg-carbon transition-colors"
                                            autoFocus
                                        />
                                        {method === "email" && errEmail.email && <p className="text-error text-xs mt-2">{String(errEmail.email.message)}</p>}
                                        {method === "phone" && errPhone.phone && <p className="text-error text-xs mt-2">{String(errPhone.phone.message)}</p>}
                                        {authError && <p className="text-error text-xs mt-2">{authError}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-accent-warm text-black font-body font-semibold text-sm uppercase tracking-wider rounded-[var(--radius-md)] flex justify-center items-center h-14 transition-all enabled:hover:brightness-110 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : "Prosegui"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "otp" && (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <button onClick={() => setStep("input")} className="text-silver-dark hover:text-warm-white flex items-center gap-2 text-xs uppercase tracking-widest mb-6 transition-colors">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                        </svg>
                                        Indietro
                                    </button>
                                    <h2 className="text-display text-4xl text-warm-white mb-2">Codice</h2>
                                    <p className="text-silver-dark text-sm">
                                        Abbiamo inviato un codice a <span className="text-warm-white">{identifier}</span>.
                                    </p>
                                </div>

                                <form onSubmit={handleOtp(onSubmitOtp)} className="space-y-6">
                                    <div>
                                        <input
                                            {...regOtp("code")}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            placeholder="000000"
                                            className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-5 text-4xl tracking-[0.5em] text-center font-mono text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none focus:bg-carbon transition-colors"
                                            autoFocus
                                        />
                                        {errOtp.code && <p className="text-error text-xs mt-2 text-center">{String(errOtp.code.message)}</p>}
                                        {authError && <p className="text-error text-xs mt-2 text-center">{authError}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-accent-warm text-black font-body font-semibold text-sm uppercase tracking-wider rounded-[var(--radius-md)] flex justify-center items-center h-14 transition-all enabled:hover:brightness-110 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : "Accedi"}
                                    </button>
                                </form>

                                <p className="text-center text-xs text-silver-dark">
                                    Non hai ricevuto il codice? <button className="underline hover:text-warm-white transition-colors">Invia di nuovo</button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-xs text-silver-dark pt-8">
                        Vuoi solo prenotare, senza account?{" "}
                        <a href="/registrazione" className="text-warm-white underline hover:text-accent-warm transition-colors">
                            Prenota come ospite
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
