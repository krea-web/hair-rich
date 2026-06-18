-- Fix E (DB) · Limite preavviso cancellazione/spostamento = 24 ore (decisione titolare)
--
-- fn_cancel_appointment_by_customer / fn_reschedule_appointment_by_customer
-- leggono salon_settings.cancel_min_hours (default 4). Il titolare ha deciso 24h.

ALTER TABLE salon_settings ADD COLUMN IF NOT EXISTS cancel_min_hours int NOT NULL DEFAULT 24;

UPDATE salon_settings SET cancel_min_hours = 24;
