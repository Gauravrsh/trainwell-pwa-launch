
# Vecto v0.X — Consolidated Build Plan (Items 1–8)

All 8 items below were spec-locked across the prior review rounds. This plan is the single execution order. Bugs (TW-019, TW-020) will be appended to `docs/issue-repository.md` and `docs/issue-repository-index.md` per SOP-2.

---

## Build order (dependency-aware)

1. **Item 4** — TW-019: Refer copy fix *(pure copy, lowest risk, ship first)*
2. **Item 8** — TW-020: Invited-client Role-Selection bypass *(routing fix, no schema)*
3. **Item 5** — `useSelectedClient` hook + wiring *(pure hook, no schema)*
4. **Item 1** — Role-split Terms page + tabular Plan Agreement card *(read-only, no schema)*
5. **Item 6** — Trainer Profile fields, avatar + certifications buckets, client-side Trainer Profile sub-section *(schema + storage)*
6. **Item 7** — Exercise metric_type + food unit dropdown *(schema + UI)*
7. **Item 3** — Steps OCR fallback (extract → confirm → save) *(edge function + UI)*
8. **Item 2** — Trainer client archive/unlink + G1–G5 anti-gaming *(schema + RPCs + RLS + UI; biggest blast radius, ships last)*

---

## Item 4 — TW-019 (Refer copy)

**Files:** `src/pages/Refer.tsx`

- Replace trainer share text body (line ~62) with the approved string.
- Replace "How Trainer Referral Works" step #4 (line ~263) with: *"They start free on Smart (3 clients). When they upgrade, you get the validity bonus."*
- Replace client share text with the approved tightened version.
- Append to `docs/issue-repository.md` and `docs/issue-repository-index.md`:
  `TW-019 | Medium | Fixed | Stale "14 bonus days" copy in Refer page | Refer.tsx`

**Regression check:** No logic touched. Refer page still renders for trainers only.

---

## Item 8 — TW-020 (Invited client → Profile Setup)

**Files:** `src/App.tsx`, `src/pages/RoleSelection.tsx`, `src/pages/ProfileSetup.tsx`

- **`RoleSelectionRoute`** in `App.tsx`: detect `localStorage.inviteTrainerCode`. If present and user is authenticated with no profile → fire role-assignment RPC inline, then `<Navigate replace to="/profile-setup" />`. Never mount `<RoleSelection />`.
- **`RoleSelection.tsx`**: remove the `autoProcessing` branch entirely. Page now only handles trainer / non-invited flows. Manual click handlers always responsive.
- **`ProfileSetup.tsx`**: top-of-page inline status row *"Linking you to your trainer…"* shown while link RPC is in-flight; auto-hides on success.
- **RPC failure path**: toast *"Couldn't link to your trainer right now. Try again."* with Retry button. Never falls back to role tiles.
- Append to issue repo:
  `TW-020 | High | Fixed | Invited client briefly lands on Role Selection | App.tsx / RoleSelection.tsx`

**Regression check:** Trainer signup w/ `referralTrainerCode` only → still sees Role Selection. Direct client signup → still blocked by signup-restriction policy. TW-011/12/14/15 preserved (uses `Navigate replace`).

---

## Item 5 — `useSelectedClient` (session-scoped)

**Files:** `src/hooks/useSelectedClient.tsx` (new), `src/pages/Calendar.tsx`, `src/pages/Progress.tsx`, `src/components/training-plans/CreatePlanModal.tsx`, `src/hooks/useAuth.tsx`

- New hook `useSelectedClient()`:
  - Reads/writes `sessionStorage['vecto.selectedClientId']`.
  - Exposes `{ selectedClientId, setSelectedClientId, clearSelectedClient }`.
  - On mount: validates stored id against `get_trainer_clients()` result; silently clears if stale (archived/unlinked).
- Wire into Calendar, Progress, CreatePlanModal (default when no `preselectedClientId`).
- `useAuth.signOut()`: `sessionStorage.removeItem('vecto.selectedClientId')`.
- Refresh behavior: native sessionStorage (survives reload, dies with tab) — option **(b)**.

**Regression check:** Client-role users unaffected (hook returns null). Stale id → silent clear, no crash. No `navigate()`/history pollution.

---

## Item 1 — Role-split Terms + tabular Plan Agreement

**Files:** `src/pages/Terms.tsx`

