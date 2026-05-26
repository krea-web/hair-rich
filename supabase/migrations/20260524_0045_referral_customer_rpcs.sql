-- Hair Rich · Chat 3 · Referral customer-facing RPCs (#65)
--
-- get_or_create_my_referral_code  — idempotent code generation per customer
-- my_referral_stats               — counts + total credit earned for /profilo/referral
-- get_referral_by_code            — public landing-page lookup (no PII)
-- claim_referral_signup           — called by ReferralLanding on registration

CREATE OR REPLACE FUNCTION fn_get_or_create_my_referral_code()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id uuid;
  v_first_name text;
  v_existing text;
  v_code text;
  v_attempt int := 0;
  v_credit_cents int := 500;
BEGIN
  SELECT id, first_name INTO v_customer_id, v_first_name
    FROM customers WHERE user_id = auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0003';
  END IF;

  SELECT code INTO v_existing
    FROM referrals
   WHERE referrer_customer_id = v_customer_id
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('code', v_existing, 'created', false);
  END IF;

  LOOP
    v_code := upper(regexp_replace(COALESCE(v_first_name, 'AMI'), '[^A-Za-z]', '', 'g'))
              || lpad((floor(random() * 100))::text, 2, '0');
    IF length(v_code) < 4 THEN v_code := 'HR' || v_code; END IF;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM referrals WHERE code = v_code);
    v_attempt := v_attempt + 1;
    IF v_attempt > 8 THEN
      v_code := 'HR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO referrals (referrer_customer_id, code, credit_cents, status)
  VALUES (v_customer_id, v_code, v_credit_cents, 'pending');

  RETURN jsonb_build_object('code', v_code, 'created', true);
END $$;

GRANT EXECUTE ON FUNCTION fn_get_or_create_my_referral_code() TO authenticated;

CREATE OR REPLACE FUNCTION fn_my_referral_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id uuid;
  v_friends_invited int;
  v_friends_completed int;
  v_credits_earned int;
  v_credits_pending int;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = auth.uid();
  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('friends_invited', 0, 'friends_completed', 0,
                              'credits_earned_cents', 0, 'credits_pending_cents', 0);
  END IF;

  SELECT
    count(*) FILTER (WHERE status <> 'pending'),
    count(*) FILTER (WHERE status IN ('first_visit_completed','rewarded')),
    COALESCE(sum(credit_cents) FILTER (WHERE status = 'rewarded'), 0),
    COALESCE(sum(credit_cents) FILTER (WHERE status = 'first_visit_completed'), 0)
  INTO v_friends_invited, v_friends_completed, v_credits_earned, v_credits_pending
  FROM referrals
  WHERE referrer_customer_id = v_customer_id;

  RETURN jsonb_build_object(
    'friends_invited', v_friends_invited,
    'friends_completed', v_friends_completed,
    'credits_earned_cents', v_credits_earned,
    'credits_pending_cents', v_credits_pending
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_my_referral_stats() TO authenticated;

CREATE OR REPLACE FUNCTION fn_referral_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referrer_name text;
  v_credit_cents int;
  v_skill_enabled boolean;
BEGIN
  SELECT enabled INTO v_skill_enabled FROM skills_config WHERE skill_key = 'referrals';
  IF NOT COALESCE(v_skill_enabled, false) THEN
    RETURN jsonb_build_object('found', false, 'reason', 'feature_disabled');
  END IF;

  SELECT r.credit_cents, c.first_name
    INTO v_credit_cents, v_referrer_name
    FROM referrals r
    JOIN customers c ON c.id = r.referrer_customer_id
   WHERE r.code = upper(trim(p_code))
   LIMIT 1;

  IF v_referrer_name IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'referrer_first_name', v_referrer_name,
    'reward_for_invitee_cents', v_credit_cents
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_referral_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION fn_claim_referral_signup(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id uuid;
  v_email text;
  v_phone text;
  v_referral record;
  v_invitee_coupon_id uuid;
  v_invitee_code text;
BEGIN
  SELECT id, email, phone INTO v_customer_id, v_email, v_phone
    FROM customers WHERE user_id = auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0003';
  END IF;

  SELECT * INTO v_referral FROM referrals
   WHERE code = upper(trim(p_code))
   ORDER BY created_at DESC LIMIT 1;
  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code_not_found');
  END IF;
  IF v_referral.referrer_customer_id = v_customer_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral_blocked');
  END IF;
  IF v_referral.invited_customer_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  v_invitee_code := 'AMICO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  INSERT INTO coupons (code, description, kind, value_cents, max_redemptions, origin,
                       single_use_per_customer, issued_to_customer_id, referral_id,
                       valid_until)
  VALUES (
    v_invitee_code,
    'Sconto benvenuto referral',
    'amount',
    v_referral.credit_cents,
    1,
    'referral',
    true,
    v_customer_id,
    v_referral.id,
    CURRENT_DATE + 90
  )
  RETURNING id INTO v_invitee_coupon_id;

  UPDATE referrals
     SET invited_customer_id = v_customer_id,
         invited_email = COALESCE(v_email, invited_email),
         invited_phone = COALESCE(v_phone, invited_phone),
         invitee_coupon_id = v_invitee_coupon_id,
         status = 'signed_up',
         signed_up_at = now()
   WHERE id = v_referral.id;

  RETURN jsonb_build_object(
    'ok', true,
    'invitee_coupon_code', v_invitee_code,
    'reward_cents', v_referral.credit_cents
  );
END $$;

GRANT EXECUTE ON FUNCTION fn_claim_referral_signup(text) TO authenticated;

-- ────────── Trigger: when referred customer's first appointment completes,
--           credit the referrer with a coupon and mark the referral rewarded
CREATE OR REPLACE FUNCTION fn_referral_on_first_visit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referral record;
  v_referrer_code text;
  v_referrer_coupon_id uuid;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN RETURN NEW; END IF;

  SELECT * INTO v_referral FROM referrals
   WHERE invited_customer_id = NEW.customer_id
     AND status = 'signed_up'
   LIMIT 1;
  IF v_referral.id IS NULL THEN RETURN NEW; END IF;

  v_referrer_code := 'GRAZIE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  INSERT INTO coupons (code, description, kind, value_cents, max_redemptions, origin,
                       single_use_per_customer, issued_to_customer_id, referral_id,
                       valid_until)
  VALUES (
    v_referrer_code,
    'Premio referral · grazie per l''invito',
    'amount',
    v_referral.credit_cents,
    1,
    'referral',
    true,
    v_referral.referrer_customer_id,
    v_referral.id,
    CURRENT_DATE + 180
  )
  RETURNING id INTO v_referrer_coupon_id;

  UPDATE referrals
     SET referrer_coupon_id = v_referrer_coupon_id,
         status = 'rewarded',
         first_visit_at = NEW.start_at,
         rewarded_at = now()
   WHERE id = v_referral.id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_referral_first_visit ON appointments;
CREATE TRIGGER trg_referral_first_visit
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW EXECUTE FUNCTION fn_referral_on_first_visit();
