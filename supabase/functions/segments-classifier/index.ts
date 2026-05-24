// Customer Segments Classifier · cron daily 06:00 (Europe/Rome)
//
// Recomputes auto-segments for every customer via
// fn_recompute_customer_segments. Manual segments are preserved (the RPC
// only wipes source='auto' rows).
//
// Scheduled via:
//   supabase functions schedule segments-classifier "0 6 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'customer_segments')
    .maybeSingle();
  if (!skill?.enabled) {
    return ok({ skipped: true, reason: 'skill_disabled' });
  }

  const { data, error } = await supabase.rpc('fn_recompute_customer_segments', {
    p_customer_id: null,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return ok({ ok: true, result: data });
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
