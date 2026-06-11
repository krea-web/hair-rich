/**
 * Contenuto della pagina HTML "Mappa del sito".
 *
 * Pagina server-rendered (Astro puro) linkata dal footer: elenca tutte le pagine
 * pubbliche raggruppate, così i crawler (e gli utenti) non perdono mai nulla.
 * Localizzata per lingua (it/en/fr/de). I path con `langAware: true` vengono
 * prefissati con la lingua nel componente.
 */

import type { Locale } from "@/i18n";

export interface SmItem {
  label: string;
  path: string;
  langAware: boolean;
}
export interface SmGroup {
  title: string;
  items: SmItem[];
}
export interface SmContent {
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbLabel: string;
  eyebrow: string;
  h1: string;
  intro: string;
  groups: SmGroup[];
}

export const MAPPA_DEL_SITO: Record<Locale, SmContent> = {
  it: {
    metaTitle: "Mappa del sito | Hair Rich Olbia",
    metaDescription:
      "Mappa del sito Hair Rich Olbia: tutte le pagine del barbiere a Olbia — servizi, lavori, team, prodotti, contatti, parrucchiere uomo e taglio a domicilio.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Mappa del sito",
    eyebrow: "Indice completo",
    h1: "Mappa del sito",
    intro: "Tutte le pagine di Hair Rich Olbia in un colpo d'occhio.",
    groups: [
      {
        title: "Il sito",
        items: [
          { label: "Home", path: "/", langAware: true },
          { label: "Servizi e listino", path: "/servizi", langAware: true },
          { label: "Lavori e portfolio", path: "/lavori", langAware: true },
          { label: "Il team", path: "/team", langAware: true },
          { label: "Prodotti", path: "/prodotti", langAware: true },
          { label: "Contatti", path: "/contatti", langAware: true },
        ],
      },
      {
        title: "Servizi locali",
        items: [
          { label: "Parrucchiere uomo a Olbia", path: "/parrucchiere-olbia", langAware: true },
          { label: "Barbiere a domicilio in Costa Smeralda", path: "/taglio-a-domicilio", langAware: true },
        ],
      },
      {
        title: "Area clienti",
        items: [
          { label: "Accedi", path: "/login", langAware: false },
          { label: "Registrati", path: "/registrazione", langAware: false },
        ],
      },
      {
        title: "Note legali",
        items: [
          { label: "Privacy", path: "/privacy", langAware: false },
          { label: "Cookie", path: "/cookie", langAware: false },
          { label: "Termini", path: "/termini", langAware: false },
        ],
      },
    ],
  },

  en: {
    metaTitle: "Sitemap | Hair Rich Olbia",
    metaDescription:
      "Hair Rich Olbia sitemap: every page of the Olbia barber — services, work, team, products, contacts, men's hairdresser and mobile barber.",
    breadcrumbHome: "Home",
    breadcrumbLabel: "Sitemap",
    eyebrow: "Full index",
    h1: "Sitemap",
    intro: "Every page of Hair Rich Olbia at a glance.",
    groups: [
      {
        title: "The site",
        items: [
          { label: "Home", path: "/", langAware: true },
          { label: "Services & pricing", path: "/servizi", langAware: true },
          { label: "Work & portfolio", path: "/lavori", langAware: true },
          { label: "The team", path: "/team", langAware: true },
          { label: "Products", path: "/prodotti", langAware: true },
          { label: "Contacts", path: "/contatti", langAware: true },
        ],
      },
      {
        title: "Local services",
        items: [
          { label: "Men's hairdresser in Olbia", path: "/parrucchiere-olbia", langAware: true },
          { label: "Mobile barber in the Costa Smeralda", path: "/taglio-a-domicilio", langAware: true },
        ],
      },
      {
        title: "Client area",
        items: [
          { label: "Log in", path: "/login", langAware: false },
          { label: "Register", path: "/registrazione", langAware: false },
        ],
      },
      {
        title: "Legal",
        items: [
          { label: "Privacy", path: "/privacy", langAware: false },
          { label: "Cookie", path: "/cookie", langAware: false },
          { label: "Terms", path: "/termini", langAware: false },
        ],
      },
    ],
  },

  fr: {
    metaTitle: "Plan du site | Hair Rich Olbia",
    metaDescription:
      "Plan du site Hair Rich Olbia : toutes les pages du barbier à Olbia — services, réalisations, équipe, produits, contacts, coiffeur homme et barbier à domicile.",
    breadcrumbHome: "Accueil",
    breadcrumbLabel: "Plan du site",
    eyebrow: "Index complet",
    h1: "Plan du site",
    intro: "Toutes les pages de Hair Rich Olbia en un coup d'œil.",
    groups: [
      {
        title: "Le site",
        items: [
          { label: "Accueil", path: "/", langAware: true },
          { label: "Services et tarifs", path: "/servizi", langAware: true },
          { label: "Réalisations et portfolio", path: "/lavori", langAware: true },
          { label: "L'équipe", path: "/team", langAware: true },
          { label: "Produits", path: "/prodotti", langAware: true },
          { label: "Contacts", path: "/contatti", langAware: true },
        ],
      },
      {
        title: "Services locaux",
        items: [
          { label: "Coiffeur homme à Olbia", path: "/parrucchiere-olbia", langAware: true },
          { label: "Barbier à domicile en Costa Smeralda", path: "/taglio-a-domicilio", langAware: true },
        ],
      },
      {
        title: "Espace client",
        items: [
          { label: "Se connecter", path: "/login", langAware: false },
          { label: "S'inscrire", path: "/registrazione", langAware: false },
        ],
      },
      {
        title: "Mentions légales",
        items: [
          { label: "Confidentialité", path: "/privacy", langAware: false },
          { label: "Cookies", path: "/cookie", langAware: false },
          { label: "Conditions", path: "/termini", langAware: false },
        ],
      },
    ],
  },

  de: {
    metaTitle: "Sitemap | Hair Rich Olbia",
    metaDescription:
      "Sitemap von Hair Rich Olbia: alle Seiten des Barbiers in Olbia — Leistungen, Arbeiten, Team, Produkte, Kontakte, Herrenfriseur und mobiler Barbier.",
    breadcrumbHome: "Startseite",
    breadcrumbLabel: "Sitemap",
    eyebrow: "Vollständiger Index",
    h1: "Sitemap",
    intro: "Alle Seiten von Hair Rich Olbia auf einen Blick.",
    groups: [
      {
        title: "Die Website",
        items: [
          { label: "Startseite", path: "/", langAware: true },
          { label: "Leistungen & Preise", path: "/servizi", langAware: true },
          { label: "Arbeiten & Portfolio", path: "/lavori", langAware: true },
          { label: "Das Team", path: "/team", langAware: true },
          { label: "Produkte", path: "/prodotti", langAware: true },
          { label: "Kontakte", path: "/contatti", langAware: true },
        ],
      },
      {
        title: "Lokale Leistungen",
        items: [
          { label: "Herrenfriseur in Olbia", path: "/parrucchiere-olbia", langAware: true },
          { label: "Mobiler Barbier an der Costa Smeralda", path: "/taglio-a-domicilio", langAware: true },
        ],
      },
      {
        title: "Kundenbereich",
        items: [
          { label: "Anmelden", path: "/login", langAware: false },
          { label: "Registrieren", path: "/registrazione", langAware: false },
        ],
      },
      {
        title: "Rechtliches",
        items: [
          { label: "Datenschutz", path: "/privacy", langAware: false },
          { label: "Cookies", path: "/cookie", langAware: false },
          { label: "AGB", path: "/termini", langAware: false },
        ],
      },
    ],
  },
};
