# PRD: Pricing Overhaul + Calendar UI Simplification

## PART A — PRICING OVERHAUL

### A.1 Three-tier model


| Tier        | Price       | Clients             | Validity                    | Notes                                        |
| ----------- | ----------- | ------------------- | --------------------------- | -------------------------------------------- |
| **Free**    | ₹0 forever  | 3 concurrent active | Unlimited                   | All features unlocked (Name it "Smart")      |
| **Monthly** | ₹999/month  | Unlimited           | 30 days + 3-day grace       | All features (Name it "Pro"                  |
| **Annual**  | ₹9,999/year | Unlimited           | 365 + 60 days (12+2 months) | Best value, ~₹714/mo equiv (Name it "Elite") |


### A.2 "Active client" definition (Free tier guardrail)

A client counts toward the 3-slot Free limit **only if they have at least one `client_training_plans` row with status = `'active'**`. Removing/cancelling a plan instantly frees the slot. `'completed'`, `'cancelled'`, `'draft'` plans don't count.

### A.3 Database changes

1. **Migrate existing trial subscriptions** — `start_trainer_trial` and supporting code change semantics: instead of 14-day trial, free tier becomes the permanent default for new trainers. Existing trial users auto-convert to free.
2. **Update `create_trainer_subscription` RPC**: monthly amount `499 → 999`, monthly duration unchanged (30); annual amount `5988 → 9999`, annual duration `365 → 425` days (12 months + 2 bonus months ≈ 60 days).
3. **Update `renew_trainer_subscription**`: same price/duration changes.
4. **Update `renew_trainer_subscription_webhook` & `create_trainer_subscription_webhook**`: accept new duration.
5. **New RPC `get_active_client_count(trainer_id)**` — returns count of distinct client_ids with active plan.
6. **Update `has_active_platform_subscription**`: also returns true when trainer has free tier (so trainer can write data) **AND** active client count ≤ 3. New helper `can_trainer_add_client(trainer_id)` for invite gating.

### A.4 Razorpay button IDs

**ACTION REQUIRED FROM USER POST-APPROVAL**: Create new Razorpay payment buttons for ₹999 monthly and ₹9,999 annual, then provide the new button IDs. Existing IDs (`pl_S6cIGsJyU7Owle`, `pl_S6ccDIYhIw1AaB`) must be replaced in `PlanSelectionModal.tsx` whitelist.

### A.5 UI updates

- `src/components/landing/PricingSection.tsx`: 3 cards (Free (name it Smart) | Monthly (Name it Pro) | Annual (Name it Elite)), Annual highlighted. Remove "14-day trial" footer. Add Beta banner at top.
- `**src/components/subscription/PlanSelectionModal.tsx**`: Show 3 plans (Free is default, no-payment "Continue Free"), update prices, add Beta banner.
- `**src/components/subscription/TrainerPlatformSubscription.tsx**`: Show "Free Plan — 2/3 active clients" with progress when on free tier; CTA "Upgrade for unlimited clients".
- `**src/components/training-plans/PlansList.tsx` & client invite flow**: Block creating a new active plan if count ≥ 3 on free tier; show toast: "Free plan limit reached (3 active clients). Upgrade to Monthly/Annual for unlimited."
- `**src/pages/Terms.tsx**`: Replace Subscription Terms accordion with new 3-tier T&C (see A.6).
- `**src/components/training-plans/PlanCard.tsx` & `ManageBillingModal**`: No price changes here (these are trainer↔client plans, separate from platform).

### A.6 Terms & Conditions — new copy

**Free Plan**

- ₹0, no expiry. All features available.
- Hard limit: maximum 3 concurrent **active** training plans across all clients.
- A client occupies a slot only while at least one of their plans is in `active` status. Completing or cancelling a plan frees the slot.

**Monthly Plan — ₹999/month**

- 30 days validity from payment date + 3 days grace period.
- Unlimited active clients during the validity window.
- Auto-downgrades to Free (3-client cap enforced) on grace expiry — existing data is retained, but trainer will need to select 3 clients on which to continue. Rest clients will get disabled.
- The disabled clients will get enabled as soon as trainer renews the plan.
- No refunds for partial months.

**Annual Plan — ₹9,999/year**

- 365 days base + 60 bonus days = **425 days total validity**.
- Unlimited active clients.
- Auto-downgrades to Free (3-client cap enforced) on grace expiry — existing data is retained, but trainer will need to select 3 clients on which to continue. Rest clients will get disabled.
- The disabled clients will get enabled as soon as trainer renews the plan.

**Beta Pricing Notice**

> Prices shown are special launch pricing for early users. Subject to revision after the beta period. Existing paid subscribers will continue at their paid rate until renewal.

### A.7 Beta banner spec

- **Landing PricingSection**: full-width banner above the pricing grid — `bg-primary/10 border-primary/30`, lime accent, copy: *"⚡ Special Beta Pricing — Limited Time. Lock in these rates while you can."*
- **PlanSelectionModal**: compact pill at top of scroll area, same copy shorter: *"Special Beta Pricing"*.
- Pure marketing element, no backend flag (per your answer).

---

## PART B — CALENDAR UI SIMPLIFICATION

### B.1 Tile state model (only 3 visual states)


| State                          | Boundary                      | Fill        | Content            | Trigger                                                 |
| ------------------------------ | ----------------------------- | ----------- | ------------------ | ------------------------------------------------------- |
| **Today / Active**             | Neon lime (current behavior)  | Lime fill   | Date number, white | `isSameDay(date, today)`                                |
| **Successfully Logged**        | Green 2px (current thickness) | Transparent | Date number only   | Any of: workout completed, food logged, OR steps logged |
| **Not Logged → Holiday**       | Gray 2px                      | Transparent | Date number only   | `day_marks.mark_type = 'holiday'`                       |
| **Not Logged → Trainer Leave** | Amber 2px                     | Transparent | Date number only   | `mark_type = 'trainer_leave'`                           |
| **Not Logged → Client Leave**  | Red 2px                       | Transparent | Date number only   | `mark_type = 'client_leave'`                            |
| **Default / blank**            | Transparent                   | Card bg     | Date number, muted | No log, no mark, not today                              |


**Removed visual elements**: All bottom-of-tile chips/dots/icons (Check, X, Dumbbell, "TL"/"CL"/"HL" text labels, fill backgrounds like `bg-success/20`). Tile shows ONLY the date number plus a colored boundary.

### B.2 Files affected — Calendar.tsx

1. `**getStatusStyles**` (line 228): replace fill+icon styles with boundary-only. Returns `{ borderColor: 'border-success' }` for completed, etc.
2. `**getDayMarkStyles**` (line 259): replace with boundary-only colors per the table above. Drop `chipBg`, `chipText`, `label`.
3. **Tile rendering JSX** (lines 1057–1130): remove `dayMark chip`, `statusStyles indicator`, `Dumbbell` overlay, the `mb-0.5` shifting. Apply boundary class only via `border-{color}` on the button.
4. **"Successfully logged" detection**: extend beyond just `workout.status === 'completed'`. Treat date as logged if any of (a) workout exists with status completed, (b) food log row exists for date, (c) step log row exists for date. Add a derived `loggedDates` Set built from existing queries — fetch food_logs & step_logs once per viewer.
5. **Status legend** (lines 1134–1179): rewrite to match new 3-color scheme (Today/Logged/Holiday/Trainer Leave/Client Leave). Remove icons; show only boundary swatches.
6. `**skipped` workouts**: no longer get a destructive fill. They render as default (blank). The "missed" concept is now expressed via Client Leave only when explicitly marked.

### B.3 Billing impact rules (already partially in code at lines 478–540, will be cleaned up)


| Mark                   | Plan billing impact                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Holiday (HL)**       | None. Date is logged-as-holiday for visibility. Validity unchanged.                                                                     |
| **Client Leave (CL)**  | None on validity ("clock keeps ticking"). Increments `missed_sessions` on active plan for trainer reporting.                            |
| **Trainer Leave (TL)** | Extends `client_training_plans.end_date` by 1 day per TL marked. Reverses on un-mark. (Already implemented; add unit comment + verify.) |


Add a small note in the trainer's Day Mark sheet UI: *"TL extends plan end date · CL keeps billing running · HL is informational"*.

### B.4 Where marks can be set

Unchanged from current rules: only today + future. Past dates locked. Marking already-logged date prompts confirmation that mark replaces the log visually but keeps log data intact.

---

## PART C — Files changed (summary)


| File                                                            | Change                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DB migration**                                                | Update `create_trainer_subscription`, `renew_trainer_subscription`, webhooks; add `get_active_client_count`, `can_trainer_add_client`; modify `start_trainer_trial` → `start_trainer_free` (free, no expiry) |
| `src/hooks/useTrainerSubscription.tsx`                          | New `'free'` plan type, free-tier slot count, drop trial logic                                                                                                                                               |
| `src/hooks/useSubscriptionAccess.tsx`                           | Free tier = full access; gate invite based on `can_trainer_add_client`                                                                                                                                       |
| `src/components/landing/PricingSection.tsx`                     | 3 cards + Beta banner                                                                                                                                                                                        |
| `src/components/subscription/PlanSelectionModal.tsx`            | 3 plans, new prices, Beta pill, new Razorpay IDs                                                                                                                                                             |
| `src/components/subscription/TrainerPlatformSubscription.tsx`   | Free plan view + slot counter                                                                                                                                                                                |
| `src/components/subscription/SubscriptionEnforcementBanner.tsx` | New copy: "Free plan — 3/3 used. Upgrade to add more."                                                                                                                                                       |
| `src/components/training-plans/PlansList.tsx`                   | Block 4th active plan creation on free tier                                                                                                                                                                  |
| `src/pages/Auth.tsx` / RoleSelection / ProfileSetup             | Remove trial messaging; new trainers auto-get free tier                                                                                                                                                      |
| `src/pages/Terms.tsx`                                           | New 3-tier subscription T&C copy + Beta clause                                                                                                                                                               |
| `src/pages/Calendar.tsx`                                        | Tile rendering rewrite (boundary-only), legend, day-mark styles                                                                                                                                              |
| `docs/landing-page-prd.md` & `docs/issue-repository.md`         | Update pricing references                                                                                                                                                                                    |


## PART D — Open items needing user action AFTER approval

1. **New Razorpay payment button IDs** (₹999 monthly, ₹9,999 annual) — must be generated in Razorpay dashboard and shared.
2. **Existing paid subscribers** (Vaishnavi etc. on ₹499/₹5,988): grandfather at old price until next renewal? Default plan: yes, grandfather.
3. **Existing 14-day trials in flight**: convert to Free immediately (3-client cap kicks in if currently >3 active plans → trainer sees banner "Reduce to 3 or upgrade").