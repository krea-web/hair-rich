// Ottimizza (webp) e carica le foto della sessione "taglio a domicilio" + il
// ritratto di Riccardo nel bucket Storage `asset/`, rinominandole in modo
// SEO-friendly. Usa la service role key (bypassa RLS).
// Esegui: node scripts/upload_domicilio_photos.mjs
//
// Le foto sorgente sono in public/ con nomi UUID; dopo l'upload verificato
// vanno rimosse. Log su file UTF-8 per evitare il bug cp1252.
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function loadEnv(path) {
    const out = {};
    for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
}

const env = loadEnv(".env.local");
const url = env.PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Mancano PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local");

const sb = createClient(url, key, { auth: { persistSession: false } });

// [src, dest, width] — width opzionale (default 1920).
const MAP = [
    // Batch 2 — sessione con vista marina (Porto Cervo/Porto Rotondo), mantellina rossa
    ["public/f721d938-98c3-4b03-8ac9-24576d705861.JPG", "domicilio-marina-1.webp"],
    ["public/11c74f15-731a-4b09-8da8-06e353c47665.JPG", "domicilio-marina-2.webp"],
    ["public/83529835-cdce-4843-a9e1-5c7e58946297.JPG", "domicilio-comb.webp"],
    ["public/94018133-c514-432e-bc8d-4090229e56d1.JPG", "domicilio-ringlight.webp"],
    ["public/73b2f4a7-4dd4-416e-abc8-8663a1bd1c7c.JPG", "domicilio-night-ringlight.webp"],
    ["public/d38bb601-9bc6-4b55-88c3-d4a5c7ebc0a0.JPG", "domicilio-razor.webp"],
    ["public/ddbac317-5923-40e1-b35a-5c692a058293.JPG", "domicilio-back-marina.webp"],
    ["public/a8624abc-f441-48af-84eb-1f54bcba0fc1.JPG", "domicilio-daylight.webp"],
    ["public/e4d879cc-5c7b-4cfd-a982-a29f1201d398.JPG", "domicilio-brand-view.webp"],
    ["public/c1be1ebc-5c4a-44cc-b99d-67718057e07c.JPG", "domicilio-crew.webp"],
    // Ritratto Riccardo (founder) per /team/riccardo
    ["public/riccardo.jpg", "riccardo.webp", 1100],
];

const log = [];
for (const [src, dest, width] of MAP) {
    try {
        const input = readFileSync(src);
        const buf = await sharp(input)
            .rotate()
            .resize({ width: width ?? 1920, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

        const { error } = await sb.storage.from("asset").upload(dest, buf, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
        });
        log.push(error ? `FAIL ${dest} :: ${error.message}` : `OK   ${dest} (${Math.round(buf.length / 1024)} KB)`);
    } catch (e) {
        log.push(`ERR  ${dest} :: ${e.message}`);
    }
}

writeFileSync("scripts/.upload_domicilio_log.txt", log.join("\n") + "\n", { encoding: "utf-8" });
const okCount = log.filter((l) => l.startsWith("OK")).length;
console.log(`Done. ${okCount}/${MAP.length} uploaded. See scripts/.upload_domicilio_log.txt`);
