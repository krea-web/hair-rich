// Ottimizza (webp) e carica la foto hero della home nel bucket Storage `asset/`,
// rinominandola `hero-home.webp`. Usa la service role key (bypassa RLS).
// Esegui: node scripts/upload_hero.mjs
//
// Sorgente: hero.jpeg nella root del repo (originale ad alta risoluzione).
// Dopo l'upload verificato, la sorgente va rimossa. Log su file UTF-8 per
// evitare il bug cp1252.
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

const SRC = "hero.jpeg";
const DEST = "hero-home.webp";

const log = [];
try {
    const buf = await sharp(readFileSync(SRC))
        .rotate()
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

    const { error } = await sb.storage.from("asset").upload(DEST, buf, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
    });
    log.push(error ? `FAIL ${DEST} :: ${error.message}` : `OK   ${DEST} (${Math.round(buf.length / 1024)} KB)`);
} catch (e) {
    log.push(`ERR  ${DEST} :: ${e.message}`);
}

writeFileSync("scripts/.upload_hero_log.txt", log.join("\n") + "\n", { encoding: "utf-8" });
console.log(log.join("\n"));
