-- Hair Rich · Chat 3 · AI reports + content drafts (#23 #25 #31)
--
-- Persistent storage for everything LLM-generated. Three sub-products share
-- this surface:
--   • AI Weekly Suggestions (#23)  — Monday 09:00 cron, GPT-4o-mini drafts 3-5 actions
--   • AI Monthly Report     (#31)  — 1st of month 09:00 cron, full KPI commentary
--   • AI Content Generator  (#25)  — admin uploads work photo → 3 captions + hashtags
--
-- All rows include model name + token usage so the owner can see cost
-- attribution per skill.

-- ────────── AI reports (weekly suggestions + monthly report) ────────────
CREATE TABLE IF NOT EXISTS ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL
    CHECK (kind IN ('weekly_suggestions','monthly_report','adhoc')),
  period_start date NOT NULL,
  period_end date NOT NULL,

  model text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  cost_usd_micros int,

  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_md text NOT NULL,
  summary_short text,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','failed','dismissed')),
  delivered_via text[] NOT NULL DEFAULT '{}'::text[],
  delivered_to text[] NOT NULL DEFAULT '{}'::text[],
  sent_at timestamptz,
  error_message text,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS ai_reports_kind_idx
  ON ai_reports (kind, period_start DESC);

ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all ai_reports" ON ai_reports;
CREATE POLICY "admin all ai_reports" ON ai_reports
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ────────── AI content drafts (caption generator) ───────────────────────
CREATE TABLE IF NOT EXISTS ai_content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  source_image_url text NOT NULL,
  source_image_storage_path text,
  source_kind text NOT NULL DEFAULT 'instagram_caption'
    CHECK (source_kind IN ('instagram_caption','facebook_post','tiktok_caption',
                           'whatsapp_status','google_post','generic')),

  tone text DEFAULT 'casual',
  language text NOT NULL DEFAULT 'it',

  model text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  cost_usd_micros int,

  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  best_time_to_post text,
  notes_for_owner text,

  selected_variant_idx int,
  posted_at timestamptz,
  posted_url text,

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_content_drafts_created_idx
  ON ai_content_drafts (created_at DESC);

ALTER TABLE ai_content_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin all ai_content_drafts" ON ai_content_drafts;
CREATE POLICY "admin all ai_content_drafts" ON ai_content_drafts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ────────── Cost summary view for the owner ─────────────────────────────
CREATE OR REPLACE VIEW v_ai_costs_monthly AS
SELECT
  date_trunc('month', created_at)::date AS month,
  'ai_reports' AS source,
  kind AS subkind,
  count(*) AS items,
  sum(prompt_tokens) AS prompt_tokens,
  sum(completion_tokens) AS completion_tokens,
  sum(cost_usd_micros) / 1000000.0 AS cost_usd
FROM ai_reports
GROUP BY 1, 3
UNION ALL
SELECT
  date_trunc('month', created_at)::date AS month,
  'ai_content_drafts' AS source,
  source_kind AS subkind,
  count(*) AS items,
  sum(prompt_tokens) AS prompt_tokens,
  sum(completion_tokens) AS completion_tokens,
  sum(cost_usd_micros) / 1000000.0 AS cost_usd
FROM ai_content_drafts
GROUP BY 1, 3;
