// Birthday Sender · cron daily 09:00 (Europe/Rome)
//
// Finds every customer whose birthday (month+day) matches today, mints a
// one-shot coupon valid 7 days, and invokes the notifications-router with
// eventType=birthday_greeting + the coupon code in the payload.
//
// Gated by skills_config('birthday_campaign'). Customer-level opt-out is
// resolved inside the Router (notification_preferences.birthday=false).
//
// Scheduled via:
//   supabase functions schedule birthday-sender "0 9 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, todayKey } from '../_shared/cronLock.ts';

const EVENT_TYPE = 'birthday_greeting';
const COUPON_VALIDITY_DAYS = 7;
const COUPON_VALUE_PERCENT = 20;

interface Candidate {
  id: string;
  first_name: string;
  birthdate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();

  // 0. Idempotency lock — at most one run per calendar day.
  const lockPeriod = todayKey();
  const lockAcquired = await acquireCronLock(supabase, 'birthday-sender', lockPeriod);
  if (!lockAcquired) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 1. Feature flag check
  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'birthday_campaign')
    .maybeSingle();
  if (!skill?.enabled) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'skill_disabled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 2. Find today's birthday children
  const { data: candidates, error } = await supabase.rpc('fn_customers_birthday_today');
  if (error) {
    return errorResponse(error.message);
  }

  const list = (candidates ?? []) as Candidate[];
  const today = new Date().toISOString().slice(0, 10);
  const results: Array<{ customer_id: string; status: string; code?: string; error?: string }> = [];

  for (const c of list) {
    // De-dup guard: skip if already sent today
    const { count } = await supabase
      .from('notifications_sent')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', c.id)
      .eq('event_type', EVENT_TYPE)
      .gte('sent_at', `${today}T00:00:00Z`);
    if ((count ?? 0) > 0) {
      results.push({ customer_id: c.id, status: 'already_sent_today' });
      continue;
    }

    const code = await mintCoupon(supabase, c.id);
    if (!code) {
      results.push({ customer_id: c.id, status: 'coupon_mint_failed' });
      continue;
    }

    const { error: routerError } = await supabase.functions.invoke('notifications-router', {
      body: {
        mode: 'customer',
        customer_id: c.id,
        event_type: EVENT_TYPE,
        payload: {
          first_name: c.first_name,
          coupon_code: code,
          discount_percent: COUPON_VALUE_PERCENT,
          validity_days: COUPON_VALIDITY_DAYS,
        },
      },
    });

    if (routerError) {
      results.push({ customer_id: c.id, status: 'router_failed', error: routerError.message });
    } else {
      results.push({ customer_id: c.id, status: 'sent', code });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      candidates: list.length,
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

async function mintCoupon(supabase: ReturnType<typeof getSupabase>, customerId: string): Promise<string | null> {
  const code = `COMPLEANNO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const validUntil = new Date();
  validUntil.setUTCDate(validUntil.getUTCDate() + COUPON_VALIDITY_DAYS);

  const { error } = await supabase.from('coupons').insert({
    code,
    description: 'Regalo di compleanno · Hair Rich Olbia',
    kind: 'percent',
    value_percent: COUPON_VALUE_PERCENT,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: validUntil.toISOString().slice(0, 10),
    max_redemptions: 1,
    origin: 'birthday',
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

function errorResponse(message: string) {
  return new Response(
    JSON.stringify({ ok: false, error: message }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
