"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegistrationData } from "@/lib/validation";

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            marketingConsent: false
        }
    });

    const onSubmit = async (_data: RegistrationData) => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
        window.location.href = "/profilo";
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center py-12 px-6 relative bg-black selection:bg-carbon selection:text-warm-white">
            <div className="fixed inset-0 bg-radial-[ellipse_at_top] from-carbon via-black to-black pointer-events-none" />
            <div className="fixed inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 512 512%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22512%22 height=%22512%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E')]"></div>

            <div className="w-full max-w-lg z-10 space-y-10">
                <div className="text-center">
                    <a href="/" className="text-display text-2xl text-warm-white tracking-[0.2em] mb-8 inline-block">
                        HAIR RICH
                    </a>
                    <h1 className="text-display text-4xl text-warm-white">Unisciti al Club</h1>
                    <p className="text-silver-dark text-sm mt-3">
                        Crea il tuo profilo per prenotazioni veloci, storico tagli e vantaggi esclusivi.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-carbon border border-line rounded-[var(--radius-lg)] p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Nome</label>
                            <input
                                {...register("firstName")}
                                type="text"
                                className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                                placeholder="Mario"
                            />
                            {errors.firstName && <p className="text-error text-xs mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Cognome</label>
                            <input
                                {...register("lastName")}
                                type="text"
                                className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                                placeholder="Rossi"
                            />
                            {errors.lastName && <p className="text-error text-xs mt-1">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Telefono</label>
                        <input
                            {...register("phone")}
                            type="tel"
                            className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                            placeholder="+39 333 1234567"
                        />
                        {errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Email</label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors"
                            placeholder="mario.rossi@email.com"
                        />
                        {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-silver-dark mb-2">Data di Nascita (Opzionale per sconti)</label>
                        <input
                            {...register("birthdate")}
                            type="date"
                            className="w-full bg-black-2 border-b-2 border-line rounded-t-[var(--radius-sm)] px-4 py-3 text-warm-white placeholder:text-silver-dark focus:border-accent-warm focus:outline-none transition-colors [color-scheme:dark]"
                        />
                    </div>

                    <label className="flex items-start gap-4 mt-6 pt-6 border-t border-line cursor-pointer group">
                        <div className="relative flex items-start">
                            <input
                                {...register("marketingConsent")}
                                type="checkbox"
                                className="peer sr-only"
                            />
                            <div className="w-5 h-5 border-2 border-silver-dark rounded flex items-center justify-center peer-checked:bg-accent-warm peer-checked:border-accent-warm transition-colors">
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-black opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-sm text-silver-dark leading-tight group-hover:text-silver transition-colors">
                            Acconsento all'invio di promemoria, sconti speciali e comunicazioni di servizio via Email/WhatsApp (puoi disattivarlo dal profilo).
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-warm-white text-black font-body font-semibold text-sm uppercase tracking-wider rounded-[var(--radius-md)] flex items-center justify-center h-14 mt-8 transition-colors enabled:hover:bg-white disabled:opacity-50"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "Crea Profilo"}
                    </button>
                </form>

                <p className="text-center text-xs text-silver-dark">
                    Hai già un account?{" "}
                    <a href="/login" className="text-warm-white underline hover:text-accent-warm transition-colors">
                        Accedi qui
                    </a>
                </p>
            </div>
        </div>
    );
}
