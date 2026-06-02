"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/landing/_shared/Wordmark";
import { LangSwitcher } from "@/components/landing/_shared/LangSwitcher";
import { MobileMenuTrigger } from "@/components/ui/MobileMenu";
import { CartIconButton } from "@/components/shop/CartIconButton";
import { useBookingDrawer } from "@/lib/store";
import { useT } from "@/i18n/useLang";

const LINKS = [
    { href: "/servizi", key: "services" as const },
    { href: "/lavori", key: "gallery" as const },
    { href: "/team", key: "team" as const },
    { href: "/prodotti", key: "products" as const },
    { href: "/contatti", key: "about" as const },
];

/**
 * Global persistent header for non-home pages. Position fixed, transparent
 * at the top, becomes solid black once you scroll. Carries logo, full nav
 * links (desktop), language switcher and the Prenota CTA. Mobile shows
 * logo + hamburger trigger.
 */
export function SiteHeader() {
    const { t, lang } = useT();
    const openDrawer = useBookingDrawer((s) => s.open);
    const [path, setPath] = useState<string>("");
    const { scrollY } = useScroll();
    const bg = useTransform(scrollY, [0, 80], ["rgba(10,10,10,0)", "rgba(10,10,10,0.92)"]);
    const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

    useEffect(() => {
        if (typeof window !== "undefined") setPath(window.location.pathname);
    }, []);

    const homeHref = lang === "it" ? "/" : `/${lang}/`;

    return (
        <motion.header
            style={{ backgroundColor: bg }}
            className="hidden md:block fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
            data-intro-hidden
        >
            <motion.div
                style={{ opacity: borderOpacity }}
                className="absolute bottom-0 left-0 right-0 h-px bg-line pointer-events-none"
            />
            <div className="relative grid grid-cols-3 items-center px-6 md:px-12 lg:px-20 py-4 md:py-5">
                <a href={homeHref} aria-label="Hair Rich · home" className="justify-self-start">
                    <Wordmark variant="wordmark" size="sm" className="md:[&>img]:h-9" />
                </a>
                <nav className="hidden md:flex items-center justify-center gap-9 text-[11px] uppercase tracking-[0.3em] font-body font-semibold text-silver">
                    {LINKS.map((link) => {
                        const active = path === link.href || path.startsWith(link.href + "/");
                        return (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`transition-colors ${
                                    active ? "text-warm-white" : "hover:text-warm-white"
                                }`}
                            >
                                {t.nav[link.key]}
                                {active && (
                                    <span aria-hidden="true" className="block h-px w-full bg-accent-warm mt-1.5" />
                                )}
                            </a>
                        );
                    })}
                </nav>
                <div className="justify-self-end flex items-center gap-2 md:gap-3">
                    <button
                        onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(6);
                            openDrawer();
                        }}
                        className="cta-shine cta-pulse hidden md:inline-flex items-center gap-2 bg-accent-warm text-black px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.25em] font-body font-semibold active:scale-95 hover:scale-[1.02] transition-transform"
                    >
                        {t.nav.bookCta}
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                    <CartIconButton size="md" />
                    <a
                        href="/profilo"
                        aria-label="Area personale"
                        className="hidden md:inline-flex w-9 h-9 items-center justify-center rounded-full border border-line text-warm-white hover:border-warm-white hover:bg-warm-white/5 active:scale-95 transition-all"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                            <path d="M4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </a>
                    <LangSwitcher current={lang} variant="navbar" />
                    <MobileMenuTrigger />
                </div>
            </div>
        </motion.header>
    );
}
