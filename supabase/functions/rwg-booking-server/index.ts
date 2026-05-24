// Reserve with Google · Booking Server endpoint
//
// Single endpoint Google calls with action dispatch in the request body.
// We support the subset needed for the "Prenota" button on the Google
// Business Profile:
//   { action: 'health_check' }                                 -> 200 ok
//   { action: 'check_availability', service_id, date }          -> list slots
//   { action: 'create_booking', service_id, staff_id?, start_at, customer } -> bookingId
//   { action: 'update_booking', booking_id, ... }              -> not impl yet
//   { action: 'cancel_booking', booking_id }                   -> cancel
//
// Authentication: shared bearer secret. We store SHA-256(secret) in
// salon_settings.rwg_partner_token_hash and validate constant-time.
//
// URL: https://<project>.supabase.co/functions/v1/rwg-booking-server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

interface Customer {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

interface CreateRequest {
  action: 'create_booking';
  service_id: string;
  staff_id?: string;
  start_at: string;
  customer: Customer;
}

interface CheckRequest {
  action: 'check_availability';
  service_id: string;
  date: string;
  staff_id?: string;
}

interface CancelRequest {
  action: 'cancel_booking';
  booking_id: string;
}

type ActionRequest =
  | { action: 'health_check' }
  | CheckRequest
  | CreateRequest
  | CancelRequest;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const supabase = getSupabase();
  const { data: salon } = await supabase
    .from('salon_settings')
    .select('rwg_enabled, rwg_partner_token_hash')
    .limit(1)
    .maybeSingle();
  if (!salon?.rwg_enabled) return json({ error: 'rwg_disabled' }, 503);

  // Validate bearer token. Allow skipping in absence of configured hash
  // (so the partner can test in dev), but otherwise enforce.
  if (salon.rwg_partner_token_hash) {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!(await tokenMatches(token, salon.rwg_partner_token_hash))) {
      return json({ error: 'unauthorized' }, 401);
    }
  }

  let body: ActionRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  switch (body.action) {
    case 'health_check':
      return json({ status: 'OK' });
    case 'check_availability':
      return await checkAvailability(supabase, body);
    case 'create_booking':
      return await createBooking(supabase, body);
    case 'cancel_booking':
      return await cancelBooking(supabase, body);
    default:
      return json({ error: 'unknown_action' }, 400);
  }
});

async function checkAvailability(
  supabase: ReturnType<typeof getSupabase>,
  body: CheckRequest,
): Promise<Response> {
  const { data, error } = await supabase.rpc('fn_available_slots', {
    p_date: body.date,
    p_service_id: body.service_id,
    p_staff_id: body.staff_id ?? null,
  });
  if (error) return json({ error: error.message }, 500);
  return json({
    slots: (data ?? []).map((s: { slot_time: string; staff_id: string }) => ({
      start_time: s.slot_time,
      staff_id: s.staff_id,
    })),
  });
}

async function createBooking(
  supabase: ReturnType<typeof getSupabase>,
  body: CreateRequest,
): Promise<Response> {
  const { data, error } = await supabase.rpc('fn_book_appointment', {
    p_first_name: body.customer.first_name,
    p_last_name: body.customer.last_name ?? '',
    p_phone: body.customer.phone ?? '',
    p_email: body.customer.email ?? '',
    p_service_id: body.service_id,
    p_staff_id: body.staff_id ?? null,
    p_start_at: body.start_at,
    p_notes: 'Prenotato via Google Reserve',
    p_marketing_consent: false,
  });
  if (error) return json({ error: error.message }, error.message?.includes('Slot non disponibile') ? 409 : 500);

  const rwgBookingId = `rwg_${crypto.randomUUID()}`;
  await supabase
    .from('appointments')
    .update({ rwg_booking_id: rwgBookingId, rwg_synced_at: new Date().toISOString(), source: 'widget' })
    .eq('id', (data as { appointment_id: string }).appointment_id);

  return json({
    booking_id: rwgBookingId,
    appointment_id: (data as { appointment_id: string }).appointment_id,
    start_at: (data as { start_at: string }).start_at,
    end_at: (data as { end_at: string }).end_at,
  });
}

async function cancelBooking(
  supabase: ReturnType<typeof getSupabase>,
  body: CancelRequest,
): Promise<Response> {
  const { data: appt } = await supabase
    .from('appointments')
    .select('id')
    .eq('rwg_booking_id', body.booking_id)
    .maybeSingle();
  if (!appt) return json({ error: 'not_found' }, 404);

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'system',
      cancellation_reason: 'Cancellato via Google Reserve',
    })
    .eq('id', appt.id);
  if (error) return json({ error: error.message }, 500);
  return json({ status: 'cancelled' });
}

async function tokenMatches(input: string, expectedHashHex: string): Promise<boolean> {
  if (!input) return false;
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== expectedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}
