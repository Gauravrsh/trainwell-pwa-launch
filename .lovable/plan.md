## Grant comp annual subscription to Vaishnavi — seamless handoff

**Trainer:** Vaishnavi (`profile.id = 30a0df77-42a6-4409-8088-96d955d899e2`)
**Current sub:** monthly, active, ends **2026-05-06** (paid, verified).
**Goal:** New annual comp begins **2026-05-07**, ends **2027-05-07**. Zero downtime.

### Single migration

1. **Insert promo code** `FOUNDING-ANNUAL-001`:
   - `discount_type = 'percent'`, `discount_value = 100`
   - `plan_type = 'annual'`
   - `valid_from = 2026-05-03`, `valid_until = 2026-12-31` (window covers redemption + future audit)
   - `max_redemptions_total = 1`, `max_redemptions_per_trainer = 1`
   - `is_active = true`
   - `description = 'Founding trainer comp — Vaishnavi (single use)'`

2. **Redeem immediately** in the same migration:
   ```sql
   SELECT admin_redeem_promo_code(
     'FOUNDING-ANNUAL-001',
     '30a0df77-42a6-4409-8088-96d955d899e2',
     DATE '2026-05-07'
   );
   ```
   This inserts a `trainer_platform_subscriptions` row: `plan_type='annual'`, `status='active'`, `payment_status='comp'`, `amount=0`, `start_date=2026-05-07`, `end_date=2027-05-07`. Code is now exhausted (1/1).

### Why this is seamless

- Her existing monthly row stays `active` through 2026-05-06.
- The new comp row becomes the latest by `created_at`, so `useTrainerSubscription` (orders by `created_at DESC LIMIT 1`) picks it up. Between today and 2026-05-06, the hook will already show the comp annual as the current sub — but `daysRemaining` is computed off `end_date = 2027-05-07`, so she sees more days remaining, never fewer. No expiry banner, no read-only flip, no client-side disruption.
- After 2026-05-06 the old monthly row simply ages out; nothing references it.

### Verification (post-migration, read-only)

```sql
SELECT plan_type, status, payment_status, start_date, end_date
FROM trainer_platform_subscriptions
WHERE trainer_id = '30a0df77-42a6-4409-8088-96d955d899e2'
ORDER BY created_at DESC;

SELECT code, redemption_count, max_redemptions_total FROM promo_codes
WHERE code = 'FOUNDING-ANNUAL-001';

SELECT * FROM promo_redemptions
WHERE trainer_id = '30a0df77-42a6-4409-8088-96d955d899e2';
```

### Not changed

No frontend, no edge functions, no schema changes. Silent to Vaishnavi (per `mem://features/promo-codes/admin-comp-model`).
