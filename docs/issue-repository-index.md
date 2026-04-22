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