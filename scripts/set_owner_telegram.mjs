// One-off: imposta salon_settings.owner_telegram_chat_id (chat ID titolare).
// Usa la service role key (bypassa RLS). Esegui: node scripts/set_owner_telegram.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const CHAT_ID = process.argv[2] ?? "1459969011";

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

const { data: rows, error: selErr } = await sb
    .from("salon_settings")
    .select("id, owner_telegram_chat_id")
    .limit(1);
if (selErr) throw selErr;
if (!rows || rows.length === 0) throw new Error("Nessuna riga salon_settings trovata");

const id = rows[0].id;
const { error: updErr } = await sb
    .from("salon_settings")
    .update({ owner_telegram_chat_id: CHAT_ID })
    .eq("id", id);
if (updErr) throw updErr;

const { data: check } = await sb
    .from("salon_settings")
    .select("owner_telegram_chat_id")
    .eq("id", id)
    .single();

console.log("OK · owner_telegram_chat_id =", check?.owner_telegram_chat_id);
