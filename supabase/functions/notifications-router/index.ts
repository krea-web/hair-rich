// Notification Router · Edge Function entry point.
//
// Single dispatch surface for every messaging event in Hair Rich. Two
// modes:
//   • mode='customer' → send to a customer over the best-fit channel
//                       (WA/push/email/sms) honoring preferences + dedup.
//   • mode='owner'    → send to the salon owner on Telegram only.
//
// Always writes to notifications_sent. Owner-mode also inserts an
// admin_inbox_items row so /admin/inbox shows the event.
//
// Invoke from a Supabase Edge Function client:
//   supabase.functions.invoke('notifications-router', { body: {...} })
//
// Required env (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (auto-provided)
//   GMAIL_USER, GMAIL_APP_PASSWORD           (Task 9)
//   TELEGRAM_BOT_TOKEN                       (Task 10)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabase } from '../_shared/supabaseAdmin.ts';
import {
  renderTemplate,
  markdownToHtml,
  markdownToText,
  renderTelegram,
} from './render.ts';
import { pickChannels, isOptedOut, isQuietHours } from './preferences.ts';
import { sendViaGmail } from './channels/gmail.ts';
import { sendViaTelegram } from './channels/telegram.ts';

type Channel = 'whatsapp' | 'push' | 'email' | 'sms' | 'telegram';

// Events that must fan out across channels even if already sent on another.
const MULTI_CHANNEL_EVENTS = new Set<string>(['waitlist_match']);

// Events that bypass quiet hours.
const QUIET_HOURS_BYPASS = new Set<string>([
  'waitlist_match',
  'appointment_cancelled_by_salon',
  'owner_tech_error',
]);

// Map event_type → required consent_type (customer_consents ledger).
// Events that are purely transactional/service (cancellation by salon,
// waitlist response to own request, package receipt) do NOT require a
// consent grant — refusing them would be hostile to the customer.
const EVENT_REQUIRED_CONSENT: Record<string, string> = {
  // Marketing-class — require explicit marketing consent
  birthday: 'marketing',
  reactivation: 'marketing',
  last_minute_promo: 'marketing',
  coupon_assigned: 'marketing',
  review_request: 'marketing',
  post_visit_survey: 'marketing',
  // Reminder-class — require reminder consent (which is the "consigliato"
  // pre-checked option in onboarding; customer can still revoke)
  appointment_reminder: 'appointment_reminders',
  appointment_reminder_short: 'appointment_reminders',
  appointment_confirmation: 'appointment_reminders',
  // Referral-class
  referral_credit_earned: 'referral_program',
  // Transactional (NO consent needed)
  // - appointment_cancelled_by_salon
  // - waitlist_match
  // - package_purchased
  // - package_expiring
};

async function hasGrantedConsent(
  supabase: ReturnType<typeof getSupabase>,
  customerId: string,
  consentType: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('customer_consents_current')
    .select('granted')
    .eq('customer_id', customerId)
    .eq('consent_type', consentType)
    .maybeSingle();
  if (!data) return false;
  return Boolean((data as { granted: boolean }).granted);
}

interface CustomerRow {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string | null;
  notification_preferences: Record<string, unknown>;
}

interface SalonRow {
  display_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notification_channel_priority: string[];
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  multi_channel_critical: boolean;
  owner_telegram_chat_id: string | null;
  owner_telegram_extra_chat_ids: string[];
}

async function loadSalon(supabase: ReturnType<typeof getSupabase>): Promise<SalonRow | null> {
  const { data } = await supabase
    .from('salon_settings')
    .select(
      'display_name, phone, email, address, notification_channel_priority, quiet_hours_start, quiet_hours_end, timezone, multi_channel_critical, owner_telegram_chat_id, owner_telegram_extra_chat_ids',
    )
    .limit(1)
    .maybeSingle();
  return data as SalonRow | null;
}

async function loadCustomer(
  supabase: ReturnType<typeof getSupabase>,
  customerId: string,
): Promise<CustomerRow | null> {
  const { data } = await supabase
    .from('customers')
    .select('id, email, phone, first_name, last_name, notification_preferences')
    .eq('id', customerId)
    .maybeSingle();
  return data as CustomerRow | null;
}

