// AI Content Generator · admin-driven (#25)
//
// POST { image_url, source_image_storage_path, source_kind, tone, language }
// Returns 3 caption variants + hashtags + best time to post via GPT-4o-mini
// with vision. Persists the draft in ai_content_drafts for the cost dashboard.
//
// Skill-flag gated. OPENAI_API_KEY env required.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const MODEL = 'gpt-4o-mini';
const PRICE_PER_M_INPUT = 0.15;
const PRICE_PER_M_OUTPUT = 0.60;

interface Body {
  image_url?: string;
  source_image_storage_path?: string;
  source_kind?: 'instagram_caption' | 'facebook_post' | 'tiktok_caption' | 'whatsapp_status' | 'google_post' | 'generic';
  tone?: string;
  language?: string;
}

interface OpenAIResp {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

interface GeneratedContent {
  variants: string[];
  hashtags: string[];
  best_time_to_post: string;
  notes_for_owner: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = getSupabase();

  const { data: skill } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', 'ai_content_generator')
    .maybeSingle();
  if (!skill?.enabled) return ok({ skipped: true, reason: 'skill_disabled' });

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return fail('missing_openai_key', 500);

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail('invalid_body', 400);
  }

  const imageUrl = body.image_url;
  if (!imageUrl) return fail('image_url required', 400);

  const sourceKind = body.source_kind ?? 'instagram_caption';
  const tone = body.tone ?? 'casual';
  const language = body.language ?? 'it';

  const systemPrompt = `Sei un copywriter per un barber shop premium di Olbia (Hair Rich Olbia). Il tono di voce è curato, mai gergale. Lingua: ${language}. Tono richiesto: ${tone}.

Output JSON valido con questa shape:
{
  "variants": ["caption 1", "caption 2", "caption 3"],
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "best_time_to_post": "es. Giovedì 18:30",
  "notes_for_owner": "1 frase di consiglio"
}

Vincoli:
- 3 caption diverse per tono/struttura (corta/media/storytelling)
- Max 220 caratteri per Instagram, 60 per TikTok
- Hashtag mix: 5-8 tra brand-related, local (Olbia/Sardegna), generic barber
- Niente emoji eccessive (max 2 per caption)
- Niente claim impossibili tipo "il miglior taglio del mondo"`;

  const userPrompt = `Genera contenuti per ${sourceKind}. La foto allegata mostra il lavoro realizzato.`;

  const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 800,
    }),
  });

  if (!aiResp.ok) {
    const text = await aiResp.text();
    return fail(`openai_error: ${aiResp.status} ${text.slice(0, 200)}`, 502);
  }

  const json = (await aiResp.json()) as OpenAIResp;
  const content = json.choices?.[0]?.message?.content ?? '{}';
  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(content) as GeneratedContent;
  } catch {
    return fail('openai_returned_invalid_json', 502);
  }

  const promptTokens = json.usage?.prompt_tokens ?? 0;
  const completionTokens = json.usage?.completion_tokens ?? 0;
  const costMicros = Math.round(
    (promptTokens / 1000 * PRICE_PER_M_INPUT + completionTokens / 1000 * PRICE_PER_M_OUTPUT) * 1000000
  );

  const { data: inserted, error: insErr } = await supabase
    .from('ai_content_drafts')
    .insert({
      source_image_url: imageUrl,
      source_image_storage_path: body.source_image_storage_path ?? null,
      source_kind: sourceKind,
      tone,
      language,
      model: MODEL,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      cost_usd_micros: costMicros,
      variants: parsed.variants ?? [],
      hashtags: parsed.hashtags ?? [],
      best_time_to_post: parsed.best_time_to_post ?? null,
      notes_for_owner: parsed.notes_for_owner ?? null,
    })
    .select('id')
    .single();

  if (insErr) return fail(insErr.message, 500);

  return ok({
    ok: true,
    draft_id: inserted?.id,
    variants: parsed.variants,
    hashtags: parsed.hashtags,
    best_time_to_post: parsed.best_time_to_post,
    notes_for_owner: parsed.notes_for_owner,
    cost_usd: costMicros / 1000000,
  });
});

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(message: string, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
