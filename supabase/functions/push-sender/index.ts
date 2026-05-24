// Push Sender · Edge Function
//
// Dispatcher for web-push messages. Invoked by the Notification Router
// when the chosen channel is 'push'. Body shape:
//   { customerId, title, body, url? }
//
// Walks push_subscriptions where customer_id matches and enabled=true,
// signs each VAPID payload and POSTs to the browser push service.
//
// Required env:
//   VAPID_PUBLIC_KEY    — same as salon_settings.push_vapid_public_key
//   VAPID_PRIVATE_KEY   — secret
//   VAPID_SUBJECT       — mailto:owner@hairrich.it (RFC 8292)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import webPush from 'https://esm.sh/web-push@3.6.6';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

interface PushRequest {
  customerId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  const vapidPub = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPriv = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:owner@hairrich.it';

  if (!vapidPub || !vapidPriv) {
    return json({ ok: false, error: 'VAPID env missing' }, 500);
  }

  let body: PushRequest;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  webPush.setVapidDetails(vapidSubject, vapidPub, vapidPriv);

  const supabase = getSupabase();
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('customer_id', body.customerId)
    .eq('enabled', true);

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!subs || subs.length === 0) return json({ ok: false, reason: 'no_subscriptions' });

  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    url: body.url ?? '/profilo',
    tag: body.tag ?? 'hair-rich',
  });

  let sent = 0;
  const stale: string[] = [];
  for (const s of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth_key },
        },
        payload,
      );
      sent++;
      await supabase
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString(), last_error: null })
        .eq('id', s.id);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        stale.push(s.id);
      } else {
        await supabase
          .from('push_subscriptions')
          .update({ last_error: msg })
          .eq('id', s.id);
      }
    }
  }

  if (stale.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ enabled: false, last_error: 'gone' })
      .in('id', stale);
  }

  return json({ ok: true, sent, disabled_stale: stale.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
