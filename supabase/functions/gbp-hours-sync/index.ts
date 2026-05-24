// Google Business Profile · Hours + Special Hours Sync · Edge Function
//
// Pushes salon working_hours and upcoming time_off windows to the
// linked GBP location so the public Google profile is always in sync.
//
// Strategy:
//   ① Refresh access_token from salon_gbp_tokens.refresh_token.
//   ② PATCH /v4/{location_id} with regular_hours derived from
//     working_hours WHERE staff_id IS NULL (salon-wide weekly grid).
//   ③ POST/PATCH special_hours from time_off WHERE staff_id IS NULL
//     and starts_at > now() (next 90 days window).
//
// Triggers: nightly cron + on-demand via Bash invoke when the owner
// changes hours/chiusure in admin (Chat 2 deferred the explicit
// trigger button — set it up in /admin/impostazioni once the
// migration runs).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = getSupabase();
  const summary = {
    started_at: new Date().toISOString(),
    hours_pushed: false,
    special_hours_pushed: false,
    error: null as string | null,
  };

  try {
    const { data: salon } = await supabase
      .from('salon_settings')
      .select('gbp_hours_sync_enabled')
      .limit(1)
      .maybeSingle();
    if (!salon?.gbp_hours_sync_enabled) {
      return json({ ...summary, skipped_reason: 'feature_off' });
    }

    const { data: token } = await supabase
      .from('salon_gbp_tokens')
      .select('*')
      .eq('is_singleton', true)
      .maybeSingle();
    if (!token || !token.enabled || !token.location_id) {
      return json({ ...summary, skipped_reason: 'no_token_or_location' });
    }

    const accessToken = await ensureAccess(supabase, token);

    await pushRegularHours(supabase, accessToken, token.location_id);
    summary.hours_pushed = true;

    await pushSpecialHours(supabase, accessToken, token.location_id);
    summary.special_hours_pushed = true;

    await supabase
      .from('salon_gbp_tokens')
      .update({
        last_hours_pushed_at: new Date().toISOString(),
        last_special_hours_pushed_at: new Date().toISOString(),
      })
      .eq('id', token.id);

    return json(summary);
  } catch (e) {
    summary.error = (e as Error).message;
    return json(summary, 500);
  }
});

async function ensureAccess(
  supabase: ReturnType<typeof getSupabase>,
  // deno-lint-ignore no-explicit-any
  token: any,
): Promise<string> {
  const exp = token.access_token_expires_at ? new Date(token.access_token_expires_at).getTime() : 0;
  if (token.access_token && exp - Date.now() > 60_000) return token.access_token;

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const json = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('GBP refresh failed');
  await supabase
    .from('salon_gbp_tokens')
    .update({
      access_token: json.access_token,
      access_token_expires_at: new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString(),
    })
    .eq('id', token.id);
  return json.access_token;
}

async function pushRegularHours(
  supabase: ReturnType<typeof getSupabase>,
  accessToken: string,
  locationId: string,
) {
  const { data: rows } = await supabase
    .from('working_hours')
    .select('weekday, start_time, end_time')
    .is('staff_id', null);

  const periods = (rows ?? []).map((r) => ({
    openDay: WEEKDAYS[r.weekday] ?? 'MONDAY',
    closeDay: WEEKDAYS[r.weekday] ?? 'MONDAY',
    openTime: timeToObj(r.start_time),
    closeTime: timeToObj(r.end_time),
  }));

  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=regularHours`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ regularHours: { periods } }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GBP regularHours PATCH ${resp.status}: ${text}`);
  }
}

async function pushSpecialHours(
  supabase: ReturnType<typeof getSupabase>,
  accessToken: string,
  locationId: string,
) {
  const horizon = new Date(Date.now() + 90 * 86400 * 1000).toISOString();
  const { data: rows } = await supabase
    .from('time_off')
    .select('starts_at, ends_at')
    .is('staff_id', null)
    .gte('starts_at', new Date().toISOString())
    .lte('starts_at', horizon)
    .order('starts_at');

  const periods = (rows ?? []).flatMap((r) => splitToDailyClosures(r.starts_at, r.ends_at));

  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}?updateMask=specialHours`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ specialHours: { specialHourPeriods: periods } }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GBP specialHours PATCH ${resp.status}: ${text}`);
  }
}

function timeToObj(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

interface SpecialHourPeriod {
  startDate: { year: number; month: number; day: number };
  endDate: { year: number; month: number; day: number };
  closed: true;
}

function splitToDailyClosures(startIso: string, endIso: string): SpecialHourPeriod[] {
  const out: SpecialHourPeriod[] = [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  while (cur < end) {
    out.push({
      startDate: { year: cur.getFullYear(), month: cur.getMonth() + 1, day: cur.getDate() },
      endDate: { year: cur.getFullYear(), month: cur.getMonth() + 1, day: cur.getDate() },
      closed: true,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
