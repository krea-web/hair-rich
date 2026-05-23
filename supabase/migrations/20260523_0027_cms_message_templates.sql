-- Hair Rich · Message templates for the Notification Router
--
-- Seeds cms_blocks with the customer-facing and owner-facing message
-- templates the Router renders before sending. All editable from
-- /admin/cms without a code deploy. Mustache-style variables: {{var}}.
--
-- Naming convention: tmpl_<channel>_<field?>_<event_type>
--   tmpl_email_subject_<event>     → email subject line  (kind=text)
--   tmpl_email_body_<event>        → email body markdown (kind=markdown)
--   tmpl_telegram_<event>          → Telegram body       (kind=markdown)
--
-- Common variables: {{customer_name}}, {{customer_first_name}},
-- {{appointment_date}}, {{appointment_time}}, {{appointment_service}},
-- {{appointment_staff}}, {{salon_name}}, {{salon_phone}},
-- {{cancel_url}}, {{reschedule_url}}, {{review_url}}, {{coupon_code}}.

INSERT INTO cms_blocks (key, label, value, kind) VALUES
  -- ── Customer · appointment confirmation ─────────────────────────────
  ('tmpl_email_subject_appointment_confirmation',
   'Email · oggetto · conferma appuntamento',
   'Appuntamento confermato — {{appointment_date}} alle {{appointment_time}}',
   'text'),
  ('tmpl_email_body_appointment_confirmation',
   'Email · corpo · conferma appuntamento',
   E'Ciao {{customer_first_name}},\n\nGrazie per aver prenotato da {{salon_name}}.\n\n**Quando:** {{appointment_date}} alle {{appointment_time}}\n**Servizio:** {{appointment_service}}\n**Operatore:** {{appointment_staff}}\n\nSe devi cambiare orario o cancellare, hai tempo fino a 4 ore prima senza costi:\n[Sposta o annulla l''appuntamento]({{reschedule_url}})\n\nA presto,\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_appointment_confirmation',
   'Telegram · conferma appuntamento (cliente)',
   E'✅ *Appuntamento confermato*\n\n🗓 {{appointment_date}} ore {{appointment_time}}\n💈 {{appointment_service}} con {{appointment_staff}}\n\nGestisci → {{reschedule_url}}',
   'markdown'),

  -- ── Customer · 24h reminder ─────────────────────────────────────────
  ('tmpl_email_subject_appointment_reminder',
   'Email · oggetto · promemoria 24h',
   'Ci vediamo domani alle {{appointment_time}}',
   'text'),
  ('tmpl_email_body_appointment_reminder',
   'Email · corpo · promemoria 24h',
   E'Ciao {{customer_first_name}},\n\nUn promemoria per il tuo appuntamento di domani:\n\n**Quando:** {{appointment_date}} alle {{appointment_time}}\n**Servizio:** {{appointment_service}}\n**Dove:** {{salon_address}}\n\nSe non riesci a venire, fammelo sapere subito così posso liberare lo slot:\n[Sposta o annulla]({{cancel_url}})\n\nA domani!\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_appointment_reminder',
   'Telegram · promemoria 24h (cliente)',
   E'⏰ *Promemoria*\n\nCi vediamo domani {{appointment_date}} alle {{appointment_time}}.\n{{appointment_service}} con {{appointment_staff}}.\n\nNon puoi venire? {{cancel_url}}',
   'markdown'),

  -- ── Customer · cancelled by salon ───────────────────────────────────
  ('tmpl_email_subject_appointment_cancelled_by_salon',
   'Email · oggetto · cancellazione dal salone',
   'Devo cancellare il tuo appuntamento del {{appointment_date}}',
   'text'),
  ('tmpl_email_body_appointment_cancelled_by_salon',
   'Email · corpo · cancellazione dal salone',
   E'Ciao {{customer_first_name}},\n\nMi spiace tantissimo: devo cancellare il tuo appuntamento del **{{appointment_date}} alle {{appointment_time}}**.\n\n{{cancellation_reason}}\n\nVorrei rivederti il prima possibile — prenota un nuovo slot quando ti è comodo:\n[Scegli un nuovo orario]({{reschedule_url}})\n\nScusami ancora,\n{{salon_name}}',
   'markdown'),

  -- ── Customer · waitlist match ───────────────────────────────────────
  ('tmpl_email_subject_waitlist_match',
   'Email · oggetto · slot disponibile (waitlist)',
   'C''è uno slot libero — scade tra {{token_validity_human}}',
   'text'),
  ('tmpl_email_body_waitlist_match',
   'Email · corpo · waitlist match',
   E'Ciao {{customer_first_name}},\n\nSi è liberato uno slot per il tuo {{appointment_service}}:\n\n**{{appointment_date}} alle {{appointment_time}}** con {{appointment_staff}}\n\nLo voglio? Tap qui entro {{token_validity_human}}:\n[👉 Prendi questo slot]({{confirm_url}})\n\nDopo la scadenza, lo riassegno al prossimo in coda.\n\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_waitlist_match',
   'Telegram · waitlist match (cliente)',
   E'🎯 *Slot libero per te!*\n\n{{appointment_date}} alle {{appointment_time}}\n{{appointment_service}} con {{appointment_staff}}\n\n⏳ Conferma entro {{token_validity_human}}\n👉 {{confirm_url}}',
   'markdown'),

  -- ── Customer · birthday ─────────────────────────────────────────────
  ('tmpl_email_subject_birthday',
   'Email · oggetto · compleanno',
   'Buon compleanno {{customer_first_name}}! 🎂',
   'text'),
  ('tmpl_email_body_birthday',
   'Email · corpo · compleanno',
   E'Tantissimi auguri {{customer_first_name}}! 🎂\n\nDa {{salon_name}} un piccolo regalo per te: **{{coupon_value}}** sul prossimo taglio.\n\nCodice: `{{coupon_code}}`\nValido fino al {{coupon_expiry}}.\n\nUsalo quando prenoti — passa a trovarci quando vuoi, magari per festeggiare con un taglio fresco. ✂️\n\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_birthday',
   'Telegram · compleanno (cliente)',
   E'🎂 *Buon compleanno {{customer_first_name}}!*\n\nUn regalo da noi: {{coupon_value}} sul prossimo taglio.\n\nCodice: `{{coupon_code}}` (valido fino al {{coupon_expiry}})',
   'markdown'),

  -- ── Customer · reactivation (win-back) ──────────────────────────────
  ('tmpl_email_subject_reactivation',
   'Email · oggetto · riattivazione',
   'Ci manchi, {{customer_first_name}}',
   'text'),
  ('tmpl_email_body_reactivation',
   'Email · corpo · riattivazione',
   E'Ciao {{customer_first_name}},\n\nÈ passato un po'' dall''ultima volta che ci siamo visti. Tutto bene?\n\nSe ti va di passare a trovarci, abbiamo un piccolo regalo per il tuo ritorno: **{{coupon_value}}** sul prossimo taglio.\n\nCodice: `{{coupon_code}}` (valido 30 giorni)\n\nPrenota quando vuoi:\n[Scegli un orario]({{booking_url}})\n\nTi aspettiamo,\n{{salon_name}}',
   'markdown'),

  -- ── Customer · review request (post-visit) ──────────────────────────
  ('tmpl_email_subject_review_request',
   'Email · oggetto · richiesta recensione',
   'Com''è andata oggi? 30 secondi del tuo tempo',
   'text'),
  ('tmpl_email_body_review_request',
   'Email · corpo · richiesta recensione',
   E'Ciao {{customer_first_name}},\n\nGrazie per essere passato oggi! Com''è andata?\n\n[😊 Bene]({{review_url}}?r=happy) · [😐 Così così]({{review_url}}?r=neutral) · [😞 Male]({{review_url}}?r=sad)\n\nUn click — niente form. Se sei contento ti porto su Google, se no ne parliamo io e te.\n\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_review_request',
   'Telegram · richiesta recensione (cliente)',
   E'Com''è andata oggi, {{customer_first_name}}? 🤔\n\n{{review_url}}',
   'markdown'),

  -- ── Customer · post-visit private survey (NPS) ──────────────────────
  ('tmpl_email_subject_post_visit_survey',
   'Email · oggetto · sondaggio privato',
   'Come è andata? (resta tra noi)',
   'text'),
  ('tmpl_email_body_post_visit_survey',
   'Email · corpo · sondaggio privato',
   E'Ciao {{customer_first_name}},\n\nUn click veloce: come è andata oggi?\n\n[😊]({{survey_url}}?s=happy) · [😐]({{survey_url}}?s=neutral) · [😞]({{survey_url}}?s=sad)\n\nQuesto resta tra noi — niente Google, niente recensione pubblica. Mi serve solo per migliorare.\n\nGrazie,\n{{salon_name}}',
   'markdown'),

  -- ── Customer · package purchased ────────────────────────────────────
  ('tmpl_email_subject_package_purchased',
   'Email · oggetto · pacchetto acquistato',
   'Pacchetto {{package_name}} attivato — {{credits_total}} crediti',
   'text'),
  ('tmpl_email_body_package_purchased',
   'Email · corpo · pacchetto acquistato',
   E'Ciao {{customer_first_name}},\n\nIl tuo pacchetto **{{package_name}}** è attivo:\n\n- Crediti: {{credits_total}}\n- Valido fino al: {{expires_at}}\n- Acquistato il: {{purchased_at}}\n\nQuando prenoti userai automaticamente un credito.\n\nGrazie per la fiducia,\n{{salon_name}}',
   'markdown'),

  -- ── Owner · new booking ─────────────────────────────────────────────
  ('tmpl_telegram_owner_new_booking',
   'Telegram · nuova prenotazione (titolare)',
   E'🟢 *Nuova prenotazione*\n\n👤 {{customer_name}}\n💈 {{appointment_service}}\n👨‍💼 {{appointment_staff}}\n🗓 {{appointment_date}} ore {{appointment_time}}\n\n📞 {{customer_phone}}',
   'markdown'),

  -- ── Owner · cancellation ────────────────────────────────────────────
  ('tmpl_telegram_owner_cancellation',
   'Telegram · cancellazione (titolare)',
   E'🔴 *Cancellazione*\n\n👤 {{customer_name}}\n🗓 {{appointment_date}} ore {{appointment_time}}\n💈 {{appointment_service}}\n\n⏱ {{hours_before_human}} di preavviso\n📝 {{cancellation_reason}}',
   'markdown'),

  -- ── Owner · no-show ─────────────────────────────────────────────────
  ('tmpl_telegram_owner_no_show',
   'Telegram · no-show (titolare)',
   E'⚠️ *No-show*\n\n👤 {{customer_name}} (no-show n. {{noshow_count}})\n🗓 {{appointment_date}} ore {{appointment_time}}\n💈 {{appointment_service}}\n\nVuoi chiedere spiegazioni? Vai su /admin/clienti/no-show',
   'markdown'),

  -- ── Owner · negative review intercepted ─────────────────────────────
  ('tmpl_telegram_owner_negative_review',
   'Telegram · recensione negativa intercettata (titolare)',
   E'😞 *Cliente insoddisfatto*\n\n👤 {{customer_name}}\n💈 {{appointment_service}} del {{appointment_date}}\n\n📝 "{{customer_feedback}}"\n\nGestisci → /admin/marketing',
   'markdown'),

  -- ── Owner · daily digest 18:00 ──────────────────────────────────────
  ('tmpl_telegram_owner_daily_digest',
   'Telegram · digest giornaliero 18:00 (titolare)',
   E'📊 *Riepilogo {{today_date}}*\n\n✂️ Appuntamenti: {{today_appointments_count}}\n💰 Incasso: € {{today_revenue}}\n👥 Nuovi clienti: {{today_new_customers}}\n❌ No-show: {{today_noshows}}\n\n*Domani*\n📅 {{tomorrow_appointments_count}} appuntamenti — primo alle {{tomorrow_first_slot}}',
   'markdown'),

  -- ── Owner · bookings drop alert ─────────────────────────────────────
  ('tmpl_telegram_owner_bookings_drop_alert',
   'Telegram · alert calo prenotazioni (titolare)',
   E'📉 *Attenzione: calo prenotazioni*\n\nQuesta settimana: {{this_week_count}} appuntamenti\nMedia ultime 8 settimane: {{avg_count}}\nDifferenza: −{{drop_pct}}%\n\n*Azioni suggerite:*\n• Promo last-minute → /admin/marketing\n• Campagna riattivazione → /admin/marketing',
   'markdown'),

  -- ── Owner · stock low ───────────────────────────────────────────────
  ('tmpl_telegram_owner_stock_low',
   'Telegram · scorte basse (titolare)',
   E'📦 *Scorte basse*\n\n{{product_name}} → {{current_stock}} pezzi\nSoglia: {{threshold}}\n\nVelocità ultime 30gg: {{sell_through_30d}}/settimana\n\nRiordina ora → /admin/prodotti/{{product_slug}}',
   'markdown')
ON CONFLICT (key) DO NOTHING;
