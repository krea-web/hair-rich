"use client";

import { useT } from "@/i18n/useLang";
import { FAQAccordion } from "./FAQAccordion";

// FAQ /prodotti localizzata client-side (display).
export function ProductsFaq() {
    const { t } = useT();
    const p = t.productsPage;
    return <FAQAccordion eyebrow={p.faqEyebrow} title={p.faqTitle} items={p.faq} />;
}
