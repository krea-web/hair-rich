import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { from_date, to_date } = await req.json();
        const supabase = getSupabase();

        // Call custom postgres function for stats
        const { data, error } = await supabase.rpc('fn_get_admin_dashboard_stats', {
            p_start: from_date,
            p_end: to_date
        });

        if (error) throw error;

        return new Response(JSON.stringify({ stats: data }), {
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
