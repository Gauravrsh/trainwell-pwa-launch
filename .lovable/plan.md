# Plan — Item 3 Build + Full Forensic Audit

Two-phase loop. **Phase A ships Item 3. Phase B is read-only audit that ends with a single triage document. No bugs get fixed silently.**

---

## Phase A — Item 3: Steps OCR Fallback

### A1. Dependency
- Add `tesseract.js` to `package.json`. Lazy-loaded only when user taps the "Scan screenshot" button — so it never ships in the initial landing/auth bundle.

### A2. UI — inside `StepLogModal.tsx`
- Add a secondary action next to the existing numeric input: **"Scan screenshot"** (camera-roll / file picker; uses `accept="image/*"` — no `capture` attribute so user can pick a saved screenshot, not a live photo).
- While OCR runs, show an inline spinner + the line `"Reading step count…"` (Elite Jester voice; no marketing fluff).
- After OCR resolves:
  - Extract the largest 3-to-6-digit number from the detected text (Google Fit, Samsung Health, Fitbit, Mi Fit, Apple Health screenshots all render the step count as the biggest number on screen).
  - **Pre-fill the step count input with the detected number and show a small caption: "Detected X,XXX — confirm or edit before saving."**
  - User must still tap **Save** — OCR never writes to DB directly. This matches the "manual tracking" DNA.
- Error states:
  - OCR found no plausible number → show `"Couldn't read a step count from this image. Please type it in."` Input stays empty, existing manual flow works.
  - OCR crashed (Tesseract worker failed, low memory on old Android) → same fallback message; `logError('StepLogModal.ocr', err)`.

### A3. OCR logic
- Run Tesseract with the English language pack only, `tessedit_char_whitelist` set to `0-9,.` so we don't parse app UI chrome.
- Extract number candidates via regex `\b\d{1,3}(?:[,\s]?\d{3})*\b`, strip commas/spaces, pick the largest value ≤ 100000 (sanity cap; nobody walked 1 million steps).
- Reject the candidate if it's identical to the current year (e.g. 2026) or matches a 4-digit calorie-looking number sitting adjacent to the word "kcal" — to avoid picking the calorie burn instead of step count.

### A4. Persistence
- No DB schema change. `step_logs.step_count` already exists. OCR is purely a client-side assist.
- No new RLS policy needed.

### A5. Tests
- Add `StepLogModal.ocr.test.ts` covering the number-extraction helper: "8,432 steps", "12 345 steps", "Steps 9876", "1,20,453 steps" (Indian lakh grouping), plus "2,134 kcal" (should NOT be picked when the larger step number is present).

### A6. TW entry
- Log as **TW-021 | Medium | Done | Steps OCR assist in StepLogModal | StepLogModal.tsx / tesseract.js**. Update `docs/issue-repository-index.md` at close of Phase A.

---

## Phase B — Forensic Regression Audit (read-only, report-first)

Severity bar: **any functional break** (dead button, lost data, wrong value saved, wrong user sees wrong data, edge function rejects valid auth, RLS blocks a legit read). Cosmetic copy/spacing noted only if it blocks a flow.

### B1. Historical regression sweep — TW-001 through TW-021
For each ticket in `docs/issue-repository-index.md`, grep the referenced files and confirm the fix is still present in current code. Any ticket that grep says is "fixed" but the code no longer has the guard → re-open. Deliverable: per-TW pass/fail table.

