

## Exhaustive Scenario → Error/Message Matrix (Auth + Onboarding)

Source: `src/pages/Auth.tsx`, `src/pages/RoleSelection.tsx`, `src/pages/ProfileSetup.tsx`, `src/lib/errorUtils.ts`, `src/App.tsx`. Every row is taken verbatim from code — no inference.

### A. Sign-In flow (`/auth`, mode = signin)

| # | Scenario | Toast Title | Toast Description | Origin |
|---|---|---|---|---|
| A1 | Empty email submit | (button disabled, no toast) | — | `Auth.tsx` L266 |
| A2 | Invalid email format (e.g. `abc@`) | Invalid email | "Please enter a valid email" | `Auth.tsx` L52 (zod) |
| A3 | Empty password submit | (button disabled, no toast) | — | `Auth.tsx` L266 |
| A4 | Password < 6 chars | Invalid password | "Password must be at least 6 characters" | `Auth.tsx` L67 (zod) |
| A5 | Wrong email/password | Sign in failed | "Invalid email or password. Please try again." | `errorUtils.ts` L17 |
| A6 | Email exists but never confirmed | Sign in failed | "Please confirm your email address before signing in." | `errorUtils.ts` L18 |
| A7 | Too many sign-in attempts (rate limit) | Sign in failed | "Too many attempts. Please wait a few minutes and try again." | `errorUtils.ts` L19 |
| A8 | Network/timeout | Sign in failed | "Connection issue. Please check your internet and try again." | `errorUtils.ts` L13 |
| A9 | Any unmapped Supabase auth error | Sign in failed | "Something went wrong. Please try again." | `errorUtils.ts` L33 (default) |

### B. Sign-Up flow (`/auth`, mode = signup)

| # | Scenario | Toast Title | Toast Description | Origin |
|---|---|---|---|---|
| B1 | Empty email | (button disabled) | — | `Auth.tsx` L266 |
| B2 | Invalid email format | Invalid email | "Please enter a valid email" | `Auth.tsx` L52 |
| B3 | Password < 6 chars | Invalid password | "Password must be at least 6 characters" | `Auth.tsx` L67 |
| B4 | Email already registered | Sign up failed | "An account with this email already exists. Try signing in instead." | `errorUtils.ts` L16 |
| B5 | HIBP-pwned password (e.g. `password123`) | Sign up failed | "This password has appeared in a known data breach. Please choose a stronger, unique password." | `errorUtils.ts` L22 / L24 |
| B6 | `weak_password` error code without `pwned` reason | Sign up failed | "This password is too weak or has appeared in a data breach. Please choose a stronger, unique password." | `errorUtils.ts` L24 |
| B7 | Backend min-length rejection | Sign up failed | "Password is too short. Use at least 6 characters." | `errorUtils.ts` L23 |
| B8 | Signups disabled in Supabase | Sign up failed | "New sign-ups are temporarily disabled. Please contact support." | `errorUtils.ts` L20 |
| B9 | Email rejected as invalid by Supabase | Sign up failed | "Please enter a valid email address." | `errorUtils.ts` L25 |
| B10 | Rate-limit hit on signup | Sign up failed | "Too many attempts. Please wait a few minutes and try again." | `errorUtils.ts` L19 |
| B11 | Any unmapped error | Sign up failed | "Something went wrong. Please try again." | `errorUtils.ts` L33 |

### C. Forgot-Password flow (`/auth`, mode = forgot)

| # | Scenario | Toast Title | Toast Description | Origin |
|---|---|---|---|---|
| C1 | Invalid email format | Invalid email | "Please enter a valid email" | `Auth.tsx` L52 |
| C2 | Reset email sent successfully | Check your email | "We sent you a password reset link." | `Auth.tsx` L94-97 |
| C3 | Rate-limit on reset | Error | "Too many attempts. Please wait a few minutes and try again." | `errorUtils.ts` L19 |
| C4 | Unknown failure | Error | "Something went wrong. Please try again." | `errorUtils.ts` L33 |

