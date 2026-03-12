

## Plan: Make Terms Public + Publish Guidance

### 1. Make `/terms` publicly accessible

**File:** `src/App.tsx` (lines 194-201)

Remove the `ProtectedRoute` wrapper from the Terms route:

```tsx
// Before
<Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />

// After
<Route path="/terms" element={<Terms />} />
```

The `Terms` page already has its own back button and layout — it does not depend on `AppLayout` for core functionality. The `useProfile` hook call inside `Terms.tsx` (used to conditionally show referral terms for trainers) will gracefully return `isTrainer: false` for unauthenticated users, so no changes needed there.

### 2. Publishing and testing

After the code change, you will need to:
1. Click **Publish** → **Update** in the top-right corner to deploy the frontend changes
2. Visit `https://trainwell.lovable.app/` in an incognito/logged-out browser
3. Verify: Landing page loads, CTAs link to `/auth`, footer Terms link opens `/terms` without redirect

No backend changes required.

