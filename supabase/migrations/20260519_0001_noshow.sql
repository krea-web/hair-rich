-- Hair Rich · No-show tracking
-- Adds a counter on customers + a trigger that auto-increments it when
-- an appointment moves to status='no_show'. Decrements if reverted.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS noshow_count int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_customer_noshow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT directly as no_show (rare but possible)
  IF (TG_OP = 'INSERT' AND NEW.status = 'no_show' AND NEW.customer_id IS NOT NULL) THEN
    UPDATE customers SET noshow_count = noshow_count + 1 WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status <> 'no_show' AND NEW.status = 'no_show' AND NEW.customer_id IS NOT NULL) THEN
      UPDATE customers SET noshow_count = noshow_count + 1 WHERE id = NEW.customer_id;
    ELSIF (OLD.status = 'no_show' AND NEW.status <> 'no_show' AND OLD.customer_id IS NOT NULL) THEN
      UPDATE customers SET noshow_count = GREATEST(noshow_count - 1, 0) WHERE id = OLD.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_appointments_noshow ON appointments;
CREATE TRIGGER trg_appointments_noshow
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW EXECUTE FUNCTION sync_customer_noshow();

-- Backfill existing data (idempotent recompute)
UPDATE customers c
   SET noshow_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT customer_id, COUNT(*)::int AS cnt
      FROM appointments
     WHERE status = 'no_show' AND customer_id IS NOT NULL
     GROUP BY customer_id
  ) sub
 WHERE c.id = sub.customer_id;
