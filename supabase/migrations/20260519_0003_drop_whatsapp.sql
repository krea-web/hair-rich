-- Hair Rich · Drop WhatsApp column
-- Business decision: WhatsApp is not a channel we use. Remove the column
-- from salon_settings and stop surfacing it in the admin form.

ALTER TABLE salon_settings DROP COLUMN IF EXISTS whatsapp;
