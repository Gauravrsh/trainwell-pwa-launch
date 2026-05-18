# TW-036 — Stale chunk crash: "Failed to fetch dynamically imported module" on /dashboard

## Voice of customer (Gaurav, vecto.fit/dashboard, 2026-05-18 16:51 UTC, Android Chrome 148)

```
TypeError: Failed to fetch dynamically imported module:
  https://vecto.fit/assets/Calendar-DgU0TVB0.js
Component stack: at Lazy ... at Suspense ...
Source: react-error-boundary
```

ErrorBoundary captured the throw cleanly (TW-033 instrumentation paid off).

## Diagnosis

`src/App.tsx` lazy-loads every authed page (`Calendar`, `Home`, `Plans`, etc.) via `React.lazy(() => import("./pages/..."))`. When a new build is deployed, Vite emits new content-hashed filenames (e.g. `Calendar-DgU0TVB0.js` → `Calendar-XyZ.js`). The user's already-loaded `index.html` (and its in-memory React app) still points at the **old** filename. When React Router navigates to `/dashboard` and triggers the lazy `import()`, the old asset path returns 404 from origin and the browser throws `TypeError: Failed to fetch dynamically imported module` — which bubbles to `ErrorBoundary` and shows the "Uh! This shouldn't have happened" screen.

This is the well-known Vite + lazy-loading stale-chunk problem. `buildFreshness.ts` already exists for the SW path, but it only fires on visibility/focus and a 3-second post-boot timer — it does not catch the moment the user clicks a route whose chunk has already vanished from the CDN.

## Fix

1. **`src/lib/lazyWithReload.ts`** (new) — wrapper around `React.lazy` that catches dynamic-import failures matching the chunk-load signature and, exactly once per session per chunk path, hard-reloads the page (`window.location.reload()`). Uses `sessionStorage` key `vecto:chunk-reload-attempted` keyed by the failing URL to prevent infinite reload loops if the chunk truly is broken (in which case the second attempt falls through and the ErrorBoundary takes over). Reuses `logError` for telemetry.

2. **`src/App.tsx`** — replace each `lazy(() => import(...))` with `lazyWithReload(() => import(...))`. No other changes; route structure, fallback, and ErrorBoundary untouched.

3. **No DB / SW changes.** The existing `buildFreshness` infra continues to handle the proactive path (visibility change). This patch handles the reactive path (user navigates straight into a missing chunk).

## Verification

- Repro path (manual): build, deploy, navigate to `/`, then deploy a new build that renames `Calendar-*.js`, then click "Dashboard". Before fix → ErrorBoundary screen. After fix → page reloads once and lands on a working `/dashboard`.
- Sentinel: error reports in `client_error_reports` containing `Failed to fetch dynamically imported module` should drop to ~0 going forward; any remaining ones imply a true CDN/network failure (covered by the second-attempt fallthrough).
- Loop guard: `sessionStorage["vecto:chunk-reload-attempted"]` ensures a broken deploy can't cause refresh thrash.

## Issue repository

Append TW-036 to `docs/issue-repository-index.md` (Fixed) and add full entry to `docs/issue-repository.md` with reporter, root cause, fix, regression check.

## Out of scope

- No changes to `buildFreshness.ts`, SW, or `manifest.json`.
- No deferred chunks beyond what `App.tsx` already lazy-loads.
