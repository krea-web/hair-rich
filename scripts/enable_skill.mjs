// One-off: accende/spegne una skill in skills_config. Usa la service role key.
// Uso: node scripts/enable_skill.mjs <skill_key> [on|off]
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const KEY = process.argv[2];
const ON = (process.argv[3] ?? "on") !== "off";
if (!KEY) throw new Error("Uso: node scripts/enable_skill.mjs <skill_key> [on|off]");

function loadEnv(path) {
    const out = {};
    for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
}

const env = loadEnv(".env.local");
const sb = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const patch = ON
    ? { enabled: true, enabled_at: new Date().toISOString(), disabled_at: null }
    : { enabled: false, disabled_at: new Date().toISOString() };

const { error } = await sb.from("skills_config").update(patch).eq("skill_key", KEY);
if (error) throw error;

const { data } = await sb
    .from("skills_config")
    .select("skill_key, enabled, enabled_at")
    .eq("skill_key", KEY)
    .single();
console.log("OK ·", data?.skill_key, "enabled =", data?.enabled);
