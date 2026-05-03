INSERT INTO public.promo_codes (
  code, description, discount_type, discount_value, plan_type,
  valid_from, valid_until, max_redemptions_total, max_redemptions_per_trainer, is_active
) VALUES (
  'FOUNDING-ANNUAL-001',
  'Founding trainer comp — Vaishnavi (single use)',
  'percent', 100, 'annual',
  DATE '2026-05-03', DATE '2026-12-31', 1, 1, true
);

SELECT public.admin_redeem_promo_code(
  'FOUNDING-ANNUAL-001',
  '30a0df77-42a6-4409-8088-96d955d899e2'::uuid,
  DATE '2026-05-07'
);