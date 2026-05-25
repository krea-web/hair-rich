// Reactivation Sender · cron weekly (Sunday 10:00 Europe/Rome)
//
// Targets customers with ≥2 completed visits but silent for 90+ days who
// gave marketing_consent. Mints a 14-day -15% coupon, dispatches via
// notifications-router (eventType=reactivation). Per-customer 60-day
// cooldown so we don't spam the same person every weekend.
//
// Scheduled via:
//   supabase functions schedule reactivation-sender "0 10 * * 0"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, isoWeekKey } from '../_shared/cronLock.ts';

const EVENT_TYPE = 'reactivation';
const COUPON_VALIDITY_DAYS = 14;
const COUPON_VALUE_PERCENT = 15;
const COOLDOWN_DAYS = 60;
const MIN_VISITS = 2;
const DAYS_SILENT = 90;
const MAX_PER_RUN = 40;

interface Candidate {
  customer_id: string;
  first_name: string;
  days_since_last: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();

  const lockPeriod = isoWeekKey();
  if (!(await acquireCronLock(supabase, 'reactivation-sender', lockPeriod))) {
    return ok({ skipped: true, reason: 'already_ran_for_period', period: lockPeriod });
  }

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'reactivation_campaigns')
    .maybeSingle();
  if (!skill?.enabled) {
    return ok({ skipped: true, reason: 'skill_disabled' });
  }

  const { data: candidates, error } = await supabase.rpc('fn_reactivation_candidates', {
    p_min_visits: MIN_VISITS,
    p_days_silent: DAYS_SILENT,
    p_cooldown_days: COOLDOWN_DAYS,
    p_limit: MAX_PER_RUN,
  });
  if (error) return fail(error.message);

  const list = (candidates ?? []) as Candidate[];
  const results: Array<{ customer_id: string; status: string; code?: string; error?: string }> = [];

  for (const c of list) {
    const code = await mintCoupon(supabase, c.customer_id);
    if (!code) {
      results.push({ customer_id: c.customer_id, status: 'coupon_mint_failed' });
      continue;
    }

    const validUntil = new Date();
    validUntil.setUTCDate(validUntil.getUTCDate() + COUPON_VALIDITY_DAYS);

    const { error: routerError } = await supabase.functions.invoke('notifications-router', {
      body: {
        mode: 'customer',
        customer_id: c.customer_id,
        event_type: EVENT_TYPE,
        payload: {
          first_name: c.first_name,
          days_since_last_visit: c.days_since_last,
          coupon_code: code,
          discount_percent: COUPON_VALUE_PERCENT,
          valid_until: validUntil.toISOString().slice(0, 10),
        },
      },
    });

    if (routerError) {
      results.push({ customer_id: c.customer_id, status: 'router_failed', error: routerError.message });
    } else {
      results.push({ customer_id: c.customer_id, status: 'sent', code });
    }
  }

  return ok({ ok: true, candidates: list.length, results });
});

async function mintCoupon(supabase: ReturnType<typeof getSupabase>, customerId: string): Promise<string | null> {
  const code = `WELCOMEBACK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const validUntil = new Date();
  validUntil.setUTCDate(validUntil.getUTCDate() + COUPON_VALIDITY_DAYS);

  const { error } = await supabase.from('coupons').insert({
    code,
    description: 'Win-back · Hair Rich Olbia',
    kind: 'percent',
    value_percent: COUPON_VALUE_PERCENT,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: validUntil.toISOString().slice(0, 10),
    max_redemptions: 1,
    origin: 'reactivation',
    single_use_per_customer: true,
    issued_to_customer_id: customerId,
    is_active: true,
  });

  if (error) {
    console.error('mintCoupon failed', error);
    return null;
  }
  return code;
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
