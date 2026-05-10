/**
 * Converte i frame WebP del hero-seq in AVIF (50% più leggeri tipicamente).
 * Genera in public/hero-seq/avif/ — il browser sceglie via <picture>.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = "public/hero-seq";
const OUT_DIR = "public/hero-seq/avif";

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".webp"));
console.log(`Converting ${files.length} frames…`);

let totalSrc = 0;
let totalDst = 0;

for (const file of files) {
    const src = path.join(SRC_DIR, file);
    const dst = path.join(OUT_DIR, file.replace(".webp", ".avif"));
    const srcSize = fs.statSync(src).size;
    totalSrc += srcSize;

    if (fs.existsSync(dst)) {
        totalDst += fs.statSync(dst).size;
        continue; // skip se già convertito
    }

    await sharp(src).avif({ quality: 60, effort: 4 }).toFile(dst);
    totalDst += fs.statSync(dst).size;
}

const saved = ((1 - totalDst / totalSrc) * 100).toFixed(1);
console.log(
    `✓ Converted ${files.length} frames | WebP: ${(totalSrc / 1024 / 1024).toFixed(2)}MB → AVIF: ${(totalDst / 1024 / 1024).toFixed(2)}MB (saved ${saved}%)`
);
