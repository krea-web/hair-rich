-- Notifica Telegram al titolare a OGNI nuova prenotazione.
--
-- Prima non veniva inviato nulla: le prenotazioni online (fn_book_appointment)
-- non avvisavano il titolare. Ora un trigger su appointment_services (l'ultima
-- riga inserita nel flusso di booking → cliente/operatore/servizio già presenti)
-- chiama la notifications-router con l'evento owner_new_booking.
--
-- - Salta gli import/seed bulk (appointments.source = 'admin').
-- - Notifica online ('app') e bot/telefono ('phone').
-- - Passa per la router: skill telegram_owner_alerts (ON), template
--   tmpl_telegram_owner_new_booking, quiet hours rispettate (di notte → inbox).
-- - net.http_post è asincrono: non blocca né fa fallire la prenotazione.

CREATE OR REPLACE FUNCTION fn_notify_new_booking() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  -- anon key PUBBLICA (non è un secret), come in fn_invoke_edge_function.
  v_anon text := 'eyJhbGciOiJIUzI1NiIsImtpZCI6IjlSeVZGUWF4VVN1Mm5NK3oiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Z6bnpmbWdmc2lqaHpqcWN3bXl0LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhbm9uIiwiYXVkIjoiYW5vbiIsImV4cCI6MjA3OTUyOTYwOSwiaWF0IjoxNzYzOTUzNjA5LCJlbWFpbCI6IiIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYW5vbiIsInByb3ZpZGVycyI6W119LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImFub24iLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc2Mzk1MzYwOX1dLCJzZXNzaW9uX2lkIjoiIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ZRdsT0XVeOXJk39MnXmFTr3HlnHljd-1FvefcQRJWXc';
  v_url text := 'https://fznzfmgfsijhzjqcwmyt.supabase.co/functions/v1/notifications-router';
  v_appt appointments;
  v_first text; v_last text; v_phone text; v_staff text; v_service text;
BEGIN
  SELECT * INTO v_appt FROM appointments WHERE id = NEW.appointment_id;
  IF v_appt.id IS NULL THEN RETURN NEW; END IF;
  IF v_appt.status NOT IN ('booked','confirmed') THEN RETURN NEW; END IF;
  IF COALESCE(v_appt.source, '') = 'admin' THEN RETURN NEW; END IF; -- import/seed bulk

  SELECT first_name, last_name, phone INTO v_first, v_last, v_phone
    FROM customers WHERE id = v_appt.customer_id;
  SELECT name INTO v_staff FROM staff WHERE id = v_appt.staff_id;
  SELECT name INTO v_service FROM services WHERE id = NEW.service_id;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_anon, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'mode', 'owner',
      'event_type', 'owner_new_booking',
      'related_type', 'appointment',
      'related_id', v_appt.id,
      'source_skill', 'telegram_owner_alerts',
      'payload', jsonb_build_object(
        'customer_name', COALESCE(NULLIF(TRIM(COALESCE(v_first, '') || ' ' || COALESCE(v_last, '')), ''), 'Cliente'),
        'customer_phone', COALESCE(v_phone, '—'),
        'appointment_service', COALESCE(v_service, 'Servizio'),
        'appointment_staff', COALESCE(v_staff, '—'),
        'appointment_date', to_char(v_appt.start_at AT TIME ZONE 'Europe/Rome', 'DD/MM/YYYY'),
        'appointment_time', to_char(v_appt.start_at AT TIME ZONE 'Europe/Rome', 'HH24:MI')
      )
    ),
    timeout_milliseconds := 60000
  );

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_booking ON appointment_services;
CREATE TRIGGER trg_notify_new_booking
  AFTER INSERT ON appointment_services
  FOR EACH ROW EXECUTE FUNCTION fn_notify_new_booking();
