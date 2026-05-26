#!/usr/bin/env python3
"""
Onboarding di un nuovo salone sulla piattaforma.

Procedura completa per portare un nuovo cliente in produzione:
  1. Legge un file di config YAML/JSON con i dati del salone
  2. Crea un nuovo progetto Supabase via Management API
  3. Applica TUTTE le migrations dal repo
  4. Promuove l'email del titolare ad admin
  5. Seeda salon_settings con nome, indirizzo, tier, branding
  6. Seeda cms_blocks brand-specific (override quelli generici)
  7. Genera il file .env.<slug> con le chiavi pubbliche per il deploy Vercel
  8. Stampa istruzioni finali (cosa fare manualmente su Vercel)

Usage:
  SBP_TOKEN=<personal-access-token> python scripts/onboard_salon.py config.yaml

config.yaml format:
  brand: salone-bellezza-cagliari
  brand_name: Bellezza
  location_name: Cagliari
  full_name: Bellezza Cagliari
  display_name: Bellezza Cagliari
  owner_email: info@bellezzacagliari.it
  tier: pro                       # vetrina | pro | full
  phone: "+39 070 123456"
  email: info@bellezzacagliari.it
  address: Via Roma 12
  city: Cagliari
  province: CA
  postal_code: "09100"
  theme:
    accent_color: "#C8A2C8"
    font_display: "Playfair Display"
    font_body: "Source Sans Pro"
  region: eu-central-1            # Supabase region
  db_password: "<random strong password>"
  org_id: <organization id Supabase>

Dipendenze: requests, pyyaml. Install via:
  pip install requests pyyaml
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

try:
    import requests  # type: ignore
except ImportError:
    print("Manca 'requests'. Installa con: pip install requests", file=sys.stderr)
    sys.exit(1)

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = REPO_ROOT / "supabase" / "migrations"

API_BASE = "https://api.supabase.com/v1"
HEADERS_BASE = {
    "User-Agent": "hairrich-onboarder/1.0",
    "Content-Type": "application/json",
}


def load_config(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    if path.suffix in {".yaml", ".yml"}:
        if yaml is None:
            print("Manca 'pyyaml'. Installa con: pip install pyyaml", file=sys.stderr)
            sys.exit(1)
        return yaml.safe_load(text)
    return json.loads(text)


def http(method: str, url: str, token: str, body: Any = None, timeout: int = 60) -> Any:
    headers = {**HEADERS_BASE, "Authorization": f"Bearer {token}"}
    resp = requests.request(method, url, headers=headers, json=body, timeout=timeout)
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code} on {method} {url}: {resp.text[:500]}")
    if not resp.text:
        return None
    return resp.json()


def create_project(token: str, cfg: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "name": cfg["brand"],
        "organization_id": cfg["org_id"],
        "region": cfg.get("region", "eu-central-1"),
        "db_pass": cfg["db_password"],
        "plan": cfg.get("supabase_plan", "free"),
    }
    return http("POST", f"{API_BASE}/projects", token, payload)


def wait_for_project_ready(token: str, project_ref: str) -> None:
    print(f"  Attendo che il progetto {project_ref} sia ACTIVE_HEALTHY...")
    for attempt in range(40):  # max ~10 min
        try:
            data = http("GET", f"{API_BASE}/projects/{project_ref}", token)
            status = data.get("status")
            if status == "ACTIVE_HEALTHY":
                print(f"  ✓ Pronto dopo {attempt + 1} tentativi")
                return
            print(f"  [{attempt + 1}/40] status={status}, attendo 15s...")
        except Exception as e:
            print(f"  Warning: {e}")
        time.sleep(15)
    raise RuntimeError("Project did not reach ACTIVE_HEALTHY in time")


def run_sql(token: str, project_ref: str, sql: str) -> Any:
    return http(
        "POST",
        f"{API_BASE}/projects/{project_ref}/database/query",
        token,
        {"query": sql},
        timeout=180,
    )


def apply_migrations(token: str, project_ref: str) -> int:
    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    print(f"  Applico {len(sql_files)} migrations su {project_ref}...")
    applied = 0
    for i, f in enumerate(sql_files, 1):
        sql = f.read_text(encoding="utf-8")
        # Handle enum-safety split as in apply_migrations.py
        import re

        enum_re = re.compile(
            r"DO\s*\$\$\s*BEGIN\s*ALTER TYPE\s+\w+\s+ADD VALUE.*?END\s*\$\$\s*;",
            re.DOTALL | re.IGNORECASE,
        )
        matches = list(enum_re.finditer(sql))
        chunks = (
            [m.group(0) for m in matches] + [enum_re.sub("", sql).strip()]
            if matches
            else [sql]
        )
        chunks = [c for c in chunks if c.strip()]

        for chunk_idx, chunk in enumerate(chunks, 1):
            label = "" if len(chunks) == 1 else f" [part {chunk_idx}/{len(chunks)}]"
            for attempt in range(4):
                try:
                    run_sql(token, project_ref, chunk)
                    break
                except RuntimeError as e:
                    msg = str(e)
                    is_retryable = any(
                        s in msg for s in ["HTTP 5", "HTTP 429", "timeout", "reset"]
                    )
                    if attempt < 3 and is_retryable:
                        wait = [2, 5, 10][attempt]
                        print(f"      retry in {wait}s ({attempt + 1}/4)")
                        time.sleep(wait)
                        continue
                    raise
        print(f"  [{i:>2}/{len(sql_files)}] {f.name}")
        applied += 1
    return applied


def sql_escape(s: str | None) -> str:
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def seed_salon(token: str, project_ref: str, cfg: dict[str, Any]) -> None:
    print("  Seed salon_settings + cms_blocks brand override...")

    theme = cfg.get("theme") or {}
    theme_json = json.dumps(theme).replace("'", "''")

    update_sql = f"""
    UPDATE salon_settings SET
        display_name = {sql_escape(cfg["display_name"])},
        phone = {sql_escape(cfg.get("phone"))},
        email = {sql_escape(cfg.get("email"))},
        address = {sql_escape(cfg.get("address"))},
        city = {sql_escape(cfg.get("city"))},
        province = {sql_escape(cfg.get("province"))},
        postal_code = {sql_escape(cfg.get("postal_code"))},
        current_tier = {sql_escape(cfg.get("tier", "vetrina"))},
        parent_brand_id = {sql_escape(cfg["brand"])},
        parent_brand_name = {sql_escape(cfg["brand_name"])},
        theme = theme || '{theme_json}'::jsonb,
        updated_at = now()
    WHERE is_singleton;
    """
    run_sql(token, project_ref, update_sql)

    cms_updates = [
        ("site_brand_name", cfg["brand_name"]),
        ("site_brand_location", cfg["location_name"]),
        ("site_brand_full", cfg["full_name"]),
        ("admin_sidebar_brand", f"{cfg['brand_name'].upper()} ADMIN"),
        ("staff_sidebar_brand", f"{cfg['brand_name'].upper()} STAFF"),
    ]
    for key, val in cms_updates:
        run_sql(
            token,
            project_ref,
            f"UPDATE cms_blocks SET value = {sql_escape(val)} WHERE key = {sql_escape(key)};",
        )


def invite_owner(token: str, project_ref: str, owner_email: str) -> None:
    print(f"  Promuovo {owner_email} ad admin...")
    sql = f"""
    DO $$
    DECLARE v_user uuid;
    BEGIN
        SELECT id INTO v_user FROM auth.users WHERE email = {sql_escape(owner_email)};
        IF v_user IS NULL THEN
            RAISE NOTICE 'Owner email % non ancora registrata. Promuovi manualmente dopo il primo login.', {sql_escape(owner_email)};
            RETURN;
        END IF;
        INSERT INTO admins (user_id) VALUES (v_user) ON CONFLICT (user_id) DO NOTHING;
    END $$;
    """
    run_sql(token, project_ref, sql)


def get_project_keys(token: str, project_ref: str) -> tuple[str, str]:
    print("  Recupero anon key + service role key...")
    data = http("GET", f"{API_BASE}/projects/{project_ref}/api-keys", token)
    anon = ""
    service = ""
    for k in data:
        if k.get("name") == "anon":
            anon = k.get("api_key", "")
        if k.get("name") == "service_role":
            service = k.get("api_key", "")
    return anon, service


def write_env_file(cfg: dict[str, Any], project_ref: str, anon_key: str, service_key: str) -> Path:
    env_path = REPO_ROOT / f".env.{cfg['brand']}"
    public_url = f"https://{project_ref}.supabase.co"
    site_url = cfg.get("site_url", f"https://{cfg['brand']}.vercel.app")

    body = f"""# Generato da scripts/onboard_salon.py per {cfg['full_name']}
