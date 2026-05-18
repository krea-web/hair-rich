-- Add is_first_visit flag to appointments so the admin agenda can
-- highlight new clients (barber gives them extra consult time + post-cut
-- photo prompt). The wizard surfaces this as an opt-in checkbox in the
-- confirm step.
ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS is_first_visit boolean NOT NULL DEFAULT false;

-- Extend the booking RPC signature so the wizard can pass the flag through
-- in a single round-trip alongside the existing inputs.
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
    p_is_first_visit boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_customer_id uuid;
    v_appointment_id uuid;
    v_duration int;
    v_price int;
    v_end_at timestamptz;
    v_user_id uuid;
BEGIN
    SELECT duration_min, price_cents INTO v_duration, v_price
        FROM services WHERE id = p_service_id AND is_active;
    IF v_duration IS NULL THEN RAISE EXCEPTION 'Servizio non valido' USING ERRCODE = 'P0001'; END IF;

    v_end_at := p_start_at + make_interval(mins => v_duration);

    IF NOT fn_check_slot_availability(p_start_at, v_end_at, p_staff_id, NULL) THEN
        RAISE EXCEPTION 'Slot non disponibile' USING ERRCODE = 'P0002';
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

    INSERT INTO appointments (customer_id, staff_id, start_at, end_at, status, source, notes, total_cents, is_first_visit)
    VALUES (v_customer_id, p_staff_id, p_start_at, v_end_at, 'booked', 'app', NULLIF(p_notes,''), v_price, p_is_first_visit)
    RETURNING id INTO v_appointment_id;

    INSERT INTO appointment_services (appointment_id, service_id, price_cents, duration_min)
    VALUES (v_appointment_id, p_service_id, v_price, v_duration);

    RETURN jsonb_build_object(
        'appointment_id', v_appointment_id,
        'customer_id', v_customer_id,
        'start_at', p_start_at,
        'end_at', v_end_at,
        'total_cents', v_price
    );
END $$;

GRANT EXECUTE ON FUNCTION fn_book_appointment(text,text,text,text,uuid,uuid,timestamptz,text,boolean,boolean) TO anon, authenticated;
