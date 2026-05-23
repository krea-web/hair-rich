// AI No-show Outreach Drafter · Edge Function
//
// Generates a short, empathetic "ciao, tutto bene?" message that the
// owner can edit before sending. Never accusatory, never threatens
// blocking the customer — we treat the no-show as a missed signal,
// not a sin.
//
// Required env: OPENAI_API_KEY (gpt-4o-mini, ~€0.0003/call).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

interface DraftRequest {
  appointmentId: string;
  channel?: 'email' | 'telegram' | 'whatsapp' | 'sms';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  let body: DraftRequest;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }
  if (!body.appointmentId) return json({ ok: false, error: 'appointmentId required' }, 400);

  const supabase = getSupabase();

  const { data: appt } = await supabase
    .from('appointments')
    .select(`
      id, start_at, status,
      customer:customer_id ( first_name, last_name ),
      appointment_services ( services ( name ) )
    `)
    .eq('id', body.appointmentId)
    .single();

  if (!appt) return json({ ok: false, error: 'Appointment not found' }, 404);

  const { data: countRow } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', (appt as { customer_id: string }).customer_id ?? '')
    .eq('status', 'no_show');
  const noshowCount = (countRow as unknown as { count?: number } | null)?.count ?? 1;

  const customer = (appt as unknown as { customer: { first_name: string; last_name: string | null } }).customer;
  const serviceName = (appt as unknown as { appointment_services: { services: { name: string } }[] })
    .appointment_services?.[0]?.services?.name ?? 'taglio';
  const dateStr = new Date((appt as { start_at: string }).start_at).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
  });

  const channel = body.channel ?? 'email';

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    // Fallback to a deterministic template if OpenAI is not configured.
    return json({
      ok: true,
      draft: defaultDraft(customer.first_name, serviceName, dateStr, channel),
      ai_used: false,
    });
  }

  const prompt = `Sei il titolare di un barber shop a Olbia. Scrivi un messaggio breve (max 4 frasi) per ${customer.first_name}, che non si è presentato all'appuntamento del ${dateStr} per "${serviceName}". È il suo no-show numero ${noshowCount}. Tono: empatico, non accusatorio. Chiedigli se tutto bene e se vuole spostare. Niente minacce, niente formule fredde. Lingua: italiano informale. Canale: ${channel}. Firma con "Cristian".`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${openaiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 220,
      }),
    });
    const data = await resp.json();
    const draft = data?.choices?.[0]?.message?.content?.trim();
    if (!draft) {
      return json({
        ok: true,
        draft: defaultDraft(customer.first_name, serviceName, dateStr, channel),
        ai_used: false,
      });
    }
    return json({ ok: true, draft, ai_used: true, model: 'gpt-4o-mini' });
  } catch (e) {
    return json({
      ok: true,
      draft: defaultDraft(customer.first_name, serviceName, dateStr, channel),
      ai_used: false,
      error: (e as Error).message,
    });
  }
});

function defaultDraft(name: string, service: string, date: string, channel: string): string {
  if (channel === 'telegram' || channel === 'whatsapp' || channel === 'sms') {
    return `Ciao ${name}, mi sa che non ci siamo visti il ${date} per il ${service}. Tutto a posto? Se ti serve spostare, fammi un messaggio quando vuoi. — Cristian`;
  }
  return `Ciao ${name},\n\nNon ti ho visto al ${service} del ${date} — spero sia tutto a posto. Se hai avuto un imprevisto e vuoi spostare, scrivimi pure quando ti è comodo.\n\nNessun problema, davvero.\n\nCristian`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
