"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClientPath, handleClientLink } from "@/lib/clientRouter";
import { useBrand } from "@/lib/brand";

interface StaffMe {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
}

const MENU = [
    { href: "/staff", label: "Oggi", icon: "today" },
    { href: "/staff/appuntamenti", label: "Appuntamenti", icon: "cal" },
    { href: "/staff/clienti", label: "I miei clienti", icon: "users" },
    { href: "/staff/incassi", label: "Incassi", icon: "wallet" },
    { href: "/staff/ferie", label: "Ferie & permessi", icon: "off" },
    { href: "/staff/timbratura", label: "Timbratura", icon: "clock" },
];

export function StaffLayout({ me, children }: { me: StaffMe; children: ReactNode }) {
    const pathname = useClientPath();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { brand } = useBrand();

    const closeAndNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
        setSidebarOpen(false);
        handleClientLink(e);
    };

    const initials = me.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex h-[100dvh] bg-black text-warm-white selection:bg-carbon selection:text-warm-white overflow-hidden">
            <div className="lg:hidden fixed top-0 w-full h-14 bg-carbon border-b border-line flex items-center justify-between px-4 z-40">
                <a href="/staff" onClick={handleClientLink} className="text-display text-sm tracking-[0.2em]">
                    {brand.staffTitle}
                </a>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2" aria-label="Menu">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            <AnimatePresence>
                {(isSidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-line flex flex-col h-[100dvh] shadow-2xl lg:shadow-none"
                    >
                        <div className="p-4 flex items-center gap-3 border-b border-line">
                            {me.avatar_url ? (
                                <img
                                    src={me.avatar_url}
                                    alt={me.name}
                                    className="w-10 h-10 rounded-full object-cover border border-line"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-warm to-warning text-black flex items-center justify-center font-body font-bold text-sm">
                                    {initials || "?"}
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="font-body text-sm font-semibold truncate">{me.name}</div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-silver-dark">{me.role}</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                            <nav className="space-y-0.5">
                                {MENU.map((item) => {
                                    const active =
                                        item.href === "/staff"
                                            ? pathname === "/staff"
                                            : pathname.startsWith(item.href);
                                    return (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            onClick={closeAndNav}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors ${
                                                active
                                                    ? "bg-carbon text-warm-white font-medium"
                                                    : "text-silver hover:bg-carbon-2"
                                            }`}
                                        >
                                            <Icon name={item.icon} active={active} />
                                            <span className="flex-1">{item.label}</span>
                                        </a>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-3 mt-auto border-t border-line">
                            <button
                                onClick={async () => {
                                    const { createClient } = await import("@/lib/supabase/client");
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = "/";
                                }}
                                className="flex items-center gap-3 px-3 py-2 w-full rounded-[var(--radius-sm)] text-sm text-silver hover:bg-carbon-2 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-silver-dark" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Esci
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="flex-1 w-full bg-black pt-14 lg:pt-0 overflow-y-auto h-[100dvh]">{children}</main>
        </div>
    );
}

function Icon({ name, active }: { name: string; active: boolean }) {
    const cls = `w-4 h-4 ${active ? "text-warm-white" : "text-silver-dark"}`;
    switch (name) {
        case "today":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                </svg>
            );
        case "cal":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            );
        case "users":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                </svg>
            );
        case "wallet":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
            );
        case "off":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9" />
                    <path d="M12 7v5l3 2" />
                    <path d="M3 12l3 3" />
                </svg>
            );
        case "clock":
            return (
                <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            );
        default:
            return null;
    }
}
