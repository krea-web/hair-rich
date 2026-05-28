-- Hair Rich · Self-claim della staff row "Titolare"
--
-- Il portal /staff richiede una row in staff con user_id = auth.uid().
-- Per un nuovo salone (o quando il titolare non si è ancora aggiunto
-- come operatore) questo flusso permette al titolare — già autenticato
-- come admin — di crearsi automaticamente la propria staff row dal UI
-- "Accesso non autorizzato" del portal, senza dover passare dal SQL
-- editor di Supabase.
--
-- L'RPC è SECURITY DEFINER ma protetta da `is_admin()`: solo chi è
-- già marcato admin (whitelist email in salon_settings o ruolo nel
-- profilo) può claimare. I dipendenti normali continuano a richiedere
-- abilitazione manuale.

CREATE OR REPLACE FUNCTION fn_claim_owner_staff(
  p_name text,
  p_role text DEFAULT 'Titolare'
) RETURNS staff
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_slug text;
  v_row staff;
  v_attempts int := 0;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Devi essere autenticato' USING ERRCODE = '42501';
  END IF;

  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Solo il titolare può creare il profilo staff principale' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM staff WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'Profilo staff già esistente per questo utente' USING ERRCODE = '23505';
  END IF;

  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Il nome è obbligatorio' USING ERRCODE = '22023';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  IF v_slug = '' THEN v_slug := 'titolare'; END IF;

  WHILE EXISTS (SELECT 1 FROM staff WHERE slug = v_slug) LOOP
    v_attempts := v_attempts + 1;
    v_slug := v_slug || '-' || (v_attempts + floor(random() * 100)::int)::text;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Impossibile generare uno slug univoco' USING ERRCODE = '23505';
    END IF;
  END LOOP;

  INSERT INTO staff (
    user_id, name, slug, role, email, is_active, sort_order, commission_pct
  ) VALUES (
    v_uid, trim(p_name), v_slug, p_role, v_email, true, 0, 0
  ) RETURNING * INTO v_row;

  RETURN v_row;
END$$;

REVOKE EXECUTE ON FUNCTION fn_claim_owner_staff(text, text) FROM public;
GRANT EXECUTE ON FUNCTION fn_claim_owner_staff(text, text) TO authenticated;

COMMENT ON FUNCTION fn_claim_owner_staff(text, text) IS
  'Self-claim della staff row del titolare. Richiamabile solo da utenti admin che non hanno ancora una riga in staff. Idempotente per tentativi successivi del medesimo utente: alla seconda chiamata raise 23505.';
