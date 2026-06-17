-- Fix A · Doppia prenotazione + dispatch "qualsiasi barbiere"
--
-- Root cause:
--   fn_check_slot_availability(p_start,p_end,p_staff_id,p_chair_id) con
--   p_staff_id IS NULL E p_chair_id IS NULL valutava la clausola conflitto
--   (p_staff_id IS NOT NULL AND ...) OR (p_chair_id IS NOT NULL AND ...) a
--   FALSE → nessun conflitto → SEMPRE "disponibile". E fn_book_appointment
--   con staff null inseriva staff_id = NULL (nessun barbiere assegnato).
--   Risultato: doppia prenotazione + appuntamenti senza barbiere.
--
-- Fix:
--   1) fn_check_slot_availability: quando staff e chair sono entrambi NULL
--      ("qualsiasi barbiere") → disponibile se ALMENO UN barbiere bookabile è
--      libero; "occupato" solo se TUTTI sono occupati.
--   2) fn_book_appointment: con p_staff_id NULL smista al PRIMO barbiere libero
--      (attivo, non-founder, in orario di lavoro per lo slot, senza conflitti né
--      time_off). staff_id non è mai più NULL. Nessuno libero → "Slot non
--      disponibile".

-- ── 1. Disponibilità "qualsiasi barbiere" ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_check_slot_availability(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_staff_id uuid DEFAULT NULL,
  p_chair_id uuid DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE conflict_exists boolean;
BEGIN
  IF p_end_at <= p_start_at THEN RETURN false; END IF;

  -- "Qualsiasi barbiere" (staff e chair non specificati): lo slot è libero se
  -- esiste almeno un barbiere bookabile senza time_off e senza conflitti.
  IF p_staff_id IS NULL AND p_chair_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM staff s
       WHERE s.is_active
         AND COALESCE(s.role_type, 'employee') <> 'founder'
         AND NOT EXISTS (
           SELECT 1 FROM time_off t
            WHERE (t.staff_id IS NULL OR t.staff_id = s.id)
              AND tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
         )
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
            WHERE a.staff_id = s.id
              AND a.status NOT IN ('cancelled','no_show')
              AND (
                a.status <> 'soft_reserved'
                OR (a.soft_reserve_expires_at IS NOT NULL AND a.soft_reserve_expires_at > now())
              )
              AND tstzrange(a.start_at, a.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
         )
    );
  END IF;

  -- Time-off per il barbiere specificato (o chiusura globale staff_id NULL).
  IF EXISTS (
    SELECT 1 FROM time_off
     WHERE (staff_id IS NULL OR staff_id = p_staff_id)
       AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
  ) THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM appointments
     WHERE status NOT IN ('cancelled','no_show')
       AND (
         status <> 'soft_reserved'
         OR (soft_reserve_expires_at IS NOT NULL AND soft_reserve_expires_at > now())
       )
       AND tstzrange(start_at, end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
       AND (
         (p_staff_id IS NOT NULL AND staff_id = p_staff_id)
         OR (p_chair_id IS NOT NULL AND chair_id = p_chair_id)
       )
  ) INTO conflict_exists;

  RETURN NOT conflict_exists;
END $$;

GRANT EXECUTE ON FUNCTION fn_check_slot_availability(timestamptz,timestamptz,uuid,uuid) TO anon, authenticated;

