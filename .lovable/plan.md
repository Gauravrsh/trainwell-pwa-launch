## TW-030 — Calendar UI regressed to old dots/icons again for Gaurav

### What I verified

The screenshot is the old calendar surface again:
- circular green/red/grey markers
- status legend says `Completed / Missed / Pending`
- small icons/dots inside date cells

That is not the current intended UI. The current source code in `src/pages/Calendar.tsx` already renders boundary-only date cells:
- date number only
- border-only state
- legend: `Today / Logged / Holiday / Trainer Leave / Client Leave`

I also checked Gaurav’s live rows:
- `gaurav.rsh@gmail.com` maps to client `a1bb2e3b-e10b-4cea-b7b9-24c8a0bc5e5f`, unique id `6486580`.
- April workout rows explain several borders/statuses: Apr 6 completed, Apr 7 pending, Apr 18 pending, Apr 28 completed, Apr 29 completed.
- Day marks explain Apr 13 CL and Apr 14 HL.
- There are no duplicate workouts for the same client/date.

So this is not a data corruption issue. The data is doing what the calendar tells it to do. The UI being shown is stale/wrong.

### Root cause

This is a deployment/cache-surface regression, not a calendar-calculation regression.

The published bundle currently includes the new boundary-only calendar chunk, but affected mobile clients can still display an older app shell/bundle. We already fixed part of this under TW-024/TW-024b, but the fix is still too soft because it relies on runtime JS executing before it can self-heal. If an old shell/bundle is already controlling the page, the new `buildFreshness` code may never run on that device.

That is why the same calendar issue can “come back” even when the repository code is correct. Excellent theatre by the browser cache. Terrible product behaviour.

There is also a second weakness: the regression test only blocks icon/dot markup inside the current date-cell block. It does not hard-fail if old calendar legend words (`Completed`, `Pending`) or old circular marker classes are reintroduced elsewhere in the calendar page. The guard was too narrow.

## Fix plan

### 1. Open a new issue entry before changing code

Add `TW-030` to:
- `docs/issue-repository-index.md`
- `docs/issue-repository.md`

It will explicitly link back to TW-024/TW-024b and record that this is the third recurrence of the same stale calendar UI symptom.

### 2. Make `/` the authenticated start route for installed users

Change `public/manifest.json`:

```json
"start_url": "/dashboard"
```

Why: installed PWAs currently start at `/`. That creates an avoidable redirect path (`/` -> auth check -> `/dashboard`) and gives older cached shells more room to win. For this product, authenticated users live on the calendar. The app icon should open the app at the protected calendar route directly.

### 3. Add a pre-React “stale build sentinel” in `index.html`

Add a tiny inline script before the main module that:
- fetches `/build-id.json` with `cache: no-store`
- compares it with the last build id stored locally
- if changed, clears Cache Storage
- unregisters Service Workers
- reloads once with a cache-busting query parameter

This runs before React, before lazy calendar chunks, and before the normal app bundle. That is the important difference from TW-024b: the recovery guard moves into the HTML shell itself, so it does not depend on the stale JavaScript bundle being cooperative.

The script will be conservative:
- only runs when `build-id.json` is reachable
- uses a once-only session guard to avoid reload loops
- does not clear `localStorage` auth/session data
- uses `logError` only in app code; for inline HTML script, errors are swallowed to avoid breaking boot

### 4. Harden Service Worker fetch handling

Update `public/sw.js` so more app-shell-critical resources are network-first/no-store:
- navigation documents
- `/build-id.json`
- `/manifest.json`
- `/sw.js`
- JavaScript and CSS bundles under `/assets/`

Also add defensive fallback behaviour: if network navigation fails, fall back to plain `fetch(req)` rather than serving a cached obsolete response.

This service worker is supposed to be push-only/minimal, not offline-first. It should not preserve old UI. It has one job: deliver push notifications without pretending to be a time machine.

### 5. Version the PWA manifest/icon query strings again

Bump static asset query strings in:
- `index.html`
- `public/manifest.json`

This forces Android Chrome/PWA install metadata to re-fetch the manifest/icon resources. It is not the main fix, but it helps flush the installable app surface.

### 6. Strengthen regression tests

Expand `src/test/calendar-boundary-ui.test.ts` to fail if `Calendar.tsx` reintroduces:
- old legend labels: `Completed`, `Missed`, `Pending`
- old circular legend markers: `rounded-full` inside the calendar render/legend area
- date-cell overlay positioning classes used for dots/badges (`absolute`, `bottom-`, `top-`, etc.)
- old status icons in the date-grid region

Add a new test file for cache/update hardening, for example `src/test/pwa-freshness.test.ts`, asserting:
- `manifest.json` starts at `/dashboard`
- `index.html` includes the pre-React build freshness sentinel
- `sw.js` handles `build-id.json`, `manifest.json`, `sw.js`, and `/assets/` with network/no-store behaviour
- preview-host/iframe SW disable guard remains intact in `buildFreshness.ts`

### 7. Keep Gaurav’s data untouched

No cleanup migration is needed for Gaurav for this specific bug. His April rows match the screenshot states:
- Apr 13 CL and Apr 14 HL are real `day_marks`
- Apr 7 and Apr 18 are real pending workouts
- Apr 6/28/29 completed workouts are real

The bug is the marker style resurrecting, not those dates existing.

### 8. Regression run before deployment

Run the focused tests before shipping:
- `calendar-boundary-ui.test.ts`
- new `pwa-freshness.test.ts`
- `client-workout-relog.test.ts`
- `workout-relog-idempotency.test.ts`

Then run the broader app test suite through the standard harness.

### Files to change

- `index.html`
- `public/manifest.json`
- `public/sw.js`
- `src/test/calendar-boundary-ui.test.ts`
- `src/test/pwa-freshness.test.ts` new
- `docs/issue-repository-index.md`
- `docs/issue-repository.md`
- likely memory update for PWA cache strategy after implementation

## Expected result

After deployment, even if a mobile device has an old installed PWA shell:
1. it opens directly to `/dashboard`,
2. the HTML-level build sentinel runs before React,
3. stale caches/service workers are cleared,
4. the app reloads once into the newest bundle,
5. the calendar shows boundary-only styling and cannot silently fall back to the old `Completed / Missed / Pending` dot UI again.

TW-ID: TW-030
Files touched: planned only
Repo updated: no — read-only plan mode
Regression check: planned before deployment