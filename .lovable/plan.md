# Phase B — Forensic Regression Audit

**Mode:** Read-only. No code edits. No migrations. No fixes.
**Deliverable:** `/mnt/documents/vecto_audit_report_v1.md`
**Scope:** Everything — trainer + client + public landing + payments + edge functions.
**Severity bar:** Any functional break (dead button, lost data, wrong value saved, privilege leak, RLS bypass, edge-fn auth gap).

---

## B1. Historical regression sweep — TW-001 through TW-021

Method: for each ticket in `docs/issue-repository-index.md`, `code--search_files` the referenced file(s) and confirm the documented fix is still present. Any ticket marked "Fixed" whose guard is no longer in code → logged as a regression finding.

Output: per-TW pass/fail table in the report.

## B2. Deep code read — every hot path

Methodical read (files only, no edits):

- **Auth & routing guards** — `App.tsx` (`ProtectedRoute`, `RoleSelectionRoute`, `ProfileSetupRoute`, `PublicLandingRoute`, `AuthRoute`), `useAuth.tsx`, `useProfile.tsx`, `RoleSelection.tsx`, `ProfileSetup.tsx`. Confirm TW-011, TW-013, TW-014, TW-015, TW-020 guards intact. Confirm no route leaks an unauth user into protected surface or strands an authed user on public one.
- **Trainer lifecycle** — signup → role → profile setup → `start_trainer_free` trial → invite client → create plan → log workout (all metric types) → log meal → view progress → subscription renewal. Read end-to-end for orphan states.
- **Client lifecycle** — invite link → auto-role-assign → profile setup → today's planned workout → log actuals (every `MetricType`) → log food with new unit dropdown → edit same-day diary → `/my-trainer` → progress → Steps OCR (new path).
- **Calendar completion logic** — `parsePlannedExercises` + `isActualLogged` walked against every metric type in `Calendar.tsx`. AMRAP and EMOM highest risk.
- **Food unit dropdown** — single-item meal persists `quantity_value`/`quantity_unit`; multi-item meal nulls them. `parseQuantity` behavior on AI output strings.
- **Trainer Profile** — avatar signed URL lifecycle, `/my-trainer` RPC, TrainerProfileEditModal validation.
- **Terms role-split** — trainer vs client accordion visibility, Plan Agreement.
- **Subscription read-only enforcement** — every write path (workouts, food_logs, client_training_plans, plan_sessions, day_marks, step_logs) verified blocked when `has_active_platform_subscription` returns false. UI surfaces a clean error.
- **Landing page ref warnings** — 3 live `Function components cannot be given refs` warnings (HowItWorks, HouseRules, ComparisonTable) from current console logs. Logged as runtime warnings.
- **Steps OCR (TW-021)** — `stepOcr.ts` extractor, `StepLogModal.tsx` wiring, lazy-load behavior, confirm-before-save.

## B3. DB + security sweep

- `supabase--linter` — run once, include output verbatim.
- Manual RLS review on all 20 public tables. Threat model: can a client read another client's data? can a trainer read a non-client's data? can an expired-subscription trainer write? can anon read anything sensitive?
- Review every `SECURITY DEFINER` function: `apply_referral_reward`, `get_my_trainer_profile`, `get_client_profile_for_trainer`, `get_trainer_subscription_status`, `get_trainer_referral_stats`, `start_trainer_free`, `start_trainer_trial`, `lookup_trainer_by_unique_id`, `renew_trainer_subscription`, `create_trainer_subscription`, `can_trainer_add_client`, `calculate_referral_reward`, `has_active_platform_subscription`, `is_trainer_of_client`, `is_profile_owner`, `get_user_profile_id`, `get_trainer_profile_id`, `get_user_role`, `get_trainer_clients`, `bump_dictionary_usage`, `search_food_dictionary`, `update_trainer_activity`, `record_heartbeat`, `generate_unique_id`, `create_trainer_subscription_webhook`, `renew_trainer_subscription_webhook`. Check `auth.uid()` presence and ownership validation.
- Edge function auth — `analyze-food`, `lookup-or-analyze-food`, `razorpay-webhook`, `nudge-trainers`, `nudge-clients`, `generate-expiry-notifications`, `record-food-edit`. Confirm JWT/MAINTENANCE_TOKEN/HMAC pattern.
- Storage `avatars` bucket RLS — owner-write, authenticated-read via signed URLs.

## B4. Live preview walk-through

Browser tool on preview URL. Two sessions in sequence:

- **Trainer session:** land → signup → profile → subscribe (test mode, no real payment) → copy invite link → create plan → log workout for each metric type (reps_weight, time, AMRAP, EMOM, distance_time) → log food with unit dropdown → log steps → edit trainer profile w/ avatar → check notifications → progress → plan agreement.
- **Client session:** separate browser → open invite link → signup → auto-assign → confirm no role-selection shown → profile setup → see today's planned workout → log actuals per metric type → log food with unit → test Steps OCR with a screenshot → progress → `/my-trainer` → edit today's food diary.

Every destructive action confirmed before executing on shared test data.

## B5. Report deliverable

Single markdown file at `/mnt/documents/vecto_audit_report_v1.md`:

1. **Executive summary** — pass/fail count by severity.
2. **Historical regression table** — TW-001…TW-021, status per ticket, evidence.
3. **Findings log** — each with:
   - Finding ID (AUDIT-###)
   - Severity (Critical / High / Medium / Low)
   - Category (Functional / Data integrity / Security / RLS / Edge fn / UX-blocking)
   - File(s) + line numbers
   - Reproduction steps (code path or click path)
   - Why it matters in business terms
   - Recommended fix (NOT applied)
4. **Security sweep output** — linter results, RLS review notes, edge-fn auth audit.
5. **Triage recommendation** — fix order, tied to trainer-wins-when-client-logs flywheel.

---

## Acceptance

- Report delivered at `/mnt/documents/vecto_audit_report_v1.md`.
- Every TW ticket verified.
- Every RLS policy reviewed.
- Every edge function auth confirmed.
- Live preview walk-through evidence for both roles.
- **Zero code written, zero migrations run.**

After you read the report, we triage together and you pick which fixes ship in what order.
