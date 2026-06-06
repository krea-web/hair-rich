// Federico: founder -> co_founder + bio corretta + admin owner.
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

const FULL_BIO =
    "Federico è co-fondatore di Hair Rich, insieme a Riccardo. Lavora come master barber dal 2017, dopo dieci anni passati tra Milano, Londra e i set editorial italiani. La sua specialità è il fade chirurgico e il razor cut su capelli medi — ma quello che lo distingue è il consulto iniziale: prima di toccare le forbici dedica sempre due minuti a capire chi hai davanti, come vivi, che tempo dedichi al mattino.";

const { data: fed, error: e1 } = await sb
    .from("staff")
    .update({ role_type: "co_founder", full_bio: FULL_BIO })
    .eq("slug", "federico-asara")
    .select("id, name, role_type, user_id")
    .single();
if (e1) throw e1;
console.log("Federico:", JSON.stringify(fed));

if (fed.user_id) {
    const { error: e2 } = await sb.from("admins").update({ role: "owner" }).eq("user_id", fed.user_id);
    if (e2) throw e2;
    const { data: a } = await sb.from("admins").select("user_id, role").eq("user_id", fed.user_id).single();
    console.log("Admin Federico:", JSON.stringify(a));
} else {
    console.log("ATTENZIONE: Federico non ha user_id collegato, ruolo admin non impostato.");
}
