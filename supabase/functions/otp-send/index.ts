import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phone } = await req.json();
        if (!phone) throw new Error('Phone number is required');

        const supabase = getSupabase();

        // Generate 6 digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in a simple custom table or cache. 
        // In a real scenario we'd use GoTrue, but for custom whatsapp OTP we might just use a standard table: `otp_sessions`
        const { error: dbErr } = await supabase
            .from('otp_sessions')
            .insert({ phone, code, expires_at: new Date(Date.now() + 10 * 60000).toISOString() }); // 10 min

        // Fire n8n webhook to send WhatsApp message
        const N8N_URL = Deno.env.get('N8N_WEBHOOK_URL');
        if (N8N_URL) {
            await fetch(`${N8N_URL}/otp-send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code })
            }).catch(console.error);
        }

        return new Response(JSON.stringify({ success: true, message: 'OTP Sent' }), {
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
