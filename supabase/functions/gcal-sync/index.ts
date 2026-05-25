// Staff Google Calendar Sync · Edge Function (cron every 10 min)
//
// Two directions:
//   ① Push: Hair Rich → personal Gcal
//     For each enabled token, walks appointments where staff_id matches
//     and gcal_synced_at is NULL or older than updated_at, creates or
//     patches the mirror event on the personal calendar.
//   ② Pull: personal Gcal → time_off
//     Incremental sync (using sync_token) to detect events created by
//     the staff outside Hair Rich. Maps them to time_off rows so
//     fn_check_slot_availability blocks the slot.
//
// Skipped entirely when salon_settings.staff_gcal_sync_enabled = false.
// Safe to invoke manually or on a 10-minute cron.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import { acquireCronLock, bucket10Key } from '../_shared/cronLock.ts';

interface TokenRow {
  id: string;
  staff_id: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  calendar_id: string;
  sync_token: string | null;
}

interface GcalEvent {
  id: string;
  status: 'confirmed' | 'cancelled' | 'tentative';
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: { hairRichSync?: string } };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();

  const lockPeriod = bucket10Key();
  if (!(await acquireCronLock(supabase, 'gcal-sync', lockPeriod))) {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'already_ran_for_period', period: lockPeriod }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const summary = {
    started_at: new Date().toISOString(),
    pushed: 0,
    pulled_busy: 0,
    pulled_cancelled: 0,
    errors: [] as string[],
  };

  const { data: salon } = await supabase
    .from('salon_settings')
    .select('staff_gcal_sync_enabled')
    .limit(1)
    .maybeSingle();
  if (!salon?.staff_gcal_sync_enabled) {
    return json({ ...summary, skipped_reason: 'feature_off' });
  }

  const { data: tokens } = await supabase
    .from('staff_gcal_tokens')
    .select('id, staff_id, refresh_token, access_token, access_token_expires_at, calendar_id, sync_token')
    .eq('enabled', true);

  for (const t of (tokens ?? []) as TokenRow[]) {
    try {
      const accessToken = await ensureAccessToken(supabase, t);
      await pushAppointments(supabase, t, accessToken, summary);
      await pullCalendar(supabase, t, accessToken, summary);
    } catch (e) {
      summary.errors.push(`${t.staff_id}: ${(e as Error).message}`);
    }
  }

  return json(summary);
});

async function ensureAccessToken(
  supabase: ReturnType<typeof getSupabase>,
  t: TokenRow,
): Promise<string> {
  const expiresAt = t.access_token_expires_at ? new Date(t.access_token_expires_at).getTime() : 0;
  if (t.access_token && expiresAt - Date.now() > 60_000) return t.access_token;

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: t.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await resp.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('refresh failed');
  const newExpires = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString();
  await supabase
    .from('staff_gcal_tokens')
    .update({ access_token: json.access_token, access_token_expires_at: newExpires })
    .eq('id', t.id);
  return json.access_token;
}

async function pushAppointments(
  supabase: ReturnType<typeof getSupabase>,
  t: TokenRow,
  accessToken: string,
  summary: { pushed: number; errors: string[] },
) {
  const { data: appts } = await supabase
    .from('appointments')
    .select(`
      id, start_at, end_at, status, gcal_event_id, gcal_synced_at, updated_at, notes,
      customer:customer_id ( first_name, last_name )
    `)
    .eq('staff_id', t.staff_id)
    .in('status', ['booked', 'confirmed', 'cancelled'])
    .gte('start_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString())
    .or(`gcal_synced_at.is.null,gcal_synced_at.lt.${new Date(Date.now() - 60_000).toISOString()}`)
    .limit(50);

  for (const a of appts ?? []) {
    if (a.status === 'cancelled' && a.gcal_event_id) {
      const r = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(t.calendar_id)}/events/${a.gcal_event_id}`,
        { method: 'DELETE', headers: { authorization: `Bearer ${accessToken}` } },
      );
      if (r.ok || r.status === 410 || r.status === 404) {
        await supabase
          .from('appointments')
          .update({ gcal_event_id: null, gcal_synced_at: new Date().toISOString() })
          .eq('id', a.id);
      } else {
        summary.errors.push(`del ${a.id}: ${r.status}`);
      }
      continue;
    }

    if (a.status === 'cancelled') continue;

    const customer = (a as unknown as { customer: { first_name: string; last_name: string | null } }).customer;
    const summaryStr = `Hair Rich · ${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim();
    const body = {
      summary: summaryStr,
      description: a.notes ?? '',
      start: { dateTime: a.start_at },
      end: { dateTime: a.end_at },
      extendedProperties: { private: { hairRichSync: a.id } },
    };

    const endpoint = a.gcal_event_id
      ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(t.calendar_id)}/events/${a.gcal_event_id}`
      : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(t.calendar_id)}/events`;
    const method = a.gcal_event_id ? 'PATCH' : 'POST';
    const r = await fetch(endpoint, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      summary.errors.push(`push ${a.id}: ${r.status}`);
      continue;
    }
    const ev = (await r.json()) as { id?: string };
    await supabase
      .from('appointments')
      .update({ gcal_event_id: ev.id ?? null, gcal_synced_at: new Date().toISOString() })
      .eq('id', a.id);
    summary.pushed++;
  }
}

async function pullCalendar(
  supabase: ReturnType<typeof getSupabase>,
  t: TokenRow,
  accessToken: string,
  summary: { pulled_busy: number; pulled_cancelled: number; errors: string[] },
) {
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(t.calendar_id)}/events`;
  const params = new URLSearchParams({ singleEvents: 'true', maxResults: '250' });
  if (t.sync_token) {
    params.set('syncToken', t.sync_token);
  } else {
    params.set('timeMin', new Date(Date.now() - 7 * 86400 * 1000).toISOString());
    params.set('timeMax', new Date(Date.now() + 60 * 86400 * 1000).toISOString());
  }

  const r = await fetch(`${baseUrl}?${params.toString()}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (r.status === 410) {
    // Sync token expired — force full re-sync next run.
    await supabase.from('staff_gcal_tokens').update({ sync_token: null }).eq('id', t.id);
    return;
  }
  if (!r.ok) {
    summary.errors.push(`pull ${t.staff_id}: ${r.status}`);
    return;
  }
  const data = (await r.json()) as { items?: GcalEvent[]; nextSyncToken?: string };

  for (const ev of data.items ?? []) {
    // Skip our own mirror events to avoid feedback loops.
    if (ev.extendedProperties?.private?.hairRichSync) continue;
    if (!ev.start?.dateTime || !ev.end?.dateTime) continue;

    if (ev.status === 'cancelled') {
      const { error } = await supabase
        .from('time_off')
        .delete()
        .eq('gcal_event_id', ev.id);
      if (!error) summary.pulled_cancelled++;
      continue;
    }

    await supabase.from('time_off').upsert(
      {
        gcal_event_id: ev.id,
        staff_id: t.staff_id,
        starts_at: ev.start.dateTime,
        ends_at: ev.end.dateTime,
        reason: ev.summary ?? 'Impegno personale',
        source: 'gcal',
      },
      { onConflict: 'gcal_event_id' },
    );
    summary.pulled_busy++;
  }

  if (data.nextSyncToken) {
    await supabase
      .from('staff_gcal_tokens')
      .update({ sync_token: data.nextSyncToken, last_incremental_sync_at: new Date().toISOString() })
      .eq('id', t.id);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
