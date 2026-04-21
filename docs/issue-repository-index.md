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