# Copia questo file su Vercel come env vars del progetto

PUBLIC_SUPABASE_URL={public_url}
PUBLIC_SUPABASE_ANON_KEY={anon_key}
SUPABASE_SERVICE_ROLE_KEY={service_key}

PUBLIC_SITE_URL={site_url}
PUBLIC_DEFAULT_TIMEZONE={cfg.get('timezone', 'Europe/Rome')}

# Secrets opzionali da configurare via `supabase secrets set --project-ref {project_ref}`:
#   GMAIL_USER, GMAIL_APP_PASSWORD
#   TELEGRAM_BOT_TOKEN
#   OPENAI_API_KEY (solo tier full)
#   SENTRY_DSN (consigliato)
"""
    env_path.write_text(body, encoding="utf-8")
    return env_path


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: SBP_TOKEN=... python scripts/onboard_salon.py <config.yaml|json>", file=sys.stderr)
        return 2

    token = os.environ.get("SBP_TOKEN")
    if not token:
        print("Env var SBP_TOKEN mancante", file=sys.stderr)
        return 1

    cfg_path = Path(sys.argv[1])
    if not cfg_path.exists():
        print(f"Config file non trovato: {cfg_path}", file=sys.stderr)
        return 1

    cfg = load_config(cfg_path)

    required = ["brand", "brand_name", "location_name", "full_name", "display_name", "owner_email", "db_password", "org_id"]
    missing = [k for k in required if k not in cfg]
    if missing:
        print(f"Campi mancanti in {cfg_path}: {missing}", file=sys.stderr)
        return 1

    print(f"━━━ Onboarding {cfg['full_name']} ({cfg['brand']}) ━━━")

    print("\n[1/6] Creazione progetto Supabase...")
    project = create_project(token, cfg)
    project_ref = project["id"]
    print(f"  ✓ Project ref: {project_ref}")

    print("\n[2/6] Attendo provisioning...")
    wait_for_project_ready(token, project_ref)

    print("\n[3/6] Applico migrations...")
    n = apply_migrations(token, project_ref)
    print(f"  ✓ {n} migrations applicate")

    print("\n[4/6] Seed salon_settings + cms_blocks...")
    seed_salon(token, project_ref, cfg)
    print("  ✓ Brand configurato")

    print("\n[5/6] Promuovo owner ad admin...")
    invite_owner(token, project_ref, cfg["owner_email"])

    print("\n[6/6] Genero .env file...")
    anon, service = get_project_keys(token, project_ref)
    env_path = write_env_file(cfg, project_ref, anon, service)
    print(f"  ✓ File scritto: {env_path}")

    print("\n━━━ Onboarding completato ━━━")
    print(f"\nProgetto Supabase:  https://supabase.com/dashboard/project/{project_ref}")
    print(f"Tier:               {cfg.get('tier', 'vetrina')}")
    print(f"Env file:           {env_path}")
    print(f"\nProssimi passi MANUALI:")
    print(f"  1. Crea repo GitHub salone-{cfg['brand']} (clone del template hair-rich)")
    print(f"  2. Crea Vercel project, collega al repo")
    print(f"  3. Copia env vars da {env_path} nel dashboard Vercel")
    print(f"  4. Configura dominio custom (se previsto)")
    print(f"  5. Configura site_url Supabase Auth: {cfg.get('site_url', 'https://...vercel.app')}")
    print(f"  6. Owner fa primo login: l'admins è già seeded se l'email era già registrata")
    print(f"  7. Setup secrets (Gmail/Telegram) via `supabase secrets set --project-ref {project_ref}`")
    print(f"  8. Deploy Edge Functions: `supabase functions deploy --project-ref {project_ref} <name>`")

    return 0


if __name__ == "__main__":
    sys.exit(main())
