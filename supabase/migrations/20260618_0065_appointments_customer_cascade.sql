-- Fix G · Eliminazione account: appointments.customer_id ON DELETE RESTRICT → CASCADE
--
-- Oggi la FK appointments.customer_id è RESTRICT: impedisce di cancellare un
-- cliente che ha appuntamenti (storici o futuri) → l'eliminazione account
-- fallisce. Le altre FK verso customers sono già CASCADE/SET NULL. Passiamo
-- anche questa a CASCADE: eliminando il cliente spariscono i suoi appuntamenti
-- (e a cascata appointment_services, foto, ecc., già CASCADE su appointments).
--
-- Robusto rispetto al nome del constraint (inline → auto-named dal Postgres).

DO $$
DECLARE v_constraint text;
BEGIN
  SELECT con.conname INTO v_constraint
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
   WHERE con.contype = 'f'
     AND rel.relname = 'appointments'
     AND att.attname = 'customer_id'
   LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT %I', v_constraint);
  END IF;

  ALTER TABLE appointments
    ADD CONSTRAINT appointments_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
END $$;
