-- Hair Rich · Owner-side waitlist match notification template
--
-- Companion to 0030/0032. The waitlist-matcher Edge Function pings the
-- owner on Telegram every time a soft hold is created so they know an
-- expired slot is on its way to being saved.

INSERT INTO cms_blocks (key, label, value, kind) VALUES
  ('tmpl_telegram_owner_waitlist_match',
   'Telegram · slot riassegnato a waitlist (titolare)',
   E'🎯 *Slot recuperato (waitlist)*\n\nUno slot cancellato è stato proposto a un cliente in lista d''attesa.\n\n🗓 {{slot}}\n👨‍💼 {{staff_name}}\n\n⏳ Scade {{expires_at}}. Se non conferma, viene riassegnato in automatico.',
   'markdown')
ON CONFLICT (key) DO NOTHING;