- Detect role via `useProfile`. Render only the relevant accordion set.
- **Client sections:** General ToS, Privacy, Calendar/Leave Rules, **My Plan(s)** (new tabular card), Payment & Refund (with Vecto-wide static clause: *"No refunds via Vecto; settle directly with your trainer."*).
- **Trainer sections:** General ToS, Privacy, Subscription Terms, Referral Terms, Calendar/Leave Rules. *(Trainer Code of Conduct deferred per your call.)*
- **My Plan(s) card** = pure read-only table per active/upcoming plan from `client_training_plans` joined to trainer profile:
  Trainer name, Plan name, Service type, Billing model, Start–End, Total sessions, Total fee, Paid, Due.
- **Skipped:** legal frame paragraph, "I Accept" gate, `client_accepted_at` / `client_accepted_ip` columns and related RLS.
- Empty-state when client has no active plan; null-profile fallback shows General ToS + Privacy only.

**Regression check:** No schema migration. Public `/terms` access (unauthenticated landing-page link) still works — falls back to General ToS + Privacy.

---

## Item 6 — Trainer Profile (extended fields + client-side view)

### Schema (one migration)

`profiles` add columns (all nullable, trainer-meaningful only):
- `avatar_url text`
- `years_experience integer` (0–60 check)
- `bio text` (≤500 chars via `validate_text_lengths`)
- `specializations text[]` (curated list + one optional "Other" string entry)
- `instagram_handle text` (≤30 chars, regex `^[a-zA-Z0-9._]+$`)
- `years_in_city integer` (0–60 check)

New table `trainer_certifications`:
- `id uuid pk`, `trainer_id uuid` → profiles, `file_url text`, `file_name text`, `mime_type text`, `uploaded_at timestamptz default now()`
- Limit enforced via insert trigger: ≤10 rows per trainer.
- RLS: trainer (owner) full CRUD; linked clients SELECT-only (via `is_trainer_of_client`-style helper inverted).

Extend `validate_text_lengths` for `bio` and `instagram_handle`.

### Storage buckets

- **`avatars`** — public-read, 2MB cap, `image/*`, owner-write. Path: `{profile_id}/avatar.{ext}`.
- **`certifications`** — authenticated-read gated by RLS (owner + linked clients), 5MB cap, `application/pdf` + `image/*`, owner-write. Path: `{trainer_profile_id}/{cert_id}.{ext}`.

### UI

- **`Profile.tsx` (trainer):** new "Professional" section — avatar uploader, years_experience, years_in_city, bio textarea, specializations multi-select chips (curated list: Strength, Hypertrophy, Fat Loss, Endurance, Mobility, Rehab, Pre/Post-natal, Sports-specific, Powerlifting, Calisthenics) + single "Other" free-text input, Instagram handle, certifications uploader (file list + delete + download).
- Soft completion bar — non-blocking.
- Non-blocking banner on first plan creation flow: *"Your client doesn't know who you are yet. Add a photo and a line of bio."*
- **`Profile.tsx` (client):** new "Trainer Profile" sub-section. Tap → sheet with avatar, name, age (derived from DOB), years_experience, years_in_city, certifications (downloadable list), specializations chips, bio, Instagram tap-out. **No WhatsApp button** (deferred). Calendar untouched.

**Regression check:** All new fields nullable; existing rows untouched. Profile completion logic remains based on existing required fields (full_name, DOB, etc.) — new fields don't gate completion.

---

## Item 7 — Exercise metric types + food units

### Exercises

Schema additions to `exercises`:
- `metric_type text default 'reps_weight'` (CHECK in: reps_weight, time_hold, distance, time_distance, reps_only, tempo)
- `recommended_duration_sec integer`, `recommended_distance_m numeric`
- `actual_duration_sec integer`, `actual_distance_m numeric`
- `tempo_pattern text` (≤7 chars, validated via `validate_text_lengths`)

UI in trainer workout builder: small metric-type pill swaps the input fields. Default `reps_weight` (current behavior unchanged).

Workout completion logic: an exercise counts as "logged" when relevant `actual_*` for its metric_type are populated.

Migration: existing rows default to `reps_weight`, no data movement.

### Foods

Curated unit list (final): `piece(s), serving, plate, bowl, katori (~150ml), small katori (~100ml), cup (~240ml), glass (~250ml), tablespoon (tbsp), teaspoon (tsp), gram, ml`.

- Pass list into AI system prompt in `analyze-food` and `lookup-or-analyze-food` edge functions for better Indian-term parsing.
- After AI response, render parsed items in `FoodLogModal` with a **unit dropdown** next to each quantity (user can correct).
- `FoodDiaryEditModal`: add unit dropdown next to quantity.
- `food_dictionary.quantity_unit`: soft-validation trigger constraining to the curated list, fallback `'serving'`.

