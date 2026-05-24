-- Hair Rich · Package expiry reminder templates
--
-- Email + Telegram bodies used by the package-expiry-reminders cron via
-- the Notification Router. Mustache vars: customer_first_name,
-- package_name, credits_remaining, credits_total, days_left,
-- milestone_label, expires_at.

INSERT INTO cms_blocks (key, label, value, kind) VALUES
  ('tmpl_email_subject_package_expiry_reminder',
   'Email · oggetto · scadenza pacchetto',
   'Il tuo pacchetto scade {{milestone_label}} — {{credits_remaining}} crediti',
   'text'),
  ('tmpl_email_body_package_expiry_reminder',
   'Email · corpo · scadenza pacchetto',
   E'Ciao {{customer_first_name}},\n\nIl tuo pacchetto **{{package_name}}** scade {{milestone_label}} ({{expires_at}}) e hai ancora **{{credits_remaining}} crediti** su {{credits_total}}.\n\nPrenota quando ti è comodo — userai il credito automaticamente:\n[Prenota →]({{booking_url}})\n\n{{salon_name}}',
   'markdown'),
  ('tmpl_telegram_package_expiry_reminder',
   'Telegram · scadenza pacchetto (cliente)',
   E'📦 *Pacchetto in scadenza*\n\nHai {{credits_remaining}}/{{credits_total}} crediti su {{package_name}} che scadono {{milestone_label}} ({{expires_at}}).\n\nPrenota → {{booking_url}}',
   'markdown')
ON CONFLICT (key) DO NOTHING;
