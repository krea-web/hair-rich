// AI Monthly Report · cron 1st of month 09:00 (Europe/Rome)
//
// Builds rich monthly report from fn_admin_stats_range on last month,
// GPT-4o-mini drafts KPI commentary + obiettivi prossimo mese, persists
// in ai_reports (kind='monthly_report'), sends via owner Router.
//
// Skill-flag: ai_monthly_report. Sub-flag in salon_settings.
//
// Schedule: supabase functions schedule ai-monthly-report "0 9 1 * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, monthKey } from '../_shared/cronLock.ts';

const MODEL = 'gpt-4o-mini';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const lockPeriod = monthKey();
  if (!(await acquireCronLock(supabase, 'ai-monthly-report', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'ai_monthly_report')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return fail('missing_openai_key', 500);

  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const fromISO = lastMonth.toISOString().slice(0, 10);
  const toISO = thisMonth.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('ai_reports')
    .select('id')
    .eq('kind', 'monthly_report')
    .eq('period_start', fromISO)
    .eq('period_end', toISO)
    .maybeSingle();
  if (existing) return ok({ skipped: true, reason: 'already_generated_this_month' });

  const { data: stats, error: statsErr } = await supabase.rpc('fn_admin_stats_range', {
    p_from: fromISO,
    p_to: toISO,
  });
  if (statsErr) return fail(statsErr.message);

  // Also fetch prior month for trend comparison
  const priorStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const { data: priorStats } = await supabase.rpc('fn_admin_stats_range', {
    p_from: priorStart.toISOString().slice(0, 10),
    p_to: fromISO,
  });

  const systemPrompt = `Sei un analista business per piccoli saloni. Ricevi le statistiche operative MENSILI di Hair Rich Olbia + il mese precedente per il confronto. Genera un report DETTAGLIATO in italiano.

Output JSON valido:
{
  "headline": "Frase di sintesi del mese",
  "key_numbers": [{"label": "Fatturato", "value": "X €", "delta_vs_prev": "+12%"}, ...],
  "what_worked": ["punto 1", ...],
  "what_didnt": ["punto 1", ...],
  "next_month_goals": [{"goal": "obiettivo", "action": "azione concreta"}, ...],
  "long_form_commentary": "2-3 paragrafi di analisi narrativa"
}

Vincoli:
- USA SOLO numeri presenti nei dati
- Calcola delta vs mese precedente quando possibile
- Tono professionale ma leggibile da non-esperti`;

  const userPrompt = `MESE ANALIZZATO (${fromISO} → ${toISO}):\n\`\`\`json\n${JSON.stringify(stats, null, 2)}\n\`\`\`\n\nMESE PRECEDENTE (per confronto):\n\`\`\`json\n${JSON.stringify(priorStats, null, 2)}\n\`\`\``;

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
      max_tokens: 2000,
    }),
  });

  if (!aiResp.ok) {
    const text = await aiResp.text();
    return fail(`openai_error: ${aiResp.status} ${text.slice(0, 200)}`);
  }

  const json = await aiResp.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return fail('openai_returned_invalid_json');
  }

  const promptTokens = json.usage?.prompt_tokens ?? 0;
  const completionTokens = json.usage?.completion_tokens ?? 0;
  const costMicros = Math.round((promptTokens / 1000 * 0.15 + completionTokens / 1000 * 0.60) * 1000000);

  const md = renderMarkdown(parsed, fromISO, toISO);

  const { data: report, error: insErr } = await supabase
    .from('ai_reports')
    .insert({
      kind: 'monthly_report',
      period_start: fromISO,
      period_end: toISO,
      model: MODEL,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost_usd_micros: costMicros,
      data_snapshot: { current: stats, prior: priorStats },
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
      event_type: 'monthly_report',
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

  return ok({ ok: true, report_id: report?.id, headline: parsed.headline });
});

function renderMarkdown(p: any, from: string, to: string) {
  let md = `# Report mensile · ${from} → ${to}\n\n## ${p.headline}\n\n`;
  if (p.key_numbers?.length) {
    md += `### Numeri chiave\n`;
    for (const n of p.key_numbers) {
      md += `- **${n.label}:** ${n.value}` + (n.delta_vs_prev ? ` (${n.delta_vs_prev})` : '') + `\n`;
    }
    md += `\n`;
  }
  if (p.what_worked?.length) {
    md += `### Cosa ha funzionato\n${p.what_worked.map((x: string) => `- ${x}`).join('\n')}\n\n`;
  }
  if (p.what_didnt?.length) {
    md += `### Da migliorare\n${p.what_didnt.map((x: string) => `- ${x}`).join('\n')}\n\n`;
  }
  if (p.next_month_goals?.length) {
    md += `### Obiettivi prossimo mese\n`;
    for (const g of p.next_month_goals) {
      md += `- **${g.goal}** → ${g.action}\n`;
    }
    md += `\n`;
  }
  if (p.long_form_commentary) {
    md += `### Analisi\n${p.long_form_commentary}\n`;
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
