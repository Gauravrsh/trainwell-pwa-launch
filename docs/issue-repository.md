# TrainWell Issue Repository
> Indexed tracker for all debugged issues. Each issue has a unique ID to prevent recurrence.

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

*Last updated: 2026-04-06*
