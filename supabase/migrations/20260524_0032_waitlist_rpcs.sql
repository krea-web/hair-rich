-- Hair Rich · Waitlist matching + confirmation RPCs
--
-- Companion to 0030. The matcher runs in two places:
--   1. fn_cancel_appointment_by_customer triggers it implicitly via the
--      cron (we don't call it inline to keep cancel snappy and atomic).
--   2. supabase/functions/waitlist-matcher cron polls every 15 min for
--      newly cancelled appointments with no waitlist match yet, invokes
--      fn_match_waitlist_entry, then routes the notification via the
--      Notification Router.
--
-- All matching logic lives here. The Edge Function is dumb: it picks up
-- candidates, calls fn_match_waitlist_entry, sends the notification, and
-- updates last_matcher_run_at. We never make business-logic decisions in
-- TypeScript when SQL can keep them transactional.

-- Adaptive token validity. Returns NULL if the slot is closer than the
-- configured soft_reserve_min_hours (no useful lead time = no notify).
CREATE OR REPLACE FUNCTION fn_waitlist_token_validity(
  p_slot_start timestamptz
) RETURNS interval LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_hours numeric;
  v_min_hours numeric;
BEGIN
  SELECT COALESCE(waitlist_soft_reserve_min_hours, 3) INTO v_min_hours
    FROM salon_settings LIMIT 1;

  v_hours := EXTRACT(EPOCH FROM (p_slot_start - now())) / 3600.0;

  IF v_hours < v_min_hours THEN
    RETURN NULL;
  ELSIF v_hours >= 24 * 7 THEN
    RETURN interval '24 hours';
  ELSIF v_hours >= 24 THEN
    RETURN interval '6 hours';
  ELSIF v_hours >= 6 THEN
    RETURN interval '2 hours';
  ELSE
    RETURN interval '45 minutes';
  END IF;
END $$;

-- Picks the best waitlist entry for a freshly cancelled slot and creates
-- a soft-reserved appointment + notification token. Returns the matched
-- waitlist row (or NULL if no match was found or feature is off).
--
-- "Best" = waiting status, service matches, slot falls in the requested
-- window, staff preference honoured if set, oldest waiting first. Soft
-- ties broken by position then created_at.
CREATE OR REPLACE FUNCTION fn_match_waitlist_entry(
  p_cancelled_appointment_id uuid
) RETURNS waitlist
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appt appointments;
  v_match waitlist;
  v_token interval;
  v_token_str text;
  v_soft_appt_id uuid;
  v_enabled boolean;
  v_duration int;
BEGIN
  SELECT COALESCE(waitlist_enabled, false) INTO v_enabled
    FROM salon_settings LIMIT 1;
  IF NOT v_enabled THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_appt FROM appointments
   WHERE id = p_cancelled_appointment_id
     AND status = 'cancelled';
  IF v_appt.id IS NULL THEN
    RETURN NULL;
  END IF;

  v_token := fn_waitlist_token_validity(v_appt.start_at);
  IF v_token IS NULL THEN
    -- Not enough lead time: do not disturb the queue, just exit.
    RETURN NULL;
  END IF;

  -- Pick the best candidate. We snapshot under SHARE lock to prevent two
  -- concurrent matcher runs from notifying the same person twice.
  SELECT w.* INTO v_match
    FROM waitlist w
    JOIN appointment_services aps ON aps.appointment_id = v_appt.id
   WHERE w.status = 'waiting'
     AND w.service_id = aps.service_id
     AND v_appt.start_at::date BETWEEN w.date_from AND w.date_to
     AND (w.preferred_time_start IS NULL OR (v_appt.start_at AT TIME ZONE 'Europe/Rome')::time >= w.preferred_time_start)
     AND (w.preferred_time_end IS NULL OR (v_appt.start_at AT TIME ZONE 'Europe/Rome')::time <= w.preferred_time_end)
     AND (w.staff_id IS NULL OR w.staff_id = v_appt.staff_id)
   ORDER BY w.position ASC, w.created_at ASC
   LIMIT 1
   FOR UPDATE OF w SKIP LOCKED;

  IF v_match.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Compute duration from the cancelled appointment_services row so the
  -- soft-reserved hold matches the original slot exactly.
  SELECT COALESCE(SUM(duration_min), EXTRACT(EPOCH FROM (v_appt.end_at - v_appt.start_at)) / 60)::int
    INTO v_duration
    FROM appointment_services
   WHERE appointment_id = v_appt.id;

  -- Create the soft-reservation. The slot is held against the matched
  -- customer for the token validity window. We reuse the original
  -- staff_id so booking constraints stay consistent.
  v_token_str := encode(gen_random_bytes(18), 'hex');

  INSERT INTO appointments (
    customer_id, staff_id, chair_id,
    start_at, end_at,
    status, source, notes, total_cents,
    soft_reserve_expires_at, waitlist_entry_id
  ) VALUES (
    v_match.customer_id, v_appt.staff_id, v_appt.chair_id,
    v_appt.start_at, v_appt.end_at,
    'soft_reserved', 'app',
    'Soft reserve da waitlist · scade ' || to_char(now() + v_token, 'YYYY-MM-DD HH24:MI'),
    v_appt.total_cents,
    now() + v_token, v_match.id
  ) RETURNING id INTO v_soft_appt_id;

  -- Mirror the originating service rows
  INSERT INTO appointment_services (appointment_id, service_id, price_cents, duration_min)
  SELECT v_soft_appt_id, service_id, price_cents, duration_min
    FROM appointment_services WHERE appointment_id = v_appt.id;

  UPDATE waitlist
     SET status = 'notified',
         notify_token = v_token_str,
         notify_token_expires_at = now() + v_token,
         notified_appointment_id = v_soft_appt_id,
         notified_at = now()
   WHERE id = v_match.id
   RETURNING * INTO v_match;

  RETURN v_match;
END $$;

REVOKE EXECUTE ON FUNCTION fn_match_waitlist_entry(uuid) FROM public;
GRANT EXECUTE ON FUNCTION fn_match_waitlist_entry(uuid) TO service_role;

-- Customer confirms the slot held for them. Converts soft_reserved →
-- booked atomically. Token must match and not be expired.
CREATE OR REPLACE FUNCTION fn_confirm_waitlist_token(
  p_token text
) RETURNS appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry waitlist;
  v_appt appointments;
BEGIN
  SELECT * INTO v_entry FROM waitlist
   WHERE notify_token = p_token
     AND status = 'notified'
   FOR UPDATE;

  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Token non valido o scaduto' USING ERRCODE = 'P0002';
  END IF;

  IF v_entry.notify_token_expires_at IS NULL OR v_entry.notify_token_expires_at < now() THEN
    UPDATE waitlist SET status = 'expired',
                        missed_notifications = missed_notifications + 1
     WHERE id = v_entry.id;
    RAISE EXCEPTION 'Il tempo per confermare è scaduto' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_appt FROM appointments
   WHERE id = v_entry.notified_appointment_id
     AND status = 'soft_reserved'
   FOR UPDATE;

  IF v_appt.id IS NULL THEN
    RAISE EXCEPTION 'Slot non più disponibile' USING ERRCODE = 'P0002';
  END IF;

  UPDATE appointments
     SET status = 'booked',
         soft_reserve_expires_at = NULL,
         notes = COALESCE(NULLIF(notes, '') || E'\n', '') ||
                 'Confermato da waitlist · ' || to_char(now(), 'YYYY-MM-DD HH24:MI'),
         updated_at = now()
   WHERE id = v_appt.id
   RETURNING * INTO v_appt;

  UPDATE waitlist
     SET status = 'confirmed',
         confirmed_at = now(),
         notify_token = NULL
   WHERE id = v_entry.id;

  RETURN v_appt;
END $$;

REVOKE EXECUTE ON FUNCTION fn_confirm_waitlist_token(text) FROM public;
GRANT EXECUTE ON FUNCTION fn_confirm_waitlist_token(text) TO anon, authenticated, service_role;

-- Periodic cleanup: expire stale soft reservations + ghost the waitlist
-- entries whose tokens never converted. Called by the cron after each
-- matching run.
CREATE OR REPLACE FUNCTION fn_waitlist_expire_stale()
RETURNS TABLE (expired_count int, ghosted_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired int := 0;
  v_ghosted int := 0;
  v_max_ghosts int;
BEGIN
  SELECT COALESCE(waitlist_max_ghosts, 3) INTO v_max_ghosts
    FROM salon_settings LIMIT 1;

  -- Release soft holds whose token has elapsed (slot becomes free again)
  WITH freed AS (
    UPDATE appointments
       SET status = 'cancelled',
           cancelled_at = now(),
           cancelled_by = 'system',
           cancellation_reason = 'Soft reserve scaduto',
           soft_reserve_expires_at = NULL,
           updated_at = now()
     WHERE status = 'soft_reserved'
       AND soft_reserve_expires_at IS NOT NULL
       AND soft_reserve_expires_at < now()
     RETURNING id
  )
  SELECT count(*) INTO v_expired FROM freed;

  -- Bump missed counter on notified entries whose token expired
  UPDATE waitlist
     SET status = CASE
                    WHEN missed_notifications + 1 >= v_max_ghosts THEN 'ghosted'
                    ELSE 'waiting'
                  END,
         missed_notifications = missed_notifications + 1,
         notify_token = NULL,
         notify_token_expires_at = NULL,
         notified_appointment_id = NULL,
         notified_at = NULL
   WHERE status = 'notified'
     AND notify_token_expires_at IS NOT NULL
     AND notify_token_expires_at < now();

  GET DIAGNOSTICS v_ghosted = ROW_COUNT;

  RETURN QUERY SELECT v_expired, v_ghosted;
END $$;

REVOKE EXECUTE ON FUNCTION fn_waitlist_expire_stale() FROM public;
GRANT EXECUTE ON FUNCTION fn_waitlist_expire_stale() TO service_role;

-- Helper for the cron: list newly cancelled appointments that may still
-- need a match (cancellation < 24h ago, not already matched).
CREATE OR REPLACE FUNCTION fn_waitlist_pending_cancellations()
RETURNS TABLE (appointment_id uuid, cancelled_at timestamptz, hours_until_slot numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id,
         a.cancelled_at,
         ROUND(EXTRACT(EPOCH FROM (a.start_at - now())) / 3600.0, 2)
    FROM appointments a
   WHERE a.status = 'cancelled'
     AND a.cancelled_at IS NOT NULL
     AND a.cancelled_at > now() - interval '24 hours'
     AND a.start_at > now()
     AND NOT EXISTS (
       SELECT 1 FROM appointments soft
        WHERE soft.start_at = a.start_at
          AND soft.staff_id = a.staff_id
          AND soft.status = 'soft_reserved'
     )
     AND NOT EXISTS (
       SELECT 1 FROM waitlist w
        WHERE w.notified_appointment_id IS NOT NULL
          AND w.status IN ('notified','confirmed')
          AND EXISTS (
            SELECT 1 FROM appointments ap2
             WHERE ap2.id = w.notified_appointment_id
               AND ap2.start_at = a.start_at
               AND ap2.staff_id = a.staff_id
          )
     )
   ORDER BY a.cancelled_at ASC;
$$;

REVOKE EXECUTE ON FUNCTION fn_waitlist_pending_cancellations() FROM public;
GRANT EXECUTE ON FUNCTION fn_waitlist_pending_cancellations() TO service_role;
