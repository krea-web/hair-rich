// Client-side wrapper for the notifications-router Edge Function.
//
// Browser/server code never sends notifications directly — it POSTs to
// this Edge Function so all channel logic + dedup + audit lives in one
// place. The Edge Function runs with the service role and bypasses RLS.

import { createClient } from '../supabase/client';
import type {
  RouterResult,
  SendCustomerArgs,
  SendOwnerArgs,
} from './types';

async function invokeRouter<Body>(body: Body): Promise<RouterResult> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<RouterResult>(
    'notifications-router',
    { body },
  );
  if (error) {
    return { ok: false, reason: error.message ?? 'router_invoke_failed' };
  }
  if (!data) {
    return { ok: false, reason: 'empty_response' };
  }
  return data;
}

export function sendCustomerNotification(
  args: SendCustomerArgs,
): Promise<RouterResult> {
  return invokeRouter({ mode: 'customer', ...args });
}

export function sendOwnerAlert(args: SendOwnerArgs): Promise<RouterResult> {
  return invokeRouter({ mode: 'owner', ...args });
}
