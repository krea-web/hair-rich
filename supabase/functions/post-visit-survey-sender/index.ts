// Post-Visit Survey Sender · Edge Function (cron every 30 min)
//
// For each completed appointment with no existing customer_surveys row,
// waits salon_settings.post_visit_survey_delay_min before sending a
// 3-emoji NPS-ish ping via the Notification Router. The customer
// follows the survey_url to /sondaggio/[token] (a token-gated public
// page Chat 2 ships separately) and tap-records sentiment.
//
// Privacy: this signal is INTERNAL, never published. Distinct from #62
// Reviews Harvester (Chat 3) which spins happy clients toward Google.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, bucket30Key } from '../_shared/cronLock.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();

  const lockPeriod = bucket30Key();
  if (!(await acquireCronLock(supabase, 'post-visit-survey-sender', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const summary = {
    started_at: new Date().toISOString(),
    candidates: 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    const { data: salon } = await supabase
      .from('salon_settings')
      .select('post_visit_survey_enabled, post_visit_survey_delay_min')
      .limit(1)
      .maybeSingle();
    if (!salon?.post_visit_survey_enabled) {
      return json({ ...summary, skipped_reason: 'feature_off' });
    }
    const delayMin = salon.post_visit_survey_delay_min ?? 120;

    const cutoff = new Date(Date.now() - delayMin * 60 * 1000);

    const { data: appts, error } = await supabase
      .from('appointments')
      .select('id, customer_id, start_at, end_at')
      .eq('status', 'completed')
      .gte('end_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString())
      .lte('end_at', cutoff.toISOString());
    if (error) throw error;

    summary.candidates = appts?.length ?? 0;

    for (const a of appts ?? []) {
      const { count } = await supabase
        .from('customer_surveys')
        .select('id', { count: 'exact', head: true })
        .eq('appointment_id', a.id);
      if ((count ?? 0) > 0) {
        summary.skipped++;
        continue;
      }

      const { data: surveyRow, error: insErr } = await supabase
        .from('customer_surveys')
        .insert({
          appointment_id: a.id,
          customer_id: a.customer_id,
          sent_via: 'email',
        })
        .select('token')
        .single();
      if (insErr) {
        summary.errors.push(`insert ${a.id}: ${insErr.message}`);
        continue;
      }

      const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://hair-rich.it';
      const surveyUrl = `${siteUrl}/sondaggio?token=${surveyRow.token}`;

      const { error: routerErr } = await supabase.functions.invoke('notifications-router', {
        body: {
          mode: 'customer',
          customerId: a.customer_id,
          eventType: 'post_visit_survey',
          relatedId: a.id,
          relatedType: 'appointment',
          payload: { survey_url: surveyUrl },
        },
      });
      if (routerErr) {
        summary.errors.push(`router ${a.id}: ${routerErr.message}`);
        continue;
      }
      summary.sent++;
    }

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
