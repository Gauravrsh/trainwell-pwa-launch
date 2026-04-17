

## Plan

**1. Remove stale TODO comment** in `src/components/subscription/PlanSelectionModal.tsx` above the Razorpay button ID whitelist.

**2. PWA cache problem — the right fix (no reinstall needed)**

You're right: asking installed PWA users to uninstall/reinstall is churn-inducing and unprofessional. The correct fix is **server-driven cache invalidation** so the app updates itself silently on next launch.

### Why gaurav.sharma hit this
The PWA shell (HTML + JS bundle) was cached by his installed app. When he opened it, he ran the **old build** that still called the pre-migration `create_trainer_subscription` signature → DB rejected → "Failed to initiate payment" toast. New code is already deployed; his device just never fetched it.

### Fix: two small, permanent changes

**A. Bump asset version query strings in `index.html`**
Change `?v=20260406b` → `?v=20260417a` on manifest, icons, favicon links. This forces the browser to re-fetch those assets (per existing PWA cache-busting strategy memory).

**B. Add a tiny "fresh shell" guard in `public/sw.js`**
Currently the service worker only handles push notifications — it does not cache anything. That's good. But because browsers themselves cache the HTML shell aggressively for installed PWAs, we add a `fetch` listener that uses **network-first for navigation requests** (HTML documents only). This guarantees that every app launch checks for a new `index.html`, while leaving JS/CSS (which are content-hashed by Vite) and push behavior untouched.

```js
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});
```

Result: gaurav (and everyone else) gets the latest build automatically the next time they open the PWA — **zero user action required, zero churn.**

### Files touched
| File | Change |
|------|--------|
| `src/components/subscription/PlanSelectionModal.tsx` | Delete stale TODO comment |
| `index.html` | Bump `?v=` query strings on PWA assets |
| `public/sw.js` | Add network-first navigation fetch handler |

No DB changes. No user-visible UI changes. Existing installed PWAs self-heal on next open.

