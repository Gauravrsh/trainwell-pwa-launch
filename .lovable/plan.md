## Goal
Produce a single PDF (`/mnt/documents/vecto_hooked_audit_screenshots.pdf`) containing exhaustive, unedited live-app screenshots for **Trainer** and **Client** personas, organized linearly by persona then by the 4 Hooked phases (Trigger → Action → Variable Reward → Investment), with the exact labelling format NotebookLM requested.

## Credentials assumed
- Account A: `Gaurav.rsh@gmail.com` / `@February$8912_`
- Account B: `gaurav.sharma@fplabs.tech` / `@February$8912_`

I'll confirm which is Trainer vs Client by logging in and reading the dashboard. Please flag now if one of these is actually a different role than expected.

## Capture plan (live preview, mobile viewport 390×844 — matches real PWA usage)

### Trainer persona — screens to capture
**Trigger**
- Browser tab on cold load (splash)
- Auth screen
- Post-login landing (Trainer dashboard / calendar home)
- Notification bell open (inbox)
- Any visible push-permission or install prompt

**Action**
- Bottom nav — each tab opened (Home, Calendar, Plans, Refer, Profile)
- Calendar: today cell, future cell tap → workout/meal log modal sequence
- Trainer workout log modal: empty → exercise added → saved
- Food log assignment flow (if available from trainer side)
- Plans tab: list → "New Plan" modal → client picker → plan-type selection → submit
- Manage Billing modal on an existing plan
- Client selector (cross-page)
- Profile page edits (TrainerProfile edit modal)

**Variable Reward**
- Calendar with mixed green/red/pending states (scroll today + a couple weeks)
- Progress page: client selector → Steps chart, Action chart, Outcome chart, quick stats row
- Referral page (stats > CTA)
- Subscription/renewal banners or expiry warnings if shown
- Any toast/confirmation after a successful log

**Investment**
- Profile setup (if re-accessible) or Profile fields (BMR, weight, WhatsApp, city, etc.)
- Trainer profile edit modal full view
- Plan creation deep flow (all steps, including legal footer)
- Adding/inviting a client (referral code surface)
- Subscription plan-selection modal (monthly vs annual)

### Client persona — screens to capture
**Trigger**
- Cold splash → auth → post-login Client dashboard
- Notification bell / inbox (if visible to client)
- Install prompt modal (force-trigger by route if needed)
- Any nudge banners

**Action**
- Bottom nav — each tab (Home, Calendar, Progress, MyTrainer, Profile)
- Calendar: today cell tap → "mark done / edit / mark missed" sequence for assigned workout
- Client workout log modal: pre-populated trainer recs → edit set → save
- Food log: Describe tab → entry → AI result → save; Photo tab → camera capture path; batch entry across meals
- Step log modal: input → live distance/energy preview → save
- Weight log modal
- BMR log modal (if client-accessible)

**Variable Reward**
- Calendar showing locked past dates + green/red marks
- Food session summary after save
- Food diary panel for the day
- Progress page: stats row (Avg Deficit, Days Logged, Days Missed, Weight Change), Steps/Action/Outcome charts
- BMR-stale warning (if surfaced)
- MyTrainer page

**Investment**
- ProfileSetup full flow if re-accessible (else Profile page sections)
- Profile body-metrics editing
- Initial weight/BMR entry
- Terms & conditions accordions (Client view)
- Client subscription view / plan agreement

## Capture method
1. `browser--navigate_to_sandbox` at 390×844 viewport.
2. Log in as Account A → identify role from dashboard → capture trainer set if trainer, else client set.
3. Log out (or open private session via re-navigation), log in as Account B → capture remaining set.
4. For every screen: `browser--screenshot`, save raw PNG to `/tmp/audit/<persona>/<phase>/<NN>_<short-name>.png`. Files kept unedited (full viewport, no cropping, no annotation overlays).
5. Trigger modals / states by direct interaction; if a state can't be reached without seed data (e.g. expired subscription banner), I'll note "state not reachable in current account" on that page.

## PDF assembly
- Tool: Python + ReportLab. One screenshot per page (portrait, US Letter), screenshot scaled to fit width with margin, label text above image.
- Label format exactly per NotebookLM example:
  `Trainer View: Screen 07 — Plans tab: New Plan modal, client picker open` (Phase: Action)
- Section dividers (full-page title pages):
  - Cover: "VECTO — Hooked Model UI/UX Audit Pack"
  - Trainer › Trigger / Action / Variable Reward / Investment
  - Client  › Trigger / Action / Variable Reward / Investment
- Footer on every page: persona, phase, screen number, viewport (390×844), capture timestamp.
- No analysis, no commentary, no recreated images. Pure labelled screenshot pack for NotebookLM ingestion.
- Visual QA: convert final PDF to images via `pdftoppm`, scan every page for clipped images / wrong labels / blank pages, fix and re-render until clean.
- Output: `/mnt/documents/vecto_hooked_audit_screenshots.pdf` + the raw `/tmp/audit/...` PNG tree (kept in case you want individual files later).

## Out of scope
- Writing the actual Hooked critique (NotebookLM will do that).
- Editing, annotating, or recreating any screen.
- Any code changes to the Vecto app.

## Risks / things I'll surface as I go
- Some states (expired subscription, push notification actually arriving, install prompt timing) may not be reachable from the two accounts on demand. I'll capture the closest in-app surface and label it `state simulated via route` or `not reachable — closest surface shown`.
- If both accounts turn out to be the same role, I'll stop and ping you for a second-role login before proceeding.
