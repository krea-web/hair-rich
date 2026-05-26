-- Hair Rich · Skills tier mapping (productization)
--
-- Lega ogni skill al tier minimo richiesto e aggiunge il tier corrente al
-- singolo salone. Il gestionale UI mostrerà skill bloccate con CTA
-- "Upgrade a Pro/Full" quando il salone è su un tier inferiore.
--
-- Hair Rich è instance #1 = tier 'full' (tutto sbloccato).
-- Per gli altri saloni il tier viene impostato in fase di onboarding.

-- ────────────────── 1. salon_settings.current_tier ──────────────────
ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS current_tier text NOT NULL DEFAULT 'full'
    CHECK (current_tier IN ('vetrina', 'pro', 'full'));

COMMENT ON COLUMN salon_settings.current_tier IS
  'Pacchetto sottoscritto dal salone. Determina quali skill sono utilizzabili.';

-- ────────────────── 2. skills_config.min_tier ──────────────────
ALTER TABLE skills_config
  ADD COLUMN IF NOT EXISTS min_tier text NOT NULL DEFAULT 'vetrina'
    CHECK (min_tier IN ('vetrina', 'pro', 'full'));

COMMENT ON COLUMN skills_config.min_tier IS
  'Tier minimo necessario per usare questa skill. vetrina < pro < full.';

-- ────────────────── 3. Assign min_tier to every skill ──────────────────
-- Vetrina (base): skill essenziali per la presenza online + gestione minima
UPDATE skills_config SET min_tier = 'vetrina' WHERE skill_key IN (
  'gdpr_consents',
  'admin_inbox',
  'coupons',
  'agenda_pdf_print',
  'vacation_calendar',
  'staff_shifts',
  'before_after_gallery',
  'dynamic_link_in_bio',
  'dynamic_pricing_widget',
  'customer_pwa',
  'multilingual_assistant',
  'data_backup_export',
  'customer_photos_archive',
  'peak_hours_analysis',
  'instagram_booking',
  'tax_quarterly_report'
);

-- Pro: + automazioni marketing + canali multipli + booking avanzato
UPDATE skills_config SET min_tier = 'pro' WHERE skill_key IN (
  'whatsapp_reminders',
  'whatsapp_business_api',
  'sms_notifications',
  'web_push',
  'renewal_reminders',
  'birthday_campaign',
  'reactivation_campaigns',
  'last_minute_promo',
  'newsletter',
  'seasonal_campaigns',
  'waitlist',
  'deposit_prepayment',
  'google_reserve',
  'booking_abandonment_analytics',
  'loyalty',
  'service_packages',
  'gift_cards',
  'noshow_outreach',
  'customer_segments',
  'customer_onboarding',
  'smart_upsell',
  'post_visit_survey',
  'reviews_harvester',
  'video_testimonials',
  'referrals',
  'telegram_owner_alerts',
  'stock_alerts',
  'suppliers_directory',
  'google_hours_sync',
  'qr_promotions',
  'staff_performance_report',
  'staff_leaderboard',
  'customer_heatmap',
  'bookings_drop_alert',
  'utm_tracking',
  'google_analytics',
  'revenue_forecast',
  'staff_gcal_sync',
  'staff_earnings_simulator',
  'advanced_customer_search',
  'structured_feedback'
);

-- Full: AI avanzato + integrations enterprise + HR + hardware
UPDATE skills_config SET min_tier = 'full' WHERE skill_key IN (
  'ai_receptionist',
  'hair_consult_ai',
  'ai_weekly_suggestions',
  'review_sentiment_analysis',
  'ai_content_generator',
  'voice_responder_ai',
  'ai_content_calendar',
  'demand_forecast',
  'ai_price_optimizer',
  'ai_monthly_report',
  'booking_chatbot',
  'instagram_dm_chatbot',
  'meta_ads_integration',
  'fatture_in_cloud',
  'pos_payments',
  'tiktok_integration',
  'proforma_invoice',
  'staff_permissions',
  'staff_mobile_dashboard',
  'staff_auto_onboarding',
  'activity_log',
  'customer_access_report',
  'team_internal_chat',
  'auto_quote',
  'telegram_booking_bot',
  'whatsapp_quote_agent',
  'customer_technical_sheet',
  'allergens_management',
  'social_scheduler',
  'social_comment_bot',
  'credit_recovery_bot',
  'seasonal_pricing',
  'equipment_maintenance',
  'post_purchase_followup',
  'seo_position_tracker',
  'apple_maps_integration',
  'uptime_monitoring',
  'salon_tv_dashboard',
  'shipping_courier',
  'multi_location',
  'multi_location_price_sync',
  'staff_contracts',
  'appointments_audit_trail'
);

-- ────────────────── 4. Helper: tier comparison ──────────────────
CREATE OR REPLACE FUNCTION fn_tier_rank(p_tier text) RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_tier
    WHEN 'vetrina' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'full' THEN 3
    ELSE 0
  END;
$$;

-- View: skill_key + can_use boolean for the current salon's tier
CREATE OR REPLACE VIEW skills_with_access AS
SELECT
  sc.skill_key,
  sc.enabled,
  sc.min_tier,
  ss.current_tier AS salon_tier,
  fn_tier_rank(ss.current_tier) >= fn_tier_rank(sc.min_tier) AS can_use,
  sc.enabled_at,
  sc.disabled_at,
  sc.config,
  sc.last_used_at,
  sc.usage_count,
  sc.updated_at
FROM skills_config sc
CROSS JOIN salon_settings ss
WHERE ss.is_singleton;

GRANT SELECT ON skills_with_access TO anon, authenticated;

COMMENT ON VIEW skills_with_access IS
  'Vista skill + flag can_use calcolato in base al tier corrente del salone. Usata dal frontend per mostrare skill bloccate.';
