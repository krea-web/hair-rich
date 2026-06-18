// Fix G · Eliminazione account (GDPR hard delete)
//
// POST { customer_id?: string }
//   - Senza customer_id → self-delete: elimina l'account del chiamante.
//   - Con customer_id → solo un admin (riga in `admins`) può eliminare altri.
//
// La cancellazione dell'auth user richiede service role (auth.admin.deleteUser,
// non fattibile da SQL). Ordine: prima la riga `customers` (CASCADE su
// appointments + tabelle collegate, vedi migration 0065/altre), poi l'auth user
// (customers.user_id è ON DELETE SET NULL, quindi NON sparirebbe da solo).
//
// Deploy: verify_jwt = true (il chiamante invia il proprio access token).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const admin = getSupabase(); // service role

  // 1. Identifica il chiamante dal proprio JWT.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const callerId = userData?.user?.id;
  if (userErr || !callerId) return json({ error: 'unauthorized' }, 401);

  const { data: adminRow } = await admin
    .from('admins')
    .select('user_id')
    .eq('user_id', callerId)
    .maybeSingle();
  const callerIsAdmin = !!adminRow;

  // 2. Risolvi il cliente target.
  let payload: { customer_id?: string } = {};
  try {
    payload = await req.json();
  } catch {
    /* body vuoto = self-delete */
  }

  let target: { id: string; user_id: string | null; first_name: string | null; last_name: string | null; email: string | null } | null = null;
  if (payload.customer_id) {
    const { data } = await admin
      .from('customers')
      .select('id, user_id, first_name, last_name, email')
      .eq('id', payload.customer_id)
      .maybeSingle();
    target = data;
  } else {
    const { data } = await admin
      .from('customers')
      .select('id, user_id, first_name, last_name, email')
      .eq('user_id', callerId)
      .maybeSingle();
    target = data;
  }
  if (!target) return json({ error: 'customer_not_found' }, 404);

  // 3. Autorizzazione: il cliente elimina sé stesso, l'admin chiunque.
  const isSelf = !!target.user_id && target.user_id === callerId;
  if (!callerIsAdmin && !isSelf) return json({ error: 'forbidden' }, 403);

  // 4. Elimina la scheda cliente (cascade) poi l'auth user.
  const { error: delErr } = await admin.from('customers').delete().eq('id', target.id);
  if (delErr) return json({ error: 'delete_failed', detail: delErr.message }, 500);

  if (target.user_id) {
    const { error: authErr } = await admin.auth.admin.deleteUser(target.user_id);
    if (authErr) console.error('delete-account: auth.admin.deleteUser', authErr.message);
  }

  // 5. Log GDPR (best-effort).
  try {
    await admin.from('admin_inbox_items').insert({
      event_type: 'account_deleted',
      category: 'customers',
      priority: 'high',
      title: 'Account cliente eliminato',
      body:
        `${target.first_name ?? ''} ${target.last_name ?? ''}`.trim() +
        (target.email ? ` · ${target.email}` : ''),
      icon: '🗑️',
      related_type: 'customer',
      payload: {
        deleted_by: callerIsAdmin && !isSelf ? 'admin' : 'self',
        deleted_customer_id: target.id,
        had_auth_user: !!target.user_id,
      },
      source_skill: 'gdpr_consents',
    });
  } catch (_) {
    /* il logging non deve bloccare la cancellazione */
  }

  return json({ ok: true, deleted_customer_id: target.id });
});
