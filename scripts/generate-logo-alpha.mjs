// Genera due PNG con sfondo alpha-transparente partendo da public/logo.png
// (silver su nero solido). Usiamo la luminanza di ogni pixel come canale alpha:
// nero → trasparente, silver → opaco. Preserva l'antialiasing dei bordi.
//
// Output:
//   public/logo-extended.png  → logo intero (scissors + rosa + HAIRRICH)
//   public/logo-wordmark.png  → solo wordmark "HAIRRICH" (crop fascia inferiore)

import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const src = path.join(root, "public", "logo.png");

async function main() {
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const out = Buffer.from(data);
    for (let i = 0; i < out.length; i += 4) {
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        // Luminanza percepita (più vicina al nero significa più trasparente)
        const lum = Math.max(r, g, b);
        out[i + 3] = lum;
    }

    // Logo esteso (full)
    await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(path.join(root, "public", "logo-extended.png"));

    // Crop solo wordmark "HAIRRICH" (sta nel 54–72% verticale)
    const wmTop = Math.floor(info.height * 0.54);
    const wmBottom = Math.floor(info.height * 0.72);
    const wmHeight = wmBottom - wmTop;
    const wmLeft = Math.floor(info.width * 0.13);
    const wmRight = Math.floor(info.width * 0.87);
    const wmWidth = wmRight - wmLeft;

    await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extract({ left: wmLeft, top: wmTop, width: wmWidth, height: wmHeight })
        .png({ compressionLevel: 9 })
        .toFile(path.join(root, "public", "logo-wordmark.png"));

    console.log("✓ generated public/logo-extended.png (%dx%d)", info.width, info.height);
    console.log("✓ generated public/logo-wordmark.png (%dx%d)", wmWidth, wmHeight);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
