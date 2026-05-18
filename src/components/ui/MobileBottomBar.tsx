"use client";

import { useEffect, useState } from "react";
import { useBookingDrawer } from "@/lib/store";

interface Tab {
    href?: string;
    label: string;
    icon: React.ReactNode;
    primary?: boolean;
    action?: "drawer";
}

const TABS: Tab[] = [
    {
        href: "/team",
        label: "Team",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        href: "/servizi",
        label: "Servizi",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5L4 20m11-11l5-5M14.5 14.5L20 20M4 4l5.5 5.5" />
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="6" r="2" />
            </svg>
        ),
    },
    {
        label: "Prenota",
        action: "drawer",
        primary: true,
        icon: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
        ),
    },
    {
        href: "/lavori",
        label: "Lavori",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
            </svg>
        ),
    },
    {
        href: "/prodotti",
        label: "Shop",
        icon: (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 0 1-8 0" />
            </svg>
        ),
    },
];

/**
 * Primary mobile navigation bar — 5 tabs (Team / Servizi / Prenota center /
 * Lavori / Shop). The center "Prenota" tab is visually elevated and opens
 * the BookingDrawer instead of navigating. Home lives on the wordmark in
 * MobileTopBar.
 */
export function MobileBottomBar() {
    const [path, setPath] = useState<string>("");
    const [hidden, setHidden] = useState(true);
    const openDrawer = useBookingDrawer((s) => s.open);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const p = window.location.pathname;
        if (p.startsWith("/admin") || p.startsWith("/profilo")) {
            setHidden(true);
            return;
        }
        setPath(p);
        setHidden(false);
    }, []);

    if (hidden) return null;

    const isActive = (href?: string) => {
        if (!href) return false;
        if (href === "/") return path === "/" || path === "";
        return path === href || path.startsWith(href + "/");
    };

    const handleTabClick = (tab: Tab) => {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
        if (tab.action === "drawer") {
            openDrawer();
            return;
        }
        if (tab.href) {
            window.location.href = tab.href;
        }
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            aria-label="Navigazione principale"
            data-intro-hidden
        >
            <div className="pointer-events-auto bg-black/90 backdrop-blur-xl border-t border-line pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
                <ul className="grid grid-cols-5 items-end gap-0 px-2 max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const active = isActive(tab.href);
                        if (tab.primary) {
                            return (
                                <li key={tab.label} className="flex justify-center -mt-6">
                                    <button
                                        onClick={() => handleTabClick(tab)}
                                        className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                                        aria-label={tab.label}
                                    >
                                        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-warm text-black shadow-[0_8px_24px_-4px_rgba(212,165,116,0.55)] ring-4 ring-black">
                                            {tab.icon}
                                        </span>
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-accent-warm font-body font-semibold">
                                            {tab.label}
                                        </span>
                                    </button>
                                </li>
                            );
                        }
                        return (
                            <li key={tab.label}>
                                <button
                                    onClick={() => handleTabClick(tab)}
                                    className={`w-full min-h-[52px] flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                                        active ? "text-warm-white" : "text-silver-dark hover:text-warm-white"
                                    }`}
                                    aria-current={active ? "page" : undefined}
                                    aria-label={tab.label}
                                >
                                    <span className="relative">
                                        {tab.icon}
                                        {active && (
                                            <span
                                                aria-hidden="true"
                                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-warm"
                                            />
                                        )}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-body font-semibold">
                                        {tab.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
