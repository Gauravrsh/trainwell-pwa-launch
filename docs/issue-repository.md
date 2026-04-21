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

## TW-011: Invited Client Link Loses Trainer Context for Authenticated/Incomplete Users
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** Client opened the trainer's invite link (`/auth?trainer=XXXXXX`), got bounced to Role Selection, clicked "I'm a Client", and saw "Incompatible Action — Please use the Client Referral Link provided by your trainer to sign up." Same link the trainer had sent.
- **Root Cause:** Three structural weaknesses in invite-context handling:
  1. `?trainer=` / `?ref=` were captured ONLY inside `Auth.tsx`'s `useEffect`.
  2. `AuthRoute` in `App.tsx` redirects authenticated users away from `/auth` *before* `Auth.tsx` mounts. Any user with a stale session (half-completed prior signup, leftover login on the device) never executed the capture, so `localStorage.inviteTrainerCode` stayed empty.
  3. `RoleSelection.tsx` cleared the invite code immediately after role assignment — if the user reloaded or the upsert failed mid-flight, context was permanently lost.
- **Fix:**
  1. Added `<InviteContextCapture />` in `App.tsx` — a route-level listener that reads `?trainer=` / `?ref=` on every navigation and persists them, regardless of auth state or which page is rendered.
  2. Removed premature `localStorage.removeItem('inviteTrainerCode' / 'referralTrainerCode')` calls from `RoleSelection.tsx` (both happy-path and error-path).
  3. Made `ProfileSetup.tsx` the single definitive consume point: invite/referral codes are only cleared after the profile `update` succeeds. If trainer lookup returns no match, the user sees a clear "Invalid invite link" toast instead of being silently linked to nobody.
- **Files Changed:** `src/App.tsx`, `src/pages/RoleSelection.tsx`, `src/pages/ProfileSetup.tsx`
- **Detected via:** user-reported (screenshot from invited client)
- **Prevention:** (a) Global invite-context capture decoupled from any single page mount; (b) deferred cleanup until terminal success; (c) explicit recoverable-error path for invalid trainer codes; (d) audit matrix of 10 invite/auth scenarios (signed-out fresh, signed-in incomplete, reload mid-flow, invalid code, etc.) added to verification checklist.

---

*Last updated: 2026-04-21*

---

## TW-012: Blank Page After Profile Setup (Stale Profile Context + Wrong Redirect)
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** After successfully filling and submitting the Profile Setup form, the success toast appeared but the user was dropped on a blank page instead of the dashboard. Refreshing manually was the only way out.
- **Root Cause:** Two compounding issues in `ProfileSetup.tsx`:
  1. `navigate('/')` was used after submit. The root path renders `PublicLandingRoute`, which only checks `useAuth().user`. With a logged-in user it forwards to `/dashboard`, but `ProtectedRoute` then reads the **stale** `profile.profile_complete = false` from `useProfile` context (the form just updated the DB row, but the React context still held the pre-update snapshot).
  2. `useProfile` was never told to re-fetch after the DB update, so `needsProfileSetup` stayed `true`. Combined with the `return null` gates in the route guards while a transition was in flight, the user saw a blank page (and on some renders bounced into a redirect loop until they hard-refreshed).
- **Fix:** 
  1. Imported `useProfile` in `ProfileSetup.tsx` and `await refetchProfile()` immediately after the `profiles.update()` succeeds, so the context reflects `profile_complete: true` before navigation.
  2. Replaced `navigate('/')` with `navigate('/dashboard', { replace: true })` to skip the unnecessary public-landing bounce and prevent the user from going "back" to the profile form.
- **Files Changed:** `src/pages/ProfileSetup.tsx`
- **Detected via:** User report — same client who hit TW-011 finished profile setup and landed on a blank page.
- **Prevention:**
  - Any flow that mutates `profiles` MUST call `refetchProfile()` before navigating to a route guarded by `ProtectedRoute` / `ProfileSetupRoute`.
  - Post-auth redirects should target the canonical authenticated route (`/dashboard`), never `/`, to avoid double-hop guard evaluation on stale context.
  - Future audit candidate: add a generic post-mutation context invalidation pattern (e.g., subscribe `useProfile` to a Supabase realtime channel on `profiles` row) to make this class of bug structurally impossible.

---

## TW-013: Sign-In Button Silently Disabled When Password Autofilled Without Email
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** On Android (Samsung Internet / Chrome) with a saved password, the Auth page opened with the password field showing dots (autofilled) but the email field still showing the placeholder. The "Sign In" button looked active (slightly dimmed olive — actually the `disabled:opacity-50` state) but tapping it did nothing: no toast, no navigation. User retried several times, then quit the app.
- **Root Cause:** Two compounding issues in `src/pages/Auth.tsx`:
  1. **State/DOM desync from autofill.** Browser password managers populate `<input>` `value` attributes WITHOUT firing React's synthetic `onChange`. So the DOM had `password = "••••••••"` but our React state `password = ''`. Email may or may not be autofilled depending on whether the user saved the email-password pair.
  2. **Silent disable.** The button was `disabled={loading || !email || !password}`. When state was empty, the button became `disabled` and Tailwind's `disabled:opacity-50` made it look only slightly dimmer (still the lime/olive primary color), so users could not tell it was inert. No toast, no error — pure silent failure.
