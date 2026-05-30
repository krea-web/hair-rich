"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    className?: string;
    /** Min viewport width (px) at which sticky activates. Default 1024 (lg). */
    minWidth?: number;
    /** Top offset in rem. Default 6 (= 96px, lascia spazio al SiteHeader). */
    topRem?: number;
}

/**
 * Pinning client-side robusto via inline style.
 *
 * Storia del bug: position:sticky scritto in Tailwind (lg:sticky), in
 * classe custom (.sticky-pin) e in arbitrary syntax (lg:[position:sticky])
 * non si applicava sulla copia servita dal CDN nonostante fosse nel build
 * locale. Per chiudere la questione applichiamo `position: sticky` con
 * style inline programmatico dentro un useEffect — l'inline style ha la
 * specificita' massima e non puo' essere overridato da Tailwind, framer-
 * motion o CSS bundle stale.
 */
export function StickyOnDesktop({
    children,
    className = "",
    minWidth = 1024,
    topRem = 6,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const apply = () => {
            if (window.innerWidth >= minWidth) {
                el.style.position = "sticky";
                el.style.top = `${topRem}rem`;
                el.style.alignSelf = "flex-start";
            } else {
                el.style.position = "";
                el.style.top = "";
                el.style.alignSelf = "";
            }
        };
        apply();
        window.addEventListener("resize", apply);
        return () => window.removeEventListener("resize", apply);
    }, [minWidth, topRem]);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
