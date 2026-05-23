// Telegram bot channel contract.
//
// Implementation runs inside the notifications-router Edge Function (Deno).
// The bot is created via @BotFather; recipient chat IDs are obtained when
// the owner sends /start to the bot, then stored in
// salon_settings.owner_telegram_chat_id and optional extras.

export interface TelegramChannelEnv {
  TELEGRAM_BOT_TOKEN: string;
}

export interface TelegramSendPayload {
  chat_id: string;
  text: string;
  // Telegram MarkdownV2 is the canonical format used by cms_blocks
  // tmpl_telegram_* templates.
  parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

export interface TelegramSendResult {
  ok: boolean;
  message_id?: string;
  error?: string;
}

export const TELEGRAM_CHANNEL_KEY = 'telegram' as const;
