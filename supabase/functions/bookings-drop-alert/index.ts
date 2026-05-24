// Bookings Drop Alert · cron weekly Monday 09:00 (Europe/Rome)
//
// Compares current week appointments count to 8-week trailing average.
// If current week is >20% under average → Telegram owner alert with
// suggested actions ("Lancia promo last-minute", "Riattiva campagna").
//
// Skill-flag: bookings_drop_alert. Threshold configurable in
// salon_settings.bookings_drop_threshold_pct (default 20).
//
// Schedule: supabase functions schedule bookings-drop-alert "0 9 * * 1"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const DEFAULT_THRESHOLD_PCT = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'bookings_drop_alert')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const { data: settings } = await supabase
    .from('salon_settings')
    .select('bookings_drop_threshold_pct')
    .eq('is_singleton', true)
    .maybeSingle();
  const thresholdPct = settings?.bookings_drop_threshold_pct ?? DEFAULT_THRESHOLD_PCT;

  const { data: snapshot, error } = await supabase.rpc('fn_bookings_drop_snapshot');
  if (error) return fail(error.message);

  const s = snapshot as {
    current_week_count: number;
    avg_8w_count: number;
    delta_pct: number;
  };

  if (s.current_week_count >= s.avg_8w_count * (1 - thresholdPct / 100)) {
    return ok({ ok: true, no_alert_needed: true, snapshot: s });
  }

  const suggestedActions = [
    `Attiva una promo last-minute (#6) per riempire gli slot vuoti questa settimana`,
    `Lancia campagna riattivazione (#5) ai clienti silenziosi da 60+ giorni`,
    `Genera un post AI (#25) e pubblicalo su Instagram per ravvivare la visibilità`,
  ];

  const { error: routerError } = await supabase.functions.invoke('notifications-router', {
    body: {
      mode: 'owner',
      event_type: 'bookings_drop_alert',
      payload: {
        current_week_count: s.current_week_count,
        avg_8w_count: Math.round(s.avg_8w_count * 10) / 10,
        delta_pct: Math.round(s.delta_pct),
        suggested_actions: suggestedActions,
      },
    },
  });

  await supabase.from('admin_inbox_items').insert({
    event_type: 'bookings_drop_alert',
    category: 'marketing',
    priority: 'high',
    title: `📉 Prenotazioni in calo (-${Math.round(s.delta_pct)}%)`,
    body: `Questa settimana: ${s.current_week_count} · Media 8 settimane: ${Math.round(s.avg_8w_count * 10) / 10}`,
    icon: '📉',
    payload: { snapshot: s, suggested_actions: suggestedActions },
    source_skill: 'bookings_drop_alert',
  });

  return ok({ ok: true, snapshot: s, threshold_pct: thresholdPct, alert_sent: !routerError });
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
