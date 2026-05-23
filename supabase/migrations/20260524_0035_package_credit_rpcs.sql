-- Hair Rich · Package credit ledger RPCs
--
-- 0034 created the tables; this migration:
--   1. Wires the appointments.package_credit_id FK now that
--      customer_packages exists.
--   2. fn_customer_active_packages(p_customer_id, p_service_id?) → eligible
--      bundles to spend a credit on. BookingDrawer calls this on Step 3
--      to surface the "Usa 1 credito" CTA.
--   3. fn_redeem_package_credit(p_customer_package_id, p_appointment_id) →
--      atomic decrement + appointment binding. Marks customer_packages
--      as 'consumed' when credits_remaining hits zero.
--   4. fn_sell_package(...) → admin-driven sell flow, captures
--      payment_method + price_paid_cents.

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_package_credit_fk;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_package_credit_fk
  FOREIGN KEY (package_credit_id) REFERENCES customer_packages(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION fn_customer_active_packages(
  p_customer_id uuid,
  p_service_id uuid DEFAULT NULL
) RETURNS TABLE (
  customer_package_id uuid,
  package_id uuid,
  package_name text,
  credits_remaining int,
  credits_total int,
  expires_at timestamptz,
  eligible_for_service boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    cp.id,
    cp.package_id,
    sp.name,
    cp.credits_remaining,
    cp.credits_total,
    cp.expires_at,
    CASE
      WHEN p_service_id IS NULL THEN true
      WHEN array_length(sp.eligible_service_ids, 1) IS NULL THEN true
      WHEN p_service_id = ANY(sp.eligible_service_ids) THEN true
      ELSE false
    END AS eligible_for_service
  FROM customer_packages cp
  JOIN service_packages sp ON sp.id = cp.package_id
  WHERE cp.customer_id = p_customer_id
    AND cp.status = 'active'
    AND cp.credits_remaining > 0
    AND cp.expires_at > now()
  ORDER BY cp.expires_at ASC;
$$;
GRANT EXECUTE ON FUNCTION fn_customer_active_packages(uuid, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION fn_redeem_package_credit(
  p_customer_package_id uuid,
  p_appointment_id uuid
) RETURNS customer_packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack customer_packages;
  v_appt appointments;
  v_eligible uuid[];
  v_appt_services uuid[];
BEGIN
  SELECT * INTO v_pack FROM customer_packages WHERE id = p_customer_package_id FOR UPDATE;
  IF v_pack.id IS NULL THEN
    RAISE EXCEPTION 'Pacchetto non trovato' USING ERRCODE = 'P0002';
  END IF;
  IF v_pack.status <> 'active' OR v_pack.credits_remaining < 1 THEN
    RAISE EXCEPTION 'Pacchetto non utilizzabile' USING ERRCODE = 'P0002';
  END IF;
  IF v_pack.expires_at <= now() THEN
    RAISE EXCEPTION 'Pacchetto scaduto' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_appt FROM appointments WHERE id = p_appointment_id FOR UPDATE;
  IF v_appt.id IS NULL THEN
    RAISE EXCEPTION 'Appuntamento non trovato' USING ERRCODE = 'P0002';
  END IF;
  IF v_appt.customer_id <> v_pack.customer_id THEN
    RAISE EXCEPTION 'Cliente del pacchetto e dell''appuntamento non coincidono' USING ERRCODE = '42501';
  END IF;
  IF v_appt.package_credit_id IS NOT NULL THEN
    RAISE EXCEPTION 'Credito già applicato a questo appuntamento' USING ERRCODE = 'P0002';
  END IF;

  -- Service eligibility check: pack.eligible_service_ids ∩ appt.services
  SELECT eligible_service_ids INTO v_eligible
    FROM service_packages WHERE id = v_pack.package_id;
  IF v_eligible IS NOT NULL AND array_length(v_eligible, 1) > 0 THEN
    SELECT array_agg(service_id) INTO v_appt_services
      FROM appointment_services WHERE appointment_id = p_appointment_id;
    IF NOT (v_eligible && v_appt_services) THEN
      RAISE EXCEPTION 'Pacchetto non valido per questo servizio' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  UPDATE appointments
     SET package_credit_id = v_pack.id,
         total_cents = 0,
         updated_at = now()
   WHERE id = p_appointment_id;

  UPDATE customer_packages
     SET credits_remaining = credits_remaining - 1,
         status = CASE WHEN credits_remaining - 1 <= 0 THEN 'consumed' ELSE 'active' END,
         updated_at = now()
   WHERE id = v_pack.id
   RETURNING * INTO v_pack;

  RETURN v_pack;
END $$;

REVOKE EXECUTE ON FUNCTION fn_redeem_package_credit(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION fn_redeem_package_credit(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION fn_sell_package(
  p_customer_id uuid,
  p_package_id uuid,
  p_price_paid_cents int,
  p_payment_method text,
  p_notes text DEFAULT NULL
) RETURNS customer_packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack service_packages;
  v_row customer_packages;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo admin' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_pack FROM service_packages WHERE id = p_package_id AND is_active;
  IF v_pack.id IS NULL THEN
    RAISE EXCEPTION 'Pacchetto non trovato' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO customer_packages (
    customer_id, package_id, credits_total, credits_remaining,
    price_paid_cents, payment_method, sold_by, sold_at,
    expires_at, notes
  ) VALUES (
    p_customer_id, p_package_id, v_pack.credits, v_pack.credits,
    p_price_paid_cents, p_payment_method, auth.uid(), now(),
    now() + make_interval(days => v_pack.validity_days),
    NULLIF(p_notes, '')
  ) RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE EXECUTE ON FUNCTION fn_sell_package(uuid, uuid, int, text, text) FROM public;
GRANT EXECUTE ON FUNCTION fn_sell_package(uuid, uuid, int, text, text) TO authenticated, service_role;
