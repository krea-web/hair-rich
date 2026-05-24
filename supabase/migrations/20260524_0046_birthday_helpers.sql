-- Hair Rich · Chat 3 · Birthday helpers
--
-- Lightweight RPCs + cms_blocks templates for the birthday cron (Task 11)
-- and reactivation cron (Task 12). All gated by skills_config inside the
-- Edge Functions themselves.

CREATE OR REPLACE FUNCTION fn_customers_birthday_today()
RETURNS TABLE (id uuid, first_name text, birthdate date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.first_name, c.birthdate
    FROM customers c
   WHERE c.birthdate IS NOT NULL
     AND extract(month from c.birthdate) = extract(month from CURRENT_DATE)
     AND extract(day from c.birthdate)   = extract(day from CURRENT_DATE)
     AND c.is_guest = false
     AND COALESCE(c.marketing_consent, false) = true;
$$;

GRANT EXECUTE ON FUNCTION fn_customers_birthday_today() TO service_role;

-- ────────── Seed cms_blocks templates ──────────────────────────────────
INSERT INTO cms_blocks (block_key, content_md, content_json)
VALUES
  ('msg_template_birthday_greeting_email',
   E'## 🎂 Auguri {{first_name}}!\n\nTutto lo staff di Hair Rich Olbia ti augura un buon compleanno.\n\nCome regalo abbiamo riservato per te uno **sconto del {{discount_percent}}%** sul prossimo taglio.\n\nUsa il codice `{{coupon_code}}` entro {{validity_days}} giorni.',
   '{"event":"birthday_greeting","channel":"email","subject":"Buon compleanno {{first_name}}! Hair Rich"}'::jsonb),
  ('msg_template_birthday_greeting_telegram',
   E'🎂 Auguri {{first_name}}!\n\nHair Rich Olbia ti regala -{{discount_percent}}% sul prossimo taglio.\nCodice: {{coupon_code}} (valido {{validity_days}} giorni)',
   '{"event":"birthday_greeting","channel":"telegram"}'::jsonb),
  ('msg_template_reactivation_email',
   E'## Ci manchi, {{first_name}}\n\nSono {{days_since_last_visit}} giorni che non ti vediamo a Hair Rich Olbia.\n\nSe ti va di tornare, abbiamo riservato per te uno sconto del **{{discount_percent}}%** sul prossimo taglio.\n\nCodice: `{{coupon_code}}` · valido fino al {{valid_until}}.',
   '{"event":"reactivation","channel":"email","subject":"{{first_name}}, ci manchi"}'::jsonb),
  ('msg_template_reactivation_telegram',
   E'👋 {{first_name}}, ci manchi.\nSono {{days_since_last_visit}}gg che non vieni. -{{discount_percent}}% se prenoti entro {{valid_until}}.\nCodice: {{coupon_code}}',
   '{"event":"reactivation","channel":"telegram"}'::jsonb),
  ('msg_template_last_minute_promo_email',
   E'## Posti liberi oggi/domani 🎯\n\nCiao {{first_name}}, ho appena visto che ho qualche posto libero {{when_label}}.\n\nSe vuoi passare, ti faccio uno sconto del {{discount_percent}}%.\n\nCodice: `{{coupon_code}}` · valido solo {{when_label}}.',
   '{"event":"last_minute_promo","channel":"email","subject":"Ultimo minuto: -{{discount_percent}}% {{when_label}}"}'::jsonb),
  ('msg_template_last_minute_promo_telegram',
   E'🎯 {{first_name}}, posti liberi {{when_label}}!\n-{{discount_percent}}% con codice {{coupon_code}}',
   '{"event":"last_minute_promo","channel":"telegram"}'::jsonb)
ON CONFLICT (block_key) DO NOTHING;
