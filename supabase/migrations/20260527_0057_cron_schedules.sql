-- Hair Rich · Pianificazione cron Edge Functions
--
-- Usa pg_cron per schedulare invocazioni HTTP verso le Edge Functions
-- via pg_net. Ogni job invoca la URL pubblica della relativa function
-- con header Authorization Bearer = anon key del progetto.
--
-- I cron sono creati come no-op idempotenti: cron.schedule restituisce
-- l'id esistente se il nome è già usato. Per cancellare un job manualmente:
--   SELECT cron.unschedule('<job_name>');

-- Service-internal helper: invoca una Edge Function per nome
-- Anon key hardcoded — è la chiave PUBBLICA (anon) e non costituisce
-- un secret. Per saloni futuri, il onboard_salon.py la sostituisce.
CREATE OR REPLACE FUNCTION fn_invoke_edge_function(p_name text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text;
  v_anon text := 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjlSeVZGUWF4VVN1Mm5NK3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Z6bnpmbWdmc2lqaHpqcWN3bXl0LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhbm9uIiwiYXVkIjoiYW5vbiIsImV4cCI6MjA3OTUyOTYwOSwiaWF0IjoxNzYzOTUzNjA5LCJlbWFpbCI6IiIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYW5vbiIsInByb3ZpZGVycyI6W119LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImFub24iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc2Mzk1MzYwOX1dLCJzZXNzaW9uX2lkIjoiIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ZRdsT0XVeOXJk39MnXmFTr3HlnHljd-1FvefcQRJWXc';
  v_request_id bigint;
BEGIN
  v_url := 'https://fznzfmgfsijhzjqcwmyt.supabase.co/functions/v1/' || p_name;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_anon,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) INTO v_request_id;

  RETURN v_request_id;
END$$;

-- ────────────────── Cron schedules ──────────────────
-- Ogni schedule è idempotente: se già esiste con lo stesso nome, viene
-- semplicemente aggiornato. Cancella eventuali job duplicati prima.

DO $$
DECLARE
  schedules text[][] := ARRAY[
    -- name                          | cron expr        | edge function
    ['birthday-sender-daily',          '0 9 * * *',      'birthday-sender'],
    ['reactivation-sender-weekly',     '0 9 * * 1',      'reactivation-sender'],
    ['reviews-harvester-30min',        '*/30 * * * *',   'reviews-harvester'],
    ['segments-classifier-daily',      '0 2 * * *',      'segments-classifier'],
    ['bookings-drop-alert-weekly',     '0 9 * * 1',      'bookings-drop-alert'],
    ['ai-weekly-suggestions-monday',   '0 9 * * 1',      'ai-weekly-suggestions'],
    ['ai-monthly-report-1st',          '0 9 1 * *',      'ai-monthly-report'],
    ['stock-low-alert-daily',          '0 8 * * *',      'stock-low-alert'],
    ['waitlist-matcher-15min',         '*/15 * * * *',   'waitlist-matcher'],
    ['package-expiry-reminders-daily', '0 10 * * *',     'package-expiry-reminders'],
    ['post-visit-survey-sender-30min', '*/30 * * * *',   'post-visit-survey-sender'],
    ['gcal-sync-10min',                '*/10 * * * *',   'gcal-sync']
  ];
  i int;
  job_id bigint;
BEGIN
  FOR i IN 1 .. array_length(schedules, 1) LOOP
    -- Unschedule existing job with same name (no-op if missing)
    BEGIN
      PERFORM cron.unschedule(schedules[i][1]);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    job_id := cron.schedule(
      schedules[i][1],
      schedules[i][2],
      format('SELECT fn_invoke_edge_function(%L)', schedules[i][3])
    );
    RAISE NOTICE 'Scheduled % (%) → job_id %', schedules[i][1], schedules[i][2], job_id;
  END LOOP;
END$$;
