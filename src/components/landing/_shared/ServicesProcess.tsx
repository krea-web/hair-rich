"use client";

import { useT } from "@/i18n/useLang";
import { ProcessSteps } from "./ProcessSteps";

// Wrapper i18n: la pagina /servizi è una sola route (IT canonica), il cambio
// lingua avviene client-side. Questo wrapper localizza il blocco "processo".
export function ServicesProcess() {
    const { t } = useT();
    const s = t.servicesPage;
    return <ProcessSteps eyebrow={s.processEyebrow} title={s.processTitle} steps={s.process} />;
}
