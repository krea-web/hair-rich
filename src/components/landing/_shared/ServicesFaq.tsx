"use client";

import { useT } from "@/i18n/useLang";
import { FAQAccordion } from "./FAQAccordion";

// Wrapper i18n della FAQ /servizi (display). Lo schema FAQPage JSON-LD resta
// generato server-side in IT dall'array FAQ in servizi.astro (route canonica IT).
export function ServicesFaq() {
    const { t } = useT();
    const s = t.servicesPage;
    return <FAQAccordion eyebrow={s.faqEyebrow} title={s.faqTitle} items={s.faq} />;
}
