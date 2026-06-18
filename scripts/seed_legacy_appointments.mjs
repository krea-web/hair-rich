// Carica le prenotazioni "storiche" dell'agenda cartacea nel gestionale.
// Una NUOVA scheda cliente per ogni prenotazione (scelta del titolare: niente
// deduplica). Servizio singolo = taglio (30'), "+ barba" = combo (60').
//
// Uso:
//   node scripts/seed_legacy_appointments.mjs            # dry-run (verifica, niente scritture)
//   node scripts/seed_legacy_appointments.mjs --commit   # inserisce davvero
//   ... --commit --force                                 # ignora il guard "range gia' popolato"
//
// Log dettagliato UTF-8 in scripts/.seed_legacy_appointments.txt (console solo ASCII).
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
const sb = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const COMMIT = process.argv.includes("--commit");
const FORCE = process.argv.includes("--force");
const OFFSET = "+02:00"; // CEST (giugno-luglio 2026)

// ── Agenda consegnata dal titolare ─────────────────────────────────────────
// [data, staffKey, [[ora, nomeGrezzo], ...]]
const DAYS = [
  ["2026-06-18", "federico", [
    ["09:00", "Riccardo"], ["09:30", "Matteo"], ["10:00", "Thomas"],
    ["10:30", "Fratello Thomas (?) + barba"], ["11:30", "Luca"], ["12:00", "Pietro Bussu"],
    ["16:00", "Daniele"], ["16:30", "Leo"], ["17:00", "Francesco"], ["17:30", "Fabio Masila"],
    ["18:00", "Francesco"], ["18:30", "Mattia"], ["19:00", "Paolo Piredda"],
  ]],
  ["2026-06-18", "cristian", [["16:30", "Peppe"], ["18:00", "Paolo"]]],
  ["2026-06-19", "federico", [
    ["09:30", "Mattia Sini"], ["10:00", "Jordan + barba"], ["11:00", "Andrea"],
    ["11:30", "Ezequiel"], ["12:00", "Daigon"], ["15:00", "Andrea Vala"], ["15:30", "Ale"],
    ["16:00", "Matteo"], ["16:30", "Andrea Mura"], ["17:00", "Lorenzo Tellien"],
    ["17:30", "Edoando"], ["18:00", "Samuele"], ["18:30", "Murri"], ["19:00", "Roberto Mungia"],
    ["19:30", "Romino"],
  ]],
  ["2026-06-19", "cristian", [["10:00", "Filippo"], ["15:30", "Giommania"], ["16:00", "Mario"]]],
  ["2026-06-20", "federico", [
    ["09:00", "Andrea"], ["09:30", "Francesco Onnis"], ["10:00", "Simone"], ["10:30", "Diego"],
    ["11:00", "Claudio Ghisu"], ["11:30", "Lorenzo"], ["12:00", "Niccolo Candia"],
    ["15:00", "Cristiano Cornias"], ["15:30", "Fiori"], ["16:00", "Edoardo"], ["16:30", "Cristiano"],
    ["17:00", "Peppe"], ["17:30", "Elias"], ["18:00", "Alessio Cana"], ["18:30", "Manio Pinedda"],
    ["19:00", "Filippo"],
  ]],
  ["2026-06-23", "federico", [
    ["09:00", "Paolo Murn."], ["10:00", "David"], ["10:30", "Nasan"], ["11:00", "Ezequiel"],
    ["11:30", "Federico"], ["12:00", "Mario Pudda"], ["19:00", "Elia"],
  ]],
  ["2026-06-24", "federico", [
    ["12:00", "Gabriele Floris"], ["15:00", "Mazz."], ["15:30", "Daniele"],
    ["18:30", "Francesco M."], ["19:00", "Paolo Piredda"],
  ]],
  ["2026-06-24", "cristian", [["15:30", "Francesco"]]],
  ["2026-06-25", "federico", [
    ["09:00", "Alessio"], ["11:30", "Pietro Bussu"], ["15:00", "Lillo"], ["16:30", "Nicola"],
    ["17:00", "Matteo"], ["17:30", "Fabio Masala"], ["18:00", "Lorenzo"], ["18:30", "Pedroni + barba"],
  ]],
  ["2026-06-26", "federico", [
    ["09:00", "Emanuele"], ["09:30", "Francesco Onnis"], ["10:00", "Jordan + barba"],
    ["11:30", "Andrea"], ["12:00", "Daigon"], ["15:00", "Andrea Tala"], ["15:30", "Ale"],
    ["17:00", "Cristiano Corrias"], ["17:30", "Mattia Manini"], ["18:00", "Samuele"],
    ["18:30", "Murri"], ["19:00", "Jona"],
  ]],
  ["2026-06-27", "federico", [
    ["15:00", "Mattia Deiana"], ["16:30", "Mathias"], ["17:00", "Brayan"], ["17:30", "Mathias"],
  ]],
  ["2026-06-30", "federico", [["19:00", "Paolo Piredda"]]],
  ["2026-07-01", "federico", [["16:00", "Alessandro"]]],
  ["2026-07-02", "federico", [["17:30", "Fabio Masala"]]],
  ["2026-07-03", "federico", [
    ["09:00", "Francesco Onnis"], ["10:00", "Jordan + barba"], ["15:00", "Andrea Tala"],
    ["15:30", "Ale"], ["17:00", "Lorenzo Tellien"], ["18:00", "Samuele"], ["18:30", "Murri"],
  ]],
  ["2026-07-06", "federico", [["19:00", "Paolo"]]],
  ["2026-07-10", "federico", [
    ["09:00", "Emanuele"], ["10:00", "Jordan + barba"], ["18:00", "Samuele"], ["18:30", "Murri"],
  ]],
  ["2026-07-14", "federico", [["19:00", "Paolo Piredda"]]],
  ["2026-07-17", "federico", [["10:00", "Jordan + barba"], ["17:00", "Lorenzo"], ["18:00", "Samuele"]]],
  ["2026-07-21", "federico", [["19:00", "Paolo Piredda"]]],
  ["2026-07-24", "federico", [["18:00", "Samuele"]]],
  ["2026-07-31", "federico", [["17:00", "Lorenzo"]]],
];

