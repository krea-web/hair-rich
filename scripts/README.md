# scripts/

Utility CLI per ops e onboarding di nuovi saloni sulla piattaforma.

## `apply_migrations.py`

Applica TUTTE le migrations pendenti dalla cartella `supabase/migrations/`
ad un progetto Supabase esistente. Idempotent (uses CREATE OR REPLACE +
IF NOT EXISTS), gestisce retry su 5xx, split di statement enum-unsafe.

**Usage**:
```bash
SBP_TOKEN=<personal-access-token> PYTHONIOENCODING=utf-8 \
  python scripts/apply_migrations.py [--dry-run]
```

Il target è il progetto Hair Rich Olbia (`fznzfmgfsijhzjqcwmyt`). Per
altri saloni usa l'opzione `--project-ref` (TODO non ancora supportato —
oggi modificare PROJECT_REF in cima al file).

## `onboard_salon.py`

Workflow completo per portare un nuovo salone in produzione:

1. Crea un nuovo progetto Supabase via Management API
2. Attende che diventi `ACTIVE_HEALTHY`
3. Applica tutte le migrations dal repo (oggi 39+)
4. Promuove l'email del titolare ad admin (se già registrata)
5. Seeda `salon_settings` con i dati del salone + tier + theme
6. Sovrascrive le 6 cms_blocks brand-specific
7. Genera un file `.env.<brand>` con le chiavi pubbliche
8. Stampa la checklist dei passi manuali rimasti (Vercel deploy, secrets, etc.)

**Usage**:
```bash
pip install requests pyyaml
SBP_TOKEN=<personal-access-token> \
  python scripts/onboard_salon.py scripts/onboard_salon.example.yaml
```

**Tempo stimato**: 8-12 minuti totali (il provisioning Supabase è la
parte più lenta — ~3-5 min).

**Cosa NON fa**:
- Crea Vercel project (manuale via dashboard, ~2 min)
- Copia env vars su Vercel (manuale, copia-incolla dal file generato)
- Configura `site_url` Supabase Auth (manuale dopo aver scelto il dominio)
- Carica foto custom del salone (manuale via /admin/cms o storage upload)
- Setup Gmail / Telegram secrets (manuale, dipende dal salone)
- Deploy Edge Functions (`supabase functions deploy ...`)

Tutti i passi manuali sono elencati alla fine dell'output del comando.

## File `.env.<brand>` generati

Vengono scritti nella root del repo (es. `.env.bellezza-cagliari`). NON
committarli — sono già in `.gitignore` se segui il pattern standard.
Contengono:
- `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` (pubbliche)
- `SUPABASE_SERVICE_ROLE_KEY` (sensibile! Solo per script server-side)
- `PUBLIC_SITE_URL` (da aggiornare quando hai il dominio definitivo)

Copia questi valori nel dashboard Vercel del progetto del salone.

## Setup environment

```bash
pip install requests pyyaml
```

Tutti gli script accettano `SBP_TOKEN` come env var. Crea il tuo
Personal Access Token Supabase su:
https://supabase.com/dashboard/account/tokens

**Conserva il token con cura** — dà accesso completo a tutti i tuoi
progetti Supabase. Non condividerlo.
