// Telegram bot channel — STUB.
// Real implementation lands in Chat 1 · Task 10.
// Returns ok=false with reason='not_implemented' so the Router can record
// the failure cleanly without throwing.

export interface TelegramSendArgs {
  chat_id: string;
  text: string;
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

export interface TelegramSendResult {
  ok: boolean;
  message_id?: string;
  error?: string;
}

export async function sendViaTelegram(
  _args: TelegramSendArgs,
): Promise<TelegramSendResult> {
  return {
    ok: false,
    error: 'telegram_channel_not_implemented_until_task_10',
  };
}
