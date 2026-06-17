// Owner Morning Digest · cron ~08:00 (Europe/Rome)
//
// All'apertura: (1) timbratura automatica 'in' per lo staff (fn_auto_clock_in_all,
// se skill auto_clock_in attiva), (2) invia al titolare gli appuntamenti del
// giorno, (3) se l'agenda ha pochi appuntamenti suggerisce una storia IG per i
// posti liberi. Invio diretto Bot API (riusa TELEGRAM_BOT_TOKEN già deployato).
//
// Skill-flag: owner_morning_digest.
// Schedule: supabase functions schedule owner-morning-digest "0 8 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, todayKey } from '../_shared/cronLock.ts';

const TZ = 'Europe/Rome';

// Offset (minuti) di un fuso a una certa data, per calcolare i confini-giorno.
function tzOffsetMin(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return (asUTC - date.getTime()) / 60000;
}

function romeDayBounds(now: Date): { startISO: string; endISO: string; dateStr: string } {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now); // YYYY-MM-DD
  const off = tzOffsetMin(now, TZ); // es. +120 in estate
  const start = new Date(`${dateStr}T00:00:00Z`).getTime() - off * 60000;
  const end = start + 24 * 60 * 60 * 1000;
  return { startISO: new Date(start).toISOString(), endISO: new Date(end).toISOString(), dateStr };
}

// ── Fasce libere ────────────────────────────────────────────────────────────
// Orari reali Hair Rich: Lun–Sab 09:00–13:00 · 15:00–20:00, Domenica chiuso.
// Capacità = 2 poltrone (Federico + Cristian). Uno slot da 30' è "libero" se gli
// appuntamenti che lo coprono sono meno della capacità.
const CAPACITY = 2;
const OPEN_BLOCKS: Array<[number, number]> = [[9 * 60, 13 * 60], [15 * 60, 20 * 60]];
function romeMinutes(iso: string): number {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  const [h, m] = p.split(':').map(Number);
  return h * 60 + m;
}
function isClosedRome(dateStr: string): boolean {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay() === 0; // domenica
}
function freeSlotsToday(dateStr: string, appts: Array<{ start_at: string; end_at: string }>): string[] {
  if (isClosedRome(dateStr)) return [];
  const busy = appts
    .filter((a) => a.start_at && a.end_at)
    .map((a) => [romeMinutes(a.start_at), romeMinutes(a.end_at)] as [number, number]);
  const out: string[] = [];
  for (const [from, to] of OPEN_BLOCKS) {
    for (let t = from; t + 30 <= to; t += 30) {
      const occupied = busy.filter(([s, e]) => s < t + 30 && e > t).length;
      if (occupied < CAPACITY) {
        out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
      }
    }
  }
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const lockPeriod = todayKey();
  if (!(await acquireCronLock(supabase, 'owner-morning-digest', lockPeriod))) {
    return ok({ skipped: 'already_ran_for_period', period: lockPeriod });
  }

  const { data: skill } = await supabase
    .from('skills_config').select('enabled').eq('skill_key', 'owner_morning_digest').maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  // (1) Auto-timbratura apertura (se skill attiva).
  let clockedIn = 0;
  const { data: clockSkill } = await supabase
    .from('skills_config').select('enabled').eq('skill_key', 'auto_clock_in').maybeSingle();
  if (clockSkill?.enabled) {
    const { data: n } = await supabase.rpc('fn_auto_clock_in_all');
    clockedIn = typeof n === 'number' ? n : 0;
  }

  // (2) Appuntamenti di oggi (service role → bypassa RLS).
  const { startISO, endISO, dateStr } = romeDayBounds(new Date());
  const { data: rows } = await supabase
    .from('appointments')
    .select(`start_at, end_at, status, customer:customer_id ( first_name, last_name ), appointment_services ( service:service_id ( name ) )`)
    .gte('start_at', startISO).lt('start_at', endISO)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true });

  const appts = (rows ?? []) as any[];
  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  const lines: string[] = [];
  lines.push(`*Buongiorno!* Apertura attività ☀️`);
  if (clockedIn > 0) lines.push(`_Timbratura automatica: ${clockedIn} in servizio._`);
  lines.push('');
  if (appts.length === 0) {
    lines.push('Oggi *nessun appuntamento* in agenda.');
  } else {
    lines.push(`Oggi *${appts.length} appuntamenti*:`);
    for (const a of appts.slice(0, 30)) {
      const name = `${a.customer?.first_name ?? '?'}${a.customer?.last_name ? ' ' + a.customer.last_name[0] + '.' : ''}`;
      const svc = a.appointment_services?.[0]?.service?.name ?? 'Servizio';
      lines.push(`· ${fmtTime(a.start_at)} — ${name} (${svc})`);
    }
  }

  // (3) Fasce libere + spunto storia IG per riempire i posti last-minute.
  const closed = isClosedRome(dateStr);
  const free = freeSlotsToday(dateStr, appts);
  const suggestIg = !closed && free.length > 0;
  if (closed) {
    lines.push('');
    lines.push('Oggi il salone è *chiuso* (domenica).');
  } else if (free.length > 0) {
    lines.push('');
    lines.push(`🕓 *Fasce libere oggi:* ${free.slice(0, 16).join(' · ')}${free.length > 16 ? ' …' : ''}`);
    lines.push('📲 Spunto: fai una *storia su Instagram* per riempire questi posti last-minute.');
  } else {
    lines.push('');
    lines.push('✅ *Agenda piena* oggi — nessuna fascia libera.');
  }

  const text = lines.join('\n');

  // Invio diretto Bot API.
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const { data: settings } = await supabase
    .from('salon_settings').select('owner_telegram_chat_id, owner_telegram_extra_chat_ids').maybeSingle();
  const recipients: string[] = [
    settings?.owner_telegram_chat_id,
    ...((settings?.owner_telegram_extra_chat_ids as string[] | null) ?? []),
  ].filter(Boolean) as string[];

  let sent = 0;
  if (token) {
    for (const chatId of recipients) {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      if (r.ok) sent++;
    }
  }

  // Inbox admin (best-effort).
  await supabase.from('admin_inbox_items').insert({
    event_type: 'owner_morning_digest',
    category: 'system',
    priority: 'normal',
    title: `Resoconto mattutino · ${appts.length} appuntamenti`,
    body: text,
    icon: '☀️',
    payload: { appointments: appts.length, suggest_ig_story: suggestIg, clocked_in: clockedIn },
    source_skill: 'owner_morning_digest',
  }).then(() => {}, () => {});

  return ok({ ok: true, appointments: appts.length, clocked_in: clockedIn, suggest_ig_story: suggestIg, sent });
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