### B2. Deep code read — every hot path
Methodical walk:
- **Auth & routing guards** (`App.tsx`, `useAuth`, `useProfile`, `ProtectedRoute`, `RoleSelectionRoute`, `ProfileSetupRoute`, `PublicLandingRoute`, `AuthRoute`) — confirm no route leaks an unauthenticated user into a protected surface and no authenticated user gets stuck on a public one. Verify TW-011 / TW-014 / TW-020 guards.
- **Trainer lifecycle** — signup → role → profile setup → subscription trial → invite client → create plan → log workout → log meal → view progress → renew subscription. Each transition read end-to-end for orphan states (e.g. trainer completes profile but `start_trainer_free` didn't run).
- **Client lifecycle** — invite link click → auto-role-assign → profile setup → see trainer's planned workout on today → log actuals → log food → edit same-day diary → view progress. Verify invite code, `trainer_id` binding, and the new Phase 4a metric-aware save path for every `MetricType`.
- **Calendar completion logic** — `parsePlannedExercises` and `isActualLogged` are new and central. Walk every metric type against the save path in `Calendar.tsx` to confirm green/red marking is correct. AMRAP and EMOM are the highest-risk new paths.
- **Food unit dropdown** — confirm single-item meals persist `quantity_value`/`quantity_unit`, multi-item meals correctly null them. Confirm `parseQuantity` handles the AI's output strings for the top ~20 Indian foods in the dictionary.
- **Trainer Profile** — avatar signed URL lifecycle (expiry handling), the non-blocking nudge banner, client's `/my-trainer` RPC.
- **Terms role-split** — trainer-only vs client-only accordion visibility; Plan Agreement table rendering.
- **Subscription read-only enforcement** — every write path (workouts, food_logs, client_training_plans, plan_sessions, day_marks) confirmed blocked when trainer subscription expired. This already has RLS — verify the UI surfaces a clean error, not a silent fail.
- **Landing page ref warnings** — the 3 `Function components cannot be given refs` console warnings in the current preview (HowItWorks, HouseRules, ComparisonTable). These are active runtime warnings right now and go into the report.

### B3. DB + security sweep
- Run `supabase--linter`.
- Manually review every RLS policy on every table (20 tables listed in `<supabase-tables>`) against the threat model: can a client read another client's data? can a trainer read a non-client's data? can an expired-subscription trainer write? can an anon user read anything sensitive?
- Review every `SECURITY DEFINER` function for missing `auth.uid()` checks or missing ownership validation. `apply_referral_reward`, `get_my_trainer_profile`, `get_client_profile_for_trainer`, `get_trainer_subscription_status`, `get_trainer_referral_stats` — all get line-by-line read.
- Verify edge function auth on `analyze-food`, `lookup-or-analyze-food`, `razorpay-webhook`, `nudge-trainers`, `nudge-clients`, `generate-expiry-notifications`, `record-food-edit` — confirm JWT/MAINTENANCE_TOKEN/HMAC pattern per `mem://technical/edge-function-auth-pattern`.
- Check the storage `avatars` bucket RLS (owner-write, authenticated-read via signed URLs — added in Phase 3).

### B4. Live preview walk-through
Use the browser tool on the preview URL. Two parallel sessions:
- **Trainer session:** land → signup → create profile → subscribe (test mode, no real payment) → copy invite link → create a plan → log a workout for each metric type (reps_weight, time, AMRAP, EMOM, distance_time) → log a food entry with the new unit dropdown → log steps → edit the trainer profile with avatar upload → check notifications → check progress → trigger the plan agreement flow.
- **Client session:** open invite link in separate browser → signup → auto-assign to trainer → confirm role-selection screen is never shown → complete profile setup → see today's planned workout → log actuals for each metric type → log food with unit → scan a step screenshot (exercises the new OCR) → view progress → view `/my-trainer` → edit today's food diary.

Every destructive action is confirmed with you before executing on shared test data.

### B5. Report deliverable
Single markdown file at `/mnt/documents/vecto_audit_report_v1.md` containing:
1. **Executive summary** — pass/fail count by severity.
2. **Historical regression table** — TW-001…TW-021, status per ticket, evidence.
3. **Findings log** — each with:
   - Finding ID (AUDIT-###)
   - Severity (Critical / High / Medium / Low)
   - Category (Functional / Data integrity / Security / RLS / Edge fn / UX-blocking)
   - File(s) + line numbers
   - Reproduction steps (code path or click path)
   - Why it matters in business terms
   - Recommended fix (not applied)
4. **Security sweep output** — linter results, RLS review notes, edge-fn auth audit.
5. **Triage recommendation** — which findings to fix in which order, based on impact to the trainer-wins-when-client-logs flywheel.

**No code changes. No migrations. No fixes.** After you read the report, we decide together what ships and in what order.

---

## Acceptance criteria

- Phase A: `tesseract.js` lazy-loads, OCR pre-fills step count, user confirms before save, TW-021 closed, build clean.
- Phase B: audit report delivered at `/mnt/documents/vecto_audit_report_v1.md` with every TW ticket verified, every RLS policy reviewed, every edge function auth confirmed, and live preview walk-through evidence for both roles. Zero code written during Phase B.

---

## Order of operations on approval

1. Phase A — Tesseract install → StepLogModal OCR wiring → tests → TW-021 entry. Single commit loop.
2. Phase B — audit; report-only; you triage.