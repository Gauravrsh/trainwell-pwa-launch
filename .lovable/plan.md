

## Root Cause Analysis

### Issue 1: "Razorpay button missing" (SS1)
There is no embedded Razorpay button widget on the modal — by design (per memory: `razorpay-checkout-flow-integrity-and-ux`, we use **hosted checkout link** opened in a new tab, not the embedded `<script data-payment_button_id>` widget). The "Proceed to Pay" button **is** the trigger — when clicked, it opens `https://razorpay.com/payment-button/{id}/view` in a new tab. So nothing is missing — the user is expecting an inline widget that we deliberately do not embed.

However, the **"SELECTED PLAN · Pro · ₹999/month"** chip below the cards is genuinely confusing because it shows **Pro** even when **Elite** is highlighted/selected at the top. That's a real bug — see Issue 3.

### Issue 2: "Elite Plan — Subscription expired — Read only" (SS2)
DB confirms: Gaurav has **one** subscription row, plan_type=`annual`, status=`pending_payment`, end_date=`2027-06-16`. The card shows "Expired" because of a logic bug in `useTrainerSubscription.tsx`:

```ts
const isReadOnly = isExpired || isPendingPayment;  // ← treats pending_payment as read-only
...
{status.isReadOnly ? 'Subscription expired - Read only mode' : ...}  // ← but copy says "expired"
```

`pending_payment` means *"trainer clicked Proceed but never completed payment on Razorpay"* — it is NOT expired. The card mislabels it. Worse, since this is his **only** subscription row and he was previously on free, the free tier is gone — replaced by an unpaid annual placeholder. He's locked out.

**The deeper bug:** `create_trainer_subscription` and `renew_trainer_subscription` overwrite/insert a `pending_payment` row *before* the user pays. If they abandon checkout (which Gaurav did — Razorpay returned `BAD_REQUEST_ERROR: Too many requests` per SS4), they're stuck in a permanent "pending_payment / read-only" purgatory with no free fallback.

### Issue 3: SS4 → "Too many requests" + selected plan mismatch
Two separate bugs converging:

**3a. Selected-plan display bug.** The chip in the modal renders `selectedPlanConfig` based on `selectedPlan` state, which defaults to `'annual'`. But the card click handler uses `setSelectedPlan(plan.id)`, and somewhere in the layout the **Pro** card got tapped (or the default `'annual'` is being overridden by the card render order). Looking at the code, the chip says "Pro · ₹999/month" while the Elite card is visually highlighted with the lime border in SS1 — meaning `selectedPlan` state and the visual highlight are **out of sync**, OR the user tapped Pro and the highlight in SS1 is residual styling. Either way, when he clicked Proceed, we called `renewPlan('annual')` (because chip showed Pro but state was annual?) — no, the screenshot is the smoking gun: chip says Pro, but Razorpay opened ₹9,999 (SS3). So the **chip displays the wrong plan** — `selectedPlanConfig` resolved to Pro but the API call sent annual. This is a stale-render / state-desync bug.

**3b. Razorpay "Too many requests" (SS4).** This is a **rate-limit** from Razorpay because the same `pl_S6ccDIYhIw1AaB` URL is being hit too rapidly (likely from React StrictMode double-invoke or the polling loop combined with `window.open` retries). The "X" on Razorpay's error page redirected to the actual checkout (SS3) — that's Razorpay's own fallback, not ours.

---

## Fix Plan

### Fix A — Stop creating `pending_payment` rows that strand the trainer
Modify `renew_trainer_subscription` and `create_trainer_subscription` RPCs so that **for trainers who currently have a `free` plan, we do NOT mutate their subscription until the webhook confirms payment**. Instead:
- Move the row creation to a **draft** stored client-side only (in-memory selectedPlan state).
- Actual DB write happens in `create_trainer_subscription_webhook` / `renew_trainer_subscription_webhook` (already exists, called by Razorpay webhook).
- Result: abandoned checkout = no DB damage, free tier remains intact.

### Fix B — One-time data repair for Gaurav
Delete his orphan `pending_payment` row and reinstate his free tier:
```sql
DELETE FROM trainer_platform_subscriptions WHERE id = 'ad08974a-f40e-40bd-b927-a1bfc320a103';
-- Then call start_trainer_free for trainer_id 'a7569e8a-...'
```
(Run as a one-shot migration.)

### Fix C — UI: rename "expired" → accurate state, fix chip desync
In `TrainerPlatformSubscription.tsx` & `useTrainerSubscription.tsx`:
- Add a new derived state `isPendingPayment` distinct from `isReadOnly`.
- Card copy when `pending_payment`: *"Payment incomplete — Complete checkout or stay on Free"* with two CTAs: **"Complete Payment"** and **"Cancel & Stay Free"**.
- The "Expired" label and read-only mode only apply to true `expired` / `grace`-elapsed states.

### Fix D — Remove the redundant/buggy "Selected plan" chip
Per the user's earlier suggestion (and now triply confirmed): delete the chip entirely. Inline the price into the CTA: **`Proceed to Pay · ₹9,999/year`**. Source-of-truth is the highlighted card → CTA reads from same `selectedPlanConfig`. Eliminates the desync class of bug.

### Fix E — Razorpay rate-limit hardening
- Disable the "Proceed to Pay" button for 2 seconds after click (debounce).
- Remove polling-loop side effects that could re-open the URL.
- Open the URL with `window.open(url, '_blank')` once, no fallback `window.location.assign` (which double-fires on some Android PWAs).

### Files touched
| File | Change |
|------|--------|
| `supabase/migrations/<new>.sql` | (1) Modify `create_trainer_subscription` & `renew_trainer_subscription` to not write `pending_payment` rows when trainer is on free; (2) one-shot: delete Gaurav's orphan row + start_trainer_free |
| `src/hooks/useTrainerSubscription.tsx` | Add `isPendingPayment` state separate from `isReadOnly`; `selectPlan`/`renewPlan` no longer call DB — just stores plan choice locally |
| `src/components/subscription/TrainerPlatformSubscription.tsx` | New "Payment incomplete" card variant with Complete/Cancel CTAs |
| `src/components/subscription/PlanSelectionModal.tsx` | Remove "Selected plan" chip; inline price in CTA; debounce Proceed button; remove fallback `window.location.assign` |

No changes needed to the Razorpay button IDs themselves (already correct).

