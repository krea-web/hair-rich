// Aggiorna l'agenda con la lista COMPLETA fornita dal titolare (18 giu -> 31 lug).
// Aggiunge SOLO gli appuntamenti mancanti: se uno slot sullo stesso barbiere e'
// gia' occupato (import precedente o prenotazione online), lo SALTA. Idempotente:
// rilanciandolo non crea doppioni (la verifica e' sull'occupazione dello slot).
//
// Clienti: i NOMI+COGNOME (es. Andrea Tala, Paolo Piredda) si agganciano alla
// scheda esistente (regolari unificati); i SOLO-NOME creano una scheda guest per
// appuntamento (come l'import storico: walk-in diversi non vanno fusi).
//
// Uso:
//   node scripts/seed_agenda_update_18giu.mjs            # dry-run + report
//   node scripts/seed_agenda_update_18giu.mjs --commit   # inserisce davvero
//
// Log UTF-8 in scripts/.seed_agenda_update_18giu.txt
import { readFileSync, writeFileSync } from "node:fs";
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
const COMMIT = process.argv.includes("--commit");
const OFFSET = "+02:00"; // CEST (giu-lug 2026)

// [data, barbiere, [[ora, nomeGrezzo], ...]]
const DAYS = [
  ["2026-06-18", "federico", [["09:00","Riccardo"],["09:30","Matteo"],["10:00","Thomas"],["10:30","Fratello Thomas (?) + barba"],["11:30","Luca"],["12:00","Pietro Bussu"],["16:00","Daniele"],["16:30","Leo"],["17:00","Francesco"],["17:30","Fabio Masila"],["18:00","Francesco"],["18:30","Mattia"],["19:00","Paolo Piredda"]]],
  ["2026-06-18", "cristian", [["16:30","Peppe"],["18:00","Paolo"]]],
  ["2026-06-19", "federico", [["09:00","Riccardo"],["09:30","Mattia Sini"],["10:00","Jordan + barba"],["11:00","Andrea"],["11:30","Ezequiel"],["12:00","Daigon"],["15:00","Andrea Vala"],["15:30","Ale"],["16:00","Matteo"],["16:30","Andrea Mura"],["17:00","Lorenzo Tellien"],["17:30","Edoardo"],["18:00","Samuele"],["18:30","Murri"],["19:00","Roberto Mungia"],["19:30","Romino"]]],
  ["2026-06-19", "cristian", [["09:00","Marco Pudda"],["10:00","Lucas"],["10:30","David"],["15:30","Giommania"],["16:00","Mario"],["16:30","Alessio"],["17:00","Riccardo"],["17:30","Giosue"],["19:00","Alessio"]]],
  ["2026-06-20", "federico", [["09:00","Andrea"],["09:30","Francesco Onnis"],["10:00","Simone"],["10:30","Diego"],["11:00","Claudio Ghisu"],["11:30","Romino"],["12:00","Niccolo Candia"],["15:00","Cristiano Corrias"],["15:30","Fiori"],["16:00","Edoardo"],["16:30","Cristiano"],["17:00","Peppe"],["17:30","Elias"],["18:00","Alessio Cana"],["18:30","Manio Piredda"],["19:00","Filippo"]]],
  ["2026-06-20", "cristian", [["16:00","Kekko + barba"]]],
  ["2026-06-23", "federico", [["09:00","Paolo Murr."],["09:30","Edoardo"],["10:00","David"],["10:30","Nasan"],["11:00","Ezequiel"],["11:30","Federico"],["12:00","Mario Pudda"],["15:00","Francesco"],["16:00","Francesco"],["16:30","Mirko"],["17:00","Matteo Pilloni"],["17:30","Luca Muntoni"],["18:00","Cristiano + barba"],["19:00","Elia"]]],
  ["2026-06-24", "federico", [["09:00","Francesco M"],["12:00","Gabriele Floris"],["15:00","Mattia Mazz."],["15:30","Daniele"],["16:30","Lorenzo Max"],["17:00","Francesca"],["17:30","Mattia Brioschi"],["19:00","Paolo Piredda"]]],
  ["2026-06-24", "cristian", [["15:30","Francesco"]]],
  ["2026-06-25", "federico", [["09:00","Alessio"],["10:30","Samuele"],["11:30","Pietro Bussu"],["15:00","Lillo"],["15:30","Fabio + Barba"],["16:30","Nicola"],["17:00","Matteo"],["17:30","Fabio Masala"],["18:00","Lorenzo"],["18:30","Pedroni + barba"]]],
  ["2026-06-26", "federico", [["09:00","Emanuele"],["09:30","Francesco Onnis"],["10:00","Jordan + barba"],["11:00","Lorenzo"],["11:30","Andrea"],["12:00","Daigon"],["15:00","Andrea Tala"],["15:30","Ale"],["16:00","Alessandro"],["16:30","Badiglio"],["17:00","Cristiano Corrias"],["17:30","Mattia Manini"],["18:00","Samuele"],["18:30","Murri"],["19:00","Jona"]]],
  ["2026-06-27", "federico", [["15:00","Mattia Deiana"],["16:30","Mathias"],["17:00","Brayan"],["17:30","Mathias"]]],
  ["2026-06-30", "federico", [["18:30","Stefano Murgia"],["19:00","Paolo Piredda"]]],
  ["2026-07-01", "federico", [["10:30","Mario"],["11:00","Damiano"],["16:00","Alessandro"],["16:30","Mauretto"],["18:30","Roberto"],["19:00","Cristiano + Barba"]]],
  ["2026-07-02", "federico", [["17:30","Fabio Masala"],["19:00","Daniele Laconi"]]],
  ["2026-07-03", "federico", [["09:30","Francesco Onnis"],["10:00","Jordan + barba"],["15:00","Andrea Tala"],["15:30","Ale"],["17:00","Lorenzo Tellien."],["18:00","Samuele"],["18:30","Murri"],["19:00","Francesco"]]],
  ["2026-07-04", "federico", [["09:30","Alessandro Sini"],["16:00","Alessandro Badiglio + Barba"],["19:00","Ludovico"]]],
  ["2026-07-06", "federico", [["19:00","Paolo"]]],
  ["2026-07-07", "federico", [["11:30","Dario"]]],
  ["2026-07-10", "federico", [["09:00","Emanuele"],["10:00","Jordan + Barba"],["15:00","Andrea Tala"],["18:00","Samuele"],["18:30","Murri"]]],
  ["2026-07-14", "federico", [["19:00","Paolo Piredda"]]],
  ["2026-07-17", "federico", [["10:00","Jordan + Barba"],["15:00","Andrea Tala"],["17:00","Lorenzo"],["18:00","Samuele"]]],
  ["2026-07-21", "federico", [["19:00","Paolo Piredda"]]],
  ["2026-07-24", "federico", [["15:00","Andrea Tala"],["18:00","Samuele"]]],
  ["2026-07-31", "federico", [["17:00","Lorenzo"]]],
];