-- ── 2. Booking con dispatch automatico del barbiere ────────────────────────
CREATE OR REPLACE FUNCTION fn_book_appointment(
    p_first_name text,
    p_last_name text,
    p_phone text,
    p_email text,
    p_service_id uuid,
    p_staff_id uuid,
    p_start_at timestamptz,
    p_notes text DEFAULT NULL,
    p_marketing_consent boolean DEFAULT false,
    p_is_first_visit boolean DEFAULT false,
    p_reference_image_paths text[] DEFAULT '{}'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_customer_id uuid;
    v_appointment_id uuid;
    v_duration int;
    v_price int;
    v_end_at timestamptz;
    v_user_id uuid;
    v_staff_id uuid := p_staff_id;
    v_weekday int;
    v_slot_start time;
    v_slot_end time;
BEGIN
    SELECT duration_min, price_cents INTO v_duration, v_price
        FROM services WHERE id = p_service_id AND is_active;
    IF v_duration IS NULL THEN RAISE EXCEPTION 'Servizio non valido' USING ERRCODE = 'P0001'; END IF;

    v_end_at := p_start_at + make_interval(mins => v_duration);

    IF v_staff_id IS NULL THEN
        -- "Qualsiasi barbiere": smista al PRIMO barbiere libero per [start,end).
        -- Bookabili = attivi, non-founder, in orario di lavoro per lo slot,
        -- senza conflitti né time_off.
        v_weekday   := EXTRACT(DOW FROM (p_start_at AT TIME ZONE 'Europe/Rome'))::int;
        v_slot_start := (p_start_at AT TIME ZONE 'Europe/Rome')::time;
        v_slot_end   := (v_end_at  AT TIME ZONE 'Europe/Rome')::time;

        SELECT s.id INTO v_staff_id
          FROM staff s
         WHERE s.is_active
           AND COALESCE(s.role_type, 'employee') <> 'founder'
           AND EXISTS (
             SELECT 1 FROM working_hours wh
              WHERE (wh.staff_id = s.id OR wh.staff_id IS NULL)
                AND wh.weekday = v_weekday
                AND wh.start_time <= v_slot_start
                AND wh.end_time   >= v_slot_end
           )
           AND fn_check_slot_availability(p_start_at, v_end_at, s.id, NULL)
         ORDER BY s.sort_order, s.id
         LIMIT 1;

        IF v_staff_id IS NULL THEN
            RAISE EXCEPTION 'Slot non disponibile' USING ERRCODE = 'P0002';
        END IF;
    ELSE
        IF NOT fn_check_slot_availability(p_start_at, v_end_at, v_staff_id, NULL) THEN
            RAISE EXCEPTION 'Slot non disponibile' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    v_user_id := auth.uid();

    IF v_user_id IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE user_id = v_user_id;
    END IF;
    IF v_customer_id IS NULL AND p_email IS NOT NULL AND p_email <> '' THEN
        SELECT id INTO v_customer_id FROM customers WHERE lower(email) = lower(p_email) LIMIT 1;
    END IF;
    IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
        INSERT INTO customers (first_name, last_name, email, phone, is_guest, marketing_consent, user_id)
        VALUES (p_first_name, p_last_name, NULLIF(p_email,''), p_phone, v_user_id IS NULL, p_marketing_consent, v_user_id)
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE customers
            SET first_name = COALESCE(NULLIF(p_first_name,''), first_name),
                    last_name  = COALESCE(NULLIF(p_last_name,''), last_name),
                    marketing_consent = marketing_consent OR p_marketing_consent
         WHERE id = v_customer_id;
    END IF;

    INSERT INTO appointments (
        customer_id, staff_id, start_at, end_at, status, source, notes, total_cents,
        is_first_visit, reference_image_paths
    )
    VALUES (
        v_customer_id, v_staff_id, p_start_at, v_end_at, 'booked', 'app',
        NULLIF(p_notes,''), v_price, p_is_first_visit,
        COALESCE(p_reference_image_paths, '{}')
    )
    RETURNING id INTO v_appointment_id;

    INSERT INTO appointment_services (appointment_id, service_id, price_cents, duration_min)
    VALUES (v_appointment_id, p_service_id, v_price, v_duration);

    RETURN jsonb_build_object(
        'appointment_id', v_appointment_id,
        'customer_id', v_customer_id,
        'staff_id', v_staff_id,
        'start_at', p_start_at,
        'end_at', v_end_at,
        'total_cents', v_price
    );
END $$;

GRANT EXECUTE ON FUNCTION fn_book_appointment(text,text,text,text,uuid,uuid,timestamptz,text,boolean,boolean,text[]) TO anon, authenticated;
