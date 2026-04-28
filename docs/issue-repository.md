# TrainWell Issue Repository
> Indexed tracker for all debugged issues. Each issue has a unique ID to prevent recurrence.
>
> **SOP-2 active.** Trigger keywords: `bug:` / `issue:` / `regression:`. Every debug response ends with a mandatory Closing Block. Quick-scan index lives at `docs/issue-repository-index.md`.
>
> **Entry template fields:** Severity, Status, Date Found, Symptom, Root Cause, Fix, Files Changed, Detected via, Prevention.

---

## TW-001: Razorpay Payment Button Embedded Script Freezes Mobile Browsers
- **Severity:** Critical
- **Status:** ✅ Fixed (reopened once for Apple Watch photo OCR fragmentation, then re-fixed)
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

---

## TW-015: Back Button After Sign-Out Re-Enters /auth In Browser Due To Stale History
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** In Chrome on Android (NOT installed PWA), after signing out from `/profile`, pressing back from the landing page or `/auth` repeatedly bounced the user back to `/auth` instead of exiting. TW-014's PWA fix did not cover this because it deliberately no-ops outside `display-mode: standalone`.
- **Root Cause:**
  1. `Profile.handleSignOut` called `navigate('/')` without `replace`, leaving `/profile` in the history stack.
  2. No global "auth flipped to signed-out" handler purged stale protected entries from the stack at the moment of sign-out.
  3. Result: pressing back hit `/profile`, `ProtectedRoute` saw no user, did `<Navigate to="/auth" replace />`, URL snapped to `/auth`. To the user this looked like "back is broken — it just reloads /auth".
- **Fix:**
  1. `src/pages/Profile.tsx` — `navigate('/', { replace: true })` on sign-out.
  2. `src/hooks/useAuth.tsx` — on `SIGNED_OUT` event, if current path is non-public, `window.history.replaceState(null, '', '/')`. Guarantees the protected route the user was on is overwritten in the stack at the exact moment auth dies, so back can never walk back into a re-redirect loop. Also covers session expiry / token refresh failure paths, not just explicit sign-out.
- **Files Changed:** `src/pages/Profile.tsx`, `src/hooks/useAuth.tsx`
- **Detected via:** User-reported (screen recording, Chrome on Android).
- **Prevention / Regression Guards:**
  - Sign in → `/dashboard` → `/profile` → Sign Out → lands on `/`. Back exits to previous site/tab (does NOT bounce into `/auth`) ✅
  - Sign in → `/plans` → `/profile` → Sign Out → `/` → tap "Sign In" → `/auth`. Back → `/`. Back again → exits ✅
  - Session expiry mid-app → `SIGNED_OUT` listener replaces history entry → back behaves correctly ✅
  - Signed-in normal in-app navigation → unchanged (no `replace` added to in-app nav) ✅
  - Standalone PWA paths from TW-014 → unchanged (sentinel + double-tap exit) ✅
  - `ProtectedRoute` already uses `<Navigate replace />` — no double-push from redirect itself.

---

## TW-016: Loading State Placeholder Lacks Brand Quote
- **Severity:** Low
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-21
- **Symptom:** During lazy-loaded route chunk fetches (Calendar → Progress → Plans, etc.), the `RouteFallback` showed only the bare "VECTO" wordmark + tagline. Visually identical to the cold-start splash, so navigations felt frozen / re-launched.
- **Root Cause:** `RouteFallback` rendered only the wordmark with no signal that the app was loading the next screen.
- **Fix:** New component `src/components/LoadingQuote.tsx` renders one of 10 consistency-themed quotes (italic, attributed) under the wordmark. Picked at random per mount, so each navigation may show a different quote. Cold-start `SplashScreen` is intentionally NOT changed — it's visible <1s and shouldn't be a reading exercise.
- **Files Changed:** `src/components/LoadingQuote.tsx` (new), `src/App.tsx`
- **Detected via:** User-reported.
- **Prevention / Regression Guards:**
  - Cold start → splash unchanged, <1s ✅
  - Logged-in navigation between code-split routes → quote visible under wordmark ✅
  - Cached chunk re-nav → no fallback shown (no flicker) ✅
  - Quote uses `text-muted-foreground` semantic token, no hardcoded colors ✅

---

