// Staff Google Calendar OAuth · Edge Function
//
// Two-step flow:
//   GET /gcal-oauth?staff_id=...                 → redirect to Google consent
//   GET /gcal-oauth?code=...&state=staff:<id>    → exchange code, store
//                                                  refresh_token
//
// Scope: calendar.events (read/write events on the chosen calendar).
//
// Required env:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_OAUTH_REDIRECT  (must match the URL configured in GCP)
//   PUBLIC_SITE_URL        (where the admin page is hosted, used in the
//                          post-callback redirect)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT');
  const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://hair-rich.it';

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response('OAuth env missing', { status: 500 });
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const staffParam = url.searchParams.get('staff_id');

  // Initial leg: build the consent URL.
  if (!code && staffParam) {
    const consent = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    consent.searchParams.set('client_id', clientId);
    consent.searchParams.set('redirect_uri', redirectUri);
    consent.searchParams.set('response_type', 'code');
    consent.searchParams.set('access_type', 'offline');
    consent.searchParams.set('prompt', 'consent');
    consent.searchParams.set('scope', SCOPE);
    consent.searchParams.set('state', `staff:${staffParam}`);
    return Response.redirect(consent.toString(), 302);
  }

  // Callback leg: exchange code for tokens.
  if (code && state?.startsWith('staff:')) {
    const staffId = state.slice('staff:'.length);

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const token = (await tokenResp.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error?: string;
      error_description?: string;
    };
    if (!token.refresh_token) {
      return new Response(
        `Token exchange failed: ${token.error_description ?? token.error ?? 'no refresh_token'}`,
        { status: 400 },
      );
    }

    // Fetch the Google profile so we can store the calendar owner email.
    const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const profile = (await profileResp.json()) as { id?: string; email?: string };

    const expiresAt = new Date(Date.now() + (token.expires_in ?? 3600) * 1000).toISOString();

    const supabase = getSupabase();
    const { error } = await supabase.from('staff_gcal_tokens').upsert(
      {
        staff_id: staffId,
        google_user_id: profile.id ?? null,
        google_email: profile.email ?? null,
        refresh_token: token.refresh_token,
        access_token: token.access_token ?? null,
        access_token_expires_at: expiresAt,
        enabled: true,
        scopes: token.scope ? token.scope.split(' ') : [SCOPE],
      },
      { onConflict: 'staff_id' },
    );
    if (error) {
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }

    return Response.redirect(`${siteUrl}/admin/staff?gcal=connected`, 302);
  }

  return new Response('Bad request', { status: 400 });
});
