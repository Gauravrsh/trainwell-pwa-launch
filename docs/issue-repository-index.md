# TrainWell Issue Index
> One line per issue. Grep this first on every debug session and `regression:` trigger.
> Format: `TW-### | Severity | Status | Short title | Primary file`

TW-001 | Critical | Fixed | Razorpay payment button freezes mobile | PlanSelectionModal.tsx
TW-002 | Medium | Fixed | Plan modal not defaulting to annual | PlanSelectionModal.tsx
TW-003 | Critical | Fixed | Webhook cannot identify trainer post-payment | razorpay-webhook/index.ts
TW-004 | Critical | Fixed | No redirect back after successful payment | PlanSelectionModal.tsx
TW-005 | Medium | Fixed | Annual plan duration 365 vs 425 days | razorpay-webhook/index.ts
TW-006 | Low | Known-nonblocking | React forwardRef deprecation warnings | (radix-ui)
TW-007 | Medium | To-investigate | Calendar dates not color-coded | Calendar.tsx
TW-008 | Critical | Fixed | Supabase 7-day idle auto-pause | migrations/heartbeat
TW-009 | Critical | Fixed | Signup disabled blocked all new users | errorUtils.ts
TW-010 | High | Fixed | HIBP pwned-password shown as generic error | errorUtils.ts
TW-011 | High | Fixed | Invited client link loses trainer context for authenticated users | App.tsx / RoleSelection.tsx / ProfileSetup.tsx
TW-012 | High | Fixed | Blank page after profile setup due to stale profile context + wrong redirect target | ProfileSetup.tsx
TW-013 | High | Fixed | Sign In button silently does nothing when password is autofilled but email isn't (state/DOM desync) | Auth.tsx
TW-014 | High | Fixed | PWA back button does not exit from root screen on Android | App.tsx / useAndroidBackExit.ts
TW-015 | High | Fixed | Back button after sign-out re-enters /auth in browser due to stale history | Profile.tsx / useAuth.tsx
TW-016 | Low | Fixed | Loading state placeholder lacks brand quote | App.tsx / LoadingQuote.tsx
TW-017 | High | Fixed | Modals (workout, weight, create plan) overlapped by on-screen keyboard on Android | index.css / useKeyboardInset.tsx
TW-018 | Low | Fixed | Loading screen still showed VECTO wordmark + tagline above quote | App.tsx
TW-019 | Medium | Fixed | Stale "14 bonus days" copy in Refer page after pricing model changed | Refer.tsx
TW-020 | High | Fixed | Invited client briefly lands on Role Selection instead of going straight to Profile Setup | App.tsx / RoleSelection.tsx
TW-021 | Medium | Fixed | Steps OCR assist \u2014 user scans fitness-tracker screenshot, Tesseract pre-fills step count, confirm-before-save | StepLogModal.tsx / stepOcr.ts
TW-022 | High | Fixed | Steps OCR picks goal/kcal/distance instead of actual steps (regression on TW-021) | stepOcr.ts
TW-024 | High | Fixed | Stale PWA service worker/cache resurrects old calendar dots/icons and old UI | sw.js / buildFreshness.ts / ResetApp.tsx
TW-024b | High | Fixed | TW-024 fix required manual kill-relaunch; SW updatefound + controllerchange + visibility recheck added | buildFreshness.ts
TW-025 | High | Fixed | Completed client workout re-prompted "Log Workout"; modal showed zeros; save toast falsely confirmed re-log | Calendar.tsx / ClientWorkoutLogModal.tsx / client-workout-relog.test.ts
TW-026 | High | Fixed | Public Landing page flashes as a splash screen on cold boot for already-signed-in users (auth-bootstrap race) | App.tsx / public-landing-auth-gate.test.ts
TW-027 | Enhancement | Shipped | Exercise vault expansion: +8 strength/mobility entries (IYTW x4, Hyperextension x2, Mountain Pose, Adductor Stretch) + new "Cardio & Endurance" category (25 entries incl. Swimming) + per-exercise default metric auto-seeding in workout modals | gymExercises.ts / TrainerWorkoutLogModal.tsx / ClientWorkoutLogModal.tsx / exercise-vault.test.ts
TW-028 | High | Fixed | Progress page: "Avg Daily Deficit" silently averaged BMR over missed days (1114 instead of 369 for Gaurav), date filter was off-by-one ("3 days" → 4), and BMR mutated history retroactively | bmr_logs migration / useProgressData.tsx / Progress.tsx / ActionChart.tsx / OutcomeChart.tsx / BMRLogModal.tsx / progress-math.test.ts
TW-029 | High | Fixed | Re-saving an already-completed workout kept appending duplicate copies of every client-added exercise (Gaurav: "Swimming - Freestyle" logged 7×) and the slow Save button had no double-click guard | Calendar.tsx / ClientWorkoutLogModal.tsx / TrainerWorkoutLogModal.tsx / workout-relog-idempotency.test.ts
TW-030 | High | Fixed | Calendar old dot/icon UI resurfaced again on Gaurav's mobile due to stale installed PWA shell; added pre-React freshness sentinel and stronger SW/test guards | index.html / sw.js / manifest.json / calendar-boundary-ui.test.ts / pwa-freshness.test.ts