**Regression check:** Existing exercises and food rows continue to work. Default metric_type preserves all current trainer/client logging flows. Food describe-tab text input unchanged; unit dropdown is additive.

---

## Item 3 — Steps OCR fallback

**Files:** new edge function `extract-step-count/index.ts`, `src/components/modals/StepLogModal.tsx`

- New camera/gallery upload path in `StepLogModal`.
- Edge function calls Gemini 3 Flash with vision; extracts integer step count + confidence.
- UI shows extracted value pre-filled in the existing step input. User confirms / edits before save.
- No image storage — image discarded after extraction.
- Standard error handling: on failure, fall back to manual entry with toast.

**Regression check:** Manual entry path unchanged. Lime brand color preserved on tiles. Live distance/energy preview unaffected.

---

## Item 2 — Trainer client archive / unlink + anti-gaming

### Schema (single migration)

- `profiles` add: `archived_at timestamptz`, `archived_by uuid` (nullable).
- New table `client_status_changes`: `id uuid pk, trainer_id uuid, client_id uuid, action text check in ('archive','reactivate','unlink'), reason text, created_at timestamptz default now()`. RLS: trainer can SELECT own rows; only RPCs (security definer) write.
- Extend `can_trainer_add_client` to count only `archived_at IS NULL` clients.
- Extend `get_trainer_clients` to exclude archived rows.
- New `get_trainer_archived_clients` RPC.

### RPCs (all SECURITY DEFINER, all enforce `auth.uid()` ownership)

- **`archive_client(p_client_id, p_reason)`** — applies G1–G5 server-side:
  - **G3:** auto-cancel in-progress plans with reason `client_archived`; only frees slot once last active plan is `completed`/`cancelled`.
  - **G5:** block if client has paid in last **14 days** for an unfulfilled plan (≥1 session remaining). Returns `{ blocked: true, reason: 'unfulfilled_paid_plan' }`.
  - Sets `archived_at = now()`, `archived_by = trainer_profile_id`. Logs row in `client_status_changes`.
- **`reactivate_client(p_client_id)`** — applies:
  - **G1:** Smart/free trainers blocked until `now() > archived_at + 30 days`. Pro/Elite immediate.
  - **G2:** max **2** archive→reactivate cycles per client per 365-day window (counted from `client_status_changes`).
  - Clears `archived_at`/`archived_by`. Logs reactivate row.
- **`unlink_client(p_client_id)`** — hard removal:
  - Requires no active plan.
  - Sets `profiles.trainer_id = NULL`. Logs `unlink` row.
  - **Notifies client** via `trainer_notifications` insert + push: *"Your trainer has ended the engagement."*

### Cron (G4)

Extend existing `nudge-trainers` schedule (or add a new daily job): trainers with clients archived ≥90 continuous days → flip `profiles.trainer_id = NULL` automatically; client survives, must be re-invited.

### UI

- **`Profile.tsx` → "My Clients"** section (trainer view): 3-dot menu per client with **Archive** and **Unlink (permanent)**.
- Confirmation sheet shows: which guard rule applies, slot impact (*"This will free 1 of 3 Smart slots"*), and cooldown clock if any.
- **Archived Clients** collapsed list at the bottom with **Reactivate** CTA. Greyed out with countdown if G1 cooldown active or G2 cap reached.

**Regression check:** All RLS using `is_trainer_of_client()` keeps working — archive only flips `archived_at` (not `trainer_id`) until G4 fires at 90d. Calendar / Progress / Plans / Refer auto-exclude archived via updated `get_trainer_clients`. Smart trainers at 3-cap with an archived client get the slot freed.

---

## Cross-cutting QA checklist (run before publish)

- All new RPCs: anonymous role denied; non-owner trainers denied.
- New storage buckets: cross-trainer access attempts denied.
- `validate_text_lengths` extended cleanly (no false-positive rejections on existing rows).
- Existing test suites pass: `modal-alignment`, `modal-responsive`, `viewport-sizes`.
- Issue repo + index updated with TW-019 and TW-020 closing blocks per SOP-2.
- Memory updates after ship:
  - `mem://features/trainer-profile/extended-fields-and-client-view`
  - `mem://features/trainer-client-lifecycle/archive-unlink-and-anti-gaming`
  - `mem://features/exercise-metric-types`
  - `mem://features/food-logging/curated-units-and-dropdown`
  - `mem://features/cross-page-client-selection`
  - `mem://features/terms-page-role-split-and-plan-agreement-table`
  - `mem://features/steps-logging/ocr-extraction-fallback`

---

**Approve to proceed → I switch to build mode and ship in the order above.**
