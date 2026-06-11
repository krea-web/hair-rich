// Owner Evening Brief · cron ~20:00 (Europe/Rome)
//
// A fine turno il bot scrive PER PRIMO al titolare con il riepilogo della
// giornata e lo invita a chiudere il brief (presenze, ore, materiale usato,
// spese straordinarie, POS/contanti). Le risposte le gestisce telegram-assistant
// (memoria conversazionale + complete_daily_brief).
//
// Skill-flag: owner_daily_brief.
// Schedule: supabase functions schedule owner-evening-brief "0 20 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, todayKey } from '../_shared/cronLock.ts';

const TZ = 'Europe/Rome';

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
function romeDayBounds(now: Date): { startISO: string; endISO: string } {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
  const off = tzOffsetMin(now, TZ);
  const start = new Date(`${dateStr}T00:00:00Z`).getTime() - off * 60000;
  return { startISO: new Date(start).toISOString(), endISO: new Date(start + 86400000).toISOString() };
}
const eur = (c: number) => `€${((c || 0) / 100).toFixed(2).replace('.', ',')}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const lockPeriod = todayKey();
  if (!(await acquireCronLock(supabase, 'owner-evening-brief', lockPeriod))) {
    return ok({ skipped: 'already_ran_for_period', period: lockPeriod });
  }

  const { data: skill } = await supabase
    .from('skills_config').select('enabled').eq('skill_key', 'owner_daily_brief').maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const { startISO, endISO } = romeDayBounds(new Date());
  const { data: appts } = await supabase
    .from('appointments').select('status, price_paid_cents, payment_method')
    .gte('start_at', startISO).lt('start_at', endISO);
  const rows = (appts ?? []) as any[];
  const completed = rows.filter((a) => a.status === 'completed');
  const total = completed.reduce((s, a) => s + (a.price_paid_cents ?? 0), 0);
  const pos = completed.reduce((s, a) => s + (a.payment_method === 'pos' ? a.price_paid_cents ?? 0 : 0), 0);
  const cash = completed.reduce((s, a) => s + (a.payment_method === 'cash' ? a.price_paid_cents ?? 0 : 0), 0);
  const noShow = rows.filter((a) => a.status === 'no_show').length;
  const expected = rows.filter((a) => a.status !== 'cancelled').length;

  const lines = [
    '🌙 *Fine giornata — facciamo il resoconto?*',
    '',
    `Oggi *${completed.length}/${expected}* appuntamenti completati${noShow ? `, *${noShow}* no-show` : ''}.`,
    `Incasso registrato: *${eur(total)}* (POS ${eur(pos)} · contanti ${eur(cash)}).`,
    '',
    'Rispondi *chiudi la giornata* e ti chiedo: presenze, ore, materiale di vendita usato, spese straordinarie e — se mancano — i totali POS/contanti.',
  ];
  const text = lines.join('\n');

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const { data: settings } = await supabase
    .from('salon_settings').select('owner_telegram_chat_id, owner_telegram_extra_chat_ids').maybeSingle();
  const recipients = [
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

  return ok({ ok: true, completed: completed.length, expected, no_show: noShow, sent });
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