## TW-019: Stale "14 Bonus Days" Copy in Refer Page After Pricing Model Changed
- **Severity:** Medium
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-24
- **Symptom:** The trainer Refer page still advertised "get 14 bonus days on your first subscription" in the Web-Share text and in step 4 of "How Trainer Referral Works". This contradicted the live Smart-tier free model (3 free clients, no bonus days for the referee).
- **Root Cause:** Pricing model evolved from "trial + bonus days" to "Smart free tier (3 clients) + paid Monthly/Annual". The referral copy was not updated when pricing memory was updated.
- **Fix:**
  1. Trainer share text replaced with: *"Run your 1:1 coaching practice on Vecto. Start free on Smart (3 clients). Sign up with my link."*
  2. "How Trainer Referral Works" step 4 replaced with: *"They start free on Smart (3 clients). When they upgrade, you get the validity bonus."*
  3. Client share text tightened per user spec: *"I'd like to track your training on Vecto. A platform that drives consistency and discipline, which gets us results. Sign up with this link — it auto-connects you to me. Logging starts day one."*
- **Files Changed:** `src/pages/Refer.tsx`
- **Detected via:** PRD review round (Item 4) — copy audit against `mem://brand/pricing-strategy`.
- **Prevention / Regression Guards:** Copy now matches the single source of truth in `mem://brand/pricing-strategy`. Refer page renders for trainers only — unchanged. Reward Matrix table (Monthly/Monthly→15d, Monthly/Annual→30d, Annual/Annual→90d) was already correct and untouched.

---

## TW-020: Invited Client Briefly Lands on Role Selection Instead of Going Straight to Profile Setup
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-24
- **Symptom:** A client signing up via a trainer's invite link saw the Role Selection screen flash for 1–2 seconds before being moved on. Worse, while that screen was visible the role tiles were rendered but click handlers were no-ops (gated by `autoProcessing` state) — clicking either tile did nothing. If the auto-link RPC failed transiently, the user fell back to the live role tiles, an invalid path for an invited client.
- **Root Cause:** `RoleSelection.tsx` mounted the role-tiles UI first, then fired the RPC chain inside a `useEffect`, then disabled tile clicks while `autoProcessing` was true. The intermediate render window exposed the wrong UI and made the page feel broken.
- **Fix:** Moved the auto-link logic into `RoleSelectionRoute` in `App.tsx`. When `localStorage.inviteTrainerCode` is present and the user has no profile, the route guard runs `generate_unique_id` → `lookup_trainer_by_unique_id` → `profiles` upsert → `refetchProfile`, then ProtectedRoute redirects to `/profile-setup` automatically. While in flight, the route renders only a minimal "Linking you to your trainer…" status surface — never the role tiles. On RPC failure, a Sonner toast offers a Retry action; the role tiles remain unreachable for invited clients. Removed the entire `autoProcessing` branch from `RoleSelection.tsx`.
- **Files Changed:** `src/App.tsx`, `src/pages/RoleSelection.tsx`
- **Detected via:** User-reported, verified via session replay (clicks on tiles produced no navigation).
- **Prevention / Regression Guards:**
  - Trainer signup with `referralTrainerCode` only (no `inviteTrainerCode`) → still sees Role Selection ✅
  - Trainer signup with no codes → unchanged ✅
  - Direct client signup with no code → already blocked by `mem://features/client-invite/signup-restriction-policy` ✅
  - TW-011 (invite context preservation through ProfileSetup) preserved — `inviteTrainerCode` is still consumed at ProfileSetup completion only ✅
  - TW-012 (refetch profile before navigate) preserved — auto-link calls `refetchProfile` before redirect ✅
  - TW-014 / TW-015 history hygiene preserved — guard uses `<Navigate replace />`, no stack pollution ✅

---

## TW-021: Steps OCR Assist — Fitness-Tracker Screenshot Pre-Fills Step Count
- **Severity:** Medium (feature-add, not a regression)
- **Status:** ✅ Shipped
- **Date Found:** 2026-04-24
- **Symptom / Need:** Clients were typing step counts from their phone's fitness tracker manually, which is friction and error-prone. Wanted a one-tap way to import the count without adding an API key or server dependency.
- **Approach:** Added a "Scan screenshot" action inside `StepLogModal`. When tapped, the user picks a screenshot from their camera roll; Tesseract.js runs OCR entirely client-side (no API key, no data leaving the device), extracts candidate numbers, and pre-fills the step count field. **User must still tap Save** — OCR never writes to the DB directly, matching the "manual tracking" DNA.
- **Extraction Heuristic (`src/lib/stepOcr.ts → extractStepCount`):** Matches comma-grouped, space-grouped, and Indian lakh-grouped numbers. Rejects anything adjacent to "kcal" / "calorie" (calorie burn), equal to the current year (date headers), below 100, or above 100,000. Picks the largest surviving candidate, since on every fitness-tracker screenshot the step count is rendered as the biggest number on screen.
- **Files Changed:** `src/components/modals/StepLogModal.tsx` (new Scan button + notice), `src/lib/stepOcr.ts` (new helper), `src/test/stepOcr.test.ts` (9 unit tests), `package.json` (`tesseract.js` dependency, lazy-loaded).
- **Detected via:** Planned Phase 5 enhancement (Item 3 of 8-item roadmap).
- **Prevention / Regression Guards:**
  - `tesseract.js` is dynamically imported inside `scanStepCountFromImage`, so it never ships in the initial bundle and public landing/auth stay as fast as before ✅
  - Manual input path unchanged — existing `stepCount` state, `onSave` callback, and validation (`parseInt > 0`) all untouched ✅
  - OCR failure (worker crash, bad image) falls back to the existing manual flow with a clear message; `logError('StepLogModal.ocr', err)` ✅
  - No DB schema change; no new RLS policy; no new edge function ✅
  - Unit tests cover the top confusion cases: calorie adjacency, current-year header, Indian comma grouping ✅

