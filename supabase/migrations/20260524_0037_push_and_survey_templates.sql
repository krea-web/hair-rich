-- Hair Rich · Push channel templates + small variants for events that
-- the Router now dispatches over web-push. Email + Telegram templates
-- for the same events are seeded in 0027.
--
-- The Router falls back to the email subject/body when push-specific
-- templates are missing, but defining shorter push titles keeps the
-- notification card readable.

INSERT INTO cms_blocks (key, label, value, kind) VALUES
  ('tmpl_push_title_appointment_reminder',
   'Push · titolo · promemoria 24h',
   'Domani alle {{appointment_time}}',
   'text'),
  ('tmpl_push_body_appointment_reminder',
   'Push · body · promemoria 24h',
   E'{{appointment_service}} con {{appointment_staff}}. Tap per gestire la prenotazione.',
   'markdown'),

  ('tmpl_push_title_waitlist_match',
   'Push · titolo · waitlist match',
   '🎯 Slot libero per te',
   'text'),
  ('tmpl_push_body_waitlist_match',
   'Push · body · waitlist match',
   E'{{appointment_date}} alle {{appointment_time}}. Conferma entro {{token_validity_human}}.',
   'markdown'),

  ('tmpl_push_title_package_expiry_reminder',
   'Push · titolo · scadenza pacchetto',
   'Pacchetto in scadenza',
   'text'),
  ('tmpl_push_body_package_expiry_reminder',
   'Push · body · scadenza pacchetto',
   E'Hai {{credits_remaining}}/{{credits_total}} crediti su {{package_name}}. Scade {{milestone_label}}.',
   'markdown')
ON CONFLICT (key) DO NOTHING;
