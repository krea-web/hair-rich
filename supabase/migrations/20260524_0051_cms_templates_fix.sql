-- Hair Rich · Chat 3 · CMS template seeds (correct schema)
--
-- Earlier migrations (0046, 0048) used the wrong column names
-- (block_key/content_md/content_json) and would fail at apply time.
-- The real cms_blocks schema is (key, label, value, kind) per
-- migration 0017. Re-seed all marketing/notification templates using
-- the canonical naming convention from migration 0027:
--   tmpl_email_subject_<event> | tmpl_email_body_<event> | tmpl_telegram_<event>

INSERT INTO cms_blocks (key, label, value, kind) VALUES
  -- Birthday greeting (#4)
  ('tmpl_email_subject_birthday_greeting',
   'Email · oggetto · auguri compleanno',
   'Buon compleanno {{first_name}}! Hair Rich',
   'text'),
  ('tmpl_email_body_birthday_greeting',
   'Email · corpo · auguri compleanno',
   E'## 🎂 Auguri {{first_name}}!\n\nTutto lo staff di Hair Rich Olbia ti augura un buon compleanno.\n\nCome regalo abbiamo riservato per te uno **sconto del {{discount_percent}}%** sul prossimo taglio.\n\nUsa il codice `{{coupon_code}}` entro {{validity_days}} giorni.',
   'markdown'),
  ('tmpl_telegram_birthday_greeting',
   'Telegram · auguri compleanno',
   E'🎂 Auguri {{first_name}}!\n\nHair Rich Olbia ti regala -{{discount_percent}}% sul prossimo taglio.\nCodice: `{{coupon_code}}` (valido {{validity_days}} giorni)',
   'markdown'),

  -- Reactivation (#5)
  ('tmpl_email_subject_reactivation',
   'Email · oggetto · riattivazione',
   '{{first_name}}, ci manchi',
   'text'),
  ('tmpl_email_body_reactivation',
   'Email · corpo · riattivazione',
   E'## Ci manchi, {{first_name}}\n\nSono {{days_since_last_visit}} giorni che non ti vediamo a Hair Rich Olbia.\n\nSe ti va di tornare, abbiamo riservato per te uno sconto del **{{discount_percent}}%** sul prossimo taglio.\n\nCodice: `{{coupon_code}}` · valido fino al {{valid_until}}.',
   'markdown'),
  ('tmpl_telegram_reactivation',
   'Telegram · riattivazione',
   E'👋 {{first_name}}, ci manchi.\nSono {{days_since_last_visit}}gg che non vieni. -{{discount_percent}}% se prenoti entro {{valid_until}}.\nCodice: `{{coupon_code}}`',
   'markdown'),

  -- Last-minute promo (#6)
  ('tmpl_email_subject_last_minute_promo',
   'Email · oggetto · promo last-minute',
   'Ultimo minuto: -{{discount_percent}}% {{when_label}}',
   'text'),
  ('tmpl_email_body_last_minute_promo',
   'Email · corpo · promo last-minute',
   E'## Posti liberi {{when_label}} 🎯\n\nCiao {{first_name}}, ho appena visto che ho qualche posto libero {{when_label}}.\n\nSe vuoi passare, ti faccio uno sconto del {{discount_percent}}%.\n\nCodice: `{{coupon_code}}` · valido solo {{when_label}}.',
   'markdown'),
  ('tmpl_telegram_last_minute_promo',
   'Telegram · promo last-minute',
   E'🎯 {{first_name}}, posti liberi {{when_label}}!\n-{{discount_percent}}% con codice `{{coupon_code}}`',
   'markdown'),

  -- Review request (#62)
  ('tmpl_email_subject_review_request',
   'Email · oggetto · richiesta recensione',
   'Com''è andata oggi, {{first_name}}?',
   'text'),
  ('tmpl_email_body_review_request',
   'Email · corpo · richiesta recensione',
   E'## Com''è andata oggi, {{first_name}}? ✂️\n\nSe ti è piaciuto il taglio, una recensione su Google ci darebbe una grossa mano.\n\nUn click qui sotto, è veloce: 👉 [{{link}}]({{link}})\n\nSe invece qualcosa non è andato bene, lo stesso link ti porta a dircelo in privato — preferiamo saperlo noi prima di Google.',
   'markdown'),
  ('tmpl_telegram_review_request',
   'Telegram · richiesta recensione',
   E'Ciao {{first_name}}! Com''è andata oggi?\nUn feedback rapido: {{link}}',
   'markdown'),

  -- Owner alerts (Telegram-only — used by ai-weekly-suggestions, ai-monthly-report, bookings-drop-alert, stock-low-alert)
  ('tmpl_telegram_weekly_suggestions',
   'Telegram (owner) · suggerimenti settimanali AI',
   E'🧠 *Suggerimenti AI · settimana {{period}}*\n\n{{headline}}\n\n_Report completo via email._',
   'markdown'),
  ('tmpl_telegram_monthly_report',
   'Telegram (owner) · report mensile AI',
   E'📊 *Report mensile · {{period}}*\n\n{{headline}}\n\n_Report completo via email._',
   'markdown'),
  ('tmpl_telegram_bookings_drop_alert',
   'Telegram (owner) · alert calo prenotazioni',
   E'📉 *Prenotazioni in calo*\n\nSettimana corrente: {{current_week_count}}\nMedia 8 settimane: {{avg_8w_count}}\nDelta: {{delta_pct}}%\n\nAzioni consigliate:\n{{#suggested_actions}}• {{.}}\n{{/suggested_actions}}',
   'markdown'),
  ('tmpl_telegram_stock_low_alert',
   'Telegram (owner) · scorte basse',
   E'📦 *Scorte basse*\n\n{{summary}}',
   'markdown')
ON CONFLICT (key) DO NOTHING;