async function isSkillEnabled(
  supabase: ReturnType<typeof getSupabase>,
  skillKey: string | undefined,
): Promise<boolean> {
  if (!skillKey) return true;
  const { data } = await supabase
    .from('skills_config')
    .select('enabled')
    .eq('skill_key', skillKey)
    .maybeSingle();
  if (!data) return false;
  return Boolean((data as { enabled: boolean }).enabled);
}

async function hasAlreadySent(
  supabase: ReturnType<typeof getSupabase>,
  args: {
    recipient_type: 'customer' | 'owner' | 'staff';
    recipient_id: string | null;
    event_type: string;
    related_id: string | null;
  },
): Promise<boolean> {
  const q = supabase
    .from('notifications_sent')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_type', args.recipient_type)
    .eq('event_type', args.event_type)
    .in('status', ['sent', 'delivered', 'opened', 'clicked']);

  const r1 = args.recipient_id ? q.eq('recipient_id', args.recipient_id) : q.is('recipient_id', null);
  const r2 = args.related_id ? r1.eq('related_id', args.related_id) : r1.is('related_id', null);

  const { count } = await r2;
  return (count ?? 0) > 0;
}

async function loadTemplate(
  supabase: ReturnType<typeof getSupabase>,
  key: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('cms_blocks')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data ? (data as { value: string }).value : null;
}

interface CustomerSendArgs {
  customer_id: string;
  event_type: string;
  related_id?: string;
  related_type?: string;
  payload?: Record<string, unknown>;
  source_skill?: string;
  force?: boolean;
  force_channel?: Channel;
}

interface OwnerSendArgs {
  event_type: string;
  related_id?: string;
  related_type?: string;
  payload?: Record<string, unknown>;
  source_skill?: string;
}

async function dispatchCustomer(args: CustomerSendArgs) {
  const supabase = getSupabase();

  if (!(await isSkillEnabled(supabase, args.source_skill))) {
    return { ok: false, reason: 'skill_disabled', skipped: 'skill_disabled' };
  }

  const salon = await loadSalon(supabase);
  if (!salon) return { ok: false, reason: 'salon_settings_missing' };

  const customer = await loadCustomer(supabase, args.customer_id);
  if (!customer) return { ok: false, reason: 'customer_not_found' };

  if (isOptedOut(customer, args.event_type)) {
    return { ok: false, reason: 'opt_out', skipped: 'opt_out' };
  }

  // GDPR consent gate — block marketing/reminder/referral events when the
  // customer has not granted (or has revoked) the matching consent type.
  // Transactional events (waitlist response, cancellation by salon, package
  // receipts) intentionally skip this check.
  const requiredConsent = EVENT_REQUIRED_CONSENT[args.event_type];
  if (requiredConsent) {
    const granted = await hasGrantedConsent(supabase, customer.id, requiredConsent);
    if (!granted) {
      return { ok: false, reason: 'consent_missing', skipped: 'consent_missing' };
    }
  }

  if (
    !QUIET_HOURS_BYPASS.has(args.event_type) &&
    isQuietHours(salon)
  ) {
    return { ok: false, reason: 'quiet_hours', skipped: 'quiet_hours' };
  }

  const allowMultiChannel =
    salon.multi_channel_critical && MULTI_CHANNEL_EVENTS.has(args.event_type);

  if (!args.force && !allowMultiChannel) {
    const already = await hasAlreadySent(supabase, {
      recipient_type: 'customer',
      recipient_id: customer.id,
      event_type: args.event_type,
      related_id: args.related_id ?? null,
    });
    if (already) return { ok: false, reason: 'duplicate', skipped: 'duplicate' };
  }

  const channels = args.force_channel
    ? [args.force_channel]
    : pickChannels(customer, salon, args.event_type);

  if (channels.length === 0) {
    return { ok: false, reason: 'no_address', skipped: 'no_address' };
  }

  const ctx = {
    ...args.payload,
    customer_name: `${customer.first_name} ${customer.last_name ?? ''}`.trim(),
    customer_first_name: customer.first_name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    salon_name: salon.display_name,
    salon_phone: salon.phone,
    salon_address: salon.address,
  };

  for (const channel of channels) {
    const result = await trySendCustomerChannel(supabase, channel, customer, salon, args, ctx);
    if (result.ok) return result;
    // On a soft skip (channel not implemented yet, no template, etc),
    // record the failure and try the next channel.
    await recordSend(supabase, {
      recipient_type: 'customer',
      recipient_id: customer.id,
      recipient_address: customerAddressForChannel(customer, channel),
      event_type: args.event_type,
      related_id: args.related_id ?? null,
      related_type: args.related_type ?? null,
      channel,
      status: 'failed',
      error: result.reason ?? 'unknown',
      payload: args.payload ?? {},
      source_skill: args.source_skill ?? null,
    });
  }

  return { ok: false, reason: 'all_channels_failed' };
}

