// Gmail SMTP channel contract.
//
// Implementation runs inside the notifications-router Edge Function (Deno).
// Browser code does NOT send email directly — it goes through the Router.
// This file documents the env vars + payload shape so callers know what
// the Router expects.

export interface GmailChannelEnv {
  GMAIL_USER: string;         // sender mailbox, e.g. info@hairrich.it
  GMAIL_APP_PASSWORD: string; // Google App Password (16 chars, no spaces)
  GMAIL_FROM_NAME?: string;   // optional friendly name; defaults to salon_settings.display_name
}

export interface GmailSendPayload {
  to: string;
  subject: string;
  html: string;              // rendered from cms_blocks markdown
  text?: string;             // plain-text fallback; auto-derived from html if missing
  reply_to?: string;
}

export interface GmailSendResult {
  ok: boolean;
  message_id?: string;
  error?: string;
}

export const GMAIL_CHANNEL_KEY = 'email' as const;