---

## TW-022: Steps OCR Picks Goal/kcal/Distance Instead of Actual Steps (Regression on TW-021)
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-24
- **Reported by:** Trainer debugging client 6486580 (Gaurav Sharma) — reported wrong step counts on 4+ consecutive uploads (Apple Watch + Samsung Health screenshots).
- **Symptom:** The OCR consistently pre-filled the step *goal*, *calorie burn*, or *distance* instead of the actual step count.
  - Samsung Health "6,729 / 15,000 steps / 2,397 kcal" → pre-filled **15,000** (goal) or **2,397** (kcal).
  - Apple Watch "Steps 6,419 / Distance 4.34 KM / 8:47" → pre-filled **434** (distance decimal stripped) or random value.
- **Root causes:**
  1. Tesseract was called with a digit-only whitelist (`0123456789,. `). That stripped *every letter* from the OCR output, so the regex filter for "kcal" / "steps" / "goal" context had nothing to match against.
  2. Extraction used `Math.max(...candidates)` — but on fitness screens the step goal and kcal are often larger than the actual step count.
  3. No spatial / visual signal was used, even though on every tracker the step count is rendered as the biggest number.
  4. `MAX_STEPS = 100000` let numbers like 15000 (goal), 10000 (goal) and 2397 (kcal) through unchallenged.
  5. Clock times like "8:47" partially leaked as `847` candidates.
- **Fix (`src/lib/stepOcr.ts`):**
  - Dropped the Tesseract character whitelist — now reads full text incl. keywords.
  - Replaced `Math.max` with a **scoring algorithm**:
    - `+100` if "step"/"steps" appears in the adjacent text window (20 chars before/after).
    - `−200` if "kcal", "calorie", "km", "m", "bpm", "min", "%" follows the number.
    - `−150` if "goal"/"target" is the *immediately* preceding label (12 chars), or if "/" precedes the number ("/15,000 steps" = goal denominator).
    - `−300` / hard-reject for clock patterns (`HH:MM`).
    - `−250` / hard-reject for decimals (distances, not steps).
    - `+height_in_px` (bbox-level path only) so visually biggest wins ties.
  - Added a bbox-aware extraction path (`extractFromWords`) that consumes Tesseract's word-level output with bounding boxes and scores neighbours on the same visual row; falls back to the text-only `extractStepCount` if blocks are unavailable.
- **Files Changed:** `src/lib/stepOcr.ts` (rewrite), `src/test/stepOcr.test.ts` (+5 real-world layout tests), `docs/issue-repository*.md`, memory file.
- **Tests Added:**
  - Apple Watch layout with 4.34 KM distance + 8:47 clock.
  - Apple Watch variant with 2.54 KM + 8:51 clock.
  - Samsung Health "6,729 / 15,000 steps / 2,397 kcal".
  - Mi Fit "Goal 10,000 Steps 7,245".
  - Google Fit "8,432 steps • 2,134 kcal".
- **Test Status:** 14/14 stepOcr tests green, 156/156 full suite, typecheck clean ✅
- **Regression Guards:**
  - All 9 original TW-021 unit tests still pass (including calorie adjacency, current-year header, Indian grouping) ✅
  - No bundle impact — `tesseract.js` is still lazy-imported inside `scanStepCountFromImage` only ✅
  - Manual input path unchanged; OCR still never writes to DB directly — user must confirm and Save ✅
  - No DB / RLS / edge function changes ✅
  - Apple Watch photo OCR now stitches fragmented thousands groups (e.g. `3,92` + `5` → `3,925`) before scoring, preventing false low values or fallback misses ✅

