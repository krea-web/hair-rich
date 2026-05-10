# Hair Rich Olbia

Sito statico per il salone Hair Rich Olbia, costruito con [Astro](https://astro.build) (SSG) + React islands + Tailwind CSS v4 + Supabase (browser-only).

## Stack

- **Astro 6** — output statico (`output: "static"`)
- **React 19** — solo come isole (`client:load`, `client:visible`, `client:idle`, `client:only`)
- **Tailwind CSS v4** — via `@tailwindcss/postcss`
- **Supabase** (`@supabase/ssr` `createBrowserClient`) — auth e dati lato client
- **Zustand** — stato condiviso fra isole (`useCartStore`, `useBookingStore`, ecc.)
- **framer-motion**, **gsap**, **react-hook-form**, **zod** — invariati dal precedente stack

## Struttura

```
src/
  pages/                    # rotte Astro
    index.astro             # homepage (landing)
    privacy.astro
    cookie.astro
    termini.astro
    login.astro
    registrazione.astro
    admin/[...slug].astro   # SPA-island + auth gate (12 sub-routes pre-renderizzate)
    profilo/[...slug].astro # SPA-island utente (4 sub-routes)
    r/[...token].astro      # review-gate token catch-all (client-side)
    i/[...code].astro       # referral landing catch-all (client-side)
  layouts/
    RootLayout.astro        # font, meta tag, grain overlay
  components/
    landing/                # sezioni home (HeroSection, ServicesSection, ...)
    auth/                   # LoginForm, RegisterForm
    admin/
      AdminApp.tsx          # dispatcher SPA + auth gate
      AdminLayout.tsx       # sidebar + nav
      views/                # 12 pagine admin (dashboard, agenda, clienti, ...)
    profilo/
      ProfiloApp.tsx
      ProfiloLayout.tsx
      views/                # 4 pagine profilo
    token/                  # ReviewGate, ReferralLanding
    shop/                   # CartFAB, CartDrawer
    booking/                # BookingWizard
    ui/
  lib/
    clientRouter.ts         # useClientPath + navigate (SPA nav per /admin e /profilo)
    supabase/client.ts      # createBrowserClient
    store.ts                # Zustand stores
  styles/
    globals.css
    design-tokens.css
public/
  robots.txt
  manifest.webmanifest
  hero-seq/                 # frames hero
```

## Sviluppo

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # genera dist/
npm run preview     # serve la build
npm run check       # type-check (astro check)
```

## Variabili d'ambiente

Copiare `.env.example` in `.env` e impostare:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — esposte al browser (prefisso `PUBLIC_` richiesto da Astro).
- Le altre (Resend, n8n, R2) sono per Edge Functions Supabase (lato server, fuori dal frontend Astro).

## Deploy

Output completamente statico — deployabile su qualsiasi CDN: Vercel, Netlify, Cloudflare Pages, S3+CloudFront, ecc. Nessun runtime server richiesto.

Le rotte `/admin/*` e `/profilo/*` sono pre-renderizzate come **shell statiche** che caricano un'isola React `client:only`. L'auth gate verifica la sessione Supabase al boot e redirige a `/login` se assente.
