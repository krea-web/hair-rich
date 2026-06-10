"use client";

import { useT } from "@/i18n/useLang";
import { ProcessSteps } from "./ProcessSteps";

// Blocco "valori" del team, localizzato client-side.
export function TeamValues() {
    const { t } = useT();
    const p = t.teamPage;
    return <ProcessSteps eyebrow={p.valuesEyebrow} title={p.valuesTitle} steps={p.values} />;
}
