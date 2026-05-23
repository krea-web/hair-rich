-- Hair Rich · Skills Hub config (single source of truth for feature flags)
--
-- Centralizes the ON/OFF state of every digital "skill" the salon can enable
-- from /admin/funzionalita. The metadata (icon, name, description, category,
-- effort hours, related skills) lives in code at src/lib/skills/registry.ts;
-- this table only tracks state + per-skill config overrides.
--
-- All skills are seeded as enabled=false. The owner activates them one at a
-- time from the Skills Hub UI.

CREATE TABLE IF NOT EXISTS skills_config (
  skill_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  enabled_at timestamptz,
  disabled_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_used_at timestamptz,
  usage_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skills_config_enabled_idx ON skills_config (enabled) WHERE enabled;

ALTER TABLE skills_config ENABLE ROW LEVEL SECURITY;

-- Public can read flag state (booking drawer needs to know if coupons/referrals are ON)
DROP POLICY IF EXISTS "public read skills_config" ON skills_config;
CREATE POLICY "public read skills_config" ON skills_config
  FOR SELECT USING (true);

-- Only admin can flip toggles or change config
DROP POLICY IF EXISTS "admin write skills_config" ON skills_config;
CREATE POLICY "admin write skills_config" ON skills_config
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS trg_skills_config_updated ON skills_config;
CREATE TRIGGER trg_skills_config_updated
  BEFORE UPDATE ON skills_config
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-stamp enabled_at / disabled_at when the enabled flag flips
CREATE OR REPLACE FUNCTION skills_config_stamp_toggle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.enabled) THEN
    NEW.enabled_at := now();
  ELSIF (TG_OP = 'UPDATE' AND NEW.enabled IS DISTINCT FROM OLD.enabled) THEN
    IF NEW.enabled THEN
      NEW.enabled_at := now();
      NEW.disabled_at := NULL;
    ELSE
      NEW.disabled_at := now();
    END IF;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_skills_config_toggle ON skills_config;
CREATE TRIGGER trg_skills_config_toggle
  BEFORE INSERT OR UPDATE OF enabled ON skills_config
  FOR EACH ROW EXECUTE FUNCTION skills_config_stamp_toggle();

-- Seed: all 101 skill_keys disabled by default.
-- ON CONFLICT DO NOTHING so re-running the migration is safe and the owner's
-- existing toggle state is preserved.
INSERT INTO skills_config (skill_key) VALUES
  -- Comunicazione & Reminder (1-10)
  ('whatsapp_reminders'),
  ('sms_notifications'),
  ('renewal_reminders'),
  ('birthday_campaign'),
  ('reactivation_campaigns'),
  ('last_minute_promo'),
  ('newsletter'),
  ('seasonal_campaigns'),
  ('web_push'),
  ('whatsapp_business_api'),
  -- Prenotazione & Booking (11-20)
  ('waitlist'),
  ('qr_checkin'),
  ('deposit_prepayment'),
  ('instagram_booking'),
  ('auto_quote'),
  ('booking_chatbot'),
  ('telegram_booking_bot'),
  ('whatsapp_quote_agent'),
  ('google_reserve'),
  ('booking_abandonment_analytics'),
  -- AI & Intelligenza (21-30)
  ('ai_receptionist'),
  ('hair_consult_ai'),
  ('ai_weekly_suggestions'),
  ('review_sentiment_analysis'),
  ('ai_content_generator'),
  ('voice_responder_ai'),
  ('ai_content_calendar'),
  ('demand_forecast'),
  ('ai_price_optimizer'),
  ('instagram_dm_chatbot'),
  -- Analytics & Report (31-40)
  ('ai_monthly_report'),
  ('staff_performance_report'),
  ('staff_leaderboard'),
  ('customer_heatmap'),
  ('tax_quarterly_report'),
  ('bookings_drop_alert'),
  ('peak_hours_analysis'),
  ('utm_tracking'),
  ('google_analytics'),
  ('revenue_forecast'),
  -- Gestione Clienti (41-50)
  ('customer_technical_sheet'),
  ('loyalty'),
  ('service_packages'),
  ('gift_cards'),
  ('coupons'),
  ('noshow_outreach'),
  ('gdpr_consents'),
  ('customer_photos_archive'),
  ('allergens_management'),
  ('customer_segments'),
  -- Gestione Team (51-60)
  ('staff_shifts'),
  ('staff_gcal_sync'),
  ('agenda_pdf_print'),
  ('staff_earnings_simulator'),
  ('staff_permissions'),
  ('staff_mobile_dashboard'),
  ('staff_auto_onboarding'),
  ('activity_log'),
  ('vacation_calendar'),
  ('team_internal_chat'),
  -- Marketing & Social (61-70)
  ('social_scheduler'),
  ('reviews_harvester'),
  ('video_testimonials'),
  ('before_after_gallery'),
  ('referrals'),
  ('meta_ads_integration'),
  ('social_comment_bot'),
  ('dynamic_link_in_bio'),
  ('tiktok_integration'),
  ('telegram_owner_alerts'),
  -- Vendite & Revenue (71-80)
  ('smart_upsell'),
  ('post_visit_survey'),
  ('credit_recovery_bot'),
  ('seasonal_pricing'),
  ('stock_alerts'),
  ('suppliers_directory'),
  ('equipment_maintenance'),
  ('post_purchase_followup'),
  ('dynamic_pricing_widget'),
  ('customer_onboarding'),
  -- Integrazioni (81-90)
  ('fatture_in_cloud'),
  ('data_backup_export'),
  ('google_hours_sync'),
  ('seo_position_tracker'),
  ('apple_maps_integration'),
  ('pos_payments'),
  ('uptime_monitoring'),
  ('qr_promotions'),
  ('salon_tv_dashboard'),
  ('shipping_courier'),
  -- Gestione Avanzata (91-101)
  ('multilingual_assistant'),
  ('multi_location'),
  ('multi_location_price_sync'),
  ('staff_contracts'),
  ('proforma_invoice'),
  ('customer_access_report'),
  ('admin_inbox'),
  ('structured_feedback'),
  ('appointments_audit_trail'),
  ('customer_pwa'),
  ('advanced_customer_search')
ON CONFLICT (skill_key) DO NOTHING;

-- A handful of skills are infrastructure-level and always ON (per CLAUDE.md
-- "Default: SEMPRE ON" notes for #47 GDPR and #97 Admin Inbox).
UPDATE skills_config
   SET enabled = true
 WHERE skill_key IN ('gdpr_consents', 'admin_inbox')
   AND NOT enabled;
