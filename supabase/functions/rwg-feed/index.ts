// Reserve with Google · Feed endpoint
//
// Static JSON feed Google polls to discover services + staff + business
// hours. Public GET. Output schema follows the v3 booking server spec
// — services as JSON Lines or a single JSON object with arrays. We
// emit the simpler object form; Google parses both.
//
// URL: https://<project>.supabase.co/functions/v1/rwg-feed

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return new Response('GET only', { status: 405 });

  const supabase = getSupabase();
  const { data: salon } = await supabase
    .from('salon_settings')
    .select('rwg_enabled, rwg_merchant_id, display_name, phone, email, address, city, postal_code, lat, lng, timezone')
    .limit(1)
    .maybeSingle();
  if (!salon?.rwg_enabled || !salon.rwg_merchant_id) {
    return json({ error: 'rwg_disabled' }, 503);
  }

  const [{ data: services }, { data: staff }, { data: hours }] = await Promise.all([
    supabase.from('services').select('id, slug, name, description, price_cents, duration_min').eq('is_active', true),
    supabase.from('staff').select('id, slug, name, role').eq('is_active', true),
    supabase.from('working_hours').select('weekday, start_time, end_time').is('staff_id', null),
  ]);

  const merchant = {
    merchant_id: salon.rwg_merchant_id,
    name: salon.display_name,
    telephone: salon.phone,
    email: salon.email,
    address: {
      street_address: salon.address,
      locality: salon.city,
      postal_code: salon.postal_code,
    },
    geo: salon.lat && salon.lng ? { latitude: salon.lat, longitude: salon.lng } : undefined,
    time_zone: salon.timezone ?? 'Europe/Rome',
    business_hours: (hours ?? []).map((h) => ({
      day: WEEKDAYS[h.weekday] ?? 'MONDAY',
      open_time: h.start_time,
      close_time: h.end_time,
    })),
  };

  const services_feed = (services ?? []).map((s) => ({
    service_id: s.id,
    name: s.name,
    description: s.description,
    duration_sec: s.duration_min * 60,
    price: {
      price_micros: String(s.price_cents * 10_000),
      currency_code: 'EUR',
    },
  }));

  const availability_constraints = (staff ?? []).map((p) => ({
    staff_id: p.id,
    name: p.name,
  }));

  return json({ merchant, services: services_feed, staff: availability_constraints });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
