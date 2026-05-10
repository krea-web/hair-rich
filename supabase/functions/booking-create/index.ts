import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { customer_id, first_name, last_name, email, phone, services, staff_id, start_at, end_at, source } = payload;

        const supabase = getSupabase();

        // 1. Resolve or create customer (If customer_id is provided via auth, skip. Else check by email/phone)
        let finalCustomerId = customer_id;
        if (!finalCustomerId) {
            const { data: extCust } = await supabase
                .from('customers')
                .select('id')
                .or(`email.eq.${email},phone.eq.${phone}`)
                .single();

            if (extCust) {
                finalCustomerId = extCust.id;
            } else {
                const { data: newCust, error: custErr } = await supabase
                    .from('customers')
                    .insert({ first_name, last_name, email, phone, is_guest: true })
                    .select('id')
                    .single();

                if (custErr) throw custErr;
                finalCustomerId = newCust.id;
            }
        }

        // 2. Check Availability
        const { data: isAvailable } = await supabase.rpc('fn_check_slot_availability', {
            p_start_at: start_at,
            p_end_at: end_at,
            p_staff_id: staff_id
        });

        if (!isAvailable) {
            return new Response(JSON.stringify({ error: 'Slot not available anymore' }), { status: 409, headers: corsHeaders });
        }

        // 3. Create Appointment
        const { data: booking, error: bookingErr } = await supabase
            .from('appointments')
            .insert({
                customer_id: finalCustomerId,
                staff_id,
                start_at,
                end_at,
                status: 'booked',
                source: source || 'app',
                notes: payload.notes || null
            })
            .select('*')
            .single();

        if (bookingErr) throw bookingErr;

        // 4. Fire n8n Webhook async 
        const N8N_URL = Deno.env.get('N8N_WEBHOOK_URL');
        if (N8N_URL) {
            // Non blocking call
            fetch(`${N8N_URL}/booking-confirmed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking, services, customer: { first_name, email, phone } })
            }).catch(e => console.error("n8n Webhook failed", e));
        }

        return new Response(JSON.stringify({ success: true, booking }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
