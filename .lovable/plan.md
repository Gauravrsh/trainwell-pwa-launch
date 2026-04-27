## Debug result: this is the same stale app-shell regression previously named TW-024

You are right: the screenshot is not the latest calendar UI. It shows the old marker model:

- green filled dot on completed day
- dumbbell icon for pending workout
- CL / HL circular chips overlapping the date
- legend entries: Completed, Missed, Pending, Trainer Leave, Client Leave, Holiday

The current source code and current published Calendar bundle do not render those items. The live Calendar route chunk currently has the boundary-only implementation:

- date cells render only the date number
- completed = green border only
- client leave = red border only
- trainer leave = amber border only
- holiday = grey border only
- legend uses square boundary swatches: Today, Logged, Holiday, Trainer Leave, Client Leave

So the problem is not client ID 6486580 data. That client’s data is only triggering dates that expose the old UI. The rendering code being served to that device/session is old.

## Which earlier bug number was this?

This was the earlier cache/PWA regression we named **TW-024** in chat: stale Service Worker / stale installed-app shell serving old UI and old copy.

Important bookkeeping failure: **TW-024 is not yet in `docs/issue-repository.md` / `docs/issue-repository-index.md`.** The repo currently ends at TW-022. So the regression had a name in the discussion, but the issue repository was not updated because the fix was not approved/implemented. That is exactly how regressions get to wear a fake moustache and re-enter the building.

Closest existing indexed issue:

- **TW-007**: calendar dates not color-coded. Related to Calendar, but not this specific stale old-UI regression.

Definitive issue for this should be:

- **TW-024: Stale PWA / Service Worker serves old calendar UI, old TnC, and removed dashboard buttons**

## Why reinstall did not fix it

Uninstalling the PWA/home-screen app does not reliably clear Chrome site storage, Service Worker registration, HTTP cache, Cache Storage, or already-controlled app tabs.

Current code has these weaknesses:

1. `usePushSubscription.tsx` registers `/sw.js` automatically when notification permission is already granted.
2. `public/sw.js` has no version constant.
3. `public/sw.js` has no `install -> skipWaiting()`.
4. `public/sw.js` has no `activate -> clients.claim()`.
5. `public/sw.js` does not delete old caches on activation.
6. The app has no hard recovery route like `/reset-app` to unregister Service Workers and clear caches.
7. The app has no build-stamp guard to detect “I am running an old bundle against a newer deployment.”

Result: a stale controlled browser context can keep serving old chunks even after the visible app is uninstalled/reinstalled. The mirror is technically working; Chrome is holding yesterday’s mirror in front of today’s face.

## What I will fix after approval

### 1. Record TW-024 properly

Update:

- `docs/issue-repository-index.md`
- `docs/issue-repository.md`

Add TW-024 with:

- symptom: old calendar dots/icons/chips/legend, old TnC, removed dummy buttons reappearing
- affected user example: client ID 6486580 / Gaurav Sharma
- root cause: stale PWA/Service Worker/browser storage lifecycle
- prevention: versioned SW, cache purge, reset route, build-stamp guard, regression tests/search checks

### 2. Replace the Service Worker lifecycle with a versioned recovery model

Update `public/sw.js` to:

- define a build/cache version
- call `self.skipWaiting()` during install
- call `clients.claim()` during activate
- delete all old caches during activate
- remain minimal for push notification support
- keep navigation network-first
- optionally respond to a message like `VECTO_CLEAR_CACHES` for emergency cleanup

### 3. Add a hard reset route

Add a protected/public-safe route such as:

- `/reset-app`

It will:

- unregister every Service Worker for the origin
- delete all Cache Storage entries
- clear app-specific local/session storage keys where safe
- show a clear “App reset complete. Reopen Vecto.” screen
- provide a button to go to `/dashboard` or `/auth`

This gives us a deterministic cleanup URL for affected users instead of telling them to uninstall five times like a ritual sacrifice.

### 4. Add a build freshness guard

Add a small client-side guard that:

- fetches a lightweight build marker with `cache: 'no-store'`
- compares it to the running app version
- if mismatched, clears caches and reloads once

Implementation will avoid editing generated backend files. It will live in normal app code, likely `src/main.tsx` or a small helper under `src/lib/`.

### 5. Harden Service Worker registration

Update `usePushSubscription.tsx` so Service Worker registration:

- uses `updateViaCache: 'none'`
- calls `registration.update()` after registration
- does not use raw `console.error`; use `logError` per project rule
- does not re-register blindly if the current context should not be controlled

### 6. Add regression checks for the calendar UI

Add tests or static guards so the old marker UI cannot silently return:

- Calendar date cell must not render status dots/icons/chips inside the date cell
- Current-section legend must not include `Completed`, `Missed`, or `Pending`
- Calendar legend should use boundary swatches only

## Files expected to change after approval

- `public/sw.js`
- `src/main.tsx` or new helper under `src/lib/`
- `src/App.tsx`
- new reset page/component, likely `src/pages/ResetApp.tsx`
- `src/hooks/usePushSubscription.tsx`
- `src/test/...` for regression coverage
- `docs/issue-repository.md`
- `docs/issue-repository-index.md`

## Approval gate

I will not touch files until you approve. Once approved, I will implement TW-024 as a cache/PWA lifecycle fix, not as a Calendar styling fix, because the Calendar styling is already correct in the current code.

---
TW-ID: TW-024 (status: triage)
Files touched: none
Repo updated: no — plan mode/read-only; TW-024 will be written to the issue repository after approval
Regression check: linked to previously discussed TW-024; existing indexed closest match TW-007 is not the root cause