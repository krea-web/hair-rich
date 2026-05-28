"""
calibrate_landing_v4_hero.py — ultimo round: hero ancora più contenute su PC.
Mobile/md NON toccati.
"""

import sys
from pathlib import Path

ROOT = Path("src/components/landing")

REPLACEMENTS: list[tuple[str, str, str]] = [
    # ── BARBER STUDIO h1 vw — ulteriore -20% su PC ─────────────────────
    (
        "hero-vw-tight",
        "text-[13vw] md:text-[8.5vw] lg:text-[6vw] xl:text-[5.2vw] 2xl:text-[4.8vw]",
        "text-[13vw] md:text-[8.5vw] lg:text-[5vw] xl:text-[4.4vw] 2xl:text-[4vw]",
    ),
    # ── ShopHero + PortfolioHero h1 (post-v3) ──────────────────────────
    (
        "hero-7rem-shop-v4",
        "text-4xl sm:text-5xl md:text-7xl lg:text-7xl xl:text-[5.5rem] 2xl:text-[6rem]",
        "text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-6xl 2xl:text-7xl",
    ),
    # ── ServicesHero h1 (post-v3) ──────────────────────────────────────
    (
        "hero-services-v4",
        "text-4xl sm:text-5xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-[5rem]",
        "text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-6xl 2xl:text-7xl",
    ),
    # ── BookingHero + TeamHero h1 (post-v3) ────────────────────────────
    (
        "hero-booking-team-v4",
        "text-4xl sm:text-5xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-warm-white tracking-tight",
        "text-4xl sm:text-5xl md:text-7xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-warm-white tracking-tight",
    ),
    # ── Hero min-h ulteriore tightening PC (post-v2) ──────────────────
    (
        "hero-minh-v4",
        "min-h-[70vh] md:min-h-[75vh] lg:min-h-[62vh] xl:min-h-[58vh] 2xl:min-h-[55vh]",
        "min-h-[70vh] md:min-h-[75vh] lg:min-h-[52vh] xl:min-h-[48vh] 2xl:min-h-[45vh]",
    ),
    (
        "hero-minh-services-v4",
        "min-h-[65vh] md:min-h-[70vh] lg:min-h-[58vh] xl:min-h-[54vh] 2xl:min-h-[52vh]",
        "min-h-[65vh] md:min-h-[70vh] lg:min-h-[48vh] xl:min-h-[44vh] 2xl:min-h-[42vh]",
    ),
    # ── HeroSection homepage min-h (post-v2) ───────────────────────────
    (
        "hero-home-minh-v4",
        "min-h-[70dvh] md:min-h-[85dvh] lg:min-h-[68vh] xl:min-h-[62vh] 2xl:min-h-[58vh]",
        "min-h-[70dvh] md:min-h-[85dvh] lg:min-h-[58vh] xl:min-h-[52vh] 2xl:min-h-[48vh]",
    ),
    # ── PageHero shared (legal pages) ──────────────────────────────────
    (
        "pagehero-v4",
        "min-h-[48vh] md:min-h-[58vh] lg:min-h-[52vh] xl:min-h-[48vh]",
        "min-h-[40vh] md:min-h-[48vh] lg:min-h-[44vh] xl:min-h-[40vh]",
    ),
    # ── PortfolioGallery h2 ridotta su lg+ ────────────────────────────
    (
        "portfolio-h2",
        'text-display text-[12vw] md:text-[6vw] lg:text-[5vw]',
        'text-display text-[12vw] md:text-[6vw] lg:text-[4vw] xl:text-[3.5vw] 2xl:text-[3vw]',
    ),
    # ── ReviewsSection blockquote ridotta su PC ───────────────────────
    (
        "reviews-bq",
        "text-2xl md:text-4xl lg:text-5xl xl:text-6xl text-warm-white leading-snug",
        "text-2xl md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-4xl text-warm-white leading-snug",
    ),
]


def main() -> int:
    if not ROOT.is_dir():
        print("ERR", file=sys.stderr)
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

    print(f"\nv4 hero tightening: {len(touched)} file(s)\n")
    for path, tags in sorted(touched.items()):
        print(f"  {path}")
        for t in tags:
            print(f"    - {t}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
