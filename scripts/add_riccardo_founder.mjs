// Aggiunge (o aggiorna) Riccardo come founder, SENZA foto (spazio vuoto).
// Testi placeholder: da rifinire più avanti.
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

const row = {
    name: "Riccardo",
    slug: "riccardo",
    role: "Founder",
    role_type: "founder",
    tagline: "Hair Rich nasce da una visione: un barbiere dove ogni dettaglio conta.",
    full_bio:
        "Riccardo è il fondatore di Hair Rich. Ha dato vita al progetto e ne cura la visione, la direzione e l'identità. Non lavora in poltrona: il suo ruolo è far crescere il salone e assicurarsi che ogni dettaglio dell'esperienza — dall'accoglienza al risultato finale — sia all'altezza del nome Hair Rich.",
    expertise: [],
    qa: [],
    avatar_url: null,
    cover_url: null,
    is_active: true,
    show_on_team_page: true,
    sort_order: 0, // founder in cima
};

const { data, error } = await sb
    .from("staff")
    .upsert(row, { onConflict: "slug" })
    .select("id, name, slug, role, role_type, sort_order, show_on_team_page, avatar_url")
    .single();
if (error) throw error;
console.log("OK Riccardo:", JSON.stringify({ ...data, avatar_url: data.avatar_url ? "set" : "(vuoto)" }));