function customerAddressForChannel(customer: CustomerRow, channel: Channel): string | null {
  if (channel === 'email') return customer.email;
  if (channel === 'sms' || channel === 'whatsapp') return customer.phone;
  return null;
}

async function trySendCustomerChannel(
  supabase: ReturnType<typeof getSupabase>,
  channel: Channel,
  customer: CustomerRow,
  _salon: SalonRow,
  args: CustomerSendArgs,
  ctx: Record<string, unknown>,
): Promise<{ ok: boolean; reason?: string; channel?: Channel; notification_id?: string; provider_message_id?: string }> {
  if (channel === 'email') {
    if (!customer.email) return { ok: false, reason: 'no_email' };
    const subjectTpl = await loadTemplate(supabase, `tmpl_email_subject_${args.event_type}`);
    const bodyTpl = await loadTemplate(supabase, `tmpl_email_body_${args.event_type}`);
    if (!subjectTpl || !bodyTpl) return { ok: false, reason: 'template_missing' };

    const subject = renderTemplate(subjectTpl, ctx);
    const md = renderTemplate(bodyTpl, ctx);
    const result = await sendViaGmail({
      to: customer.email,
      subject,
      html: markdownToHtml(md),
      text: markdownToText(md),
    });

    if (!result.ok) return { ok: false, reason: result.error ?? 'gmail_failed' };

    const recordId = await recordSend(supabase, {
      recipient_type: 'customer',
      recipient_id: customer.id,
      recipient_address: customer.email,
      event_type: args.event_type,
      related_id: args.related_id ?? null,
      related_type: args.related_type ?? null,
      channel: 'email',
      status: 'sent',
      subject,
      body_preview: md.slice(0, 200),
      payload: args.payload ?? {},
      provider: 'gmail',
      provider_message_id: result.message_id ?? null,
      source_skill: args.source_skill ?? null,
    });

    return {
      ok: true,
      channel: 'email',
      notification_id: recordId,
      provider_message_id: result.message_id,
    };
  }

  if (channel === 'push') {
    const subjectTpl = await loadTemplate(supabase, `tmpl_push_title_${args.event_type}`);
    const bodyTpl = await loadTemplate(supabase, `tmpl_push_body_${args.event_type}`);
    if (!subjectTpl || !bodyTpl) {
      // Fallback to email subject/body if push-specific templates are missing
      const fallbackTitle = await loadTemplate(supabase, `tmpl_email_subject_${args.event_type}`);
      const fallbackBody = await loadTemplate(supabase, `tmpl_email_body_${args.event_type}`);
      if (!fallbackTitle || !fallbackBody) return { ok: false, reason: 'template_missing' };
      const title = renderTemplate(fallbackTitle, ctx);
      const md = renderTemplate(fallbackBody, ctx);
      const result = await invokePushSender(supabase, customer.id, title, markdownToText(md).slice(0, 240), args);
      if (!result.ok) return { ok: false, reason: result.reason };
      const recordId = await recordSend(supabase, {
        recipient_type: 'customer',
        recipient_id: customer.id,
        recipient_address: 'push',
        event_type: args.event_type,
        related_id: args.related_id ?? null,
        related_type: args.related_type ?? null,
        channel: 'push',
        status: 'sent',
        subject: title,
        body_preview: md.slice(0, 200),
        payload: args.payload ?? {},
        provider: 'web-push',
        provider_message_id: null,
        source_skill: args.source_skill ?? null,
      });
      return { ok: true, channel: 'push', notification_id: recordId };
    }
    const title = renderTemplate(subjectTpl, ctx);
    const body = renderTemplate(bodyTpl, ctx);
    const result = await invokePushSender(supabase, customer.id, title, body, args);
    if (!result.ok) return { ok: false, reason: result.reason };
    const recordId = await recordSend(supabase, {
      recipient_type: 'customer',
      recipient_id: customer.id,
      recipient_address: 'push',
      event_type: args.event_type,
      related_id: args.related_id ?? null,
      related_type: args.related_type ?? null,
      channel: 'push',
      status: 'sent',
      subject: title,
      body_preview: body.slice(0, 200),
      payload: args.payload ?? {},
      provider: 'web-push',
      provider_message_id: null,
      source_skill: args.source_skill ?? null,
    });
    return { ok: true, channel: 'push', notification_id: recordId };
  }

  // WhatsApp, SMS — not implemented yet. Fall through.
  return { ok: false, reason: `channel_${channel}_not_implemented` };
}

