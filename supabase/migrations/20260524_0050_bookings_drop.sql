-- Hair Rich · Chat 3 · Bookings drop snapshot RPC (Task 20)
--
-- Computes current ISO week appointments count vs 8-week trailing average.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS bookings_drop_threshold_pct int NOT NULL DEFAULT 20;

COMMENT ON COLUMN salon_settings.bookings_drop_threshold_pct IS
  'If current week bookings are below avg_8w * (1 - threshold/100), the cron fires owner alert.';

CREATE OR REPLACE FUNCTION fn_bookings_drop_snapshot()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current int;
  v_avg numeric;
  v_delta numeric;
BEGIN
  SELECT count(*) INTO v_current
    FROM appointments
   WHERE start_at >= date_trunc('week', now())
     AND start_at <  date_trunc('week', now()) + interval '7 days'
     AND status NOT IN ('cancelled');

  SELECT COALESCE(avg(week_count), 0) INTO v_avg
    FROM (
      SELECT count(*) AS week_count
        FROM appointments
       WHERE start_at >= date_trunc('week', now()) - interval '8 weeks'
         AND start_at <  date_trunc('week', now())
         AND status NOT IN ('cancelled')
       GROUP BY date_trunc('week', start_at)
    ) t;

  v_delta := CASE WHEN v_avg > 0 THEN ((v_current::numeric - v_avg) / v_avg) * 100 ELSE 0 END;

  RETURN jsonb_build_object(
    'current_week_count', v_current,
    'avg_8w_count', v_avg,
    'delta_pct', v_delta
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_bookings_drop_snapshot() TO service_role, authenticated;
