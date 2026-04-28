## Bug

When `gaurav.rsh@gmail.com` (already signed in) launches the PWA at `/`, the **public Landing page** flashes intermittently as if it were a splash screen, before the app finally lands on `/dashboard`.

This is **not** a stale-cache issue. The freshness guard from last night is working correctly. This is a logic bug in the boot sequence.

---

## Root Cause Analysis (TW-026)

Three things conspire in `src/App.tsx`:

### 1. `PublicLandingRoute` ignores the auth `loading` flag
```ts
const PublicLandingRoute = () => {
  const { user } = useAuth();           // <- does NOT read `loading`
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;                   // <- rendered while user is still null
};
```
On a cold boot, `useAuth` starts with `user = null, loading = true`. Supabase restores the session asynchronously via `getSession()` / `onAuthStateChange`. Until that resolves (typically 200-800 ms on mobile), `user` is `null`, so `PublicLandingRoute` happily renders `<Landing />`.

### 2. `AppContent` whitelists `/` as a "public route"
```ts
const isPublicRoute = location.pathname === "/" || ...
const ready = isPublicRoute || (!authLoading && !profileLoading);
```
For path `/`, `ready` is `true` immediately, so `showSplash` is set to `false` on the very first effect tick. The splash is hidden before auth has resolved, exposing whatever `PublicLandingRoute` renders — which, per #1, is `<Landing />`.

### 3. Landing page is eager-imported (line 22), so it paints in one frame
There is no Suspense fallback to mask the gap. The full landing hero renders, then ~300-700 ms later the auth listener fires, `user` becomes non-null, and React redirects to `/dashboard`. The user perceives this as "Landing page flashing as a splash screen."

### Why killing + relaunching "fixed" it last time
A fresh process sometimes has the Supabase session warm in IndexedDB and resolves `getSession()` before the first paint, hiding the race. It's timing-dependent — exactly the symptom Gaurav described ("intermittent").

### Why this is independent from the calendar/SW bug fixed last night
That fix was about stale **app shells**. This bug exists even on a brand-new build because the race is between Supabase auth bootstrap and the first React paint of `/`. No amount of cache-busting changes it.

---

## Fix Plan

### Change 1 — `PublicLandingRoute` waits for auth to resolve
```ts
const PublicLandingRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;             // splash stays up
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
};
```

### Change 2 — `AppContent` no longer treats `/` as splash-skippable
Remove `location.pathname === "/"` from the `isPublicRoute` whitelist. `/auth`, `/reset-password`, `/terms`, `/pitch` stay public (they have no auth-gated redirect on top of them). `/` must wait for `authLoading` to settle so we know whether to show Landing or redirect.

```ts
const isPublicRoute =
  location.pathname.startsWith("/auth") ||
  location.pathname.startsWith("/reset-password") ||
  location.pathname === "/terms" ||
  location.pathname === "/pitch";
```

The 1200 ms `SPLASH_MAX_MS` cap remains as a safety net so a wedged auth call can never strand a first-time visitor on the splash forever — they'll fall through to Landing as today.

### Change 3 — defensive: `AuthRoute` already reads `user` only, but should also wait
```ts
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
```
Prevents the symmetric flash on `/auth` (signed-in user briefly sees the login form).

---

## Regression Surface — what else could this affect?

| Surface | Risk | Mitigation |
|---|---|---|
| First-time visitor (no session) | Splash held ~200-400 ms longer before Landing paints | Acceptable; matches dashboard boot behavior. 1200 ms hard cap unchanged. |
| Signed-in trainer cold boot | Now correctly redirects to `/dashboard` without Landing flash | **This is the fix** |
| Signed-out user on `/auth` | Splash holds until auth resolves, then Auth renders | Fine; Auth is eager-imported, paints in one frame |
| `/terms`, `/pitch`, `/reset-password` | Unchanged | Still in `isPublicRoute` whitelist |
| Invited client (`?trainer=...`) flow | `InviteContextCapture` runs on every route change, not gated by auth — unchanged | No impact |
| PWA resume from background | Auth is already warm; `loading` resolves in <50 ms; user perceives instant route | No impact |
| Sign-out from inside app | `SIGNED_OUT` listener replaces history with `/`; `PublicLandingRoute` now sees `loading=false, user=null` → renders Landing correctly | Behavior preserved |
| Build freshness reload (`window.location.replace`) | After reload, normal boot path applies; fix benefits this path too | No impact |

### Regression test to add
`src/test/public-landing-auth-gate.test.ts`:
- `PublicLandingRoute` returns `null` while `loading=true`
- `PublicLandingRoute` redirects to `/dashboard` when `loading=false, user!=null`
- `PublicLandingRoute` renders Landing when `loading=false, user==null`
- `AuthRoute` returns `null` while `loading=true`
- `AppContent.isPublicRoute` is `false` for `/` (regression guard)

---

## Files to change
1. `src/App.tsx` — `PublicLandingRoute`, `AuthRoute`, `isPublicRoute` whitelist
2. `src/test/public-landing-auth-gate.test.ts` — new regression test
3. `docs/issue-repository.md` — add **TW-026** entry with this RCA
4. `docs/issue-repository-index.md` — index TW-026

No DB / edge function / SW changes. No risk to last night's freshness guard or the TW-025 workout-relog fix.

---

**Approve to implement?**