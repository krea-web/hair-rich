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

// Le classi .hr-sticky-md e .hr-sticky-lg sono definite in globals.css
// (CSS pure, niente React style tag). Garantisce che la regola sia nel
// bundle CSS che Astro emette per ogni pagina, indipendentemente da
// quando il componente fa hydration.

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
                // setProperty con la flag "important" e' equivalente a
                // `position: sticky !important` inline: vince qualsiasi
                // regola CSS, qualsiasi cache.
                el.style.setProperty("position", "sticky", "important");
                el.style.setProperty("top", `${topRem}rem`, "important");
                el.style.setProperty("align-self", "start", "important");
            } else {
                el.style.removeProperty("position");
                el.style.removeProperty("top");
                el.style.removeProperty("align-self");
            }
        };
        apply();
        window.addEventListener("resize", apply);
        return () => window.removeEventListener("resize", apply);
    }, [minWidth, topRem]);

    // Scegliamo la classe statica in base al breakpoint richiesto cosi
    // il sticky e' attivo anche prima dell'hydration (CSS pure).
    const staticClass = minWidth >= 1024 ? "hr-sticky-lg" : "hr-sticky-md";

    return (
        <div ref={ref} className={`${className} ${staticClass}`}>
            {children}
        </div>
    );
}
