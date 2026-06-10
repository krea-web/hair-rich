# Schema / Structured Data Report — Hair Rich Olbia

> Generata l'8 giugno 2026 sul JSON-LD reale (`src/components/seo/JsonLd.astro` → ogni pagina, build verificato).

## Validazione

| Schema | Tipo | Stato | Note |
|---|---|---|---|
| HairSalon | LocalBusiness | ✅ valido · rich-result eligible | name, PostalAddress completo, telephone, geo, url, image, logo, priceRange (`€€`), openingHoursSpecification×2, aggregateRating (4.6/37), areaServed, sameAs (IG+Maps), hasOfferCatalog, ReserveAction. |
| Service ×3 | Service/Offer | ✅ valido | Taglio 20€ / Barba 10€ / Combo 30€ in `hasOfferCatalog`, provider → `@id` salone. |
| **Service "Taglio a domicilio"** | Service | ✅ **aggiunto** | `areaServed` Olbia/Porto Cervo/Golfo Aranci/Costa Smeralda + `availableChannel` (telefono). Emesso su tutte le pagine. |
| FAQPage | FAQPage | ⚠️ valido ma **no rich-result** | Da ago 2023 il rich-result FAQ è ristretto a siti gov/healthcare → per un barbiere **non genera snippet FAQ in Google**. Resta utile per AEO/AI parsing → **tenerlo**. |
| BreadcrumbList | BreadcrumbList | ✅ valido · rich-result eligible | Su servizi/lavori/prodotti/team/contatti/pillar. |
| Person (staff) | Person | ✅ valido | Su /team e /team/[slug]; `worksFor` → `@id` salone (catena E-E-A-T). Aggiunto supporto `sameAs` (vuoto by design: lo staff non ha profili social individuali). |

**Sintassi**: tutto generato via `JSON.stringify` → JSON sempre valido; build verde, 86 pagine, 4 blocchi ld+json su /servizi.

## Fix applicati in questa sessione
1. **Nodo `Service` "Taglio a domicilio"** con `areaServed` + canale telefonico → l'offerta a domicilio è ora "estraibile" da AI Overviews / ricerca locale (prima era solo testo).
2. **Supporto `Person.sameAs`** nel componente (pronto per eventuali profili social individuali dello staff).
3. (Sessione precedente) Description `HairSalon` riscritta factual (prezzi+orari).

## Raccomandazioni (non applicate — richiedono dati/decisioni)
1. **Precisione `geo`** — oggi `40.9230, 9.4980` (4 decimali). Google consiglia 5+ decimali: confermare le coordinate esatte di Via Regina Elena 33/A e portarle a 5 decimali. (Non le invento per non falsare la posizione.)
2. **`hasMap`** sul nodo HairSalon = URL Google Maps del salone (rinforza il segnale geografico).
3. **`tel:` in home + formato E.164** (`tel:+390789...`) — vedi `LOCAL-SEO-ANALYSIS.md`.
4. **Dopo il dominio live**: validare su Google Rich Results Test + Schema Markup Validator sugli URL reali (in locale i tool ufficiali non arrivano).

## Eleggibilità rich-result (riepilogo)
- ✅ **LocalBusiness/HairSalon** (knowledge panel / local) — forte.
- ✅ **BreadcrumbList** — attivo.
- ✅ **Merchant/Offer** (prezzi servizi) — presente.
- ⚠️ **FAQ** — solo AEO/AI (no snippet Google per sito commerciale).
