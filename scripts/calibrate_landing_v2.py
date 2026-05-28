"""
calibrate_landing_v2.py — second-pass tightening for "tutto troppo grande su PC".

Riduce ulteriormente padding verticali (py-), min-height hero, scala
tipografica hero, e centra tutto su "1 viewport per sezione" target.

Run from repo root:
    python scripts/calibrate_landing_v2.py
"""

import re
import sys
from pathlib import Path

ROOT = Path("src/components/landing")

REPLACEMENTS: list[tuple[str, str, str]] = [
    # ── Section vertical padding — più tight (target: 12/16/20/24/28) ──
    (
        "py-uniform-old",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
        "py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28",
    ),
    # ── Hero pt — meno aggressivo ──
    (
        "pt-hero-old",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 2xl:pt-44",
        "pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36",
    ),
    # ── Hero pb ──
    (
        "pb-hero-old",
        "pb-16 md:pb-24 lg:pb-28 xl:pb-32",
        "pb-12 md:pb-16 lg:pb-20 xl:pb-24",
    ),
    # ── Hero min-h — molto più tight (cap a ~60vh PC) ──
    (
        "min-h-hero-graceful",
        "min-h-[80vh] md:min-h-[85vh] lg:min-h-[78vh] xl:min-h-[72vh] 2xl:min-h-[68vh]",
        "min-h-[70vh] md:min-h-[75vh] lg:min-h-[62vh] xl:min-h-[58vh] 2xl:min-h-[55vh]",
    ),
    (
        "min-h-hero-services",
        "min-h-[70vh] md:min-h-[78vh] lg:min-h-[72vh] xl:min-h-[68vh] 2xl:min-h-[64vh]",
        "min-h-[65vh] md:min-h-[70vh] lg:min-h-[58vh] xl:min-h-[54vh] 2xl:min-h-[52vh]",
    ),
    # ── HeroSection homepage main grid ──
    (
        "hero-home-pt-pb",
        "pt-20 md:pt-28 lg:pt-32 xl:pt-36 2xl:pt-40 pb-16 md:pb-20 lg:pb-24 xl:pb-28",
        "pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-12 md:pb-16 lg:pb-18 xl:pb-20",
    ),
    (
        "hero-home-minh",
        "min-h-[70dvh] md:min-h-[100dvh] lg:min-h-[85vh] xl:min-h-[80vh] 2xl:min-h-[75vh]",
        "min-h-[70dvh] md:min-h-[85dvh] lg:min-h-[68vh] xl:min-h-[62vh] 2xl:min-h-[58vh]",
    ),
    # ── Hero sticky photo top offsets ──
    (
        "hero-sticky-top",
        "sticky top-32 lg:top-28 xl:top-32 2xl:top-40",
        "sticky top-24 lg:top-20 xl:top-24 2xl:top-28",
    ),
    # ── HeroSection sticky photo max-h ──
    (
        "hero-sticky-maxh",
        "aspect-[4/5] lg:aspect-[5/6] xl:aspect-[4/5] w-full max-h-[600px] lg:max-h-[680px] xl:max-h-[750px] 2xl:max-h-[820px]",
        "aspect-[4/5] lg:aspect-[5/6] xl:aspect-[4/5] w-full max-h-[440px] lg:max-h-[500px] xl:max-h-[560px] 2xl:max-h-[600px]",
    ),
    # ── Footer top fold ridotto ulteriormente ──
    (
        "footer-cta-minh",
        "min-h-[50vh] md:min-h-[58vh] lg:min-h-[52vh] xl:min-h-[48vh]",
        "min-h-[42vh] md:min-h-[48vh] lg:min-h-[44vh] xl:min-h-[42vh]",
    ),
    (
        "footer-cta-pt-pb",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 pb-10 md:pb-12 lg:pb-14",
        "pt-20 md:pt-24 lg:pt-28 xl:pt-32 pb-10 md:pb-12",
    ),
    (
        "footer-inner-py",
        "py-14 md:py-18 lg:py-20 xl:py-24 2xl:py-28",
        "py-10 md:py-14 lg:py-16 xl:py-20 2xl:py-24",
    ),
    # ── PageHero shared ──
    (
        "pagehero-new",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 pb-12 md:pb-20 lg:pb-24 min-h-[55vh] md:min-h-[72vh] lg:min-h-[64vh] xl:min-h-[58vh]",
        "pt-20 md:pt-24 lg:pt-28 xl:pt-32 pb-10 md:pb-14 lg:pb-18 min-h-[48vh] md:min-h-[58vh] lg:min-h-[52vh] xl:min-h-[48vh]",
    ),
    # ── FeaturedWork inner ──
    (
        "pt-featured",
        "pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-16 md:pb-24 lg:pb-28 xl:pb-32 2xl:pb-36",
        "pt-12 md:pt-16 lg:pt-20 xl:pt-24 2xl:pt-28 pb-12 md:pb-16 lg:pb-20 xl:pb-24 2xl:pb-28",
    ),
]


def main() -> int:
    if not ROOT.is_dir():
        print(f"ERR: {ROOT} not found — run from repo root.", file=sys.stderr)
        return 1

    touched: dict[str, list[str]] = {}
    files = sorted(ROOT.rglob("*.tsx"))

    for f in files:
        original = f.read_text(encoding="utf-8")
        text = original
        applied: list[str] = []
        for tag, old, new in REPLACEMENTS:
            if old in text:
                count = text.count(old)
                text = text.replace(old, new)
                applied.append(f"{tag}x{count}")
        if text != original:
            f.write_text(text, encoding="utf-8")
            touched[str(f).replace("\\", "/")] = applied

    print(f"\nv2 calibrated {len(touched)} file(s):\n")
    for path, tags in sorted(touched.items()):
        print(f"  {path}")
        for t in tags:
            print(f"    - {t}")
    print(f"\nTotal scanned: {len(files)}.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
