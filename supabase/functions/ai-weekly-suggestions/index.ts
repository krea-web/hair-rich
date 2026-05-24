// AI Weekly Suggestions · cron Monday 09:00 (Europe/Rome)
//
// Aggregates the previous 7 days via fn_admin_stats_range, feeds the JSON
// snapshot to GPT-4o-mini, asks for 3-5 actionable suggestions for the
// salon owner. Persists in ai_reports (kind='weekly_suggestions') and
// invokes notifications-router (eventType=weekly_suggestions, owner mode).
//
// Skill-flag: ai_weekly_suggestions. Sub-flag in salon_settings.
//
// Schedule: supabase functions schedule ai-weekly-suggestions "0 9 * * 1"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const MODEL = 'gpt-4o-mini';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'ai_weekly_suggestions')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return fail('missing_openai_key', 500);

  const today = new Date();
  const from = new Date();
  from.setUTCDate(today.getUTCDate() - 7);
  const fromISO = from.toISOString().slice(0, 10);
  const toISO = today.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('ai_reports')
    .select('id')
    .eq('kind', 'weekly_suggestions')
    .eq('period_start', fromISO)
    .eq('period_end', toISO)
    .maybeSingle();
  if (existing) return ok({ skipped: true, reason: 'already_generated_this_week' });

  const { data: stats, error: statsErr } = await supabase.rpc('fn_admin_stats_range', {
    p_from: fromISO,
    p_to: toISO,
  });
  if (statsErr) return fail(statsErr.message);

  const systemPrompt = `Sei un consulente esperto di salon management. Ricevi le statistiche operative settimanali di un barber shop premium a Olbia. Genera 3-5 suggerimenti ACTIONABLE in italiano, basati SOLO sui dati ricevuti. Tono: diretto, pratico, mai generico.

Output JSON valido:
{
  "headline": "Una frase di sintesi della settimana",
  "suggestions": [
    {"title": "Azione consigliata", "why": "Cosa nei dati la giustifica", "how": "Come farla concretamente"},
    ...
  ],
  "kpis_to_watch": ["KPI 1", "KPI 2"]
}

Vincoli:
- NON inventare numeri non presenti nei dati
- Se i dati sono scarsi (<5 appuntamenti), dillo nella headline e dai 1-2 suggerimenti generici di crescita`;

  const userPrompt = `Statistiche settimanali (dal ${fromISO} al ${toISO}):\n\`\`\`json\n${JSON.stringify(stats, null, 2)}\n\`\`\``;

  const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 900,
    }),
  });

  if (!aiResp.ok) {
    const text = await aiResp.text();
    return fail(`openai_error: ${aiResp.status} ${text.slice(0, 200)}`);
  }

  const json = await aiResp.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  let parsed: { headline: string; suggestions: Array<{ title: string; why: string; how: string }>; kpis_to_watch: string[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return fail('openai_returned_invalid_json');
  }

  const promptTokens = json.usage?.prompt_tokens ?? 0;
  const completionTokens = json.usage?.completion_tokens ?? 0;
  const costMicros = Math.round((promptTokens / 1000 * 0.15 + completionTokens / 1000 * 0.60) * 1000000);

  const md = renderMarkdown(parsed);

  const { data: report, error: insErr } = await supabase
    .from('ai_reports')
    .insert({
      kind: 'weekly_suggestions',
      period_start: fromISO,
      period_end: toISO,
      model: MODEL,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost_usd_micros: costMicros,
      data_snapshot: stats,
      content_md: md,
      summary_short: parsed.headline,
      status: 'draft',
    })
    .select('id')
    .single();
  if (insErr) return fail(insErr.message);

  const { error: routerError } = await supabase.functions.invoke('notifications-router', {
    body: {
      mode: 'owner',
      event_type: 'weekly_suggestions',
      payload: {
        headline: parsed.headline,
        summary_md: md,
        report_id: report?.id,
        period: `${fromISO} → ${toISO}`,
      },
    },
  });

  await supabase.from('ai_reports').update({
    status: routerError ? 'failed' : 'sent',
    sent_at: routerError ? null : new Date().toISOString(),
    error_message: routerError?.message ?? null,
    delivered_via: routerError ? [] : ['telegram', 'email'],
  }).eq('id', report?.id);

  return ok({
    ok: true,
    report_id: report?.id,
    headline: parsed.headline,
    suggestions_count: parsed.suggestions?.length ?? 0,
  });
});

function renderMarkdown(p: { headline: string; suggestions: Array<{ title: string; why: string; how: string }>; kpis_to_watch: string[] }) {
  let md = `## ${p.headline}\n\n`;
  for (const s of p.suggestions ?? []) {
    md += `### ${s.title}\n**Perché:** ${s.why}\n**Come:** ${s.how}\n\n`;
  }
  if (p.kpis_to_watch?.length) {
    md += `**KPI da monitorare:** ${p.kpis_to_watch.join(', ')}\n`;
  }
  return md;
}

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
