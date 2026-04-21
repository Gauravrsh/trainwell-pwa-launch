

## Bug TW-014: Back button does not exit PWA from home screen

### What you actually saw in the video
Pressing the Android back button on the landing/home screen did nothing visible — the app stayed put instead of exiting to the launcher. My previous "autofill" diagnosis was wrong. Apologies.

### Why this happens
Three compounding causes, all in our code:

1. **History stack pollution from redirects.** `App.tsx` uses `<Navigate to="..." />` without `replace` in several guards (`AuthRoute`, `RoleSelectionRoute`, `ProfileSetupRoute`, `PublicLandingRoute`). Each redirect pushes a new history entry instead of replacing the current one. So a user who lands on `/` and gets bounced to `/dashboard` actually has 2 entries. Back button walks back through them silently before Android can exit.

2. **`InviteContextCapture` re-runs on every `location.search` change** and React Router's internal effects can produce extra entries when URLs are normalised. Combined with the splash screen state transition, the user's first paint may already sit on top of 2–3 stack entries.

3. **No explicit "exit on back from root" handler.** Standalone PWAs on Android only exit when the history stack is at its first entry. We never enforce that invariant, so even one stray push traps the user.

### The fix (scope)

**A. Convert all guard redirects to `replace`** in `src/App.tsx`:
- `AuthRoute`, `RoleSelectionRoute`, `ProfileSetupRoute`, `PublicLandingRoute`, `ProtectedRoute` — every `<Navigate>` gets `replace`. This stops history pollution at the source.

**B. Add a root-level back-button exit guard** in `src/App.tsx` (new small hook `useAndroidBackExit`):
- On mount, when the user is on a "root" route (`/`, `/dashboard`, `/auth`), push one sentinel history entry.
- Listen for `popstate`. If the user pops back to the sentinel while on a root route, re-push the sentinel and show a toast: *"Press back again to exit"*. If pressed again within 2s, allow the pop (Android will exit the standalone PWA because there's nothing left).
- Only active when `display-mode: standalone` (installed PWA) — in a normal browser tab, default behaviour is preserved.

**C. Make `InviteContextCapture` idempotent**: only write to `localStorage` if the value changed, and don't trigger any history side-effects. (It currently doesn't, but I'll verify and lock it down.)

### Files touched
- `src/App.tsx` — add `replace` to all `<Navigate>`, mount `useAndroidBackExit`
- `src/hooks/useAndroidBackExit.ts` — new file, ~40 lines
- `docs/issue-repository.md` + `docs/issue-repository-index.md` — log TW-014; **also correct TW-013 entry** to note the autofill fix was based on a misread of the video and is being kept only as a defensive hardening (not the actual reported bug)

### Regression matrix I will check before closing
1. Browser tab on `/` → back returns to previous site (unchanged)
2. Installed PWA on `/dashboard` → back shows "Press back again to exit" toast, second back exits
3. Installed PWA on `/calendar` after navigating from `/dashboard` → back returns to `/dashboard` (normal in-app nav preserved)
4. Login flow: `/auth` → `/role-selection` → `/profile-setup` → `/dashboard`. Back from `/dashboard` does NOT walk back into onboarding (because all guard redirects now use `replace`)
5. Invite link `/auth?trainer=XXX` for authed user → captures code, lands on `/dashboard`, back exits (one tap from root, two from elsewhere)
6. Modal open + back press → does NOT exit; closes modal first (deferred — current modals already trap focus via Radix; back-to-close is a separate enhancement, flagged as TW-015 candidate, not bundled)
7. Notification deep-link via SW `client.navigate(urlPath)` → back returns to previous in-app screen (unchanged)
8. iOS Safari standalone — `popstate` exit pattern is effectively a no-op (iOS has no back button); confirms no iOS regression

### What I am NOT touching
- Service worker (already minimal; cache strategy unrelated)
- Auth.tsx autofill changes from TW-013 (kept as defensive code; entry will be re-classified)
- Any modal back-to-close behaviour (separate concern, will flag if you want it)

### Bug repo entry
`TW-014 | High | Fixed | PWA back button does not exit from root screen on Android | App.tsx / useAndroidBackExit.ts`

