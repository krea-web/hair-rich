#!/usr/bin/env python3
"""
Apply a single migration file via Supabase Management API.

Usage:
    SBP_TOKEN=<token> python scripts/apply_single_migration.py <path/to/file.sql>

Useful when you only need to ship one new migration without re-running
the whole `apply_migrations.py` sweep (which is also idempotent but
much slower).
"""

import json
import os
import sys
import time
from pathlib import Path
from urllib import request, error

PROJECT_REF = "fznzfmgfsijhzjqcwmyt"


def main() -> int:
    if len(sys.argv) < 2:
        print("ERROR: pass the migration file path as the first argument.", file=sys.stderr)
        return 1

    token = os.environ.get("SBP_TOKEN")
    if not token:
        print("ERROR: SBP_TOKEN env var not set", file=sys.stderr)
        return 1

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        return 1

    sql = path.read_text(encoding="utf-8")
    endpoint = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

    payload = json.dumps({"query": sql}).encode("utf-8")
    req = request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "hairrich-migrator/1.0 (curl-compatible)",
        },
        method="POST",
    )

    for attempt in range(4):
        try:
            with request.urlopen(req, timeout=60) as resp:
                body = resp.read().decode("utf-8", errors="replace")
                print(f"OK  ({resp.status})  {path.name}")
                if body.strip() and body.strip() != "[]":
                    print(f"     -> {body[:400]}")
                return 0
        except error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            print(f"FAIL ({e.code}) {path.name}\n     -> {body[:600]}", file=sys.stderr)
            if e.code < 500:
                return 1
        except (error.URLError, TimeoutError) as e:
            print(f"WARN attempt {attempt+1}: {e}", file=sys.stderr)
        time.sleep(2 + attempt * 3)
    return 1


if __name__ == "__main__":
    sys.exit(main())
