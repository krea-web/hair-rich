"use client";

import { useEffect, useState } from "react";
import { navigate } from "@/lib/clientRouter";

function readToken(): string {
    if (typeof window === "undefined") return "";
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
}

export function ReviewGate() {
    const [token, setToken] = useState("");

    useEffect(() => {
        setToken(readToken());
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6 font-body">
            <div className="max-w-md w-full bg-carbon border border-line rounded-[var(--radius-xl)] p-8 text-center space-y-6">
                <h1 className="text-display text-3xl text-warm-white">Hair Rich Olbia</h1>
                <p className="text-silver-dark text-sm">
                    Grazie per la tua visita! Come valuteresti la tua esperienza con il nostro Barber?
                </p>
                <p className="text-[10px] uppercase tracking-widest text-silver-dark opacity-50">
                    Token: {token || "—"}
                </p>

                <div className="flex justify-center gap-2 py-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => {
                                alert(`Rating ${star} stelle registrato tramite l'Edge Function review-gate!`);
                                if (star >= 4) {
                                    window.location.href = "https://g.page/r/CW7L55AEqsREEBM/review";
                                } else {
                                    alert("Aperto Modulo di Feedback Privato interno.");
                                    navigate("/");
                                }
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-black-2 transition-colors text-2xl text-accent-warm"
                        >
                            ★
                        </button>
                    ))}
                </div>

                <p className="text-[10px] uppercase tracking-widest text-silver-dark opacity-50">
                    Le recensioni a 4 o 5 stelle ti manderanno a Google. Le recensioni inferiori restano interne.
                </p>
            </div>
        </div>
    );
}