---

## TW-024: Stale PWA Cache Resurrects Old Calendar Dots/Icons and Removed UI
- **Severity:** High
- **Status:** ✅ Fixed (with follow-up TW-024b for auto-recovery)
- **Date Found:** 2026-04-27
- **Reported by:** Trainer debugging client `6486580` and user `gaurav.sharma@fplabs.tech`.
- **Symptom:** Calendar repeatedly showed old UI markers — green/red/grey dots, dumbbell icons on dates, and circular legend states — even though the current guideline is boundary-only date styling for Logged, TL, CL, HL, and Today. The same stale surface also explained removed dummy settings/notification UI and old Terms content returning after install/uninstall cycles.
- **Root Cause:** The production Service Worker was minimal and did not version the app shell, call `skipWaiting()`, claim clients, purge old caches on activation, or force bypass Service Worker cache for fresh builds. On some mobile PWA/browser paths, uninstalling the app does not reliably clear Service Worker registrations or Cache Storage, so an old shell could continue serving obsolete bundles.
- **Fix:**
  1. Hardened `public/sw.js` with install/activate lifecycle handling: `skipWaiting()`, `clients.claim()`, and complete Cache Storage purge on activation.
  2. Changed navigation handling to network-only/no-store so stale HTML shells cannot resurrect old date-cell UI.
  3. Added build-stamp infrastructure: Vite emits `build-id.json`; runtime guard compares the active build to the latest server build and wipes caches + unregisters Service Workers on mismatch.
  4. Hardened Service Worker registration with `updateViaCache: 'none'`, preview/iframe guards, and registration updates.
  5. Added `/reset-app` recovery route to unregister Service Workers, clear Cache Storage, and clear local/session storage for affected devices.
  6. Added regression tests that block calendar date-cell icons/dots and circular legends from returning.
- **Files Changed:** `public/sw.js`, `vite.config.ts`, `src/main.tsx`, `src/lib/buildFreshness.ts`, `src/pages/ResetApp.tsx`, `src/App.tsx`, `src/hooks/usePushSubscription.tsx`, `src/vite-env.d.ts`, `src/test/calendar-boundary-ui.test.ts`, `docs/issue-repository.md`, `docs/issue-repository-index.md`
- **Detected via:** User report + source audit of calendar renderer vs stale rendered screenshot.
- **Prevention / Regression Guards:**
  - `src/test/calendar-boundary-ui.test.ts` asserts date cells contain only numeric date content plus border classes — no `Dumbbell`, status icons, marker dots, absolute-position badges, or `rounded-full` chips.
  - The legend is explicitly guarded as boundary swatches only and must not contain `Completed`, `Missed`, `Pending`, or circular indicators.
  - Service Worker is disabled/unregistered in Lovable preview/iframe contexts to avoid editor cache pollution.

---

## TW-024b: Stale Cache Fix Required Manual Kill-Relaunch to Self-Heal
- **Severity:** High
- **Status:** ✅ Fixed
- **Date Found:** 2026-04-28
- **Reported by:** Trainer `gaurav.rsh@gmail.com` — calendar reverted to old dots/icons after foreground/refresh; only an OS-level kill + relaunch surfaced the new build.
- **Symptom:** After TW-024 shipped, regular reloads, background→foreground transitions, and pull-to-refresh in the installed PWA continued to show the old shell. Only fully killing the PWA process and relaunching picked up the new Service Worker and fresh UI.
- **Root Cause:**
  1. A new Service Worker installs into the `waiting` state and cannot activate while the old SW still controls open clients. The app had no `updatefound` listener on the registration, so the new worker was never told to `SKIP_WAITING` after the user's first visit. It only activated when every client was closed — i.e. an OS kill.
  2. There was no `navigator.serviceWorker.controllerchange` listener, so even if the new SW did take control, the page kept rendering the already-loaded stale bundle until a manual reload.
  3. The build-freshness guard ran exactly once, ~3s after boot. In an installed PWA the document is rarely re-mounted, so foregrounding the app after a deploy never re-checked `build-id.json` and never triggered the cache wipe.
- **Fix:**
  1. `registerAppServiceWorker` now attaches `updatefound` → `statechange` and posts `SKIP_WAITING` to any newly installed worker as soon as a controller already exists.
  2. Added a one-shot `controllerchange` listener that calls `window.location.reload()` the moment a new SW takes control, so the user sees the new build without manual action.
  3. `installBuildFreshnessGuard` now also runs `runFreshnessCheck()` on `visibilitychange` (visible) and `window` `focus`, with an in-flight guard to prevent overlap. Foregrounding the PWA now reliably picks up new builds.
  4. The freshness check itself now calls `registration.update()` and posts `SKIP_WAITING` to any waiting worker before clearing caches and reloading, so the SW lifecycle drives the controller swap rather than fighting it.
