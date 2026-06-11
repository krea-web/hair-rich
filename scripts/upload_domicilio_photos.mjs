// One-off: ottimizza (webp) e carica le 9 foto della sessione "taglio a domicilio"
// (villa a Porto Cervo) nel bucket Storage `asset/`, rinominandole in modo SEO-friendly.
// Usa la service role key (bypassa RLS). Esegui: node scripts/upload_domicilio_photos.mjs
//
// Le foto sorgente sono in public/ con nomi UUID; dopo l'upload verificato vanno rimosse.
// Output scritto su file UTF-8 (scripts/.upload_domicilio_log.txt) per evitare il bug cp1252.
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

// UUID sorgente -> nome destinazione nel bucket asset/
const MAP = [
    ["public/34e8bfc6-c085-47ca-b07c-78c522eb7b46.jpeg", "domicilio-villa-wide-1.webp"],
    ["public/550f74b8-f608-4849-bfba-4ecc0b1ba584.jpeg", "domicilio-action-1.webp"],
    ["public/4dd6ecea-e53c-440e-a279-99336aa331c7.jpeg", "domicilio-result-goldenhour-1.webp"],
    ["public/48b4ca11-ed24-4c34-9b76-ddef0cf7b901.jpeg", "domicilio-result-goldenhour-2.webp"],
    ["public/9d3b7147-0471-456f-8267-d0792dd28708.jpeg", "domicilio-result-goldenhour-3.webp"],
    ["public/a5a7f530-6008-438e-a94e-51fc6418e963.jpeg", "domicilio-cape-detail.webp"],
    ["public/c6c63328-19ef-4fdd-8427-0d6e87f83db3.jpeg", "domicilio-villa-wide-2.webp"],
    ["public/fc281e05-aeb5-41ab-b5c0-d70eb0342b7b.jpeg", "domicilio-action-2.webp"],
    ["public/fe7c6d36-92c1-4f0d-9d67-fb118bad578d.jpeg", "domicilio-kit-postazione.webp"],
];

const log = [];
function record(line) {
    log.push(line);
}

for (const [src, dest] of MAP) {
    try {
        const input = readFileSync(src);
        const buf = await sharp(input)
            .rotate() // rispetta l'orientamento EXIF
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const { error } = await sb.storage.from("asset").upload(dest, buf, {
            contentType: "image/webp",
            cacheControl: "31536000",
            upsert: true,
        });
        if (error) {
            record(`FAIL ${dest} :: ${error.message}`);
        } else {
            const kb = Math.round(buf.length / 1024);
            record(`OK   ${dest} (${kb} KB)`);
        }
    } catch (e) {
        record(`ERR  ${dest} :: ${e.message}`);
    }
}

const summary = log.join("\n") + "\n";
writeFileSync("scripts/.upload_domicilio_log.txt", summary, { encoding: "utf-8" });
// stampa ASCII-safe a console
const okCount = log.filter((l) => l.startsWith("OK")).length;
console.log(`Done. ${okCount}/${MAP.length} uploaded. See scripts/.upload_domicilio_log.txt`);
