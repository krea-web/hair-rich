import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phone, code } = await req.json();
        if (!phone || !code) throw new Error('Phone and code are required');

        const supabase = getSupabase();

        // Verify OTP
        const { data: session, error } = await supabase
            .from('otp_sessions')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !session) {
            return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), { status: 401, headers: corsHeaders });
        }

        // OTP Valid. Now we either sign them in or create a user.
        // In custom flow without GoTrue magic link, we might mint a custom JWT here,
        // or just trigger `supabase.auth.admin.generateLink` if using GoTrue underlying DB.

        // Cleanup OTP
        await supabase.from('otp_sessions').delete().eq('id', session.id);

        return new Response(JSON.stringify({ success: true, message: 'OTP Verified' }), {
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
