"use client";

import { useEffect, useState, type MouseEvent } from "react";

/**
 * Minimal client-side router for SPA islands inside Astro catch-all pages.
 * Uses pushState + popstate; no external dependencies.
 */
export function useClientPath(): string {
    const [path, setPath] = useState<string>(() =>
        typeof window === "undefined" ? "/" : window.location.pathname
    );

    useEffect(() => {
        const onPop = () => setPath(window.location.pathname);
        const onPush = () => setPath(window.location.pathname);
        window.addEventListener("popstate", onPop);
        window.addEventListener("clientroute:change", onPush);
        return () => {
            window.removeEventListener("popstate", onPop);
            window.removeEventListener("clientroute:change", onPush);
        };
    }, []);

    return path;
}

export function navigate(href: string): void {
    if (typeof window === "undefined") return;
    if (window.location.pathname === href) return;
    window.history.pushState(null, "", href);
    window.dispatchEvent(new Event("clientroute:change"));
    window.scrollTo(0, 0);
}

export function handleClientLink(e: MouseEvent<HTMLAnchorElement>): void {
    const target = e.currentTarget;
    const href = target.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target.target === "_blank") return;
    e.preventDefault();
    navigate(href);
}
