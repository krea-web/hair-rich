// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // TODO: cambiare in https://www.hairricholbia.com appena il dominio sarà comprato e puntato.
  site: "https://hair-rich.vercel.app",
  output: "static",
  i18n: {
    defaultLocale: "it",
    locales: ["it", "en", "fr", "de"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    // Niente fallback: ogni lingua deve avere le proprie pagine.
    // I path mancanti (es. /en/login durante Wave 1) ricadono in 404 finché
    // non vengono scaffoldati nelle Wave successive.
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "it",
        locales: {
          it: "it-IT",
          en: "en-US",
          fr: "fr-FR",
          de: "de-DE",
        },
      },
      filter: (page) =>
        !page.includes("/admin") &&
        !page.includes("/profilo") &&
        !page.includes("/r/") &&
        !page.includes("/i/"),
    }),
  ],
  server: {
    port: 3000,
  },
});
