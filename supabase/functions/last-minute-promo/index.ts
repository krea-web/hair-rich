// Last-Minute Promo · MANUAL trigger from admin (#6)
//
// Owner taps "Attiva promo last-minute" in /admin/marketing when they see
// holes in tomorrow's agenda. The endpoint:
//   1. Picks the eligible audience (≥3 visits in last 6 months, max
//      1 promo / month / customer, marketing_consent=true)
//   2. Mints a -15% coupon valid only for the chosen day window
//   3. Fans out via notifications-router (eventType=last_minute_promo)
//
// Caller passes:
//   { when: "today" | "tomorrow", discount_percent: 10|15, target_size?: 25 }
//
// Owner-driven, not crontab — there's deliberately no schedule here.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const EVENT_TYPE = 'last_minute_promo';
const MAX_DISCOUNT = 15;
const MAX_TARGET_SIZE = 60;

interface Candidate {
  customer_id: string;
  first_name: string;
}

interface Body {
  when?: 'today' | 'tomorrow';
  discount_percent?: number;
  target_size?: number;
  triggered_by?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'last_minute_promo')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body ok */
  }

  const when = body.when === 'today' ? 'today' : 'tomorrow';
  const discount = Math.min(MAX_DISCOUNT, Math.max(5, body.discount_percent ?? 15));
  const targetSize = Math.min(MAX_TARGET_SIZE, Math.max(1, body.target_size ?? 25));

  const { data: candidates, error } = await supabase.rpc('fn_last_minute_promo_audience', {
    p_limit: targetSize,
  });
  if (error) return fail(error.message);

  const list = (candidates ?? []) as Candidate[];
  const whenLabel = when === 'today' ? 'oggi' : 'domani';
  const validUntil = new Date();
  if (when === 'tomorrow') validUntil.setUTCDate(validUntil.getUTCDate() + 1);

  const results: Array<{ customer_id: string; status: string; code?: string; error?: string }> = [];

  for (const c of list) {
    const code = `FLASH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const { error: insErr } = await supabase.from('coupons').insert({
      code,
      description: `Last-minute ${whenLabel} · Hair Rich Olbia`,
      kind: 'percent',
      value_percent: discount,
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: validUntil.toISOString().slice(0, 10),
      max_redemptions: 1,
      origin: 'last_minute',
      single_use_per_customer: true,
      issued_to_customer_id: c.customer_id,
      is_active: true,
    });
    if (insErr) {
      results.push({ customer_id: c.customer_id, status: 'mint_failed', error: insErr.message });
      continue;
    }

    const { error: routerError } = await supabase.functions.invoke('notifications-router', {
      body: {
        mode: 'customer',
        customer_id: c.customer_id,
        event_type: EVENT_TYPE,
        payload: {
          first_name: c.first_name,
          coupon_code: code,
          discount_percent: discount,
          when_label: whenLabel,
          valid_until: validUntil.toISOString().slice(0, 10),
        },
      },
    });

    results.push({
      customer_id: c.customer_id,
      status: routerError ? 'router_failed' : 'sent',
      code,
      error: routerError?.message,
    });
  }

  await supabase.from('admin_inbox_items').insert({
    event_type: EVENT_TYPE,
    category: 'marketing',
    priority: 'normal',
    title: `Promo last-minute ${whenLabel} inviata`,
    body: `${results.filter((r) => r.status === 'sent').length} clienti raggiunti · -${discount}%`,
    icon: '🎯',
    payload: { when, discount, target_size: targetSize, results_count: results.length },
    source_skill: 'last_minute_promo',
  });

  return ok({ ok: true, when, discount, audience: list.length, results });
});

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
