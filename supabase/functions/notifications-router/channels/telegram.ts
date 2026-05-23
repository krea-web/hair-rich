// Telegram bot channel.
//
// Uses the public Bot API directly via fetch — no library, no auth flow.
// Setup:
//   1. Open https://t.me/BotFather and send /newbot, follow prompts
//   2. Copy the bot token, set as Edge Function secret TELEGRAM_BOT_TOKEN
//   3. From the owner's Telegram, search the bot name and send /start
//   4. Run:  curl https://api.telegram.org/bot<TOKEN>/getUpdates
//   5. Copy the numeric chat_id and save into
//      salon_settings.owner_telegram_chat_id

const API_BASE = 'https://api.telegram.org';

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
  args: TelegramSendArgs,
): Promise<TelegramSendResult> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!token) return { ok: false, error: 'telegram_bot_token_missing' };

  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: args.chat_id,
        text: args.text,
        parse_mode: args.parse_mode ?? 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const json = (await res.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };

    if (!json.ok || !json.result) {
      return { ok: false, error: json.description ?? 'telegram_send_failed' };
    }

    return { ok: true, message_id: String(json.result.message_id) };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? 'telegram_fetch_failed' };
  }
}
