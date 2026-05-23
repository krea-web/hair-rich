// Gmail SMTP channel.
//
// Uses Nodemailer via Deno's npm: specifier to talk SMTP STARTTLS to
// smtp.gmail.com:587 with an App Password (NOT the account password).
// Set up: https://myaccount.google.com/apppasswords
//
// Required Edge Function secrets (`supabase secrets set ...`):
//   GMAIL_USER           — full mailbox, e.g. info@hairrich.it
//   GMAIL_APP_PASSWORD   — 16-char app password, no spaces
//   GMAIL_FROM_NAME      — optional friendly From: name

// deno-lint-ignore-file no-explicit-any
import nodemailer from 'npm:nodemailer@6.9.16';

export interface GmailSendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
}

export interface GmailSendResult {
  ok: boolean;
  message_id?: string;
  error?: string;
}

let cachedTransport: any | null = null;

function getTransport(): any | null {
  if (cachedTransport) return cachedTransport;

  const user = Deno.env.get('GMAIL_USER');
  const pass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !pass) return null;

  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });

  return cachedTransport;
}

export async function sendViaGmail(args: GmailSendArgs): Promise<GmailSendResult> {
  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: 'gmail_credentials_missing' };
  }

  const fromName = Deno.env.get('GMAIL_FROM_NAME') ?? 'Hair Rich Olbia';
  const fromAddr = Deno.env.get('GMAIL_USER')!;
  const from = `"${fromName}" <${fromAddr}>`;

  try {
    const info = await transport.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.reply_to,
    });
    return { ok: true, message_id: info?.messageId };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? 'gmail_send_failed' };
  }
}
