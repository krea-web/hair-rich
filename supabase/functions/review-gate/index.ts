import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Review Gate Logic: Customer clicks a star rating in their email/WhatsApp.
        // > 4 stars -> redirect to Google Maps / Trustpilot.
        // <= 3 stars -> show internal form to gather feedback privately.

        const { appointment_id, rating, feedback } = await req.json();
        if (!appointment_id || !rating) throw new Error('Missing fields');

        const supabase = getSupabase();

        const { error } = await supabase
            .from('reviews')
            .insert({
                appointment_id,
                rating,
                internal_feedback: feedback || null,
                is_public: rating >= 4
            });

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            action: rating >= 4 ? 'redirect_google' : 'stay_internal'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
