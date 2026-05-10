"use client";

import { useEffect, useState } from "react";
import type { Locale } from "./types";
import { useTranslations as useDict } from "./index";

const isLocale = (v: string | undefined): v is Locale =>
    v === "it" || v === "en" || v === "fr" || v === "de";

/**
 * Hook React: ritorna la lingua corrente leggendo `document.body.dataset.lang`
 * (impostato da `RootLayout.astro`). Aggiorna in caso di SPA navigation.
 *
 * In SSR (Astro server render) ritorna "it" come fallback sicuro.
 */
export function useLang(): Locale {
    const [lang, setLang] = useState<Locale>(() => {
        if (typeof document === "undefined") return "it";
        const v = document.body?.dataset.lang;
        return isLocale(v) ? v : "it";
    });

    useEffect(() => {
        const update = () => {
            const v = document.body?.dataset.lang;
            if (isLocale(v) && v !== lang) setLang(v);
        };
        update();
        // Osserva mutazioni a body data-lang (per future SPA nav cross-lingua)
        const obs = new MutationObserver(update);
        obs.observe(document.body, { attributes: true, attributeFilter: ["data-lang"] });
        window.addEventListener("clientroute:change", update);
        return () => {
            obs.disconnect();
            window.removeEventListener("clientroute:change", update);
        };
    }, [lang]);

    return lang;
}

/** Combo: leggi la lingua corrente + il dizionario in un colpo. */
export function useT() {
    const lang = useLang();
    return { lang, t: useDict(lang) };
}