const log = [];
const out = (s) => { log.push(s); console.log(s.replace(/[^\x00-\x7F]/g, "?")); };
const normName = (f, l) => `${f ?? ""} ${l ?? ""}`.trim().toLowerCase().replace(/\s+/g, " ");

function parseEntry(raw) {
  let combo = false, name = raw;
  const m = name.match(/\+\s*barb\w*/i);
  if (m) { combo = true; name = name.slice(0, m.index); }
  name = name.replace(/\(.*$/, "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return { combo, first_name: parts[0] ?? name, last_name: parts.length > 1 ? parts.slice(1).join(" ") : null };
}
const ms = (dateStr, hhmm, dur) => {
  const start = new Date(`${dateStr}T${hhmm}:00${OFFSET}`);
  return { startISO: start.toISOString(), endISO: new Date(start.getTime() + dur * 60000).toISOString() };
};
const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE;

async function main() {
  out(`# seed_agenda_update_18giu — ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  const { data: staffRows } = await sb.from("staff").select("id, name, slug");
  const findStaff = (...n) => staffRows.find((s) => n.some((x) => (s.slug ?? "").toLowerCase() === x || (s.name ?? "").toLowerCase().includes(x)));
  const STAFF = { federico: findStaff("federico-asara", "federico"), cristian: findStaff("cristian") };
  if (!STAFF.federico || !STAFF.cristian) { out("ERRORE: barbieri non risolti"); return; }

  const { data: svcRows } = await sb.from("services").select("id, slug, duration_min, price_cents").in("slug", ["taglio-classico", "taglio-barba"]);
  const single = svcRows.find((s) => s.slug === "taglio-classico");
  const combo = svcRows.find((s) => s.slug === "taglio-barba");
  if (!single || !combo) { out("ERRORE: servizi non risolti"); return; }

  // Mappa nome-completo -> cliente esistente (preferisci registrato, poi piu' vecchio).
  const { data: custRows } = await sb.from("customers").select("id, first_name, last_name, user_id, created_at");
  const fullNameMap = new Map();
  for (const c of custRows.filter((c) => c.last_name && c.last_name.trim())) {
    const k = normName(c.first_name, c.last_name);
    const prev = fullNameMap.get(k);
    if (!prev || (!prev.user_id && c.user_id) || (new Date(c.created_at) < new Date(prev.created_at) && !prev.user_id)) {
      fullNameMap.set(k, c);
    }
  }

  // Appuntamenti esistenti nel range -> occupazione per barbiere.
  const { data: existing } = await sb.from("appointments")
    .select("staff_id, start_at, end_at, status")
    .gte("start_at", "2026-06-18T00:00:00Z").lt("start_at", "2026-08-01T00:00:00Z")
    .in("status", ["booked", "confirmed", "completed"]);
  const busy = new Map([[STAFF.federico.id, []], [STAFF.cristian.id, []]]);
  for (const a of existing) {
    if (busy.has(a.staff_id)) busy.get(a.staff_id).push([new Date(a.start_at).getTime(), new Date(a.end_at).getTime()]);
  }
  const isFree = (staffId, s, e) => !busy.get(staffId).some(([bs, be]) => overlaps(s, e, bs, be));

  const batchCache = new Map(); // nome-completo creato in questo run -> id
  let inserted = 0, skipped = 0, fail = 0;

  for (const [date, key, items] of DAYS) {
    const staffId = STAFF[key].id;
    for (const [time, raw] of items) {
      const p = parseEntry(raw);
      const svc = p.combo ? combo : single;
      const { startISO, endISO } = ms(date, time, svc.duration_min);
      const s = new Date(startISO).getTime(), e = new Date(endISO).getTime();

      if (!isFree(staffId, s, e)) { skipped++; out(`SKIP ${date} ${time} ${key} "${raw}" (slot occupato)`); continue; }

      if (!COMMIT) { inserted++; out(`ADD  ${date} ${time} ${key} "${raw}"${p.combo ? " (combo)" : ""}`); busy.get(staffId).push([s, e]); continue; }

      try {
        // Risolvi cliente: nome+cognome -> esistente/cache; solo-nome -> guest nuovo.
        let customerId;
        if (p.last_name) {
          const k = normName(p.first_name, p.last_name);
          const hit = fullNameMap.get(k) ?? (batchCache.has(k) ? { id: batchCache.get(k) } : null);
          if (hit) customerId = hit.id;
          else {
            const { data: c, error } = await sb.from("customers").insert({ first_name: p.first_name, last_name: p.last_name, is_guest: true }).select("id").single();
            if (error) throw error;
            customerId = c.id; batchCache.set(k, c.id);
          }
        } else {
          const { data: c, error } = await sb.from("customers").insert({ first_name: p.first_name, last_name: null, is_guest: true }).select("id").single();
          if (error) throw error;
          customerId = c.id;
        }

        const { data: appt, error: aErr } = await sb.from("appointments").insert({
          customer_id: customerId, staff_id: staffId, start_at: startISO, end_at: endISO,
          status: "confirmed", source: "admin", total_cents: svc.price_cents, notes: "Agenda titolare (giu-lug)",
        }).select("id").single();
        if (aErr) throw aErr;
        const { error: sErr } = await sb.from("appointment_services").insert({ appointment_id: appt.id, service_id: svc.id, price_cents: svc.price_cents, duration_min: svc.duration_min });
        if (sErr) throw sErr;

        busy.get(staffId).push([s, e]);
        inserted++; out(`OK   ${date} ${time} ${key} ${p.first_name}${p.last_name ? " " + p.last_name : ""}${p.combo ? " (combo)" : ""}`);
      } catch (err) { fail++; out(`FAIL ${date} ${time} ${key} "${raw}" :: ${err.message}`); }
    }
  }

  out(`\nRiepilogo: ${inserted} ${COMMIT ? "inseriti" : "da inserire"}, ${skipped} saltati (gia' presenti), ${fail} errori.`);
  out(COMMIT ? "Applicato." : "DRY-RUN: rilancia con --commit per inserire.");
  writeFileSync("scripts/.seed_agenda_update_18giu.txt", log.join("\n"), "utf-8");
}

main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
