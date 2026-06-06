// Dump read-only di staff, admins, portfolio_images per pianificare le modifiche.
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

const { data: staff } = await sb
    .from("staff")
    .select("id, name, slug, role, role_type, is_active, sort_order, user_id, avatar_url, cover_url, show_on_team_page")
    .order("sort_order", { ascending: true });
console.log("=== STAFF ===");
for (const s of staff ?? []) {
    console.log(JSON.stringify({ ...s, avatar_url: s.avatar_url ? "set" : null, cover_url: s.cover_url ? "set" : null }));
}

const { data: admins } = await sb.from("admins").select("user_id, role");
console.log("\n=== ADMINS ===");
for (const a of admins ?? []) console.log(JSON.stringify(a));

const { data: portfolio } = await sb
    .from("portfolio_images")
    .select("id, title, tag, storage_path, sort_order, is_active")
    .order("sort_order", { ascending: true });
console.log("\n=== PORTFOLIO_IMAGES ===");
for (const p of portfolio ?? []) console.log(`#${p.sort_order} | tag="${p.tag}" | title="${p.title}" | ${p.storage_path} | active=${p.is_active} | ${p.id}`);