async function invokePushSender(
  supabase: ReturnType<typeof getSupabase>,
  customerId: string,
  title: string,
  body: string,
  args: CustomerSendArgs,
): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await supabase.functions.invoke('push-sender', {
    body: {
      customerId,
      title,
      body,
      url: args.payload?.url ?? '/profilo',
      tag: args.event_type,
    },
  });
  if (error) return { ok: false, reason: error.message ?? 'push_invoke_failed' };
  const result = data as { ok: boolean; reason?: string; sent?: number };
  if (!result?.ok) return { ok: false, reason: result?.reason ?? 'push_failed' };
  if ((result.sent ?? 0) === 0) return { ok: false, reason: 'no_subscriptions' };
  return { ok: true };
}

async function dispatchOwner(args: OwnerSendArgs) {
  const supabase = getSupabase();

  if (!(await isSkillEnabled(supabase, args.source_skill))) {
    return { ok: false, reason: 'skill_disabled', skipped: 'skill_disabled' };
  }

  const salon = await loadSalon(supabase);
  if (!salon) return { ok: false, reason: 'salon_settings_missing' };

  // All owner channels write to admin_inbox_items first — even if the
  // outbound Telegram send fails the owner still sees it next /admin visit.
  const inboxId = await insertInboxItem(supabase, args, salon);

  if (!salon.owner_telegram_chat_id) {
    return {
      ok: false,
      reason: 'owner_telegram_chat_id_missing',
      skipped: 'no_address',
      inbox_id: inboxId,
    };
  }

  if (!QUIET_HOURS_BYPASS.has(args.event_type) && isQuietHours(salon)) {
    return { ok: false, reason: 'quiet_hours', skipped: 'quiet_hours', inbox_id: inboxId };
  }

  const tpl = await loadTemplate(supabase, `tmpl_telegram_${args.event_type}`);
  if (!tpl) return { ok: false, reason: 'template_missing', inbox_id: inboxId };

  const ctx = {
    ...args.payload,
    salon_name: salon.display_name,
  };
  const text = renderTelegram(tpl, ctx);

  const recipients = [
    salon.owner_telegram_chat_id,
    ...(salon.owner_telegram_extra_chat_ids ?? []),
  ];

  let firstSuccess: { provider_message_id?: string; chat_id: string } | null = null;
  for (const chatId of recipients) {
    const r = await sendViaTelegram({ chat_id: chatId, text, parse_mode: 'Markdown' });
    if (r.ok && !firstSuccess) {
      firstSuccess = { provider_message_id: r.message_id, chat_id: chatId };
    }
    await recordSend(supabase, {
      recipient_type: 'owner',
      recipient_id: null,
      recipient_address: chatId,
      event_type: args.event_type,
      related_id: args.related_id ?? null,
      related_type: args.related_type ?? null,
      channel: 'telegram',
      status: r.ok ? 'sent' : 'failed',
      error: r.ok ? null : r.error ?? 'telegram_failed',
      body_preview: text.slice(0, 200),
      payload: args.payload ?? {},
      provider: 'telegram',
      provider_message_id: r.message_id ?? null,
      source_skill: args.source_skill ?? null,
    });
  }

  if (!firstSuccess) {
    return { ok: false, reason: 'telegram_send_failed', inbox_id: inboxId };
  }

  return {
    ok: true,
    channel: 'telegram',
    provider_message_id: firstSuccess.provider_message_id,
    inbox_id: inboxId,
  };
}

