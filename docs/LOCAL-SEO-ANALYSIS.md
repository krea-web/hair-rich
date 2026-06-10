# Local SEO Analysis — Hair Rich Olbia

> Generata l'8 giugno 2026 sui contenuti reali serviti in locale (`http://localhost:3001`).

## Local SEO Score: 84 / 100

| Dimensione (peso) | Punteggio | Note |
|---|---|---|
| GBP signals (25%) | 18/25 | Mappa/recensioni referenziate, rating 4,6·37 citato. **Non valutabile la config GBP reale** (categoria, foto, post) → vedi azioni. |
| Reviews & reputation (20%) | 16/20 | 4,6 stelle · 37 recensioni (sopra soglia 10) + `aggregateRating` in schema. Velocity/risposte non valutabili da qui. |
| Local on-page (20%) | 19/20 | Title+H1 con città ✓, NAP visibile ✓, pagine servizio dedicate ✓, pillar locale ✓. |
| NAP consistency (15%) | 14/15 | NAP identico tra HTML e schema. Unico neo: `tel:` senza prefisso +39. |
| Local schema (10%) | 9/10 | `HairSalon` (subtype corretto per barbiere) + geo + openingHours + areaServed. Manca nodo Service per il domicilio + Person staff. |
| Local authority (10%) | 8/10 | Segnali on-page ok; authority off-site (chamber/press/"best of") assente. |

**Business type**: Ibrido — brick-and-mortar (Via Regina Elena 33/A) **+ service-area** (taglio a domicilio Olbia/Costa Smeralda, phone-only).
**Vertical**: Barbiere / Personal care.

## Cosa è già ottimo (verificato in locale)
- **NAP ultra-coerente**: Via Regina Elena 33/A (20×), 0789 1891049 (14×), 07026 (8×), info@hairrich.it (12×) — identico tra HTML footer/contatti e JSON-LD. Nessuna discrepanza.
- **Title/H1 local-intent**: home `Hair Rich · Barbiere a Olbia` / H1 "…Barbiere a Olbia"; /servizi H1 "Taglio e barba a Olbia".
- **Pagine servizio dedicate** (`/servizi`) + **pillar locale** (`/parrucchiere-olbia`) = #1 fattore local organic e #2 AI.
- **Schema locale completo**: `HairSalon` + `GeoCoordinates` + `OpeningHoursSpecification`×2 + `aggregateRating` + `areaServed` (City: Olbia, Porto Cervo, Golfo Aranci; AdministrativeArea: Costa Smeralda) + `ReserveAction`.
- **Mappa iframe** su /contatti + link "Indicazioni" Google Maps; **click-to-call** su /contatti e /servizi.

## Gap concreti (applicabili)
1. **Click-to-call in home** — la home non ha un link `tel:` (footer telefono è testo). Aggiungere `tel:+390789189...` (utile per "barbiere Olbia" da mobile / "near me"). *Quick win.*
2. **Formato `tel:` internazionale** — i link sono `tel:07891891049`; meglio `tel:+390789189...` (E.164) per click-to-call cross-device.
3. **Nodo `Service` "Taglio a domicilio"** con `areaServed` (Costa Smeralda/Olbia) nello schema — oggi i 3 `Service` sono solo i bookable; il domicilio è solo testo. Renderlo schema = lo rende "estraibile" da AIO/local. → lo genero con `seo-schema`.
4. **Person schema staff** (Federico/Cristian) con `sameAs` IG + `worksFor` HairSalon (presente solo su /team; aggiungerlo a home/`employee` del salone). → `seo-schema`.

## Azioni off-page (non-code, alta leva — in ordine)
1. **Google Business Profile**: verificare **categoria primaria = "Barbiere"** (fattore #1 del local pack), aggiungere categorie secondarie (es. "Parrucchiere", "Barbiere a domicilio"), foto reali, post, e **mantenere velocity recensioni** (regola dei 18 giorni). *La skill `reviews_harvester` della piattaforma può alimentarla una volta live.*
2. **Bing Places** (alimenta ChatGPT/Copilot/Alexa) + **Apple Business Connect** — rivendicare entrambi con NAP identico.
3. **Citazioni Tier-1 IT**: PagineGialle, Virgilio, Yelp, Facebook business, TripAdvisor — NAP coerente.
4. **Authority locale**: menzioni stampa locale Olbia / "migliori barbieri a Olbia" (top fattore AI), eventuali partnership/eventi.

## Limiti dell'analisi (cosa NON è valutabile da qui)
- Posizione reale nel **map pack / geo-grid**, categoria GBP effettiva, foto/post GBP, velocity recensioni, Domain Authority/backlink reali, GBP Insights. → richiedono dominio live + tool (DataForSEO / GBP API / `seo-maps`).
- Canonical punta a `www.hairricholbia.com` (non ancora attivo): gli audit su URL live e la posizione local reale vanno rifatti **dopo l'attivazione del dominio**.
