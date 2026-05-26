#!/usr/bin/env python3
"""
Apply pending Supabase migrations via Management API.

Usage:
  SBP_TOKEN=<token> python apply_migrations.py [--dry-run]

Reads supabase/migrations/*.sql in alphabetical order, skips legacy
files (date prefix < 20260523), POSTs each to
https://api.supabase.com/v1/projects/<ref>/database/query.

Halts on first error so partial state is easy to inspect.
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib import request, error

PROJECT_REF = "fznzfmgfsijhzjqcwmyt"
MIGRATIONS_DIR = Path("supabase/migrations")
LEGACY_CUTOFF = "20260520"  # apply files dated 20260523+

token = os.environ.get("SBP_TOKEN")
if not token:
    print("ERROR: SBP_TOKEN env var not set", file=sys.stderr)
    sys.exit(1)

dry_run = "--dry-run" in sys.argv

endpoint = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"


import re

ENUM_ADD_RE = re.compile(
    r"DO\s*\$\$\s*BEGIN\s*ALTER TYPE\s+\w+\s+ADD VALUE.*?END\s*\$\$\s*;",
    re.DOTALL | re.IGNORECASE,
)


def split_for_enum_safety(sql: str) -> list[str]:
    """
    Postgres requires `ALTER TYPE ... ADD VALUE` to be committed before
    the new value is referenced (e.g. in an index WHERE clause). The
    Supabase /query endpoint wraps each call in a single transaction,
    so a migration that adds an enum value AND uses it must be split
    into multiple API calls.

    This splitter pulls every `DO $$ ... ALTER TYPE ... ADD VALUE $$;`
    block to the front as its own chunk, in order. The remaining
    statements become the final chunk.
    """
    matches = list(ENUM_ADD_RE.finditer(sql))
    if not matches:
        return [sql]

    chunks: list[str] = []
    remaining = sql
    for m in matches:
        chunks.append(m.group(0))
    # Strip the extracted blocks from the original, keep the rest as one
    cleaned = ENUM_ADD_RE.sub("", remaining).strip()
    if cleaned:
        chunks.append(cleaned)
    return chunks


def run_sql(sql: str) -> tuple[bool, str]:
    # Retry on transient 5xx / timeouts. Migrations are idempotent
    # (IF NOT EXISTS / CREATE OR REPLACE) so a successful partial apply
    # followed by a retry is safe.
    max_attempts = 4
    backoff = [2, 5, 10, 20]
    last_err = ""
    for attempt in range(max_attempts):
        payload = json.dumps({"query": sql}).encode("utf-8")
        req = request.Request(
            endpoint,
            data=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "hairrich-migrator/1.0 (curl-compatible)",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=180) as resp:
                body = resp.read().decode("utf-8")
                return True, body
        except error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            last_err = f"HTTP {e.code}: {body}"
            # 5xx and 429 are retryable; 4xx (auth / bad SQL) are not
            if e.code in (429, 500, 502, 503, 504) and attempt < max_attempts - 1:
                wait = backoff[attempt]
                print(f"        ... retry in {wait}s (attempt {attempt + 1}/{max_attempts}, HTTP {e.code})")
                time.sleep(wait)
                continue
            return False, last_err
        except Exception as e:
            last_err = f"{type(e).__name__}: {e}"
            if attempt < max_attempts - 1:
                wait = backoff[attempt]
                print(f"        ... retry in {wait}s (attempt {attempt + 1}/{max_attempts})")
                time.sleep(wait)
                continue
            return False, last_err
    return False, last_err


def main() -> int:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    pending = [f for f in files if f.name >= LEGACY_CUTOFF]

    print(f"Found {len(files)} total migrations, {len(pending)} to apply.")
    if dry_run:
        for f in pending:
            print(f"  [dry] {f.name}")
        return 0

    applied = 0
    for i, f in enumerate(pending, 1):
        sql = f.read_text(encoding="utf-8")
        first_comment = next(
            (line.strip() for line in sql.splitlines() if line.strip().startswith("--")),
            "(no header)",
        )
        print(f"\n[{i:>2}/{len(pending)}] {f.name}")
        print(f"        {first_comment[:80]}")

        chunks = split_for_enum_safety(sql)
        for chunk_idx, chunk in enumerate(chunks, 1):
            label = "" if len(chunks) == 1 else f" [part {chunk_idx}/{len(chunks)}]"
            ok, body = run_sql(chunk)
            if not ok:
                print(f"        [FAIL]{label}")
                print(f"        {body[:1500]}")
                print(f"\n{applied} migrations applied before this failure.")
                return 1
            snippet = body if len(body) < 200 else f"{body[:200]}..."
            print(f"        [ok]{label}  ({snippet})")
        applied += 1
        time.sleep(0.3)  # gentle pace

    print(f"\nAll {applied} migrations applied successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
