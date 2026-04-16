

# Plan: Fix Signup Auto-Login, Subscription Banner Flash, Rename to Manage Billing, Mark as Paid, Plan Card Cleanup

## 1. Signup → Auto Sign-In (no re-login required)

**Problem**: After signup, users see "Account created! You can now sign in" and must manually sign in again.

**Fix**: Enable auto-confirm for email signups via `cloud--configure_auth`, then change `Auth.tsx` so after a successful `signUp`, it navigates directly to `/` instead of switching to sign-in mode. The `onAuthStateChange` listener will pick up the new session automatically.

**Files**: 
- `src/pages/Auth.tsx` — remove the `setMode('signin')` block after signup, navigate to `/` instead
- Auth config — enable auto-confirm

**Also**: Broaden error patterns in `src/lib/errorUtils.ts` to catch Supabase variants like "A user with this email address has already been registered" and add "Email rate limit exceeded" pattern.

## 2. Calendar UI — HELD (awaiting your input)

## 3. "Select Plan" Banner Flash for All Users (including active subscribers like Vaishnavi)

**Root cause**: `useSubscriptionAccess` returns `isReadOnly: true` with `reason: 'no_subscription'` while `loading` is still `true` (subscription data hasn't loaded yet). The banner renders immediately based on this premature state.

**Fix in `useSubscriptionAccess.tsx`**: When `loading` is `true`, return a safe default: `{ loading: true, hasAccess: true, isReadOnly: false, reason: null }` — preventing the banner from flashing.

**Fix in consumers** (3 files): Gate the banner on `!loading`:
- `src/components/dashboard/TrainerDashboard.tsx` line 123: `{!loading && isReadOnly && (`
- `src/pages/Calendar.tsx` line 937: same pattern for `subscriptionReadOnly`
- `src/components/training-plans/PlansList.tsx`: same pattern

**Files**: `src/hooks/useSubscriptionAccess.tsx`, `TrainerDashboard.tsx`, `Calendar.tsx`, `PlansList.tsx`

## 4. Rename "Manage Plans" → "Manage Billing"

**File**: `src/components/training-plans/PlansList.tsx`
- Change "Training Plans" subtitle → "Billing & Plans"
- Change "Manage Plans" header → "Manage Billing"

## 5. Add "Mark as Paid" / Record Payment

**New file**: `src/components/training-plans/ManageBillingModal.tsx`
- Shows plan billing summary (total, paid, due)
- Input field for payment amount
- "Mark as Paid" button that updates `amount_paid` on the plan

**File**: `src/hooks/useTrainingPlans.tsx`
- Add `markAsPaid` function using `updatePlanMutation` to increment `amount_paid`

**File**: `src/components/training-plans/PlanCard.tsx`
- Add "Record Payment" dropdown menu item for active/paused plans

## 6. Remove Service Type from Plan Cards

**File**: `src/components/training-plans/PlanCard.tsx`
- Remove `serviceLabels` map and the service type badge from JSX (line 117)
- Always show single `Dumbbell` icon with `bg-primary/20` (remove conditional icon logic at lines 101-112)
- Remove `Utensils` import if no longer needed

## Summary of All Files Changed

| File | Change |
|------|--------|
| Auth config | Enable auto-confirm email signups |
| `src/pages/Auth.tsx` | Auto-navigate after signup instead of switching to sign-in |
| `src/lib/errorUtils.ts` | Broader auth error regex patterns |
| `src/hooks/useSubscriptionAccess.tsx` | Return safe defaults while loading |
| `src/components/dashboard/TrainerDashboard.tsx` | Gate banner on `!loading` |
| `src/pages/Calendar.tsx` | Gate banner on `!loading` |
| `src/components/training-plans/PlansList.tsx` | Gate banner + rename header |
| `src/components/training-plans/PlanCard.tsx` | Remove service type UI, add Record Payment menu item |
| `src/hooks/useTrainingPlans.tsx` | Add `markAsPaid` helper |
| `src/components/training-plans/ManageBillingModal.tsx` | **New** — payment recording modal |

