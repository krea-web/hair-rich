// Stock Low Alert · cron daily 08:00 (Europe/Rome)
//
// Queries v_products_low_stock (created in migration 0043), de-dupes via
// products.last_low_stock_alert_at (>24h), fans out a single Telegram
// owner alert summarizing all products at warning/critical level + writes
// admin_inbox_items row.
//
// Skill-flag: stock_alerts.
//
// Schedule: supabase functions schedule stock-low-alert "0 8 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, todayKey } from '../_shared/cronLock.ts';

interface LowStockRow {
  id: string;
  name: string;
  brand: string | null;
  stock: number;
  severity: 'critical' | 'low';
  supplier_name: string | null;
  supplier_phone: string | null;
  supplier_email: string | null;
  reorder_quantity_suggestion: number | null;
  last_low_stock_alert_at: string | null;
  avg_daily_velocity_30d: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const lockPeriod = todayKey();
  if (!(await acquireCronLock(supabase, 'stock-low-alert', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'stock_alerts')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const { data: rows, error } = await supabase
    .from('v_products_low_stock')
    .select('*');
  if (error) return fail(error.message);

  const list = (rows ?? []) as LowStockRow[];
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const fresh = list.filter((r) => {
    if (!r.last_low_stock_alert_at) return true;
    return new Date(r.last_low_stock_alert_at) < cutoff;
  });

  if (fresh.length === 0) {
    return ok({ ok: true, no_alert_needed: true, low_count: list.length });
  }

  const critical = fresh.filter((r) => r.severity === 'critical');
  const low = fresh.filter((r) => r.severity === 'low');

  const lines: string[] = [];
  if (critical.length > 0) {
    lines.push(`🚨 CRITICI (${critical.length}):`);
    for (const p of critical) lines.push(`  · ${p.name} — ${p.stock} pz`);
  }
  if (low.length > 0) {
    lines.push(`⚠️ Bassi (${low.length}):`);
    for (const p of low) lines.push(`  · ${p.name} — ${p.stock} pz`);
  }
  const summary = lines.join('\n');

  const { error: routerError } = await supabase.functions.invoke('notifications-router', {
    body: {
      mode: 'owner',
      event_type: 'stock_low_alert',
      payload: {
        critical_count: critical.length,
        low_count: low.length,
        summary,
        products: fresh.map((p) => ({
          name: p.name,
          stock: p.stock,
          severity: p.severity,
          supplier: p.supplier_name,
          velocity: Math.round(p.avg_daily_velocity_30d * 10) / 10,
        })),
      },
    },
  });

  await supabase.from('admin_inbox_items').insert({
    event_type: 'stock_low_alert',
    category: 'catalog',
    priority: critical.length > 0 ? 'high' : 'normal',
    title: `Scorte basse · ${fresh.length} prodotti`,
    body: summary,
    icon: critical.length > 0 ? '🚨' : '⚠️',
    payload: { critical_count: critical.length, low_count: low.length },
    source_skill: 'stock_alerts',
  });

  const ids = fresh.map((p) => p.id);
  if (ids.length > 0) {
    await supabase
      .from('products')
      .update({ last_low_stock_alert_at: now.toISOString() })
      .in('id', ids);
  }

  return ok({
    ok: true,
    alerted: fresh.length,
    critical: critical.length,
    low: low.length,
    router_error: routerError?.message ?? null,
  });
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(message: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
