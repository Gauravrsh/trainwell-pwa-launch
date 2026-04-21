## Two issues, both fixable

### Issue 1 — Loading state shows raw "VECTO" wordmark with no message

**What's happening (verified in code):**

- `src/App.tsx` defines `RouteFallback` (lines 149–160) which is shown by `<Suspense>` whenever a lazy-loaded route chunk is being fetched. It renders only the VECTO wordmark + tagline.
- `SplashScreen.tsx` does the same on cold start.
- Result: every cold start AND every first navigation to a code-split route (Progress, Plans, Refer, etc.) shows the same bare wordmark, which feels like a frozen splash.

**Fix:**
Add a rotating "consistency quote" line under the wordmark in `RouteFallback` (the in-app loading state). The cold-start `SplashScreen` stays minimal — it's visible for under a second and shouldn't be a reading exercise. Quote rotation is per-mount so the user sees a different one on each navigation.

**Pick 1 of these 10 (I'll wire the chosen one as the seed; the rotation will use all 10 over time):**


| #   | Quote                                                                                                       | Attribution                           |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | "We are what we repeatedly do. Excellence, then, is not an act, but a habit."                               | Will Durant (paraphrasing Aristotle)  |
| 2   | "Success is the sum of small efforts, repeated day in and day out."                                         | Robert Collier                        |
| 3   | "It's not what we do once in a while that shapes our lives. It's what we do consistently."                  | Tony Robbins                          |
| 4   | "Discipline is choosing between what you want now and what you want most."                                  | Abraham Lincoln (commonly attributed) |
| 5   | "You do not rise to the level of your goals. You fall to the level of your systems."                        | James Clear                           |
| 6   | "Motivation gets you going, but discipline keeps you growing."                                              | John C. Maxwell                       |
| 7   | "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time." | John C. Maxwell                       |
| 8   | "Hard work beats talent when talent doesn't work hard."                                                     | Tim Notke                             |
| 9   | "The pain of discipline weighs ounces. The pain of regret weighs tonnes."                                   | Anonymous                             |
| 10  | "Show up. Even when you don't feel like it. Especially when you don't feel like it."                        | Anonymous                             |


Tell me which number to anchor on; I'll bake all 10 into a rotation pool with the chosen one shown most often. --- go ahead. Show all 10 in rotation. Use italics.

---

### Issue 2 — Back button from `/auth` keeps reloading `/auth` after sign-out

**Why my earlier fix didn't address this:**
TW-014 only patched the **installed PWA** case (`display-mode: standalone`) — the hook is a deliberate no-op in browser tabs. Your video filename is `Screen_Recording_..._Chrome.mp4` — you're in Chrome, not an installed PWA. So the hook was never even active. That's an honest miss on scope, not a regression of the hook itself.

**Real root cause for browser case (verified by reading `Profile.tsx`, `App.tsx`, and `useAuth.tsx`):**

1. `Profile.handleSignOut` (line 29–32) calls `navigate('/')` **without `replace**`. So after sign-out the history is:
  `[…, /profile, /]` — `/profile` is still in the stack.
2. From Landing the user taps "Sign In" → push → `[…, /profile, /, /auth]`.
3. Press back → browser pops to `/` → `PublicLandingRoute` sees no user → renders Landing. So far OK.
4. But if at any earlier point the user was on a protected route after sign-out (or if a stale `/profile` entry sits in history from step 1), pressing back hits `/profile` → `ProtectedRoute` sees no user → does `<Navigate to="/auth" replace />`. The URL bar visibly snaps back to `/auth`. To the user this looks like *"back is broken — it just reloads /auth"*.
5. There is **no** general "auth state changed → purge stale protected entries from history" mechanism. React Router can't do this — only `replace` at the source can.

**The actual fix:**

A. `**Profile.handleSignOut**` — use `navigate('/', { replace: true })` so the post-signout entry replaces `/profile` instead of stacking.

B. `**AuthProvider**` — when `onAuthStateChange` fires `SIGNED_OUT`, replace the current history entry with `/` (or `/auth`, depending on where they were). This guarantees that any protected route the user was on is overwritten in the stack at the moment of sign-out, so back can never walk back into it. Implemented with a small effect that listens to the sign-out event and calls `window.history.replaceState(null, '', '/')` once.

C. `**ProtectedRoute**` — already uses `replace`, good. No change.

D. `**useAndroidBackExit**` — extend to also activate in non-standalone Chrome on Android **only on `/auth` and `/` after a sign-out has just occurred**, OR keep it standalone-only and rely on A+B (which is the cleaner fix). I'll go with A+B; the hook stays scoped to standalone PWAs as designed.

**Why A+B together solves it:**

- B guarantees the protected route the user was on is replaced at the *exact* moment auth flips to signed-out, regardless of what page they're on.
- A guarantees the explicit Profile sign-out flow doesn't leave `/profile` in history.
- Together: pressing back from `/auth` after sign-out walks to whatever was *before* `/profile` (usually Landing or the previous external page), never into a re-redirect loop.

### Files touched

- `src/App.tsx` — replace `RouteFallback` body with rotating quote component
- `src/components/LoadingQuote.tsx` *(new, ~25 lines)* — picks a quote at mount; pure presentational
- `src/pages/Profile.tsx` — `navigate('/', { replace: true })`
- `src/hooks/useAuth.tsx` — on `SIGNED_OUT` event, `window.history.replaceState(null, '', '/')`
- `docs/issue-repository.md` + `docs/issue-repository-index.md`:
  - Update **TW-014** entry to clarify scope (standalone PWA only)
  - Add **TW-015 | High | Fixed | Back button after sign-out re-enters /auth in browser due to stale history | Profile.tsx / useAuth.tsx**
  - Add **TW-016 | Low | Fixed | Loading state placeholder lacks brand quote | App.tsx / LoadingQuote.tsx**

### Regression matrix (will verify before closing)

**Loading state:**

1. Cold start in browser → splash shows wordmark only (unchanged, <1s).
2. Cold start logged in → after splash, navigating Calendar → Progress → Plans shows *quote under wordmark* during chunk fetch.
3. Slow 3G simulated → quote is readable (long enough to register, not flashy).
4. Repeated nav to same route → no re-fetch (chunk cached), no flicker.

**Back button after sign-out (browser, Chrome on Android):**
5. Sign in → /dashboard → /profile → tap Sign Out → lands on `/` (Landing). Press back → exits to previous site/tab (does NOT bounce into /auth).
6. Sign in → /plans → /profile → Sign Out → `/` → tap "Sign In" → `/auth`. Press back → `/` (Landing). Press back again → exits.
7. Sign-out via session expiry mid-app (token refresh fail) → AuthProvider's `SIGNED_OUT` listener replaces history entry → back behaves like #5.
8. While signed in, normal in-app navigation back/forward → unchanged (no `replace` added to in-app navigations).

**Back button in installed PWA (TW-014 path):**
9. Standalone PWA on `/dashboard` → back shows "Press back again to exit" toast → second back exits. (Unchanged from TW-014.)
10. Standalone PWA, sign out → lands on `/` → back shows exit toast → second back exits. (Now also covered by B, so no double-press surprises.)

**No regressions to:**

- Invite link flow (`?trainer=…`) — `InviteContextCapture` still runs first.
- TW-012 profile setup completion — uses `navigate('/dashboard', { replace: true })`, untouched.
- TW-013 autofill recovery in Auth.tsx — untouched.

### Action needed from you

**Pick a quote number (1–10).** I'll start with that as the headline quote and rotate the rest on subsequent loads. - No 5