import fs from "node:fs";
import path from "node:path";

const langs = ["en", "fr", "de"];
const docs = { privacy: "privacy", cookie: "cookie", termini: "terms" };

const legalTpl = (docKey) => `---
import RootLayout from "../../layouts/RootLayout.astro";
import LegalPage from "../../components/LegalPage.astro";
import { useTranslations, getLangFromUrl } from "@/i18n";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<RootLayout title={\`\${t.legal.${docKey}.title} · Hair Rich Olbia\`}>
  <LegalPage doc="${docKey}" />
</RootLayout>
`;

const loginTpl = `---
import RootLayout from "../../layouts/RootLayout.astro";
import { LoginForm } from "../../components/auth/LoginForm";
import { useTranslations, getLangFromUrl } from "@/i18n";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<RootLayout title={\`\${t.auth.login.welcome} · Hair Rich Olbia\`}>
  <LoginForm client:load />
</RootLayout>
`;

const registerTpl = `---
import RootLayout from "../../layouts/RootLayout.astro";
import { RegisterForm } from "../../components/auth/RegisterForm";
import { useTranslations, getLangFromUrl } from "@/i18n";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<RootLayout title={\`\${t.auth.register.title} · Hair Rich Olbia\`}>
  <RegisterForm client:load />
</RootLayout>
`;

for (const L of langs) {
    fs.mkdirSync(path.join("src/pages", L), { recursive: true });
    for (const [filename, key] of Object.entries(docs)) {
        fs.writeFileSync(path.join("src/pages", L, filename + ".astro"), legalTpl(key));
    }
    fs.writeFileSync(path.join("src/pages", L, "login.astro"), loginTpl);
    fs.writeFileSync(path.join("src/pages", L, "registrazione.astro"), registerTpl);
}
console.log("✓ scaffolded i18n pages for", langs.join(", "));