// ── Parsing nome + combo ────────────────────────────────────────────────────
function parseEntry(raw) {
  let combo = false;
  let name = raw;
  const m = name.match(/\+\s*barb\w*/i); // "+ barba", "+ Barba", "+ Barbq"
  if (m) {
    combo = true;
    name = name.slice(0, m.index);
  }
  name = name.replace(/\(.*$/, "").trim(); // toglie "(?)" e note tra parentesi
  const uncertain = /\?/.test(raw) || /\.\s*$/.test(name);
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? name;
  const last = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { combo, first_name: first, last_name: last, uncertain, display: name };
}

function addMinutesISO(dateStr, hhmm, durationMin) {
  const startLocal = `${dateStr}T${hhmm}:00${OFFSET}`;
  const start = new Date(startLocal);
  const end = new Date(start.getTime() + durationMin * 60000);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

const log = [];
const L = (s) => log.push(s);

async function main() {
  // 1. Risolvi staff
  const { data: staffRows, error: staffErr } = await sb
    .from("staff").select("id, name, slug, is_active, role_type");
  if (staffErr) throw staffErr;
  const findStaff = (...needles) =>
    staffRows.find((s) =>
      needles.some((n) => (s.slug ?? "").toLowerCase() === n || (s.name ?? "").toLowerCase().includes(n)));
  const federico = findStaff("federico-asara", "federico");
  const cristian = findStaff("cristian", "luca"); // il 2o barbiere (slug cristian o luca nel seed)
  const STAFF = { federico, cristian };

  L("== STAFF ==");
  for (const s of staffRows) L(`  ${s.is_active ? "act" : "off"} ${s.role_type ?? "?"} | ${s.slug} | ${s.name} | ${s.id}`);
  L(`  -> federico = ${federico?.name} (${federico?.id})`);
  L(`  -> cristian = ${cristian?.name} (${cristian?.id})`);

  // 2. Risolvi servizi
  const { data: svcRows, error: svcErr } = await sb
    .from("services").select("id, slug, name, duration_min, price_cents, is_active")
    .in("slug", ["taglio-classico", "taglio-barba"]);
  if (svcErr) throw svcErr;
  const single = svcRows.find((s) => s.slug === "taglio-classico");
  const combo = svcRows.find((s) => s.slug === "taglio-barba");
  L("== SERVIZI ==");
  for (const s of svcRows) L(`  ${s.slug} | ${s.name} | ${s.duration_min}min | ${(s.price_cents/100).toFixed(2)} EUR | ${s.id}`);

  if (!federico || !cristian || !single || !combo) {
    L("ERRORE: staff o servizi non risolti. Abort.");
    flush();
    console.log("ABORT: staff/servizi non risolti. Vedi scripts/.seed_legacy_appointments.txt");
    return;
  }
  if (combo.duration_min !== 60) L(`ATTENZIONE: combo duration_min=${combo.duration_min} (atteso 60).`);

  // 3. Espandi appuntamenti + parsing
  const appts = [];
  const uncertainList = [];
  for (const [date, staffKey, items] of DAYS) {
    const staff = STAFF[staffKey];
    for (const [time, raw] of items) {
      const p = parseEntry(raw);
      const svc = p.combo ? combo : single;
      const { startISO, endISO } = addMinutesISO(date, time, svc.duration_min);
      const appt = {
        date, time, staffKey, staffId: staff.id,
        first_name: p.first_name, last_name: p.last_name,
        svc, startISO, endISO, combo: p.combo, raw,
      };
      appts.push(appt);
      if (p.uncertain) uncertainList.push(`${date} ${time} ${staffKey}: "${raw}"`);
    }
  }

  // 4. Overlap check intra-batch per staff
  const overlaps = [];
  for (const key of ["federico", "cristian"]) {
    const list = appts.filter((a) => a.staffKey === key)
      .sort((a, b) => a.startISO.localeCompare(b.startISO));
    for (let i = 1; i < list.length; i++) {
      if (list[i].startISO < list[i - 1].endISO) {
        overlaps.push(`${key}: ${list[i-1].date} ${list[i-1].time} (${list[i-1].raw}) <-> ${list[i].time} (${list[i].raw})`);
      }
    }
  }

  L("== RIEPILOGO ==");
  L(`  appuntamenti totali: ${appts.length}`);
  L(`  combo (+barba): ${appts.filter((a) => a.combo).length}`);
  L(`  federico: ${appts.filter((a) => a.staffKey === "federico").length} | cristian: ${appts.filter((a) => a.staffKey === "cristian").length}`);
  L(`  nomi incerti (${uncertainList.length}):`);
  uncertainList.forEach((u) => L(`     - ${u}`));
  L(`  overlap intra-batch (${overlaps.length}):`);
  overlaps.forEach((o) => L(`     - ${o}`));

  if (!COMMIT) {
    L("== DRY-RUN: nessuna scrittura. Rilancia con --commit per inserire. ==");
    flush();
    console.log(`DRY-RUN ok. ${appts.length} appuntamenti, ${appts.filter(a=>a.combo).length} combo, ${uncertainList.length} incerti, ${overlaps.length} overlap. Vedi log.`);
    return;
  }

  // 5. Guard idempotenza: questo import e' GIA' stato eseguito?
  // Conta solo le righe con la NOSTRA firma (notes 'Import agenda cartacea'),
  // cosi' non confonde le prenotazioni online preesistenti con un nostro re-run.
  const { count: alreadyImported } = await sb
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .gte("start_at", "2026-06-18T00:00:00Z")
    .lt("start_at", "2026-08-01T00:00:00Z")
    .like("notes", "Import agenda cartacea%");
  if (alreadyImported && alreadyImported > 0 && !FORCE) {
    L(`GUARD: import gia' eseguito (${alreadyImported} righe 'Import agenda cartacea'). Niente re-run. (--force per ignorare)`);
    flush();
    console.log(`ABORT: import gia' eseguito (${alreadyImported} righe nostre). Niente duplicati.`);
    return;
  }

  // 6. Insert
  let ok = 0, fail = 0;
  for (const a of appts) {
    try {
      const { data: cust, error: cErr } = await sb.from("customers")
        .insert({ first_name: a.first_name, last_name: a.last_name, is_guest: true })
        .select("id").single();
      if (cErr) throw cErr;
      const { data: appt, error: aErr } = await sb.from("appointments")
        .insert({
          customer_id: cust.id, staff_id: a.staffId,
          start_at: a.startISO, end_at: a.endISO,
          status: "confirmed", source: "admin", total_cents: a.svc.price_cents,
          notes: a.uncertain ? `Import agenda cartacea (verificare nome: "${a.raw}")` : "Import agenda cartacea",
        })
        .select("id").single();
      if (aErr) throw aErr;
      const { error: sErr } = await sb.from("appointment_services")
        .insert({ appointment_id: appt.id, service_id: a.svc.id, price_cents: a.svc.price_cents, duration_min: a.svc.duration_min });
      if (sErr) throw sErr;
      ok++;
      L(`OK  ${a.date} ${a.time} ${a.staffKey} ${a.first_name}${a.last_name ? " " + a.last_name : ""} ${a.combo ? "(combo)" : ""}`);
    } catch (e) {
      fail++;
      L(`FAIL ${a.date} ${a.time} ${a.staffKey} "${a.raw}" :: ${e.message}`);
    }
  }
  L(`== INSERITI ${ok}/${appts.length} (fail ${fail}) ==`);
  flush();
  console.log(`COMMIT done. ${ok}/${appts.length} inseriti (fail ${fail}). Vedi log.`);
}

function flush() {
  writeFileSync("scripts/.seed_legacy_appointments.txt", log.join("\n") + "\n", { encoding: "utf-8" });
}

main().catch((e) => { L(`EXCEPTION: ${e.message}`); flush(); console.log("EXCEPTION:", e.message); });
