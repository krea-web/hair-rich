import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { start_time, end_time, staff_id, chair_id } = await req.json();

        if (!start_time || !end_time) {
            return new Response(JSON.stringify({ error: 'Missing start_time or end_time' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = getSupabase();

        // Call the postgres function
        const { data, error } = await supabase.rpc('fn_check_slot_availability', {
            p_start_at: start_time,
            p_end_at: end_time,
            p_staff_id: staff_id || null,
            p_chair_id: chair_id || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ available: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
