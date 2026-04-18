

## Plan

### 1. Replace "Loading…" route fallback with branded splash content
In `src/App.tsx`, the `RouteFallback` component currently shows a plain "Loading…" string. Replace it with the same VECTO wordmark + tagline ("Effort | Direction | Discipline") used in `SplashScreen.tsx`, so when the splash fades and lazy chunks are still resolving, the user continues to see brand identity instead of bare text.

Approach: Reuse the markup from `SplashScreen` directly inside `RouteFallback` (static, no animation needed since splash already animated out). Keeps single source of truth on copy and styling.

Note: the user wrote "efforts | dedication | discipline" but the existing splash (and the locked memory `mem://features/branding/splash-screen-and-alignment-logic`) uses **"Effort | Direction | Discipline"**. I'll keep the canonical brand tagline. Flag if you actually want it changed.

### 2. Cold-start load time test
Run a Lighthouse-style cold-start measurement against the published URL (`https://trainwell.lovable.app`) using a headless run via `code--exec` (curl + `npx -y lighthouse` or a simple Puppeteer script measuring nav timings + first contentful paint + time-to-interactive). Report:
- TTFB
- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive
- Total transfer size of initial bundle

This is a one-shot measurement, output to console only — no artifact file needed unless you want a saved report.

### Files touched
- `src/App.tsx` — replace `RouteFallback` body (~5 lines)

### Out of scope
- Splash screen itself (already correct)
- Bundle optimization (will only act if numbers look bad and you ask)

