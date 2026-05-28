"""
calibrate_landing_v3_fonts.py — riduce SOLO i font hero/h2 su PC (lg+).
Mobile e md non vengono toccati: l'utente è soddisfatto su mobile.
"""

import sys
from pathlib import Path

ROOT = Path("src/components/landing")

REPLACEMENTS: list[tuple[str, str, str]] = [
    # ── Hero h1 con lg:text-[7rem] (ShopHero, PortfolioHero) ────────────
    (
        "h1-7rem-shop-portfolio",
        "text-4xl sm:text-5xl md:text-7xl lg:text-[7rem]",
        "text-4xl sm:text-5xl md:text-7xl lg:text-7xl xl:text-[5.5rem] 2xl:text-[6rem]",
    ),
    # ── Hero h1 ServicesHero (lg:text-[6rem]) ──────────────────────────
    (
        "h1-6rem-services",
        "text-4xl sm:text-5xl md:text-7xl lg:text-[6rem]",
        "text-4xl sm:text-5xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-[5rem]",
    ),
    # ── Hero h1 BookingHero/TeamHero (lg:text-8xl) ─────────────────────
    (
        "h1-lg8xl",
        "text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-warm-white tracking-tight",
        "text-4xl sm:text-5xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-warm-white tracking-tight",
    ),
    # ── h2 sezione "text-4xl md:text-6xl" (BeforeAfter, SalonDay, TeamShowcase, BookingSection) ──
    (
        "h2-section-46",
        "text-display text-4xl md:text-6xl text-warm-white tracking-tight",
        "text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl 2xl:text-6xl text-warm-white tracking-tight",
    ),
    # ── h3 nome staff TeamSection (text-4xl md:text-6xl + mt-2) ────────
    (
        "h3-staff-name",
        'className="text-display text-4xl md:text-6xl text-warm-white mt-2 leading-[0.95]"',
        'className="text-display text-4xl md:text-6xl lg:text-5xl xl:text-5xl text-warm-white mt-2 leading-[0.95]"',
    ),
    # ── h3 nome staff TeamShowcase (text-3xl md:text-5xl + mt-2) ───────
    (
        "h3-showcase-name",
        "text-display text-3xl md:text-5xl text-warm-white tracking-tight mt-2 leading-[1.05]",
        "text-display text-3xl md:text-5xl lg:text-4xl xl:text-4xl 2xl:text-5xl text-warm-white tracking-tight mt-2 leading-[1.05]",
    ),
    # ── HomeServiceFocus h1 (text-4xl sm:text-5xl md:text-7xl) ─────────
    (
        "homefocus-h1",
        "text-display text-4xl sm:text-5xl md:text-7xl text-warm-white tracking-tight mt-5 md:mt-7 leading-[0.95]",
        "text-display text-4xl sm:text-5xl md:text-7xl lg:text-6xl xl:text-6xl 2xl:text-7xl text-warm-white tracking-tight mt-5 md:mt-7 leading-[0.95]",
    ),
]


def main() -> int:
    if not ROOT.is_dir():
        print(f"ERR: {ROOT} not found", file=sys.stderr)
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

    print(f"\nv3 font tightening {len(touched)} file(s):\n")
    for path, tags in sorted(touched.items()):
        print(f"  {path}")
        for t in tags:
            print(f"    - {t}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