- **Files Changed:** `src/lib/buildFreshness.ts`, `docs/issue-repository.md`, `docs/issue-repository-index.md`
- **Detected via:** User reproduction + RCA of SW lifecycle (`installing` → `installed/waiting` → `activated`) against the previous registration code.
- **Prevention / Regression Guards:**
  - Self-healing is now automatic on the next foreground or focus event after a deploy — no kill-relaunch required.
  - `controllerchange` reload is guarded against double-fire.
  - Freshness check is idempotent via `freshnessCheckInFlight` and `BUILD_REFRESH_KEY` session marker.

---

### TW-025 — Completed client workout re-prompts logging

- **Status:** Fixed
- **Severity:** High (UX integrity, false confirmation toast, destructive re-save risk)
- **Reported:** 2026-04-28 by gaurav.rsh@gmail.com
- **Surface area:** Client → Calendar → today's tile → action sheet → "Log Workout"

**Reproduction**
1. Trainer logs a workout for the client (planned exercises only).
2. Client opens today's tile, taps "Log Workout", saves once → workout `status='completed'`.
3. Client reopens the same tile and taps "Log Workout" again.
4. Modal shows the trainer's recommended exercises with empty actuals (as if nothing was saved).
5. Saving again fires "Workout logged successfully!" — a duplicate, misleading confirmation.

**Root cause (verified against DB for workout `ffb7b51a…`, `status='completed'`)**
1. **No status gate on the CTA.** `Calendar.tsx` rendered the "Log Workout" tile whenever `canEdit` was true; only the secondary Done/Missed buttons were gated by `pending`. So a `completed` workout still exposed the full re-log entry point.
2. **Modal ignored saved actuals.** `ClientWorkoutLogModal` re-seeded `exerciseBlocks` from `trainerExercises` on every open; `clientTrainerExercises` was fetched from `recommended_*` columns only. Previously-saved `actual_*` values never made it back into the UI, so the modal looked "blank".
3. **Save path was non-idempotent and destructive.** `handleWorkoutSave` re-set `status='completed'`, deleted any non-planned actual rows (`recommended_sets IS NULL`), and reapplied actuals over planned rows — with the same "logged successfully" toast every time. Any extra exercises the user had added in the original log would be silently wiped.

**Fix**
- `Calendar.tsx`: status-aware CTA. Completed → "View / Edit Workout" tile (success-tinted). Pending/missing → original "Log Workout" copy.
- `Calendar.tsx`: when the date click resolves to a `completed` workout, fetch and pass `existingActuals` (parsed from `actual_*` columns) and set `mode='edit'`.
- `ClientWorkoutLogModal.tsx`: new optional props `existingActuals` and `mode`. In edit mode the modal hydrates blocks from saved actuals (preserving `isFromTrainer` by name match) and switches title to "Edit Workout" and CTA to "Update Workout".
- `Calendar.handleWorkoutSave`: detects `existingWorkout.status === 'completed'` → toast becomes "Workout updated"; the destructive cleanup of non-planned actuals is skipped in edit mode.

**Files touched**
- `src/pages/Calendar.tsx`
- `src/components/modals/ClientWorkoutLogModal.tsx`
- `src/test/client-workout-relog.test.ts` (new)
- `docs/issue-repository.md`, `docs/issue-repository-index.md`

**Regression check**
- New vitest suite `client-workout-relog.test.ts` covers CTA label, modal mode, save toast, and cleanup gating across `pending`/`completed`/missing statuses.
- Manual matrix to verify after deploy:
  1. Completed today → tile says "View / Edit Workout"; modal opens with prior reps/weights; saving toasts "Workout updated".
  2. Pending today → tile says "Log Workout"; modal opens with trainer recommendations + empty actuals; saving toasts "Workout logged successfully!".
  3. No trainer plan + no log → "Log Workout" tile, free-form modal, original behavior.
  4. Trainer view unchanged (separate `TrainerWorkoutLogModal`).

**Detected via:** User reproduction + DB inspection of `workouts`/`exercises` rows for the affected client.

**Prevention / Regression Guards**
- CTA label is derived from `workout?.status`, not just `canEdit`.
- Modal hydration prefers `existingActuals` over `trainerExercises` whenever present.
- Save path branches on `existingWorkout?.status === 'completed'` for both copy and cleanup.
