// Gmail SMTP channel — STUB.
// Real implementation lands in Chat 1 · Task 9.
// Returns ok=false with reason='not_implemented' so the Router can fall
// back to the next channel in the hierarchy.

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

export async function sendViaGmail(_args: GmailSendArgs): Promise<GmailSendResult> {
  return {
    ok: false,
    error: 'gmail_channel_not_implemented_until_task_9',
  };
}
