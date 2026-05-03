## Promo Codes — Admin-Driven Comp Subscriptions

Backend-only. You operate everything from the Lovable SQL panel; no UI for trainers, no checkout changes, no trainer-visible trace. Foundation laid so a future admin UI can sit on top without reshaping data.

---

### 1. New enum

`promo_discount_type`: `percent` | `flat` | `extension_days`
(Stored on every code so future checkout integration knows how to apply price math. For now, only the redemption effect — granting a comp subscription — actually fires.)

---

### 2. Table: `promo_codes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text UNIQUE, uppercased | e.g. `LAUNCH50` |
| `description` | text | Internal note |
| `discount_type` | promo_discount_type | percent / flat / extension_days |
| `discount_value` | numeric | % (0-100), ₹ amount, or # of days |
| `plan_type` | platform_plan_type | **single plan per code** — `monthly` or `annual` |
| `valid_from` | date | inclusive |
| `valid_until` | date | inclusive |
| `max_redemptions_total` | int | NULL = unlimited |
| `max_redemptions_per_trainer` | int | default 1 |
| `is_active` | boolean | manual kill switch |
| `redemption_count` | int default 0 | maintained by RPC |
| `created_at` / `updated_at` | timestamptz | |

**RLS:** authenticated SELECT/INSERT/UPDATE/DELETE → all `false`. Only service-role (you via SQL) can touch it.

CHECK constraints: `discount_value > 0`, `valid_until >= valid_from`, percent ≤ 100.

---

### 3. Table: `promo_redemptions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `promo_code_id` | uuid → promo_codes.id | |
| `trainer_id` | uuid → profiles.id | |
| `subscription_id` | uuid → trainer_platform_subscriptions.id | the comp sub created |
| `granted_plan_type` | platform_plan_type | snapshot |
| `granted_start_date` | date | |
| `granted_end_date` | date | |
| `redeemed_by` | text | 'admin' for now |
| `redeemed_at` | timestamptz | |

UNIQUE `(promo_code_id, trainer_id)` when per-trainer cap = 1 (enforced in RPC, not constraint, since cap is configurable).

**RLS:** all denied to authenticated. Service-role only. Trainer never sees this row.

---

### 4. RPC: `admin_redeem_promo_code(p_code text, p_trainer_id uuid, p_start_date date DEFAULT CURRENT_DATE)`

`SECURITY DEFINER`, but **opens with a hard guard**: `IF auth.role() <> 'service_role' THEN RAISE EXCEPTION`. So even an authenticated trainer who somehow learns the function name cannot call it; only your service-role SQL session can.

Logic:
1. Lookup code (uppercased), lock row.
2. Validate: `is_active`, `CURRENT_DATE BETWEEN valid_from AND valid_until`, `redemption_count < max_redemptions_total`, trainer's existing redemption count for this code < `max_redemptions_per_trainer`.
3. Verify `p_trainer_id` is a trainer profile.
4. Compute duration: `monthly` → +30 days, `annual` → +365 days. If `discount_type = extension_days`, add `discount_value` extra days on top.
5. Insert into `trainer_platform_subscriptions`:
   - `plan_type = code.plan_type`
   - `status = 'active'`, `payment_status = 'comp'` (new allowed value, no schema enum change since `payment_status` is text)
   - `amount = 0`
   - `start_date = p_start_date`, `end_date = start + duration`
   - `razorpay_*` left null
6. Insert `promo_redemptions` row, increment `promo_codes.redemption_count`.
7. Return the new subscription row.

This works alongside existing `has_active_platform_subscription()` because the new row has `status='active'` — trainer immediately gets full feature access. No app code changes needed.

---

### 5. Admin workflow (you, today)

```sql
-- Create a code
INSERT INTO promo_codes (code, description, discount_type, discount_value,
  plan_type, valid_from, valid_until, max_redemptions_total, max_redemptions_per_trainer)
VALUES ('LAUNCH-ANNUAL', 'Founding 20 trainers - free Elite year',
  'percent', 100, 'annual', '2026-05-03', '2026-06-30', 20, 1);

-- Grant it to a trainer (look up their profile.id first)
SELECT * FROM admin_redeem_promo_code('LAUNCH-ANNUAL',
  '<trainer-profile-uuid>', CURRENT_DATE);

-- Audit
SELECT * FROM promo_redemptions ORDER BY redeemed_at DESC;
```

---

### 6. What is intentionally NOT built (yet)

- No trainer-facing input field, no Razorpay discount math, no trainer notification, no admin UI. `discount_type`/`discount_value` are persisted so when checkout integration arrives later, the same codes work — but today every redemption is effectively a 100% comp.
- No admin role on profiles. Strictly service-role gated. Adding an admin role later is non-breaking.

---

### Files touched

- One migration: enum + 2 tables + RLS + RPC.
- No frontend changes.
- No edge functions.

After approval I will also save a memory note `mem://features/promo-codes/admin-comp-model` so future loops respect the service-role boundary.