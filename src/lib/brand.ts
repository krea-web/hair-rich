// Hair Rich · Brand & theme helpers
//
// Astro/React isolate hook + Astro server-side getter per leggere il
// nome del brand, la sede, e i token di tema dal DB (salon_settings +
// cms_blocks). Fallback chain:
//   1. salon_settings.theme.* / parent_brand_name / display_name
//   2. cms_blocks (site_brand_name, site_brand_location, ecc.)
//   3. env PUBLIC_BRAND_NAME / PUBLIC_BRAND_LOCATION
//   4. Defaults hardcoded "Hair Rich" / "Olbia"
//
// Per ora il fallback chain è banale: leggiamo da cms_blocks + env. Il
// passaggio completo a salon_settings.theme avverrà quando ogni
// componente customer-facing consumerà il hook (lavoro incrementale).

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface BrandInfo {
    name: string;             // "Hair Rich"
    location: string;         // "Olbia"
    fullName: string;         // "Hair Rich Olbia"
    taglineShort: string;     // "Barberia di precisione"
    adminTitle: string;       // "HAIR RICH ADMIN"
    staffTitle: string;       // "HAIR RICH STAFF"
}

export interface BrandTheme {
    accent_color: string;
    accent_color_warm: string;
    background_color: string;
    surface_color: string;
    text_color: string;
    font_display: string;
    font_body: string;
    logo_url: string | null;
    wordmark_text: string | null;
}

const DEFAULT_BRAND: BrandInfo = {
    name: "Hair Rich",
    location: "Olbia",
    fullName: "Hair Rich Olbia",
    taglineShort: "Barberia di precisione",
    adminTitle: "HAIR RICH ADMIN",
    staffTitle: "HAIR RICH STAFF",
};

const DEFAULT_THEME: BrandTheme = {
    accent_color: "#D4A574",
    accent_color_warm: "#D4A574",
    background_color: "#0a0a0a",
    surface_color: "#121212",
    text_color: "#F5F0E8",
    font_display: "Fraunces",
    font_body: "Inter",
    logo_url: null,
    wordmark_text: null,
};

let cachedBrand: BrandInfo | null = null;
let cachedTheme: BrandTheme | null = null;
let cachedPromise: Promise<{ brand: BrandInfo; theme: BrandTheme }> | null = null;

async function fetchBrandFromDB(): Promise<{ brand: BrandInfo; theme: BrandTheme }> {
    try {
        const supabase = createClient();
        const [cmsResp, settingsResp] = await Promise.all([
            supabase
                .from("cms_blocks")
                .select("key, value")
                .in("key", [
                    "site_brand_name",
                    "site_brand_location",
                    "site_brand_full",
                    "site_brand_tagline_short",
                    "admin_sidebar_brand",
                    "staff_sidebar_brand",
                ]),
            supabase.from("salon_settings").select("display_name, theme, parent_brand_name, city").limit(1).maybeSingle(),
        ]);

        const cms = new Map<string, string>();
        for (const r of (cmsResp.data ?? []) as { key: string; value: string }[]) {
            cms.set(r.key, r.value);
        }
        const settings = (settingsResp.data ?? {}) as {
            display_name?: string;
            theme?: Partial<BrandTheme>;
            parent_brand_name?: string;
            city?: string;
        };

        const brand: BrandInfo = {
            name: settings.parent_brand_name ?? cms.get("site_brand_name") ?? DEFAULT_BRAND.name,
            location: cms.get("site_brand_location") ?? settings.city ?? DEFAULT_BRAND.location,
            fullName: cms.get("site_brand_full") ?? settings.display_name ?? DEFAULT_BRAND.fullName,
            taglineShort: cms.get("site_brand_tagline_short") ?? DEFAULT_BRAND.taglineShort,
            adminTitle: cms.get("admin_sidebar_brand") ?? DEFAULT_BRAND.adminTitle,
            staffTitle: cms.get("staff_sidebar_brand") ?? DEFAULT_BRAND.staffTitle,
        };

        const theme: BrandTheme = { ...DEFAULT_THEME, ...(settings.theme ?? {}) };

        cachedBrand = brand;
        cachedTheme = theme;
        return { brand, theme };
    } catch {
        return { brand: DEFAULT_BRAND, theme: DEFAULT_THEME };
    }
}

/**
 * React hook che restituisce brand + theme. La prima chiamata fetcha dal
 * DB e cache il risultato a livello modulo. Le chiamate successive sono
 * istantanee. Mostra DEFAULT_BRAND finché la fetch non completa, così
 * non ci sono flash di "loading".
 */
export function useBrand(): { brand: BrandInfo; theme: BrandTheme; ready: boolean } {
    const [state, setState] = useState<{ brand: BrandInfo; theme: BrandTheme; ready: boolean }>({
        brand: cachedBrand ?? DEFAULT_BRAND,
        theme: cachedTheme ?? DEFAULT_THEME,
        ready: cachedBrand !== null,
    });

    useEffect(() => {
        if (cachedBrand && cachedTheme) {
            setState({ brand: cachedBrand, theme: cachedTheme, ready: true });
            return;
        }
        if (!cachedPromise) cachedPromise = fetchBrandFromDB();
        let cancelled = false;
        cachedPromise.then(({ brand, theme }) => {
            if (!cancelled) setState({ brand, theme, ready: true });
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}

/**
 * Inietta i token di tema come CSS custom properties sul :root. Va
 * chiamato una volta sola (es. all'avvio dell'app).
 */
export function applyThemeToCss(theme: BrandTheme): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--brand-accent", theme.accent_color);
    root.style.setProperty("--brand-accent-warm", theme.accent_color_warm);
    root.style.setProperty("--brand-bg", theme.background_color);
    root.style.setProperty("--brand-surface", theme.surface_color);
    root.style.setProperty("--brand-text", theme.text_color);
    root.style.setProperty("--brand-font-display", theme.font_display);
    root.style.setProperty("--brand-font-body", theme.font_body);
}