interface RecordSendArgs {
  recipient_type: 'customer' | 'owner' | 'staff';
  recipient_id: string | null;
  recipient_address: string | null;
  event_type: string;
  related_id: string | null;
  related_type: string | null;
  channel: Channel;
  status: 'sent' | 'failed' | 'queued' | 'delivered' | 'bounced';
  error?: string | null;
  subject?: string | null;
  body_preview?: string | null;
  payload: Record<string, unknown>;
  provider?: string | null;
  provider_message_id?: string | null;
  source_skill?: string | null;
}

async function recordSend(
  supabase: ReturnType<typeof getSupabase>,
  row: RecordSendArgs,
): Promise<string> {
  const { data } = await supabase
    .from('notifications_sent')
    .insert(row)
    .select('id')
    .single();
  return (data as { id: string } | null)?.id ?? '';
}

async function insertInboxItem(
  supabase: ReturnType<typeof getSupabase>,
  args: OwnerSendArgs,
  _salon: SalonRow,
): Promise<string | null> {
  const { title, body, icon, category, priority, action_url } = mapOwnerEventToInboxItem(args);

  const { data } = await supabase
    .from('admin_inbox_items')
    .insert({
      event_type: args.event_type,
      category,
      priority,
      title,
      body,
      icon,
      action_url,
      related_type: args.related_type ?? null,
      related_id: args.related_id ?? null,
      payload: args.payload ?? {},
      source_skill: args.source_skill ?? null,
    })
    .select('id')
    .single();

  return (data as { id: string } | null)?.id ?? null;
}

interface InboxItemMapping {
  title: string;
  body: string | null;
  icon: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  action_url: string | null;
}

function mapOwnerEventToInboxItem(args: OwnerSendArgs): InboxItemMapping {
  const p = args.payload ?? {};
  const customerName = (p.customer_name as string) ?? '';
  const date = (p.appointment_date as string) ?? '';
  const time = (p.appointment_time as string) ?? '';

  switch (args.event_type) {
    case 'owner_new_booking':
      return {
        title: `Nuova prenotazione · ${customerName}`,
        body: `${date} alle ${time}`,
        icon: '🟢',
        category: 'appointments',
        priority: 'normal',
        action_url: '/admin/agenda',
      };
    case 'owner_cancellation':
      return {
        title: `Cancellazione · ${customerName}`,
        body: `${date} alle ${time}`,
        icon: '🔴',
        category: 'appointments',
        priority: 'high',
        action_url: '/admin/agenda',
      };
    case 'owner_no_show':
      return {
        title: `No-show · ${customerName}`,
        body: `${date} alle ${time}`,
        icon: '⚠️',
        category: 'appointments',
        priority: 'high',
        action_url: '/admin/clienti/no-show',
      };
    case 'owner_negative_review':
      return {
        title: `Cliente insoddisfatto · ${customerName}`,
        body: (p.customer_feedback as string) ?? null,
        icon: '😞',
        category: 'marketing',
        priority: 'critical',
        action_url: '/admin/marketing',
      };
    case 'owner_bookings_drop_alert':
      return {
        title: `Calo prenotazioni −${p.drop_pct}%`,
        body: `Questa settimana ${p.this_week_count} vs media ${p.avg_count}`,
        icon: '📉',
        category: 'system',
        priority: 'high',
        action_url: '/admin/statistiche',
      };
    case 'owner_stock_low':
      return {
        title: `Scorte basse · ${p.product_name}`,
        body: `${p.current_stock} pezzi · soglia ${p.threshold}`,
        icon: '📦',
        category: 'catalog',
        priority: 'normal',
        action_url: '/admin/prodotti',
      };
    case 'owner_daily_digest':
      return {
        title: `Riepilogo del ${p.today_date}`,
        body: `${p.today_appointments_count} appuntamenti · € ${p.today_revenue}`,
        icon: '📊',
        category: 'system',
        priority: 'low',
        action_url: '/admin',
      };
    default:
      return {
        title: args.event_type.replace(/_/g, ' '),
        body: null,
        icon: '🔔',
        category: 'system',
        priority: 'normal',
        action_url: null,
      };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (body?.mode === 'customer') {
      const result = await dispatchCustomer(body as CustomerSendArgs);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (body?.mode === 'owner') {
      const result = await dispatchOwner(body as OwnerSendArgs);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ ok: false, reason: 'unknown_mode' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, reason: (err as Error).message ?? 'unhandled_error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
