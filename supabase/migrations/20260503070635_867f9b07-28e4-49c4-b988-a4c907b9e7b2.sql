
-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.promo_discount_type AS ENUM ('percent','flat','extension_days');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. promo_codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type public.promo_discount_type NOT NULL,
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  plan_type public.platform_plan_type NOT NULL,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  max_redemptions_total integer,
  max_redemptions_per_trainer integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  redemption_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_window_chk CHECK (valid_until >= valid_from),
  CONSTRAINT promo_codes_percent_chk CHECK (
    discount_type <> 'percent' OR discount_value <= 100
  ),
  CONSTRAINT promo_codes_plan_chk CHECK (plan_type IN ('monthly','annual'))
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes (code);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all select on promo_codes" ON public.promo_codes
  FOR SELECT USING (false);
CREATE POLICY "Deny all insert on promo_codes" ON public.promo_codes
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on promo_codes" ON public.promo_codes
  FOR UPDATE USING (false);
CREATE POLICY "Deny all delete on promo_codes" ON public.promo_codes
  FOR DELETE USING (false);

CREATE TRIGGER trg_promo_codes_updated
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. promo_redemptions
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL,
  trainer_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  granted_plan_type public.platform_plan_type NOT NULL,
  granted_start_date date NOT NULL,
  granted_end_date date NOT NULL,
  redeemed_by text NOT NULL DEFAULT 'admin',
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_redemptions_code ON public.promo_redemptions (promo_code_id);
CREATE INDEX idx_promo_redemptions_trainer ON public.promo_redemptions (trainer_id);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all select on promo_redemptions" ON public.promo_redemptions
  FOR SELECT USING (false);
CREATE POLICY "Deny all insert on promo_redemptions" ON public.promo_redemptions
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny all update on promo_redemptions" ON public.promo_redemptions
  FOR UPDATE USING (false);
CREATE POLICY "Deny all delete on promo_redemptions" ON public.promo_redemptions
  FOR DELETE USING (false);

-- 4. Admin redeem RPC (service-role gated)
CREATE OR REPLACE FUNCTION public.admin_redeem_promo_code(
  p_code text,
  p_trainer_id uuid,
  p_start_date date DEFAULT CURRENT_DATE
)
RETURNS SETOF public.trainer_platform_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.promo_codes%ROWTYPE;
  v_duration integer;
  v_end date;
  v_existing_for_trainer integer;
  v_sub_id uuid;
BEGIN
  -- Hard guard: only service role may call this
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: admin_redeem_promo_code is service-role only';
  END IF;

  -- Lookup + lock
  SELECT * INTO v_code
  FROM public.promo_codes
  WHERE code = upper(p_code)
  FOR UPDATE;

  IF v_code.id IS NULL THEN
    RAISE EXCEPTION 'Promo code not found: %', p_code;
  END IF;

  IF NOT v_code.is_active THEN
    RAISE EXCEPTION 'Promo code is inactive';
  END IF;

  IF CURRENT_DATE < v_code.valid_from OR CURRENT_DATE > v_code.valid_until THEN
    RAISE EXCEPTION 'Promo code outside validity window (% to %)',
      v_code.valid_from, v_code.valid_until;
  END IF;

  IF v_code.max_redemptions_total IS NOT NULL
     AND v_code.redemption_count >= v_code.max_redemptions_total THEN
    RAISE EXCEPTION 'Promo code global redemption limit reached';
  END IF;

  -- Trainer must exist and be a trainer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_trainer_id AND role = 'trainer'
  ) THEN
    RAISE EXCEPTION 'Target profile is not a trainer';
  END IF;

  -- Per-trainer cap
  SELECT COUNT(*) INTO v_existing_for_trainer
  FROM public.promo_redemptions
  WHERE promo_code_id = v_code.id AND trainer_id = p_trainer_id;

  IF v_existing_for_trainer >= v_code.max_redemptions_per_trainer THEN
    RAISE EXCEPTION 'Trainer has already redeemed this code the maximum number of times';
  END IF;

  -- Duration
  IF v_code.plan_type = 'monthly' THEN
    v_duration := 30;
  ELSIF v_code.plan_type = 'annual' THEN
    v_duration := 365;
  ELSE
    RAISE EXCEPTION 'Unsupported plan_type on code';
  END IF;

  IF v_code.discount_type = 'extension_days' THEN
    v_duration := v_duration + v_code.discount_value::integer;
  END IF;

  v_end := p_start_date + v_duration;

  -- Create comp subscription
  INSERT INTO public.trainer_platform_subscriptions (
    trainer_id, plan_type, status, amount,
    start_date, end_date, grace_end_date,
    is_trial_used, payment_status
  ) VALUES (
    p_trainer_id, v_code.plan_type, 'active', 0,
    p_start_date, v_end, NULL,
    true, 'comp'
  )
  RETURNING id INTO v_sub_id;

  -- Audit
  INSERT INTO public.promo_redemptions (
    promo_code_id, trainer_id, subscription_id,
    granted_plan_type, granted_start_date, granted_end_date,
    redeemed_by
  ) VALUES (
    v_code.id, p_trainer_id, v_sub_id,
    v_code.plan_type, p_start_date, v_end,
    'admin'
  );

  -- Bump usage
  UPDATE public.promo_codes
  SET redemption_count = redemption_count + 1,
      updated_at = now()
  WHERE id = v_code.id;

  RETURN QUERY SELECT * FROM public.trainer_platform_subscriptions WHERE id = v_sub_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_redeem_promo_code(text, uuid, date) FROM PUBLIC, anon, authenticated;
