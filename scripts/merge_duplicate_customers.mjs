// Unificazione clienti doppioni (modalita' SICURA scelta dal titolare):
// si fondono SOLO i clienti con lo STESSO nome+cognome E (stesso telefono
// OPPURE stessa email). Gli omonimi senza contatto in comune NON si toccano:
// vanno in scripts/merge_review.csv per decisione manuale.
//
// Canonica del gruppo = la scheda registrata (user_id / login Google) se ce n'e'
// UNA sola; altrimenti la piu' vecchia (created_at). Se nel cluster ci sono 2+
// account registrati, si salta (manuale) per non fondere due login diversi.
//
// Re-pointing di tutti i riferimenti customer_id verso la canonica, merge dei
// metadati (noshow_count somma, consensi OR, note, email/telefono/compleanno se
// mancanti), poi DELETE delle schede assorbite (eventuali figli residui spariscono
// via CASCADE/SET NULL).
//
// Uso:
//   node scripts/merge_duplicate_customers.mjs            # dry-run + report
//   node scripts/merge_duplicate_customers.mjs --commit   # applica davvero
//
// Log UTF-8: scripts/.merge_duplicate_customers.txt ; review: scripts/merge_review.csv
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

// Tabelle con riferimento al cliente (col -> nome colonna FK).
const REFS = [
  ["appointments", "customer_id"],
  ["orders", "customer_id"],
  ["customer_packages", "customer_id"],
  ["customer_surveys", "customer_id"],
  ["loyalty_transactions", "customer_id"],
  ["customer_segments", "customer_id"],
  ["review_requests", "customer_id"],
  ["noshow_outreach", "customer_id"],
  ["waitlist", "customer_id"],
  ["customer_consents", "customer_id"],
  ["push_subscriptions", "customer_id"],
  ["cancellation_history", "customer_id"],
  ["coupon_redemptions", "customer_id"],
  ["coupons", "issued_to_customer_id"],
  ["referrals", "referrer_customer_id"],
  ["referrals", "invited_customer_id"],
];

const log = [];
const out = (s) => { log.push(s); console.log(s.replace(/[^\x00-\x7F]/g, "?")); };
const normName = (f, l) => `${f ?? ""} ${l ?? ""}`.trim().toLowerCase().replace(/\s+/g, " ");
const normPhone = (p) => (p ? p.replace(/\D/g, "").replace(/^0+/, "").slice(-9) : "");
const normEmail = (e) => (e ? e.trim().toLowerCase() : "");

async function main() {
  out(`# merge_duplicate_customers — ${COMMIT ? "COMMIT" : "DRY-RUN"}`);

  const { data: rows, error } = await sb
    .from("customers")
    .select("id, first_name, last_name, email, phone, user_id, is_guest, marketing_consent, noshow_count, notes, birthdate, notification_preferences, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  out(`Clienti totali: ${rows.length}`);

  // Raggruppa per nome normalizzato.
  const byName = new Map();
  for (const c of rows) {
    const k = normName(c.first_name, c.last_name);
    if (!k) continue;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(c);
  }

  const reviewCsv = ["nome,motivo,ids"];
  let merged = 0, deleted = 0, skipped = 0;

  for (const [name, group] of byName) {
    if (group.length < 2) continue;

    // Si fondono SOLO i gruppi con NOME+COGNOME completo (stessa persona). I
    // "solo nome" (Jordan, Matteo, Andrea, ...) sono quasi certamente persone
    // diverse -> non si toccano, finiscono nel report per revisione manuale.
    const hasFullName = name.includes(" ") && group.every((c) => c.last_name && c.last_name.trim());
    if (!hasFullName) {
      reviewCsv.push(`"${name}",solo_nome_non_fuso,"${group.map((c) => c.id).join(" ")}"`);
      skipped++;
      continue;
    }

    {
      const cl = group; // l'intero gruppo: stesso nome+cognome
      const registered = cl.filter((c) => c.user_id);
      if (registered.length > 1) {
        out(`SKIP "${name}": ${registered.length} account registrati diversi (manuale)`);
        reviewCsv.push(`"${name}",multipli_account_registrati,"${cl.map((c) => c.id).join(" ")}"`);
        skipped++;
        continue;
      }
      const canonical = registered[0] ?? cl.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
      const dups = cl.filter((c) => c.id !== canonical.id);

      out(`MERGE "${name}": canonica ${canonical.id}${canonical.user_id ? " (registrato)" : ""} <- ${dups.map((d) => d.id).join(", ")}`);
      merged++;

      // Metadati consolidati sulla canonica.
      const patch = {};
      const sumNoshow = (canonical.noshow_count ?? 0) + dups.reduce((s, d) => s + (d.noshow_count ?? 0), 0);
      if (sumNoshow !== (canonical.noshow_count ?? 0)) patch.noshow_count = sumNoshow;
      if (!canonical.email) { const e = dups.find((d) => d.email)?.email; if (e) patch.email = e; }
      if (!canonical.phone) { const p = dups.find((d) => d.phone)?.phone; if (p) patch.phone = p; }
      if (!canonical.birthdate) { const b = dups.find((d) => d.birthdate)?.birthdate; if (b) patch.birthdate = b; }
      if (!canonical.marketing_consent && dups.some((d) => d.marketing_consent)) patch.marketing_consent = true;
      const extraNotes = dups.map((d) => d.notes).filter(Boolean);
      if (extraNotes.length) patch.notes = [canonical.notes, ...extraNotes].filter(Boolean).join("\n");

      if (COMMIT) {
        for (const d of dups) {
          for (const [table, col] of REFS) {
            const { error: e } = await sb.from(table).update({ [col]: canonical.id }).eq(col, d.id);
            if (e) out(`  re-point ${table}.${col} ${d.id}: ${e.message}`); // conflitti -> cascade alla delete
          }
        }
        if (Object.keys(patch).length) {
          const { error: ep } = await sb.from("customers").update(patch).eq("id", canonical.id);
          if (ep) out(`  patch canonica ${canonical.id}: ${ep.message}`);
        }
        for (const d of dups) {
          const { error: ed } = await sb.from("customers").delete().eq("id", d.id);
          if (ed) out(`  delete dup ${d.id}: ${ed.message}`); else deleted++;
        }
      } else {
        deleted += dups.length;
      }
    }
  }

  out(`\nRiepilogo: ${merged} gruppi fusi, ${deleted} schede assorbite, ${skipped} gruppi saltati (manuale).`);
  out(COMMIT ? "Applicato." : "DRY-RUN: nessuna scrittura. Rilancia con --commit per applicare.");
  writeFileSync("scripts/.merge_duplicate_customers.txt", log.join("\n"), "utf-8");
  writeFileSync("scripts/merge_review.csv", reviewCsv.join("\n"), "utf-8");
}

main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
