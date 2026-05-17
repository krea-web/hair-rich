"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/landing/_shared/Wordmark";
import { LangSwitcher } from "@/components/landing/_shared/LangSwitcher";
import { useT } from "@/i18n/useLang";

/**
 * Mobile-only top bar: not sticky, scrolls with the page. Liquid-glass
 * aesthetic (heavily blurred semi-transparent surface, no hard border)
 * so the IntroSequence canvas behind it appears to emerge through it.
 *
 * Layout:
 *  [        Hairrich extended logo (centered)        ] [profile] [lang]
 *
 * Hamburger removed: the bottom 5-tab nav (MobileBottomBar) is now the
 * primary navigation on mobile.
 */
export function MobileTopBar() {
    const { lang } = useT();
    const [profileHref, setProfileHref] = useState("/login");

    // Best-effort auth check: if there's a Supabase session, link straight
    // to /profilo, otherwise /login. Avoid SSR access.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data } = await supabase.auth.getSession();
                if (!alive) return;
                setProfileHref(data.session ? "/profilo" : "/login");
            } catch {
                /* keep default /login */
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    return (
        <header className="md:hidden relative z-30">
            <div
                className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(20,20,20,0.55) 0%, rgba(20,20,20,0.25) 70%, rgba(20,20,20,0) 100%)",
                    backdropFilter: "blur(18px) saturate(160%)",
                    WebkitBackdropFilter: "blur(18px) saturate(160%)",
                }}
            >
                {/* Left spacer to balance the grid */}
                <div aria-hidden="true" />

                {/* Centered wordmark */}
                <a
                    href={lang === "it" ? "/" : `/${lang}/`}
                    aria-label="Hair Rich · home"
                    className="justify-self-center pointer-events-auto inline-flex items-center"
                >
                    <Wordmark variant="wordmark" size="sm" className="[&>img]:h-7" />
                </a>

                {/* Right group: profile + lang */}
                <div className="justify-self-end flex items-center gap-1.5">
                    <a
                        href={profileHref}
                        aria-label="Profilo"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-warm-white active:scale-95 transition-transform"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            boxShadow:
                                "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)",
                        }}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </a>
                    <LangSwitcher current={lang} variant="navbar" />
                </div>
            </div>
        </header>
    );
}
