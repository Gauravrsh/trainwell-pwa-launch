# TrainWell Issue Repository
> Indexed tracker for all debugged issues. Each issue has a unique ID to prevent recurrence.
>
> **SOP-2 active.** Trigger keywords: `bug:` / `issue:` / `regression:`. Every debug response ends with a mandatory Closing Block. Quick-scan index lives at `docs/issue-repository-index.md`.
>
> **Entry template fields:** Severity, Status, Date Found, Symptom, Root Cause, Fix, Files Changed, Detected via, Prevention.

---

## TW-001: Razorpay Payment Button Embedded Script Freezes Mobile Browsers
- **Severity:** Critical
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-05
- **Symptom:** After clicking "Proceed to Pay", the modal and entire app froze on Android. Back button, typing, and scrolling all became unresponsive.
- **Root Cause:** Injecting Razorpay's `payment-button.js` script created an iframe overlay that captured all touch/click events. The Radix Dialog's focus trap (`onInteractOutside`, `onEscapeKeyDown`) conflicted with the iframe.
- **Fix:** Replaced embedded script injection with a direct hosted checkout link (`window.open` / `window.location.assign`). Removed Radix Dialog interaction traps.
- **Files Changed:** `src/components/subscription/PlanSelectionModal.tsx`

---

## TW-002: Plan Selection Modal Not Defaulting to Annual Plan
- **Severity:** Medium
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-05
- **Symptom:** Modal opened with no plan selected or wrong plan pre-selected.
- **Root Cause:** `selectedPlan` state was not reset to `'annual'` when the modal re-opened.
- **Fix:** Added `useEffect` that sets `setSelectedPlan('annual')` on every `open` change to `true`.
- **Files Changed:** `src/components/subscription/PlanSelectionModal.tsx`

---

## TW-003: Webhook Cannot Identify Trainer After Payment Button Payment
- **Severity:** Critical
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-06
- **Symptom:** After successful UPI payment, the trainer's subscription remained inactive. Webhook logs showed `trainerProfileId: undefined, planType: undefined`.
- **Root Cause:** Razorpay Payment Buttons do not support custom `notes` metadata. The webhook relied on `notes.trainer_profile_id` and `notes.plan_type` to identify the trainer, which were always empty for Payment Button payments.
- **Fix:** 
  1. **Frontend:** `PlanSelectionModal` now calls `onSelectPlan()` BEFORE opening the Razorpay page. This creates a `pending_payment` record in `trainer_platform_subscriptions` with the correct `trainer_id` and `plan_type`.
  2. **Webhook:** Added fallback logic — when `notes` are empty, the webhook infers `plan_type` from payment amount (₹499 → monthly, ₹5988 → annual) and matches against the most recent `pending_payment` subscription of that type.
- **Files Changed:** `supabase/functions/razorpay-webhook/index.ts`, `src/components/subscription/PlanSelectionModal.tsx`

---

## TW-004: No Redirect Back to TrainWell After Successful Payment
- **Severity:** Critical
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-06
- **Symptom:** After successful UPI transaction, user remained on the Razorpay payment page. Had to manually close the page by clicking the cross multiple times.
- **Root Cause:** Razorpay Payment Button hosted pages do not support `callback_url` for automatic redirect.
- **Fix:** Implemented client-side polling in `PlanSelectionModal`. After the payment window opens, the modal shows a "Waiting for payment confirmation" spinner and polls the `trainer_platform_subscriptions` table every 5 seconds. When the webhook activates the subscription (status → `active`), the app automatically shows a success toast, closes the modal, and navigates to `/home`.
- **Files Changed:** `src/components/subscription/PlanSelectionModal.tsx`

---

## TW-005: Annual Plan Duration Incorrect (365 days instead of 425)
- **Severity:** Medium
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-06
- **Symptom:** Annual plan marketed as "14 months access" but webhook only granted 365 days (12 months).
- **Root Cause:** Webhook hardcoded `durationDays = 365` for annual plan.
- **Fix:** Changed annual plan duration to 425 days (~14 months) in the webhook.
- **Files Changed:** `supabase/functions/razorpay-webhook/index.ts`

---

## TW-006: React forwardRef Deprecation Warnings in Console
- **Severity:** Low
- **Status:** 🔶 Known / Non-blocking
- **Date Found:** 2026-04-06
- **Symptom:** Console warnings about `forwardRef` in `FoodLogModal`, `PlanSelectionModal`, and `BottomNav`.
- **Root Cause:** React 18.3 deprecation warnings for `forwardRef` pattern used by Radix UI primitives.
- **Impact:** No functional impact. Will resolve when Radix UI updates.

---

## TW-007: Calendar Dates Not Color-Coded by Workout Status
- **Severity:** Medium
- **Status:** 🔶 To Investigate
- **Date Found:** 2026-04-06
- **Symptom:** All calendar dates appear the same color (grey) regardless of workout completion status.
- **Root Cause:** Needs investigation — may be missing data or styling logic not applied.

---

## TW-008: Supabase Project Auto-Paused After 7 Days of Idle Activity
- **Severity:** Critical
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-20
- **Symptom:** Supabase Free-tier project paused itself after a quiet week. All API/DB calls failed until manually resumed. No proactive guard was in place.
- **Root Cause:** Free-tier auto-pauses after ~7 consecutive days of zero API/DB activity. The platform had no scheduled job to keep the database "warm".
- **Fix:** Added a `pg_cron` job `vecto-daily-heartbeat` (runs daily at 03:17 UTC / 08:47 IST) that calls `record_heartbeat()` — inserts one row into internal `_system_heartbeat` table and prunes rows older than 90 days. RLS-locked with zero policies (invisible to all app users). Pure in-DB write, no edge function dependency.
- **Files Changed:** `supabase/migrations/20260420091139_*.sql`

---

## TW-009: Signup Disabled in Supabase Auth Blocked All New Users
- **Severity:** Critical
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** Trainer `unja284@gmail.com` could not sign up. Frontend showed generic "Something went wrong" instead of the real reason.
- **Root Cause:** `disable_signup = true` was set on the Supabase Auth config, blocking all registration. Compounded by `errorUtils.ts` lacking a regex pattern for the "Signups not allowed" response, so it fell through to the default message.
- **Fix:** Re-enabled signups via `configure_auth` (client direct-signup remains gated by `RoleSelection.tsx` invite-link logic). Added explicit error mappings for `signups not allowed`, `weak_password`, `invalid email` in `errorUtils.ts`.
- **Files Changed:** `src/lib/errorUtils.ts`

---

## TW-010: HIBP "Pwned Password" Error Shown as Generic Message
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** Same user reported the issue persisted after TW-009 fix. End-to-end auth audit traced it to Supabase's HIBP (Have I Been Pwned) check returning `"Password is known to be weak and easy to guess, please choose a different one."` — not matched by any existing regex, so users saw "Something went wrong" with no guidance.
- **Root Cause:** `errorUtils.ts` regex patterns didn't cover Supabase's specific HIBP wording or the `weak_password` error code variant returned by the breach-database lookup.
- **Fix:** Added precise patterns: `password is known to be weak`, `known.*weak.*easy to guess`, `^weak[_ ]password$`, plus broader `pwned|compromised|breach` matchers. Audited 11 auth scenarios (direct signup, invite signup, referral signup, signin, password reset, rate-limit) — all now surface human-readable errors.
- **Files Changed:** `src/lib/errorUtils.ts`

---

*Last updated: 2026-04-21*
