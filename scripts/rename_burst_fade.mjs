// Rinomina i tagli sbagliati in "Burst Fade" (per id esatti).
// #1 taper-fade-01, #3 mid-fade-01, #5 low-fade-01, #9 french-crop-01.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
    const out = {};
    for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
}
const env = loadEnv(".env.local");
const sb = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const IDS = [
    "80d97386-a109-4e0a-a0c5-6abfe3b4e879", // taper-fade-01
    "075e2c21-4bd4-4eea-be40-7c418a784802", // mid-fade-01
    "61735719-feef-4f55-b9ab-bd655a9a7a50", // low-fade-01
    "43c1f58b-1c2b-4dcf-8a8e-c83a92a2ad96", // french-crop-01
];

const { error } = await sb
    .from("portfolio_images")
    .update({ tag: "Burst Fade", title: "Burst Fade" })
    .in("id", IDS);
if (error) throw error;

const { data } = await sb
    .from("portfolio_images")
    .select("sort_order, tag, title, storage_path")
    .in("id", IDS)
    .order("sort_order", { ascending: true });
console.log("Aggiornate:");
for (const p of data ?? []) console.log(`  #${p.sort_order} ${p.storage_path} -> tag="${p.tag}", title="${p.title}"`);
