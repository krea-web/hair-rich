"use client";

import type { ReactNode } from "react";
import { useClientPath, handleClientLink } from "@/lib/clientRouter";
import { Wordmark } from "@/components/landing/_shared/Wordmark";
import { useSkillsConfig } from "@/lib/skills/useSkillsConfig";
import { useCurrentCustomer } from "@/lib/supabase/me";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
    // If present, voice is shown only when AT LEAST ONE of these skill_keys
    // is enabled in skills_config. Voices without `anySkill` are always shown.
    anySkill?: string[];
}

const NAV_ITEMS: NavItem[] = [
    {
        href: "/profilo",
        label: "Dashboard",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        href: "/profilo/appuntamenti",
        label: "Appuntamenti",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        href: "/profilo/storia",
        label: "La mia storia",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        ),
    },
    {
        href: "/profilo/credito",
        label: "Crediti & bonus",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L4 6v6c0 5 3.4 9.5 8 10 4.6-.5 8-5 8-10V6l-8-4z" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        ),
        anySkill: ["service_packages", "loyalty", "coupons"],
    },
    {
        href: "/profilo/referral",
        label: "Passaparola",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
        anySkill: ["referrals"],
    },
    {
        href: "/profilo/recensioni",
        label: "Recensioni",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.9 6.26 6.6.54-5 4.3 1.5 6.4L12 16.9 5.99 19.5l1.5-6.4-5-4.3 6.6-.54L12 2z" />
            </svg>
        ),
        anySkill: ["reviews_harvester", "post_visit_survey"],
    },
    {
        href: "/profilo/impostazioni",
        label: "Impostazioni",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
    },
];

export function ProfiloLayout({ children }: { children: ReactNode }) {
    const pathname = useClientPath();
    const { ready, anyActive } = useSkillsConfig();
    const { customer } = useCurrentCustomer();

    const firstName = (customer?.first_name ?? "").trim();
    const lastName = (customer?.last_name ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Cliente";
    const initials =
        (firstName.charAt(0) + (lastName.charAt(0) || firstName.charAt(1) || "")).toUpperCase() || "·";
    const email = customer?.email ?? "";

    const handleSignOut = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch {
            /* fallback below */
        }
        window.location.assign("/");
    };

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (!item.anySkill) return true;
        // Hide gated items until the first fetch resolves — avoids briefly
        // showing entries that the customer would only see vanish a moment
        // later. The cost is a small first-paint delay for those voices,
        // which is acceptable for navigation that is otherwise stable.
        if (!ready) return false;
        return anyActive(item.anySkill);
    });

    return (
        <div className="min-h-[100dvh] flex flex-col md:flex-row bg-black">
            {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-[280px] bg-black-2 border-r border-line fixed inset-y-0 left-0 z-10 overflow-hidden">
                {/* Decorative background mark */}
                <div
                    aria-hidden="true"
                    className="absolute -bottom-12 -right-16 text-display text-[16rem] font-semibold text-warm-white/[0.03] leading-none tracking-tighter pointer-events-none select-none"
                >
                    H
                </div>

                <div className="relative p-8">
                    <a href="/" onClick={handleClientLink} className="inline-block mb-12">
                        <Wordmark variant="wordmark" size="md" />
                    </a>

                    <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold whitespace-nowrap">
                        Area personale
                    </span>

                    <nav className="mt-8 space-y-1.5">
                        {visibleItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleClientLink}
                                    className={`relative flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] transition-colors group ${
                                        isActive
                                            ? "bg-accent-warm text-black"
                                            : "text-silver hover:text-warm-white hover:bg-carbon"
                                    }`}
                                >
                                    {isActive && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -left-8 top-1/2 -translate-y-1/2 w-px h-6 bg-accent-warm"
                                        />
                                    )}
                                    {item.icon}
                                    <span className="font-body text-sm font-semibold">{item.label}</span>
                                </a>
                            );
                        })}
                    </nav>
                </div>

                <div className="relative mt-auto p-8 border-t border-line">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-warm to-warning text-black flex items-center justify-center font-display font-semibold shadow-[0_8px_20px_-8px_rgba(212,165,116,0.6)]">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-warm-white text-sm font-semibold truncate">{fullName}</p>
                            {email && (
                                <p className="text-silver-dark text-xs truncate">{email}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="mt-6 w-full py-2.5 border border-line rounded-[var(--radius-sm)] text-[10px] uppercase tracking-[0.3em] font-body font-semibold text-silver-dark hover:text-warm-white hover:border-warm-white transition-colors"
                    >
                        Esci
                    </button>
                </div>
            </aside>

            {/* ── Mobile top bar ──────────────────────────────────────────── */}
            <header className="md:hidden sticky top-0 z-30 bg-black/85 backdrop-blur-md border-b border-line h-14 flex items-center justify-between px-4">
                <a
                    href="/"
                    onClick={handleClientLink}
                    aria-label="Torna al sito"
                    className="inline-flex items-center gap-2 px-3 py-2 -ml-1 rounded-full border border-line text-warm-white active:scale-95 transition-transform"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
                        <path d="M9 21V14h6v7" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-body font-semibold">Sito</span>
                </a>
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent-warm font-body font-semibold">
                    Profilo
                </span>
            </header>

            {/* ── Main ──────────────────────────────────────────────────────── */}
            <main className="flex-1 md:ml-[280px] pb-[80px] md:pb-0 relative overflow-x-hidden min-h-[100dvh]">
                {children}
            </main>

            {/* ── Mobile Bottom Nav ──────────────────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-line safe-bottom">
                <div className="flex items-center justify-around h-16">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={handleClientLink}
                                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                                    isActive ? "text-accent-warm" : "text-silver-dark hover:text-silver"
                                }`}
                            >
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-0 h-0.5 w-8 bg-accent-warm rounded-full"
                                    />
                                )}
                                {item.icon}
                                <span className="text-[9px] uppercase font-semibold tracking-wider font-body">
                                    {item.label}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
