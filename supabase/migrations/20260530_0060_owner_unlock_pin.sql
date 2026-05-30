-- Hair Rich · Owner unlock PIN per tablet-mode role switching
--
-- Quando un device condiviso (tablet del salone) e' in modalita'
-- "Dipendente" tramite il toggle in /admin, per tornare alla vista
-- "Titolare" e' necessario inserire un PIN. Senza questo PIN, qualsiasi
-- dipendente potrebbe cambiare lo switch e accedere a tutti i tab
-- riservati al titolare (impostazioni, statistiche, AI, marketing).
--
-- Il PIN e' un valore in chiaro perche' deve essere ricordato e cambiato
-- frequentemente dal titolare; non e' un secret crittografico ma una
-- barriera UX. Per scenari piu' robusti (multiple-staff, audit) si puo'
-- successivamente upgradare a token short-lived + RPC SECURITY DEFINER.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS owner_unlock_pin text;

COMMENT ON COLUMN salon_settings.owner_unlock_pin IS
  'PIN numerico (tipicamente 4-6 cifre) richiesto per uscire dalla vista Dipendente nel tablet-mode dell''admin. Se NULL, il toggle Titolare e'' libero (fallback dev/onboarding).';
