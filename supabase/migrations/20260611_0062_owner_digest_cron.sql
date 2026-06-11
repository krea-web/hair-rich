-- Hair Rich · Cron Parte C — brief contabile al titolare
--
-- Schedula le due Edge Function del bot contabile via pg_cron + pg_net,
-- riusando fn_invoke_edge_function (migration 0057). Idempotente.
--   owner-morning-digest → 08:00 (auto-timbratura + agenda + suggerimento IG)
--   owner-evening-brief  → 20:00 (riepilogo POS/contanti + invito a chiudere il brief)

DO $$
DECLARE
  schedules text[][] := ARRAY[
    ['owner-morning-digest-daily', '0 8 * * *',  'owner-morning-digest'],
    ['owner-evening-brief-daily',  '0 20 * * *', 'owner-evening-brief']
  ];
  i int;
  job_id bigint;
BEGIN
  FOR i IN 1 .. array_length(schedules, 1) LOOP
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
