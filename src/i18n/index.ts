/**
 * i18n entrypoint. Esporta i dizionari + helper per Astro pages e React islands.
 */
import { it } from "./it";
import { en } from "./en";
import { fr } from "./fr";
import { de } from "./de";
import type { Dict, Locale } from "./types";

export { LOCALES, LOCALE_META } from "./types";
export type { Dict, Locale } from "./types";

const DICTS: Record<Locale, Dict> = { it, en, fr, de };

/**
 * Per `.astro`: deduce la lingua dall'URL.
 * Pattern: `/` o `/it/...` → "it" · `/en/...` → "en" · ecc.
 */
export function getLangFromUrl(url: URL): Locale {
    const seg = url.pathname.split("/").filter(Boolean)[0];
    if (seg === "en" || seg === "fr" || seg === "de") return seg;
    return "it";
}

/**
 * Helper centrale: data una lingua, ritorna il dizionario.
 * Uso in `.astro`: `const t = useTranslations(getLangFromUrl(Astro.url))`
 * Uso in React islands: passare `lang` come prop e chiamare `useTranslations(lang)`.
 */
export function useTranslations(lang: Locale): Dict {
    return DICTS[lang] ?? DICTS.it;
}

/** Genera il path equivalente in un'altra lingua, mantenendo la sotto-pagina. */
export function localizePath(currentPath: string, target: Locale): string {
    // Normalizza: rimuove eventuale prefisso lingua
    const segs = currentPath.split("/").filter(Boolean);
    if (segs[0] === "en" || segs[0] === "fr" || segs[0] === "de") segs.shift();
    const subPath = segs.join("/");
    if (target === "it") return subPath ? `/${subPath}` : "/";
    return subPath ? `/${target}/${subPath}` : `/${target}/`;
}

/** Tutte le varianti URL per hreflang dato un path. */
export function getAlternates(currentPath: string, baseUrl: string) {
    const locales: Locale[] = ["it", "en", "fr", "de"];
    return locales.map((loc) => ({
        hreflang: loc === "it" ? "it-IT" : loc === "en" ? "en" : loc === "fr" ? "fr-FR" : "de-DE",
        href: new URL(localizePath(currentPath, loc), baseUrl).toString(),
    }));
}

/** Format prezzo locale-aware (estende format.ts senza rompere il default). */
export function formatPriceLocale(cents: number, lang: Locale): string {
    const locale =
        lang === "it" ? "it-IT" : lang === "en" ? "en-US" : lang === "fr" ? "fr-FR" : "de-DE";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Format data locale-aware (data short tipo "12 Set 2024"). */
export function formatDateLocale(d: Date | string, lang: Locale): string {
    const date = typeof d === "string" ? new Date(d) : d;
    const locale =
        lang === "it" ? "it-IT" : lang === "en" ? "en-US" : lang === "fr" ? "fr-FR" : "de-DE";
    return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
