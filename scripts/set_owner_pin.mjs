// Imposta salon_settings.owner_unlock_pin = '2026' (gate per passare da vista
// Dipendente a Titolare nel gestionale). Service-role.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(readFileSync(".env.local","utf-8").split(/\r?\n/).map(l=>l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2].trim().replace(/^["']|["']$/g,"")]));
const sb = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false}});
const { data: row, error: e1 } = await sb.from("salon_settings").select("id, owner_unlock_pin").limit(1).maybeSingle();
if (e1) { console.log("ERR select:", e1.message); process.exit(1); }
if (!row) { console.log("ERR: nessuna riga salon_settings"); process.exit(1); }
console.log("PIN attuale:", row.owner_unlock_pin ?? "(non impostato)");
const { error: e2 } = await sb.from("salon_settings").update({ owner_unlock_pin: "2026" }).eq("id", row.id);
if (e2) { console.log("ERR update:", e2.message); process.exit(1); }
const { data: after } = await sb.from("salon_settings").select("owner_unlock_pin").eq("id", row.id).maybeSingle();
console.log("PIN nuovo:", after?.owner_unlock_pin);
