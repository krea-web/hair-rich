// Rigenera i loghi "zoomati" (rimuove il bordo nero in eccesso) e li sostituisce
// in public/ con gli stessi nomi gia in uso. Esegui: node scripts/regen_logos.mjs
import sharp from "sharp";

const P = "C:/Users/daian/hair-rich/public/";
const SRC = P + "logo.png";

// 1) ritaglia il bordo nero -> bounding box del logo
const { data: trimmed, info } = await sharp(SRC)
  .removeAlpha()
  .trim({ background: "#000000", threshold: 24 })
  .png()
  .toBuffer({ resolveWithObject: true });
const cw = info.width, ch = info.height;

// 2+3) icone quadrate "zoomate": logo ~88% del frame, composto direttamente
// su ogni canvas (un solo ridimensionamento => piu' nitido).
async function squareIcon(size, frac, out) {
  const logo = await sharp(trimmed)
    .resize({ width: Math.round(size * frac), height: Math.round(size * frac), fit: "inside" })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: "#000000" } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(P + out);
}
const tight = [
  ["logo.png", 800],
  ["logo-250.png", 250],
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["apple-icon.png", 180],
  ["favicon-32x32.png", 32],
  ["favicon-16x16.png", 16],
];
for (const [out, size] of tight) {
  await squareIcon(size, 0.88, out);
}

// 4) icona MASKABLE dedicata: safe-zone (logo ~62% del frame, resto nero)
const maskTarget = Math.round(512 * 0.62);
const maskLogo = await sharp(trimmed).resize({ width: maskTarget, height: maskTarget, fit: "inside" }).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 3, background: "#000000" } })
  .composite([{ input: maskLogo, gravity: "center" }])
  .png()
  .toFile(P + "icon-maskable-512.png");

// 5) og-image 1200x630, logo piu' grande (altezza ~58%) centrato su nero
const ogLogo = await sharp(trimmed).resize({ height: Math.round(630 * 0.58) }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#000000" } })
  .composite([{ input: ogLogo, gravity: "center" }])
  .png()
  .toFile(P + "og-image.png");

console.log(`trimmed ${cw}x${ch}. Logos regenerated.`);
