// Shared types for the Notification Router. Mirrored on the Deno side
// inside supabase/functions/notifications-router/ — keep in sync.

export type NotificationChannel =
  | 'whatsapp'
  | 'push'
  | 'email'
  | 'sms'
  | 'telegram';

export type RecipientType = 'customer' | 'owner' | 'staff';

// Customer-facing event vocabulary (Router renders a cms_blocks template
// for each). Keep in sync with tmpl_<channel>_<event_type> keys.
export type CustomerEventType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_reminder_short'
  | 'appointment_cancelled_by_salon'
  | 'waitlist_match'
  | 'birthday'
  | 'reactivation'
  | 'last_minute_promo'
  | 'review_request'
  | 'post_visit_survey'
  | 'package_purchased'
  | 'package_expiring'
  | 'referral_credit_earned'
  | 'coupon_assigned';

// Owner-facing event vocabulary (Telegram only, by design — see CLAUDE.md
// "Notification Router Bifurcated Architecture: Customer vs. Owner").
export type OwnerEventType =
  | 'owner_new_booking'
  | 'owner_cancellation'
  | 'owner_no_show'
  | 'owner_negative_review'
  | 'owner_empty_slot'
  | 'owner_coupon_exhausted'
  | 'owner_winback'
  | 'owner_vip_booking'
  | 'owner_tech_error'
  | 'owner_daily_digest'
  | 'owner_bookings_drop_alert'
  | 'owner_stock_low'
  | 'owner_ai_weekly_suggestions'
  | 'owner_ai_monthly_report';

export type EventType = CustomerEventType | OwnerEventType;

export interface SendCustomerArgs {
  customer_id: string;
  event_type: CustomerEventType;
  related_id?: string;
  related_type?: 'appointment' | 'coupon' | 'review' | 'waitlist' | 'package' | 'referral';
  payload?: Record<string, unknown>;
  source_skill?: string;
  // When true, ignore the dedup index and force a send even if the same
  // event was already delivered for this related_id. Used by retries.
  force?: boolean;
  // Pin to a specific channel (testing, or overrides like "send via email
  // because customer just opted into WhatsApp but it's not active yet").
  force_channel?: NotificationChannel;
}

export interface SendOwnerArgs {
  event_type: OwnerEventType;
  related_id?: string;
  related_type?: 'appointment' | 'coupon' | 'review' | 'waitlist' | 'package' | 'referral' | 'product';
  payload?: Record<string, unknown>;
  source_skill?: string;
}

export interface RouterSuccess {
  ok: true;
  channel: NotificationChannel;
  notification_id: string;
  provider_message_id?: string;
}

export interface RouterFailure {
  ok: false;
  reason: string;
  // Populated when the Router intentionally skipped (not an error)
  skipped?:
    | 'duplicate'
    | 'quiet_hours'
    | 'skill_disabled'
    | 'consent_missing'
    | 'opt_out'
    | 'no_address';
}

export type RouterResult = RouterSuccess | RouterFailure;