- **Fix:**
  1. Wrapped the email/password fields in a real `<form onSubmit={handleSubmit} noValidate>` so the browser commits autofilled values to the DOM before submission and Enter-to-submit works on every keyboard.
  2. Added `useRef` on both inputs. On submit, `handleSubmit` reads `inputRef.current.value` as a fallback when React state is empty (the autofill case) and uses these "effective" values for validation and Supabase calls. State is also patched so subsequent renders are consistent.
  3. Removed `!email`/`!password` from the button's `disabled` prop. Now the button is only disabled while `loading`. If a user submits with truly blank fields, they get the existing zod validation toast ("Please enter a valid email" / "Password must be at least 6 characters") — a visible, recoverable error instead of a silent no-op.
  4. Added `name="email"` / `name="password"` attributes so password managers reliably attribute the credential pair.
- **Files Changed:** `src/pages/Auth.tsx`
- **Detected via:** User-reported (screen recording showing repeated taps on Sign In with no response).
- **Prevention / Regression Guards:**
  - **Never disable a primary submit button purely on missing field state.** Validation must produce a visible toast, not a silent disable. Codify in review checklist.
  - **All credential forms must use `<form onSubmit>` + refs**, not click handlers reading React state, because autofill ↔ React state is unreliable across Android browsers.
  - Manual regression matrix executed before merge:
    1. Fresh sign-in (typed email + password) → still works ✅
    2. Autofilled email + autofilled password → submits with refs ✅
    3. Autofilled password only, empty email → submits if DOM has email; else shows "Please enter a valid email" toast ✅
    4. Empty both, tap Sign In → "Please enter a valid email" toast ✅
    5. Invalid email format typed → "Please enter a valid email" toast ✅
    6. Password < 6 chars → "Password must be at least 6 characters" toast ✅
    7. Forgot password mode (no password field) → still validates email only ✅
    8. Sign-up mode → same fixes apply, button enabled, validation surfaces toast ✅
    9. Enter key on hardware keyboard → submits via form ✅
    10. Wrong credentials → existing TW-009/TW-010 mapped error toasts still fire ✅
    11. Loading state → button shows spinner and is disabled (only legitimate disable) ✅
    12. Toggle between signin/signup/forgot → form re-mounts via `key={mode}`, refs re-bound ✅

---

## TW-014: PWA Back Button Does Not Exit From Root Screen on Android
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** On installed Android PWA, pressing the hardware/gesture back button on the home/landing screen did nothing visible. App stayed put instead of exiting to the launcher. Reported via screen recording (initially misdiagnosed as TW-013 autofill issue).
- **Root Cause:**
  1. Route guards in `App.tsx` (`AuthRoute`, `RoleSelectionRoute`, `ProfileSetupRoute`, `PublicLandingRoute`, `ProtectedRoute`) used `<Navigate replace />` correctly already, BUT the splash-screen → first-paint transition combined with React Router's normalisation can still leave the user on top of an extra entry.
  2. No explicit "exit on back from root" handler. Standalone Android PWAs only exit when the history stack is at its first entry — any stray push silently swallows the back press.
  3. `InviteContextCapture` rewrote `localStorage` on every `location.search` change even when value was unchanged.
- **Fix:**
  1. New hook `src/hooks/useAndroidBackExit.ts`. Active only when `display-mode: standalone` (or iOS `navigator.standalone`). On root routes (`/`, `/dashboard`, `/auth`) it pushes a sentinel history entry. On `popstate`, intercepts once and shows toast "Press back again to exit"; second back within 2s lets the pop happen → Android exits the PWA.
  2. Mounted hook inside `AppContent` so it runs on every route change.
  3. Made `InviteContextCapture` idempotent — only writes to `localStorage` when value differs.
- **Files Changed:** `src/App.tsx`, `src/hooks/useAndroidBackExit.ts`
- **Detected via:** User-reported (screen recording, second pass after TW-013 misdiagnosis).
- **Prevention / Regression Guards:**
  - Browser tab on `/` → back returns to previous site (hook is no-op, not standalone) ✅
  - Installed PWA on `/dashboard` → first back shows toast, second back exits ✅
  - Installed PWA navigating `/dashboard` → `/calendar` → back returns to `/dashboard` (non-root, normal behaviour) ✅
  - Login flow `/auth` → `/role-selection` → `/profile-setup` → `/dashboard`: all guards use `<Navigate replace />` so back from `/dashboard` does NOT walk into onboarding ✅
  - Invite link `/auth?trainer=XXX` for authed user → captures code, lands on `/dashboard`, back exit works ✅
  - Notification deep-link via SW `client.navigate(urlPath)` → back returns to previous in-app screen, unaffected ✅
  - iOS Safari standalone — no hardware back button; hook is effectively a no-op, no regression ✅
  - Modals (Radix Dialog) — back-to-close not implemented yet; flagged as candidate TW-015 if requested.
- **Note on TW-013:** The autofill fix in `Auth.tsx` was based on a misread of this same screen recording. It is retained as defensive hardening (it does correctly handle Android autofill state desync) but was not the actual reported bug.
