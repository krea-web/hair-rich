"""
calibrate_landing.py — bulk-replace responsive class tokens across all landing
components so vertical rhythm, horizontal padding, hero min-h and font scale
stay consistent at every breakpoint.

Run from repo root:
    python scripts/calibrate_landing.py
"""

import re
import sys
from pathlib import Path

ROOT = Path("src/components/landing")

REPLACEMENTS: list[tuple[str, str, str]] = [
    # ── Section vertical padding — uniform 16/24/28/32/36 ─────────────────
    (
        "py-section-mega",
        "py-16 md:py-32 lg:py-40 xl:py-48",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    (
        "py-section-big-44",
        "py-16 md:py-28 lg:py-36 xl:py-44",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    (
        "py-section-big-40",
        "py-16 md:py-24 lg:py-32 xl:py-40",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    (
        "py-section-mid-40",
        "py-16 md:py-28 lg:py-36 xl:py-40",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    (
        "py-20-md-32-no-scale",
        "py-20 md:py-32",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    (
        "py-20-md-28-compact",
        "py-20 md:py-28",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    # ── Section horizontal padding — uniform 6/12/16/20/24 ────────────────
    (
        "px-section-full",
        "px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36",
        "px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24",
    ),
    # ── Hero pt — moderate the 56 monster ─────────────────────────────────
    (
        "pt-hero-28-56",
        "pt-28 md:pt-40 lg:pt-48 xl:pt-56",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 2xl:pt-44",
    ),
    (
        "pt-hero-24-56",
        "pt-24 md:pt-40 lg:pt-48 xl:pt-56",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 2xl:pt-44",
    ),
    (
        "pt-hero-28-44-56",
        "pt-28 md:pt-44 lg:pt-48 xl:pt-56",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 2xl:pt-44",
    ),
    # ── Hero pb — same idea ───────────────────────────────────────────────
    (
        "pb-hero-12-32",
        "pb-12 md:pb-24 lg:pb-32",
        "pb-16 md:pb-24 lg:pb-28 xl:pb-32",
    ),
    (
        "pb-hero-16-32",
        "pb-16 md:pb-28 lg:pb-32",
        "pb-16 md:pb-24 lg:pb-28 xl:pb-32",
    ),
    # ── Hero min-h — graceful step-down on bigger screens ────────────────
    (
        "min-h-hero-80-90",
        "min-h-[80vh] md:min-h-[90vh]",
        "min-h-[80vh] md:min-h-[85vh] lg:min-h-[78vh] xl:min-h-[72vh] 2xl:min-h-[68vh]",
    ),
    (
        "min-h-hero-70-80",
        "min-h-[70vh] md:min-h-[80vh]",
        "min-h-[70vh] md:min-h-[78vh] lg:min-h-[72vh] xl:min-h-[68vh] 2xl:min-h-[64vh]",
    ),
    # ── HeroSection homepage main grid — old class still uses pt-48 ──────
    (
        "hero-home-pt-pb",
        "pt-20 md:pt-32 lg:pt-40 xl:pt-48 pb-12 md:pb-20 lg:pb-28",
        "pt-20 md:pt-28 lg:pt-32 xl:pt-36 2xl:pt-40 pb-16 md:pb-20 lg:pb-24 xl:pb-28",
    ),
    # ── HomeServiceFocus py monster on its inner container ───────────────
    (
        "py-inner-mega",
        "py-20 md:py-32 lg:py-40 xl:py-48",
        "py-16 md:py-24 lg:py-28 xl:py-32 2xl:py-36",
    ),
    # ── FeaturedWork inner container pt/pb mega ──────────────────────────
    (
        "pt-featured",
        "pt-16 md:pt-24 lg:pt-32 xl:pt-40 pb-20 md:pb-28 lg:pb-36 xl:pb-44",
        "pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-32 pb-16 md:pb-24 lg:pb-28 xl:pb-32 2xl:pb-36",
    ),
    # ── Footer top fold min-h — too tall on PC ───────────────────────────
    (
        "footer-cta-minh",
        "min-h-[55vh] md:min-h-[65vh]",
        "min-h-[50vh] md:min-h-[58vh] lg:min-h-[52vh] xl:min-h-[48vh]",
    ),
    (
        "footer-cta-pt-pb",
        "pt-32 md:pt-48 pb-10 md:pb-14",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 pb-10 md:pb-12 lg:pb-14",
    ),
    # ── Footer inner py — coordinate with section rhythm ─────────────────
    (
        "footer-inner-py",
        "py-14 md:py-20 lg:py-24 xl:py-28",
        "py-14 md:py-18 lg:py-20 xl:py-24 2xl:py-28",
    ),
    # ── PageHero shared (used by legal pages) ─────────────────────────────
    (
        "pagehero-pt-pb-mh",
        "pt-24 md:pt-44 pb-10 md:pb-24 min-h-[55vh] md:min-h-[85vh]",
        "pt-24 md:pt-32 lg:pt-36 xl:pt-40 pb-12 md:pb-20 lg:pb-24 min-h-[55vh] md:min-h-[72vh] lg:min-h-[64vh] xl:min-h-[58vh]",
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
                applied.append(f"{tag}×{count}")
        if text != original:
            f.write_text(text, encoding="utf-8")
            touched[str(f).replace("\\", "/")] = applied

    print(f"\nCalibrated {len(touched)} file(s):\n")
    for path, tags in sorted(touched.items()):
        print(f"  {path}")
        for t in tags:
            print(f"    · {t}")
    print(f"\nTotal scanned: {len(files)} files in {ROOT}.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