### D. Invite-link capture (`?trainer=…` / `?ref=…`)

| # | Scenario | Behavior | Toast | Origin |
|---|---|---|---|---|
| D1 | Unauthenticated user opens `/auth?trainer=XXX` | `inviteTrainerCode` saved; mode forced to signup | (none) | `Auth.tsx` L31-46 + `App.tsx` `InviteContextCapture` |
| D2 | Already-authenticated user opens `/auth?trainer=XXX` (post TW-011 fix) | `InviteContextCapture` saves code globally before `AuthRoute` redirects to `/dashboard` | (none) | `App.tsx` L106-126 |
| D3 | Authenticated user with no profile opens `/role-selection?trainer=XXX` directly | Code saved by global capture; auto-process triggers client role | "Setting up your account..." (loading screen, no toast) | `App.tsx` + `RoleSelection.tsx` L20-36 |
| D4 | Trainer referral link `/auth?ref=XXX` | `referralTrainerCode` saved; mode forced to signup | (none) | `Auth.tsx` L41-46 |

### E. Role Selection (`/role-selection`)

| # | Scenario | Toast Title | Toast Description | Origin |
|---|---|---|---|---|
| E1 | Authenticated user with `inviteTrainerCode` lands on page | (auto-processed, no toast; loader shown) | — | `RoleSelection.tsx` L21-36 |
| E2 | User clicks "I'm a Client" WITHOUT `inviteTrainerCode` in localStorage | Incompatible Action | "Please use the Client Referral Link provided by your trainer to sign up." | `RoleSelection.tsx` L154-161 |
| E3 | User clicks "I'm a Trainer" (no referral) | (proceeds, no toast) | — | `RoleSelection.tsx` L162 |
| E4 | `generate_unique_id` RPC fails | Error | sanitized message (typically "Something went wrong. Please try again.") | `RoleSelection.tsx` L46-49, L140-144 |
| E5 | Profile upsert returns FK violation `23503` (auth user deleted) | Session Expired | "Please sign in again to continue." → forced sign-out + redirect to `/auth` | `RoleSelection.tsx` L128-138 |
| E6 | Profile upsert hits RLS violation | Error | "Unable to complete this operation. Please try again." | `errorUtils.ts` L8 |
| E7 | Profile upsert hits unique-key conflict beyond `user_id` | Error | "This record already exists." | `errorUtils.ts` L11 |
| E8 | `lookup_trainer_by_unique_id` returns empty for invite (invalid code) | (silent here — no toast; trainerId stays null; flow continues to ProfileSetup where it's caught) | — | `RoleSelection.tsx` L57-65 |
| E9 | Same, for trainer referral code | (silent; referredByTrainerId stays null; trainer registers with no referral) | — | `RoleSelection.tsx` L72-80 |
| E10 | `trainer_referrals` insert fails | (silently swallowed — no toast, no rethrow) | — | `RoleSelection.tsx` L106-113 |
| E11 | Network drop mid-RPC | Error | "Connection issue. Please check your internet and try again." | `errorUtils.ts` L13 |

### F. Profile Setup (`/profile-setup`)

| # | Scenario | Toast Title | Toast Description | Origin |
|---|---|---|---|---|
| F1 | Empty Full Name | Error | "Please enter your name" | `ProfileSetup.tsx` L108-110 |
| F2 | DOB blank, malformed, or impossible (e.g. 31/02/2000, year > current) | Error | "Please enter a valid date of birth (dd/mm/yyyy)" | `ProfileSetup.tsx` L113-117 |
| F3 | City not selected | Error | "Please select your city" | `ProfileSetup.tsx` L119-122 |
| F4 | WhatsApp not 10 digits | Error | "Please enter a valid 10-digit mobile number" | `ProfileSetup.tsx` L124-127 |
| F4a | WhatsApp partial (1-9 digits) typed | (inline text, not toast) | "Enter a valid 10-digit mobile number" | `ProfileSetup.tsx` L373-375 |
| F5 | Client: height empty / <50 / >300 | Error | "Please enter a valid height (50-300 cm)" | `ProfileSetup.tsx` L134-137 |
| F6 | Client: weight empty / <20 / >300 | Error | "Please enter a valid weight (20-300 kg)" | `ProfileSetup.tsx` L138-141 |
| F7 | Client invite code present but trainer not found in DB (post TW-011) | Invalid invite link | "We couldn't find your trainer. Please ask them to resend the link." | `ProfileSetup.tsx` L177-184 |
| F8 | `lookup_trainer_by_unique_id` RPC errors (network/permission) | (logged silently; flow continues without trainer link, then succeeds) | — | `ProfileSetup.tsx` L170-171 |
| F9 | Client invite code present, trainer found, profile update succeeds | Profile Complete! | "Your profile has been set up and linked to your trainer." | `ProfileSetup.tsx` L200-205 |
| F10 | Trainer or no-invite client, profile update succeeds | Profile Complete! | "Your profile has been set up successfully." | `ProfileSetup.tsx` L200-205 |
| F11 | Profile update RLS denial | Error | "Unable to complete this operation. Please try again." | `errorUtils.ts` L8 |
| F12 | Profile update hits validate_text_lengths trigger | Error | "Invalid data provided. Please check your input." | `errorUtils.ts` L10 |
| F13 | Network drop mid-update | Error | "Connection issue. Please check your internet and try again." | `errorUtils.ts` L13 |
| F14 | Any unmapped error | Error | "Something went wrong. Please try again." | `errorUtils.ts` L33 |

### G. Routing guards (no toasts — silent redirects)

| # | Scenario | Behavior |
|---|---|---|
| G1 | Unauthenticated user hits `/dashboard`, `/home`, `/plans`, `/progress`, `/refer`, `/profile` | Redirect to `/auth` |
| G2 | Authenticated user with no profile hits any protected route | Redirect to `/role-selection` |
| G3 | Authenticated user with profile but `profile_complete = false` hits any protected route | Redirect to `/profile-setup` |
| G4 | Authenticated user hits `/auth` | Redirect to `/dashboard` (after `InviteContextCapture` runs) |
| G5 | Authenticated user with completed profile hits `/role-selection` | Redirect to `/dashboard` |
| G6 | Authenticated user with completed profile hits `/profile-setup` | Redirect to `/dashboard` |
| G7 | Authenticated user hits `/` | Redirect to `/dashboard` |
| G8 | Auth or profile loading | Renders `null` (splash screen continues; hard cap 1200ms) |

### H. Known silent failure paths (no user-visible message)

These were uncovered during the audit and are flagged as gaps:

| # | Gap | Current behavior | Risk |
|---|---|---|---|
| H1 | E8 — invalid trainer invite code at RoleSelection | No toast; user proceeds and only sees error at F7 | User wastes time filling profile before learning code is bad |
| H2 | E9 — invalid trainer referral code | No toast ever; trainer registers with no attribution | Silent revenue/attribution loss |
| H3 | E10 — `trainer_referrals` insert failure | Silently swallowed | Referral never recorded; no recovery path |
| H4 | F8 — `lookup_trainer_by_unique_id` RPC error (vs. empty result) | Logged only; client continues without `trainer_id` and is marked `profile_complete` | Orphan client account, no trainer link, no toast |
| H5 | A8/B10 — rate-limit response shape from Supabase varies; pattern may miss some forms | Falls through to "Something went wrong" | User retries blindly |

---
TW-ID: TW-011 (status: fixed — awaiting-verification) + new gaps H1-H5 candidates for new TW-### entries
Files touched: none (read-only audit)
Repo updated: no — this is a planning/audit response, no code changed; if you want H1-H5 logged as new TW entries (TW-012 silent invite failures, TW-013 silent referral failures, etc.), say the word and I'll open them next turn
Regression check: grepped for prior auth/invite issues — TW-009, TW-010, TW-011 all linked above; no regression of earlier issues introduced by this audit

