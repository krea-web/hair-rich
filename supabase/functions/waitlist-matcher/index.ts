// Waitlist Matcher · Edge Function (cron, every 15 min)
//
// Pipeline:
//   1. fn_waitlist_expire_stale() → release expired soft holds + bump
//      missed counters / ghost stale entries.
//   2. fn_waitlist_pending_cancellations() → fresh cancellations that
//      still have lead time and no soft reserve yet.
//   3. For each pending cancellation, call fn_match_waitlist_entry. If
//      a match was made, invoke the notifications-router to message the
//      customer (channel-agnostic) and the owner (telegram).
//
// Schedule via Supabase Dashboard → Functions → "Schedule" with cron
// expression `*/15 * * * *`. Manual trigger by POSTing with empty body.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, bucket15Key } from '../_shared/cronLock.ts';

interface MatchedEntry {
  id: string;
  customer_id: string;
  notified_appointment_id: string;
  notify_token: string;
  notify_token_expires_at: string;
}

interface CancellationRow {
  appointment_id: string;
  cancelled_at: string;
  hours_until_slot: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = getSupabase();

  const lockPeriod = bucket15Key();
  if (!(await acquireCronLock(supabase, 'waitlist-matcher', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startedAt = new Date().toISOString();
  const summary = {
    started_at: startedAt,
    expired_soft_holds: 0,
    ghosted_entries: 0,
    cancellations_checked: 0,
    matches_made: 0,
    notifications_sent: 0,
    errors: [] as string[],
  };

  try {
    // 1. House-keeping first so matching has accurate availability.
    const { data: expireRow, error: expireError } = await supabase
      .rpc('fn_waitlist_expire_stale')
      .single();
    if (expireError) {
      summary.errors.push(`expire: ${expireError.message}`);
    } else if (expireRow) {
      summary.expired_soft_holds = (expireRow as { expired_count: number }).expired_count ?? 0;
      summary.ghosted_entries = (expireRow as { ghosted_count: number }).ghosted_count ?? 0;
    }

    // 2. Candidate cancellations.
    const { data: pending, error: pendingError } = await supabase
      .rpc('fn_waitlist_pending_cancellations');
    if (pendingError) {
      summary.errors.push(`pending: ${pendingError.message}`);
      return json(summary, 500);
    }

    const rows = (pending ?? []) as CancellationRow[];
    summary.cancellations_checked = rows.length;

    // 3. Per-cancellation matching + notification dispatch.
    for (const row of rows) {
      const { data: match, error: matchError } = await supabase
        .rpc('fn_match_waitlist_entry', {
          p_cancelled_appointment_id: row.appointment_id,
        })
        .maybeSingle();

      if (matchError) {
        summary.errors.push(`match ${row.appointment_id}: ${matchError.message}`);
        continue;
      }
      if (!match) continue;
      summary.matches_made++;

      const matched = match as MatchedEntry;
      const ok = await notifyMatch(supabase, matched);
      if (ok) summary.notifications_sent++;
    }

    return json(summary, summary.errors.length ? 207 : 200);
  } catch (e) {
    summary.errors.push((e as Error).message);
    return json(summary, 500);
  }
});

async function notifyMatch(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  match: MatchedEntry,
): Promise<boolean> {
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, start_at, end_at, customer_id, staff_id')
    .eq('id', match.notified_appointment_id)
    .single();
  if (!appt) return false;

  const { data: staff } = await supabase
    .from('staff')
    .select('name')
    .eq('id', appt.staff_id)
    .maybeSingle();

  const expiresIso = match.notify_token_expires_at;
  const expiresLocal = new Date(expiresIso).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  const slotLocal = new Date(appt.start_at).toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://hair-rich.it';
  const confirmUrl = `${siteUrl}/profilo/waitlist/${match.notify_token}`;

  const payload = {
    appointment_id: appt.id,
    customer_id: appt.customer_id,
    staff_name: staff?.name ?? 'Cristian',
    slot: slotLocal,
    expires_at: expiresLocal,
    confirm_url: confirmUrl,
  };

  // Customer message
  const { data: customerResult } = await supabase.functions.invoke(
    'notifications-router',
    {
      body: {
        mode: 'customer',
        customerId: appt.customer_id,
        eventType: 'waitlist_match',
        payload,
      },
    },
  );

  // Owner ping (low priority, no spam)
  await supabase.functions.invoke('notifications-router', {
    body: {
      mode: 'owner',
      eventType: 'waitlist_match_owner',
      payload,
    },
  });

  return Boolean(customerResult?.ok);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
