// Crop each intro frame to the exact subject bounding box.
//
// As the rose+scissors animation progresses, the subject rises within the
// 568x615 source frame and the lower portion fills with near-black pixels.
// On a tall mobile viewport this leaves a growing void below the subject
// during scroll. By cropping each frame to its content bbox (bottom only
// — the subject stays anchored to the top of the source), the canvas
// drawing call can top-anchor the cropped image and the empty space below
// the subject disappears.
//
// Originals are backed up to `frame_NNN.orig.webp` on first run. The
// frame files in-place (`frame_NNN.webp`) get overwritten with cropped
// versions. Update FRAMES_VERSION in IntroSequence.tsx to bust caches.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const FRAMES_DIR = path.resolve("public/hero-seq");
const FRAME_COUNT = 103;
const BLACK_THRESHOLD = 28; // per-channel; below this counts as background
const ROW_MIN_BRIGHT_PIXELS = 6; // tolerate a few noisy pixels in a black row
const PADDING_BOTTOM = 4;

async function findContentBottom(filePath) {
    const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    for (let y = height - 1; y >= 0; y--) {
        let brightCount = 0;
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = channels === 4 ? data[idx + 3] : 255;
            if (a < 30) continue; // skip transparent pixels
            if (r > BLACK_THRESHOLD || g > BLACK_THRESHOLD || b > BLACK_THRESHOLD) {
                brightCount++;
                if (brightCount >= ROW_MIN_BRIGHT_PIXELS) return y;
            }
        }
    }
    return height - 1;
}

async function processFrame(i) {
    const filename = `frame_${String(i).padStart(3, "0")}.webp`;
    const filePath = path.join(FRAMES_DIR, filename);
    const backupPath = path.join(FRAMES_DIR, `frame_${String(i).padStart(3, "0")}.orig.webp`);
    const tmpPath = path.join(FRAMES_DIR, `frame_${String(i).padStart(3, "0")}.tmp.webp`);

    // Back up once
    try {
        await fs.access(backupPath);
    } catch {
        await fs.copyFile(filePath, backupPath);
    }

    // Use the backup as source — that way re-running the script doesn't
    // crop on top of an already-cropped file.
    const metadata = await sharp(backupPath).metadata();
    const bottomY = await findContentBottom(backupPath);
    const newHeight = Math.min(metadata.height, bottomY + 1 + PADDING_BOTTOM);

    await sharp(backupPath)
        .extract({ left: 0, top: 0, width: metadata.width, height: newHeight })
        .webp({ quality: 88, effort: 4 })
        .toFile(tmpPath);
    await fs.rename(tmpPath, filePath);

    return { filename, originalHeight: metadata.height, newHeight };
}

console.log(`Cropping ${FRAME_COUNT} intro frames…`);
const results = [];
for (let i = 1; i <= FRAME_COUNT; i++) {
    const r = await processFrame(i);
    results.push(r);
    if (i % 10 === 0 || i === FRAME_COUNT) {
        console.log(`  ${i}/${FRAME_COUNT}: ${r.filename} ${r.originalHeight}px → ${r.newHeight}px`);
    }
}

const max = Math.max(...results.map((r) => r.newHeight));
const min = Math.min(...results.map((r) => r.newHeight));
console.log(`\nDone. Heights: min ${min}px, max ${max}px (original 615px).`);
console.log("⚠️  Remember to bump FRAMES_VERSION in src/components/landing/IntroSequence.tsx");
