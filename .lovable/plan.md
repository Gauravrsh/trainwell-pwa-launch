
## Bug to log
Create a new entry: `TW-011 | High | Investigating/Fixed | Invited client link loses trainer context for authenticated/incomplete users | Auth.tsx / App.tsx / RoleSelection.tsx`

## What is happening
The screenshot is consistent with one specific failure path:

1. Trainer shares `/auth?trainer=<code>`.
2. Client is already authenticated or has a half-created account from a prior attempt.
3. `AuthRoute` redirects authenticated users away from `/auth` before `Auth.tsx` mounts.
4. Because `Auth.tsx` never mounts, its `useEffect` never stores `inviteTrainerCode` in `localStorage`.
5. User lands on `RoleSelection` without invite context.
6. Clicking “I’m a Client” triggers the hard block:
   “Please use the Client Referral Link provided by your trainer to sign up.”

So the issue is not that the trainer link is wrong. The issue is that **invite context is currently captured only inside the Auth page**, which is bypassed for already-authenticated users.

## Why this happened
Current implementation has two structural weaknesses:

### Root cause A
`src/pages/Auth.tsx` is the only place that reads `?trainer=` / `?ref=` and saves them.

### Root cause B
`src/App.tsx` redirects authenticated users off `/auth` immediately, so invited users with an existing session never execute the capture logic.

### Root cause C
`src/pages/RoleSelection.tsx` clears `inviteTrainerCode` too early during role assignment, which makes the flow brittle if the user re-enters the route before profile setup completes.

## Scenarios to cover in the fix
I’ll implement against this full matrix so it does not recur:

1. New unauthenticated client opens trainer invite link
2. Existing authenticated but profile-incomplete client opens trainer invite link
3. Existing authenticated trainer-invite recipient opens same link again after interruption
4. Trainer referral signup via `?ref=`
5. Standard trainer signup without referral
6. Direct client role selection without invite link should still stay blocked
7. Invalid / expired / mistyped trainer code
8. Invite flow survives redirects between `/auth`, `/role-selection`, and `/profile-setup`
9. Invite flow survives reload during profile setup
10. Successful completion clears stale invite context only after trainer linking succeeds

## Implementation plan

### 1) Move invite/referral capture out of `Auth.tsx`
Create a route-level invite-context capture mechanism that runs regardless of page:
- read `location.search` globally
- if `trainer` exists, store `inviteTrainerCode`
- if `ref` exists, store `referralTrainerCode`

This should happen in app-level routing logic, not only on the Auth screen.

### 2) Preserve invite handling for authenticated users
Update routing so that visiting `/auth?trainer=...` while signed in still captures the query before redirecting onward.

Result:
- authenticated incomplete users keep the trainer code
- they can land on `RoleSelection` with valid invite context
- client selection no longer falsely throws “Incompatible Action”

### 3) Stop clearing invite code too early in `RoleSelection.tsx`
Change the flow so `inviteTrainerCode` is not removed immediately after role assignment.
Keep it until the profile/setup step has successfully linked the client to a trainer.

### 4) Make profile setup the definitive consume point
`ProfileSetup.tsx` should be the single place where invite code is finally consumed and removed after successful trainer lookup + successful profile update.

If trainer lookup fails:
- keep user recoverable
- show a specific human-readable error
- do not silently strand them in a broken state

### 5) Harden manual client selection logic
In `RoleSelection.tsx`:
- keep blocking direct client signup without invite
- but if user arrived from a link in the same browser session, allow selection consistently
- add fallback messaging for invalid trainer codes vs missing invite context

### 6) Add regression-safe error handling
Improve invite-specific error messaging so users see:
- invalid invite link
- trainer not found
- session mismatch / stale partially-created account
instead of generic failure or misleading “Incompatible Action”

### 7) Update bug repository
Add `TW-011` to:
- `docs/issue-repository.md`
- `docs/issue-repository-index.md`

Repository entry should include:
- **Detected via:** user-reported
- **Prevention:** global invite-context capture + delayed invite-code cleanup + flow audit matrix

## Files to update
- `src/App.tsx`
- `src/pages/Auth.tsx`
- `src/pages/RoleSelection.tsx`
- `src/pages/ProfileSetup.tsx`
- `src/lib/errorUtils.ts` if invite-specific messages need mapping
- `docs/issue-repository.md`
- `docs/issue-repository-index.md`

## Expected outcome after fix
If a client opens the trainer’s link:
- it works whether they are signed out or already signed in
- it works even if a previous attempt was interrupted
- role selection retains trainer context
- the client can complete setup and get linked to the trainer
- direct non-invite client signup remains blocked

## Verification checklist after implementation
1. Fresh signed-out client via invite link
2. Existing signed-in user with no profile via same invite link
3. Reload on role-selection after invite capture
4. Reload on profile-setup before submit
5. Wrong trainer code
6. Trainer referral flow still works
7. Direct client signup without invite still blocked
8. Bug repo shows new `TW-011` entry and index line
