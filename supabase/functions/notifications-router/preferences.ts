// Channel selection logic.
//
// Given a customer + event type, returns an ordered list of channels the
// Router should try. The first channel where the customer has a reachable
// address and isn't opted out wins.
//
// Hierarchy resolution:
// 1. customers.notification_preferences.channels[<category>]  (manual override per category)
// 2. customers.notification_preferences.channels.default
// 3. salon_settings.notification_channel_priority  (global fallback)
// 4. hardcoded fallback ['whatsapp','push','email','sms']

type Channel = 'whatsapp' | 'push' | 'email' | 'sms' | 'telegram';

interface CustomerForRouting {
  id: string;
  email: string | null;
  phone: string | null;
  notification_preferences: Record<string, unknown>;
}

interface SalonForRouting {
  notification_channel_priority: string[];
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

const HARDCODED_FALLBACK: Channel[] = ['whatsapp', 'push', 'email', 'sms'];
const VALID_CHANNELS = new Set<Channel>(['whatsapp', 'push', 'email', 'sms']);

// Event-type → category mapping used for per-category channel preferences.
// Each customer-facing event_type lands in exactly one category that the
// customer can override individually in /profilo/impostazioni.
export function eventCategory(eventType: string): string {
  if (eventType.startsWith('appointment_')) return 'appointment_reminders';
  if (eventType === 'waitlist_match') return 'waitlist';
  if (eventType === 'birthday') return 'birthday';
  if (eventType === 'review_request') return 'review_request';
  if (eventType === 'post_visit_survey') return 'post_visit_survey';
  if (eventType.startsWith('package_')) return 'package_expiry';
  if (
    eventType === 'reactivation' ||
    eventType === 'last_minute_promo' ||
    eventType === 'coupon_assigned' ||
    eventType === 'referral_credit_earned'
  )
    return 'marketing';
  return 'other';
}

function readChannelList(value: unknown): Channel[] | null {
  if (!Array.isArray(value)) return null;
  const valid = value
    .filter((c): c is Channel => typeof c === 'string' && VALID_CHANNELS.has(c as Channel));
  return valid.length > 0 ? valid : null;
}

export function pickChannels(
  customer: CustomerForRouting,
  salon: SalonForRouting,
  eventType: string,
): Channel[] {
  const category = eventCategory(eventType);
  const prefs = (customer.notification_preferences ?? {}) as Record<string, unknown>;
  const channels = (prefs.channels ?? {}) as Record<string, unknown>;

  const candidate =
    readChannelList(channels[category]) ??
    readChannelList(channels.default) ??
    readChannelList(salon.notification_channel_priority) ??
    HARDCODED_FALLBACK;

  // Remove channels the customer can't actually receive on.
  return candidate.filter((ch) => {
    if (ch === 'email') return Boolean(customer.email);
    if (ch === 'sms' || ch === 'whatsapp') return Boolean(customer.phone);
    return true; // push is checked separately by the channel handler
  });
}

export function isOptedOut(
  customer: CustomerForRouting,
  eventType: string,
): boolean {
  const prefs = (customer.notification_preferences ?? {}) as Record<string, unknown>;
  const optOut = prefs.opt_out;
  if (!Array.isArray(optOut)) return false;
  const category = eventCategory(eventType);
  return optOut.includes(category) || optOut.includes(eventType);
}

// Returns true when the current wall-clock time in the salon's timezone
// falls inside the salon-defined quiet window. Wraps across midnight
// (start=22:00 end=08:00 → quiet from 22 through 07:59 next day).
export function isQuietHours(salon: SalonForRouting, now: Date = new Date()): boolean {
  const localHHMM = new Intl.DateTimeFormat('en-GB', {
    timeZone: salon.timezone || 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(now)
    .replace(':', '');

  const start = salon.quiet_hours_start.replace(':', '').slice(0, 4);
  const end = salon.quiet_hours_end.replace(':', '').slice(0, 4);
  const cur = localHHMM;

  if (start <= end) {
    return cur >= start && cur < end;
  }
  return cur >= start || cur < end;
}
