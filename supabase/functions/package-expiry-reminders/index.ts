// Package Expiry Reminders · Edge Function (daily 09:00)
//
// Walks customer_packages with credits_remaining > 0 and expires_at
// between now() and now() + N days (default 30). For each, sends a
// reminder via the Notification Router IF we haven't already pinged
// this package for the same expiry-window milestone.
//
// Milestones: 30d, 7d, 1d. We tag notifications_sent.related_id with
// `${customer_package_id}:${milestone}` so the dedup filter naturally
// suppresses re-sends.
//
// Schedule: 0 9 * * * (daily 09:00 Europe/Rome → cron in UTC depends
// on DST, set both via Supabase Dashboard).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, todayKey } from '../_shared/cronLock.ts';

const MILESTONES = [30, 7, 1];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();

  const lockPeriod = todayKey();
  if (!(await acquireCronLock(supabase, 'package-expiry-reminders', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const summary = {
    started_at: new Date().toISOString(),
    candidates: 0,
    notified: 0,
    skipped_duplicate: 0,
    errors: [] as string[],
  };

  try {
    const { data: enabled } = await supabase
      .from('salon_settings')
      .select('packages_enabled')
      .limit(1)
      .maybeSingle();
    if (!enabled?.packages_enabled) {
      return json({ ...summary, skipped_reason: 'packages_disabled' });
    }

    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + Math.max(...MILESTONES) + 1);

    const { data: packs, error } = await supabase
      .from('customer_packages')
      .select('id, customer_id, package_id, credits_remaining, credits_total, expires_at, service_packages!inner(name)')
      .eq('status', 'active')
      .gt('credits_remaining', 0)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', horizon.toISOString());
    if (error) throw error;

    summary.candidates = packs?.length ?? 0;

    for (const p of packs ?? []) {
      const daysLeft = Math.ceil(
        (new Date(p.expires_at).getTime() - now.getTime()) / (24 * 3600 * 1000),
      );
      const milestone = MILESTONES.find((m) => daysLeft <= m && daysLeft > (MILESTONES[MILESTONES.indexOf(m) + 1] ?? -1));
      if (!milestone) continue;

      const dedupKey = `${p.id}:${milestone}`;

      const { count } = await supabase
        .from('notifications_sent')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'package_expiry_reminder')
        .eq('related_id', dedupKey);

      if ((count ?? 0) > 0) {
        summary.skipped_duplicate++;
        continue;
      }

      const packageName = (p as unknown as { service_packages: { name: string } })
        .service_packages?.name ?? 'pacchetto';

      const { error: routerErr } = await supabase.functions.invoke('notifications-router', {
        body: {
          mode: 'customer',
          customerId: p.customer_id,
          eventType: 'package_expiry_reminder',
          relatedId: dedupKey,
          payload: {
            package_name: packageName,
            credits_remaining: p.credits_remaining,
            credits_total: p.credits_total,
            days_left: daysLeft,
            milestone_label: milestone === 30 ? 'tra un mese' : milestone === 7 ? 'tra una settimana' : 'domani',
            expires_at: new Date(p.expires_at).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
          },
        },
      });
      if (routerErr) {
        summary.errors.push(`${p.id}: ${routerErr.message}`);
        continue;
      }
      summary.notified++;
    }

    // House-keeping: expire packages whose deadline has passed
    await supabase
      .from('customer_packages')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    return json(summary);
  } catch (e) {
    summary.errors.push((e as Error).message);
    return json(summary, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
