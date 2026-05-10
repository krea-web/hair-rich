"use client";

import { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}
interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary editoriale: cattura crash dei React tree (admin, profilo, booking)
 * e mostra un messaggio elegante invece di white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: unknown) {
        // eslint-disable-next-line no-console
        console.error("[Hair Rich] ErrorBoundary caught:", error, info);
    }

    private reset = () => {
        this.setState({ hasError: false, error: undefined });
        if (typeof window !== "undefined") window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;
        if (this.props.fallback) return this.props.fallback;

        return (
            <div className="min-h-[60vh] bg-black flex items-center justify-center px-6 py-20">
                <div className="max-w-md text-center">
                    <span className="text-display-alt text-2xl text-accent-warm">Oops</span>
                    <h2 className="text-display text-3xl md:text-4xl text-warm-white tracking-tight mt-2 leading-tight">
                        Qualcosa non ha tenuto.
                    </h2>
                    <p className="mt-4 text-warm-white-muted text-sm leading-relaxed">
                        Abbiamo un piccolo intoppo. Ricarica la pagina o torna alla home — il tuo lavoro
                        non è perso.
                    </p>
                    {this.state.error?.message && (
                        <pre className="mt-4 text-[10px] text-silver-dark font-mono bg-carbon border border-line rounded-[var(--radius-sm)] p-3 overflow-auto text-left">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                            onClick={this.reset}
                            className="px-6 py-3 bg-accent-warm text-black rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:brightness-110 transition-all active:scale-95"
                        >
                            Ricarica
                        </button>
                        <a
                            href="/"
                            className="px-6 py-3 border border-line text-warm-white rounded-full text-[10px] uppercase tracking-[0.3em] font-body font-semibold hover:border-warm-white transition-colors"
                        >
                            Home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}
