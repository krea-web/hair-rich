-- Fix D · Elimina appuntamento sbagliato (hard delete) — solo titolare/admin
--
-- In agenda mancava la cancellazione vera: si poteva solo cambiare stato. Il
-- titolare ha chiesto l'eliminazione definitiva degli appuntamenti sbagliati.
-- Tutte le FK che puntano ad appointments(id) sono già ON DELETE CASCADE o
-- SET NULL (appointment_services, appointment_photos, surveys, review_requests,
-- waitlist match, coupon/loyalty/cash → SET NULL), quindi il DELETE è pulito.

CREATE OR REPLACE FUNCTION fn_admin_delete_appointment(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Non autorizzato' USING ERRCODE = '42501';
  END IF;

  DELETE FROM appointments WHERE id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION fn_admin_delete_appointment(uuid) TO authenticated;
