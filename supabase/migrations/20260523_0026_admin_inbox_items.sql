-- Hair Rich · Admin Inbox (centralized notification feed)
--
-- Single inbox at the top of /admin that aggregates every operationally
-- relevant event: new bookings, cancellations, no-shows, reviews, stock
-- alerts, booking-drop warnings, package expiries, etc. The Notification
-- Router writes a row here for any owner-facing event (in addition to the
-- Telegram/email send). Realtime via Supabase publication.

CREATE TABLE IF NOT EXISTS admin_inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type text NOT NULL,                   -- matches notifications_sent.event_type
  category text NOT NULL,                     -- 'appointments','marketing','catalog','staff','system','customers'
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  title text NOT NULL,
  body text,
  icon text,                                  -- emoji or icon-name hint for the UI
  action_url text,                            -- deep-link the admin should follow when they click

  related_type text,                          -- 'appointment','review','customer',...
  related_id uuid,

  payload jsonb NOT NULL DEFAULT '{}'::jsonb, -- extra context: button labels, suggested actions, AI drafts

  source_skill text,                          -- skills_config.skill_key that produced the item

  read_at timestamptz,
  read_by uuid,                               -- admin user_id who marked it read
  archived_at timestamptz,
  archived_by uuid,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unread counter for sidebar badge — hottest query.
CREATE INDEX IF NOT EXISTS admin_inbox_unread_idx
  ON admin_inbox_items (created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_inbox_feed_idx
  ON admin_inbox_items (created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_inbox_category_idx
  ON admin_inbox_items (category, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_inbox_related_idx
  ON admin_inbox_items (related_type, related_id) WHERE related_id IS NOT NULL;

ALTER TABLE admin_inbox_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin all inbox" ON admin_inbox_items;
CREATE POLICY "admin all inbox" ON admin_inbox_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Convenience RPC used by the sidebar badge: returns the unread count fast.
CREATE OR REPLACE FUNCTION fn_admin_inbox_unread_count() RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int
    FROM admin_inbox_items
   WHERE read_at IS NULL AND archived_at IS NULL;
$$;
REVOKE EXECUTE ON FUNCTION fn_admin_inbox_unread_count() FROM public;
GRANT EXECUTE ON FUNCTION fn_admin_inbox_unread_count() TO authenticated;

-- Mark-as-read helper that stamps read_at + read_by atomically.
CREATE OR REPLACE FUNCTION fn_admin_inbox_mark_read(p_ids uuid[]) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  UPDATE admin_inbox_items
     SET read_at = COALESCE(read_at, now()),
         read_by = COALESCE(read_by, auth.uid())
   WHERE id = ANY(p_ids) AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;
REVOKE EXECUTE ON FUNCTION fn_admin_inbox_mark_read(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION fn_admin_inbox_mark_read(uuid[]) TO authenticated;

-- Enable Supabase Realtime for this table so the admin UI can subscribe
-- via supabase.channel().on('postgres_changes',...) without polling.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE admin_inbox_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;

COMMENT ON TABLE admin_inbox_items IS
  'Centralized owner-facing feed. Notification Router writes here for any actionable event.';
