-- Hair Rich · Chat 3 · Reviews Harvester candidates RPC + template seed
--
-- Returns appointments completed at least `reviews_request_delay_min`
-- minutes ago, customer has marketing_consent, no review_requests row yet
-- for this appointment, and per-customer cooldown elapsed.

CREATE OR REPLACE FUNCTION fn_review_request_candidates(p_limit int DEFAULT 25)
RETURNS TABLE (
  appointment_id uuid,
  customer_id uuid,
  first_name text,
  completed_at timestamptz,
  staff_name text,
  service_name text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_delay int;
  v_cooldown int;
BEGIN
  SELECT reviews_request_delay_min, reviews_cooldown_days
    INTO v_delay, v_cooldown
    FROM salon_settings WHERE is_singleton;

  RETURN QUERY
  SELECT
    a.id,
    a.customer_id,
    c.first_name,
    a.end_at AS completed_at,
    s.name AS staff_name,
    (
      SELECT srv.name FROM appointment_services aps
      JOIN services srv ON srv.id = aps.service_id
      WHERE aps.appointment_id = a.id
      LIMIT 1
    ) AS service_name
  FROM appointments a
  JOIN customers c ON c.id = a.customer_id
  LEFT JOIN staff s ON s.id = a.staff_id
  LEFT JOIN review_requests rr ON rr.appointment_id = a.id
  WHERE a.status = 'completed'
    AND a.end_at < now() - make_interval(mins => v_delay)
    AND rr.id IS NULL
    AND COALESCE(c.marketing_consent, false) = true
    AND c.is_guest = false
    AND NOT EXISTS (
      SELECT 1 FROM review_requests rr2
       WHERE rr2.customer_id = c.id
         AND rr2.sent_at > now() - make_interval(days => v_cooldown)
    )
  ORDER BY a.end_at ASC
  LIMIT p_limit;
END $$;

GRANT EXECUTE ON FUNCTION fn_review_request_candidates(int) TO service_role;

INSERT INTO cms_blocks (block_key, content_md, content_json)
VALUES
  ('msg_template_review_request_email',
   E'## Com''è andata oggi, {{first_name}}? ✂️\n\nSe ti è piaciuto il taglio, una recensione su Google ci darebbe una grossa mano.\n\nUn click qui sotto, è veloce: 👉 [{{link}}]({{link}})\n\nSe invece qualcosa non è andato bene, lo stesso link ti porta a dircelo in privato — preferiamo saperlo noi prima di Google.',
   '{"event":"review_request","channel":"email","subject":"Com''e' andata oggi, {{first_name}}?"}'::jsonb),
  ('msg_template_review_request_telegram',
   E'Ciao {{first_name}}! Com''è andata oggi?\nUn feedback rapido: {{link}}',
   '{"event":"review_request","channel":"telegram"}'::jsonb)
ON CONFLICT (block_key) DO NOTHING;
