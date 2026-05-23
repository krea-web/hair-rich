"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClientPath, handleClientLink } from "@/lib/clientRouter";
import { useAdminNotifyStore, useAdminInboxStore } from "@/lib/store";

const MAIN_MENU = [
    { href: "/admin", label: "Dashboard", icon: "svg-dash" },
    { href: "/admin/inbox", label: "Inbox", icon: "svg-inbox" },
    { href: "/admin/agenda", label: "Agenda", icon: "svg-calendar" },
    { href: "/admin/waitlist", label: "Lista d'attesa", icon: "svg-pause" },
    { href: "/admin/chiusure", label: "Chiusure & ferie", icon: "svg-pause" },
    { href: "/admin/statistiche", label: "Statistiche", icon: "svg-chart" },
    { href: "/admin/clienti", label: "Clienti", icon: "svg-users" },
    { href: "/admin/ordini", label: "Ordini & Cassa", icon: "svg-wallet" },
    { href: "/admin/foto-risultati", label: "Foto risultato", icon: "svg-camera" },
];

const SETTINGS_MENU = [
    { href: "/admin/servizi", label: "Servizi" },
    { href: "/admin/prodotti", label: "Prodotti" },
    { href: "/admin/staff", label: "Staff" },
    { href: "/admin/orari", label: "Orari staff" },
    { href: "/admin/marketing", label: "Recensioni" },
    { href: "/admin/gamification", label: "Coupon & sconti" },
    { href: "/admin/cms", label: "Testi del sito" },
    { href: "/admin/funzionalita", label: "Funzionalità (Skills Hub)" },
    { href: "/admin/log", label: "Log attività" },
    { href: "/admin/impostazioni", label: "Impostazioni Salone" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = useClientPath();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const newBookingsCount = useAdminNotifyStore((s) => s.newBookingsCount);
    const markSeen = useAdminNotifyStore((s) => s.markSeen);
    const inboxUnreadCount = useAdminInboxStore((s) => s.unreadCount);

    useEffect(() => {
        // Visiting the agenda clears the unseen-new-bookings counter.
        if (pathname === "/admin/agenda" && newBookingsCount > 0) markSeen();
    }, [pathname, newBookingsCount, markSeen]);

    const renderIcon = (type: string) => {
        switch (type) {
            case "svg-dash":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                );
            case "svg-calendar":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                    </svg>
                );
            case "svg-users":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                );
            case "svg-wallet":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="21 8 21 21 3 21 3 8" />
                        <rect x="1" y="3" width="22" height="5" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                );
            case "svg-camera":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                );
            case "svg-pause":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                );
            case "svg-chart":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="20" x2="21" y2="20" />
                        <rect x="5" y="12" width="3" height="8" />
                        <rect x="10" y="6" width="3" height="14" />
                        <rect x="15" y="9" width="3" height="11" />
                    </svg>
                );
            case "svg-inbox":
                return (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                    </svg>
                );
        }
    };

    const closeAndNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
        setSidebarOpen(false);
        handleClientLink(e);
    };

    return (
        <div className="flex h-[100dvh] bg-black text-warm-white selection:bg-carbon selection:text-warm-white overflow-hidden">
            <div className="lg:hidden fixed top-0 w-full h-14 bg-carbon border-b border-line flex items-center justify-between px-4 z-40">
                <a href="/admin" onClick={handleClientLink} className="text-display text-sm tracking-[0.2em]">HAIR RICH ADMIN</a>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2">
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
                        <div className="p-4 flex items-center justify-between group cursor-pointer hover:bg-carbon-2 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-accent-warm text-black rounded flex items-center justify-center font-bold text-xs uppercase">
                                    O
                                </div>
                                <span className="font-body text-sm font-semibold truncate">Hair Rich Olbia</span>
                            </div>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-silver-dark opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-8 scrollbar-hide">
                            <div>
                                <div className="px-3 mb-2 text-xs font-semibold text-silver-dark uppercase tracking-wider">Principale</div>
                                <nav className="space-y-0.5">
                                    {MAIN_MENU.map((item) => {
                                        const active = pathname === item.href;
                                        const agendaBadge = item.href === "/admin/agenda" && newBookingsCount > 0;
                                        const inboxBadge = item.href === "/admin/inbox" && inboxUnreadCount > 0;
                                        const badgeCount = agendaBadge ? newBookingsCount : inboxBadge ? inboxUnreadCount : 0;
                                        return (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={closeAndNav}
                                                className={`flex flex-row items-center gap-3 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors ${active ? "bg-carbon text-warm-white font-medium" : "text-silver hover:bg-carbon-2"}`}
                                            >
                                                <span className={active ? "text-warm-white" : "text-silver-dark"}>{renderIcon(item.icon)}</span>
                                                <span className="flex-1">{item.label}</span>
                                                {badgeCount > 0 && (
                                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-accent-warm text-black text-[10px] font-body font-semibold tabular-nums">
                                                        {badgeCount > 9 ? "9+" : badgeCount}
                                                    </span>
                                                )}
                                            </a>
                                        );
                                    })}
                                </nav>
                            </div>

                            <div>
                                <div className="px-3 mb-2 text-xs font-semibold text-silver-dark uppercase tracking-wider">Gestione</div>
                                <nav className="space-y-0.5">
                                    {SETTINGS_MENU.map((item) => {
                                        const active = pathname.startsWith(item.href);
                                        return (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={closeAndNav}
                                                className={`flex items-center gap-3 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors ${active ? "bg-carbon text-warm-white font-medium" : "text-silver hover:bg-carbon-2"}`}
                                            >
                                                <svg viewBox="0 0 24 24" className={`w-4 h-4 ${active ? "text-warm-white" : "text-silver-dark"}`} fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                    <polyline points="10 9 9 9 8 9" />
                                                </svg>
                                                {item.label}
                                            </a>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        <div className="p-3 mt-auto">
                            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-[var(--radius-sm)] text-sm text-silver hover:bg-carbon-2 transition-colors">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-silver-dark" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Esci dall'Admin
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {isSidebarOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="flex-1 w-full bg-black pt-14 lg:pt-0 overflow-y-auto h-[100dvh]">
                {children}
            </main>
        </div>
    );
}
