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

// SPA scopes: only catch-all Astro pages route client-side. Outside of
// these prefixes every navigation must be a full browser navigation so
// the destination Astro page actually loads. Without this guard a
// "client link" from /team to /team/cristian would only swap the URL
// via pushState and leave the visitor stuck on the TeamShowcase view.
const SPA_PREFIXES = ["/admin", "/profilo", "/staff"];

function inSameSpaScope(href: string): boolean {
    if (typeof window === "undefined") return false;
    const cur = window.location.pathname;
    for (const prefix of SPA_PREFIXES) {
        if (
            (href === prefix || href.startsWith(prefix + "/")) &&
            (cur === prefix || cur.startsWith(prefix + "/"))
        ) {
            return true;
        }
    }
    return false;
}

export function handleClientLink(e: MouseEvent<HTMLAnchorElement>): void {
    const target = e.currentTarget;
    const href = target.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target.target === "_blank") return;
    if (!inSameSpaScope(href)) return; // let the browser do a full navigation
    e.preventDefault();
    navigate(href);
}
