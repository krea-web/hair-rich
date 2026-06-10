# GEO / AEO Analysis — Hair Rich Olbia

> Generata l'8 giugno 2026 analizzando i contenuti reali serviti in locale (`http://localhost:3001`).
> Target: citabilità su Google AI Overviews / ChatGPT / Perplexity per query locali IT
> ("barbiere Olbia", "quanto costa taglio Olbia", "barbiere a domicilio Olbia",
> "barbiere aperto oggi Olbia", "parrucchiere uomo Olbia").

## GEO Readiness Score: 81 / 100

| Criterio (peso) | Punteggio | Note |
|---|---|---|
| Citability (25%) | 22/25 | FAQ answer-first, passaggi self-contained, prezzi/fatti specifici ✓ |
| Structural readability (20%) | 17/20 | Heading H1→H2→H3 puliti, FAQ Q&A, paragrafi brevi. Poche tabelle. |
| Multi-modal (15%) | 9/15 | Foto reali ✓. Nessun video/infografica/tool. |
| Authority & brand signals (20%) | 13/20 | NAP coerente + rating Google citato. **Debole off-site** (no Wikipedia/Reddit/YouTube), niente date/autore sui contenuti. |
| Technical accessibility (20%) | 20/20 | SSR ✓, robots AI ✓, llms.txt ✓, schema ricco ✓ |

## Platform breakdown
- **Google AI Overviews**: forte — SSR + schema HairSalon/FAQPage/Service + segnali locali. È la piattaforma dove si parte avvantaggiati.
- **ChatGPT**: buono — llms.txt strutturato + entità chiara. Manca presenza Wikipedia/autorità esterna.
- **Perplexity**: medio — Perplexity pesa molto Reddit/community: oggi assenti.

## Stato tecnico (verificato in locale)
- **AI crawler access** ✓ — `robots.txt` consente esplicitamente GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-Web; private (`/admin`,`/staff`,`/profilo`,`/r`,`/i`,`/recensione`,`/sondaggio`,`/coupon`) bloccate. Corretto.
- **Server-Side Rendering** ✓ — tutte le sezioni i18n (hero, manifesto, whyUs, servizi, team, FAQ, domicilio) sono nell'HTML grezzo (47 astro-island ma contenuto pre-renderizzato). Gli AI crawler (che non eseguono JS) vedono tutto.
- **Schema /servizi** ✓ ricco: `HairSalon`, `AggregateRating` (4.6/37), `FAQPage` (10 Q&A), `BreadcrumbList`, `Service`×3 + `Offer`×3 + `OfferCatalog`, `OpeningHoursSpecification`×2, `GeoCoordinates`, `PostalAddress`, `areaServed` (City: Olbia/Porto Cervo/Golfo Aranci), `ReserveAction`. Il `FAQPage` legge lo stesso array della pagina → nessun mismatch.
- **llms.txt** ✓ presente e **aggiornato in questa sessione** (vedi sotto).

## Fix applicato in questa sessione (high-impact)
**`public/llms.txt`** riallineato:
- Descrizione: tolto "premium / sartoriale / una poltrona" (incoerente con la voce factual e con 2+ barbieri) → posizionamento factual "barbiere specializzato sull'uomo a Olbia".
- Nuova sezione **"Area servita e taglio a domicilio"**: copre esplicitamente "barbiere a domicilio a Olbia e Costa Smeralda" (Porto Cervo, Golfo Aranci, hotel, yacht, cerimonie) — phone-only. **Colma il gap home-service per l'AEO.**
- Team: descrizioni Federico/Cristian ripulite dal lessico "sartoriale/chirurgico".
- "Note per gli AI": aggiunti gli intenti "barbiere a domicilio Olbia", "taglio a domicilio Olbia", "parrucchiere a domicilio Costa Smeralda", "quanto costa un taglio a Olbia".

## Top 5 cambiamenti a più alto impatto (prossimi)
1. **Person schema per lo staff** (Federico/Cristian) su home/team con `sameAs` (Instagram) + `worksFor` HairSalon → segnale entità/E-E-A-T (oggi `Person` = 0 su home/servizi). Aggiungere anche `employee` al nodo `HairSalon`.
2. **Service "Taglio a domicilio" come nodo schema** dedicato con `areaServed` = Costa Smeralda/Olbia (oggi i 3 Service in schema sono solo i bookable; il domicilio è solo testo) → rende l'home-service "estraibile" dagli AIO.
3. **Brand mentions off-site** (correlazione #1 con citazioni AI): verificare/ottimizzare il **Google Business Profile**, ottenere citazioni su directory locali e 1-2 menzioni community (forum/Reddit local/stampa locale Olbia). È l'azione con più leva su ChatGPT/Perplexity.
4. **Date + attribuzione** sui contenuti chiave (FAQ/pillar): `dateModified` visibile + autore/salone → segnale freschezza/autorità.
5. **Dominio live + GSC**: appena `www.hairricholbia.com` è attivo → submit sitemap in Search Console, poi ri-eseguire `seo-audit`/`seo-google` (CrUX/GSC) su URL live e un check di visibilità reale (ChatGPT/Perplexity sulle query target).

## Note
- Il canonical punta a `www.hairricholbia.com` (non ancora attivo): finché il dominio non risolve, gli audit su URL live e i controlli di visibilità AI reale non sono attendibili. I fix di contenuto/markup/llms.txt qui sopra sono invece già validi e veritieri (valutati sul sito servito in locale).
- Punti di forza off-the-shelf: SSR + schema locale completo + FAQ answer-first = base tecnica AIO già molto solida per un'attività locale.
