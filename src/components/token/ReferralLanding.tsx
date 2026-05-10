"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function readCode(): string {
    if (typeof window === "undefined") return "";
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
}

export function ReferralLanding() {
    const [code, setCode] = useState("");

    useEffect(() => {
        setCode(readCode());
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col pt-20 px-6 font-body text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto w-full pt-10 space-y-8">
                <div className="w-20 h-20 bg-carbon rounded-full border border-line mx-auto flex items-center justify-center mb-6">
                    <span className="text-display text-4xl text-warm-white">🎁</span>
                </div>

                <h1 className="text-display text-3xl md:text-5xl text-warm-white">
                    Un tuo amico ti ha <br /><span className="text-accent-warm italic">Invitato!</span>
                </h1>

                <p className="text-silver-dark">
                    Usa il codice <span className="font-mono text-warm-white bg-carbon px-2 py-1 rounded mx-1">{code || "—"}</span> e avrai <strong className="text-accent-warm">5,00 € di sconto</strong> sul tuo primo taglio.
                </p>

                <a href="/registrazione" className="block w-full py-4 mt-8 bg-warm-white text-black font-bold uppercase tracking-widest rounded-[var(--radius-sm)] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:brightness-110 transition-colors">
                    Registrati &amp; Ottieni il Bonus
                </a>

                <p className="text-xs text-silver-dark">
                    Oppure <a href="/" className="underline hover:text-warm-white">scopri di più sul nostro salone</a>.
                </p>
            </motion.div>
        </div>
    );
}
