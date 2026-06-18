// Pulizia delle doppie prenotazioni accumulate dal bug A ("qualsiasi barbiere"
// non smistato + nessun controllo conflitti con staff NULL).
//
// Cosa fa:
//   1) Duplicati identici (stesso cliente + stesso orario di inizio) -> tiene il
//      piu' vecchio (created_at), marca gli altri per ELIMINAZIONE.
//   2) Appuntamenti con staff_id NULL -> li assegna al PRIMO barbiere libero.
//   3) Sovrapposizioni sullo stesso barbiere -> il piu' recente viene spostato
//      al primo barbiere libero per quello slot.
//   Un barbiere bookabile = is_active AND role_type <> 'founder'.
//
// Uso:
//   node scripts/fix_double_bookings.mjs            # dry-run (nessuna scrittura)
//   node scripts/fix_double_bookings.mjs --commit   # applica davvero
//
// Log dettagliato UTF-8 in scripts/.fix_double_bookings.txt (console solo ASCII).
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
const ACTIVE = ["booked", "confirmed", "completed"]; // stati "occupano" lo slot
const log = [];
const out = (s) => { log.push(s); console.log(s.replace(/[^\x00-\x7F]/g, "?")); };

const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE;

async function main() {
  out(`# fix_double_bookings — ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  const { data: staffRows, error: e1 } = await sb
    .from("staff")
    .select("id, name, role_type, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (e1) throw e1;
  const barbers = (staffRows ?? []).filter((s) => (s.role_type ?? "employee") !== "founder");
  out(`Barbieri bookabili: ${barbers.map((b) => b.name).join(", ")}`);

  const { data: apptRows, error: e2 } = await sb
    .from("appointments")
    .select("id, start_at, end_at, status, staff_id, customer_id, created_at")
    .in("status", ACTIVE)
    .order("start_at", { ascending: true });
  if (e2) throw e2;
  const appts = (apptRows ?? []).map((a) => ({
    ...a,
    s: new Date(a.start_at).getTime(),
    e: new Date(a.end_at).getTime(),
  }));
  out(`Appuntamenti attivi caricati: ${appts.length}`);

  const toDelete = new Set();
  const reassign = []; // { id, fromStaff, toStaff, at }

  // 1) Duplicati identici: stesso cliente + stesso start.
  const byKey = new Map();
  for (const a of appts) {
    if (!a.customer_id) continue;
    const k = `${a.customer_id}|${a.start_at}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(a);
  }
  for (const [k, group] of byKey) {
    if (group.length < 2) continue;
    group.sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
    for (const dup of group.slice(1)) {
      toDelete.add(dup.id);
      out(`DUP elimino ${dup.id} (cliente ${dup.customer_id} @ ${dup.start_at}, doppione del piu' vecchio)`);
    }
  }

  // Busy map per barbiere (solo appuntamenti con staff assegnato, non da eliminare).
  const busy = new Map(barbers.map((b) => [b.id, []]));
  for (const a of appts) {
    if (toDelete.has(a.id) || !a.staff_id) continue;
    if (busy.has(a.staff_id)) busy.get(a.staff_id).push(a);
  }
  const firstFreeBarber = (start, end, excludeId) => {
    for (const b of barbers) {
      const conflict = busy.get(b.id).some((x) => x.id !== excludeId && overlaps(start, end, x.s, x.e));
      if (!conflict) return b;
    }
    return null;
  };

  // 2) staff_id NULL -> assegna primo barbiere libero (in ordine cronologico).
  const nullStaff = appts.filter((a) => !a.staff_id && !toDelete.has(a.id)).sort((x, y) => x.s - y.s);
  for (const a of nullStaff) {
    const b = firstFreeBarber(a.s, a.e, a.id);
    if (b) {
      reassign.push({ id: a.id, fromStaff: null, toStaff: b.id, at: a.start_at, name: b.name });
      busy.get(b.id).push(a);
      out(`NULL assegno ${a.id} @ ${a.start_at} -> ${b.name}`);
    } else {
      out(`NULL IRRISOLTO ${a.id} @ ${a.start_at}: nessun barbiere libero (gestione manuale)`);
    }
  }

  // 3) Sovrapposizioni sullo stesso barbiere: tieni il piu' vecchio, sposta gli altri.
  for (const b of barbers) {
    const mine = busy.get(b.id).filter((a) => !toDelete.has(a.id)).sort((x, y) => x.s - y.s || (new Date(x.created_at) - new Date(y.created_at)));
    const kept = [];
    for (const a of mine) {
      const clash = kept.find((k) => overlaps(a.s, a.e, k.s, k.e));
      if (!clash) { kept.push(a); continue; }
      // a si sovrappone: prova a spostarlo su un altro barbiere libero.
      const other = barbers.find((ob) => ob.id !== b.id &&
        !busy.get(ob.id).some((x) => x.id !== a.id && overlaps(a.s, a.e, x.s, x.e)));
      if (other) {
        // togli a dalla busy di b, aggiungi a quella di other
        busy.set(b.id, busy.get(b.id).filter((x) => x.id !== a.id));
        busy.get(other.id).push(a);
        reassign.push({ id: a.id, fromStaff: b.id, toStaff: other.id, at: a.start_at, name: other.name });
        out(`OVERLAP sposto ${a.id} @ ${a.start_at} da ${b.name} -> ${other.name}`);
      } else {
        out(`OVERLAP IRRISOLTO ${a.id} @ ${a.start_at} su ${b.name}: nessun altro barbiere libero (manuale)`);
      }
    }
  }

  out(`\nRiepilogo: ${toDelete.size} da eliminare, ${reassign.length} da riassegnare.`);

  if (COMMIT) {
    for (const id of toDelete) {
      const { error } = await sb.from("appointments").delete().eq("id", id);
      if (error) out(`ERRORE delete ${id}: ${error.message}`);
    }
    for (const r of reassign) {
      const { error } = await sb.from("appointments").update({ staff_id: r.toStaff }).eq("id", r.id);
      if (error) out(`ERRORE update ${r.id}: ${error.message}`);
    }
    out("Applicato.");
  } else {
    out("DRY-RUN: nessuna scrittura. Rilancia con --commit per applicare.");
  }

  writeFileSync("scripts/.fix_double_bookings.txt", log.join("\n"), "utf-8");
}

main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
