## TW-033 — Anisha Rohra hits ErrorBoundary on app launch

### What we know
- **User**: `rohra.aneesha@gmail.com` → profile `Anisha Rohra` (client of trainer `30a0df77…`), Pune, signed up & last sign-in 13-May-2026 04:05 UTC.
- **State**: brand-new client. **Zero** workouts, food_logs, step_logs, weight_logs, bmr_logs. `profiles.bmr` is **NULL** even though `bmr_updated_at` is set. `profile_complete = true`.
- **Surface**: production (`vecto.fit`) in-browser (not PWA). Renders the React ErrorBoundary fallback → a render-time exception is being thrown somewhere in `<AppRoutes />` after splash.
- **No server-side trace**: `ErrorBoundary.componentDidCatch` only does `console.error` (no remote reporting). No matching errors in Postgres/auth logs. So we currently can't see her stack from our side.

### Likely suspects (brand-new client, null BMR, no logs)
1. **`useProgressData` / Progress charts** — `profile.bmr` typed as `number` but is `null`; downstream math (`Number(null)` → NaN, divisions, chart domains) can throw or produce invalid values that crash Recharts.
2. **Calendar/Home aggregation** — empty arrays for workouts/food/steps combined with null BMR could trip a `.reduce` or date-fns call (e.g. on an empty plan range).
3. **Trainer-scoped data fetches** — a client with no active training_plan rendering a component that assumes `plan` is defined.
4. **Stale PWA shell** — less likely (browser, not installed PWA), but `buildFreshness` race on first visit can also cause a one-shot render glitch.

### Plan

**Step 1 — Log the issue (TW-033)**
Append to `docs/issue-repository-index.md`:
```
TW-033 | High | To-investigate | New client (Anisha Rohra) hits ErrorBoundary on app launch in prod browser; null profiles.bmr + zero logs suspected to crash Progress/Calendar render | ErrorBoundary.tsx / useProgressData.tsx / Calendar.tsx
```
Add a matching detailed entry to `docs/issue-repository.md` (context, repro user, suspects, status).

**Step 2 — Make the next crash diagnosable (the real fix-enabler)**
Currently ErrorBoundary swallows the stack into the user's console only. Upgrade so we can actually see *her* error next time:
- In `ErrorBoundary.componentDidCatch`: also persist `{message, stack, componentStack, route, userId, ts, buildId}` into a new `public.client_error_reports` table via a tiny insert (RLS: authenticated users may insert their own row; nobody can SELECT except service role).
- Add a "Copy error details" link under the Reload button so the user can paste the trace into WhatsApp.
- Wire `window.addEventListener('error', …)` and `'unhandledrejection'` in `main.tsx` to also write to the same table — catches errors that happen outside React (e.g. service-worker / module-init).

**Step 3 — Hardening pass on the most-likely crash sites (defensive, no behaviour change for healthy users)**
- `useProgressData.tsx`: treat `profile.bmr` as `number | null`; coalesce to `0` everywhere math runs; guard chart inputs against `NaN`/empty arrays.
- `Calendar.tsx` / `Home.tsx`: ensure render path tolerates `plans = []`, `workouts = []`, `null` BMR.
- `Progress.tsx`: when there is *no* data at all, render the empty state instead of attempting chart math.

**Step 4 — Reproduce & confirm**
- Use the browser tool to load prod with a freshly-created throwaway client mirroring Anisha's state (no logs, null BMR) and walk Home → Calendar → Progress → Profile, watching console for the original throw.
- Once Step 2 is shipped and Anisha reopens the app once, pull her row from `client_error_reports` and pin the exact stack.
- Patch the offending component, add a regression test under `src/test/` (e.g. `new-client-empty-state.test.ts`).

**Step 5 — Close TW-033** with files-touched list, regression check, and update the index entry to `Fixed`.

### Out of scope (for this loop)
- No Sentry / 3rd-party error service — using our own table keeps it inside Lovable Cloud.
- No UX rewrite of the ErrorBoundary screen beyond adding the "Copy details" affordance.

### What I need from you before building
1. Approve creating `public.client_error_reports` (insert-only for `authenticated`, owner-scoped; service-role read).
2. Confirm I can ask Anisha (via you) to **open the app once more after the patch ships** so her next crash gets captured — otherwise I'll be guessing from suspects only.
