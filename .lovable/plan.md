# Annual Plan: Drop "12+2 months", keep ₹9,999 for 12 months

## Decision recap

- **Elite (Annual)**: ₹9,999 for **12 months (365 days)**. No bonus 60 days, no "14 months for the price of 12".
- **New monthly equivalent on display**: ₹9,999 / 12 = **~₹833/month**.
- **New savings line**: vs Pro ₹999/month → savings ≈ (999−833)/999 = **~17% less than monthly plan** (was ~28%).
- Pro (Monthly) remains **₹999/month**, Smart (Free) unchanged.

## Complete list of every place pricing / annual duration appears

This is the authoritative inventory I will touch. Anything not listed here either already states only "Annual" without numbers, or is unrelated (`9999` z-index in modal CSS — ignored).

### A. UI surfaces shown to users (must change)

1. `**src/components/landing/PricingSection.tsx**` — landing page Pricing section
  - Elite price block: "₹9,999/year"
  - Description: `~₹714/month · Unlimited clients\n~28% less than monthly plan` → `~₹833/month · Unlimited clients\n~17% less than monthly plan`
  - Feature bullet: `'14 months for the price of 12'` → remove 
2. `**src/components/subscription/PlanSelectionModal.tsx**` — in-app paywall modal (the modal trainers see when picking/renewing a plan)
  - Same description string → ₹833 / ~17%
  - Same `'14 months for the price of 12'` feature bullet → remove
3. `**src/pages/Terms.tsx**` — Terms & Conditions page (public)
  - Line 157 plans overview: "Elite (Annual): ₹9,999/year — **14 months access**, unlimited clients" → "₹9,999/year — 12 months access, unlimited clients"
  - Line 182 heading "Elite Plan — ₹9,999/year" — unchanged
  - Line 184 detail: "365 days base + 60 bonus days = **425 days total validity**" → "365 days validity"
4. `**public/landing-mockup.html**` — static marketing mockup
  - Already shows `₹5,988/year` (stale). Update to `₹9,999/year`. (Confirms the file is currently out of sync; will bring it in line.)

### B. Backend (must change to keep DB ↔ UI consistent)

5. `**supabase/functions/razorpay-webhook/index.ts**`
  - Line 44: `if (amountPaise === 49900) return 'monthly';` → `99900` (₹999) — already mismatched with current ₹999 UI; will fix.
  - Line 45: `if (amountPaise === 598800) return 'annual';` → `999900` (₹9,999) — fix.
  - Line 162: `durationDays = planType === 'annual' ? 425 : 30` → `365 : 30`. Comment updated.
6. **New migration** to update `create_trainer_subscription` / `renew_trainer_subscription` (and any helper) so server-side amount + duration match:
  - Latest version is `supabase/migrations/20260417055537_*.sql` which already uses `9999` and `425`. We only need to change `v_duration := 425` → `365` (two occurrences) and any place that hardcodes `425`.
  - Older migrations using `499/5988` are historical — not re-run, leave untouched.

### C. Places that mention "Annual" but no numeric price/duration (NO change needed — listed for transparency)

- `src/pages/Refer.tsx` — referral matrix uses the word "Annual" only. Referral validity bonuses (e.g., `+90 days per annual referral`) are unrelated to the plan duration and are unchanged.
- `src/components/referral/ReferralTermsAccordion.tsx` — same.
- `src/hooks/useTrainerSubscription.tsx`, `src/components/subscription/TrainerPlatformSubscription.tsx` — only use the type literal `'annual'`.
- All other migrations that still reference `5988` / `499` are historical migrations already applied; we do not edit historical migrations.
- `src/integrations/supabase/types.ts` — auto-generated, untouched.

## Replacement copy for the dropped "14 months for the price of 12" bullet

To keep the Elite feature list at 5 bullets, replace with one of:

- `'Best value annual pricing'`, OR
- `'Lock pricing for the year'`

I will use **'Lock pricing for the year'** (matches Sage/Ruler tone) unless you say otherwise.----No, it gives impression of fluctuating prices. Give a copy that gives the message "focus on client results, not renewing every month". Should be under 7 words.

## Files that will be edited

- `src/components/landing/PricingSection.tsx`
- `src/components/subscription/PlanSelectionModal.tsx`
- `src/pages/Terms.tsx`
- `public/landing-mockup.html`
- `supabase/functions/razorpay-webhook/index.ts`
- New migration file under `supabase/migrations/` adjusting `create_trainer_subscription` + `renew_trainer_subscription` durations from 425 → 365 (and inline `WHEN p_plan_type = 'annual' THEN 9999` amounts left as-is).

## Out of scope (flagged for your awareness)

- The marketing PDFs (`vecto-cold-outreach-dark.pdf`, `vecto-cold-outreach-light.pdf`) we generated earlier still embed the old "14 months / ₹714" copy. After the code change, I'll regenerate the dark PDF so the cold-outreach material matches.
- Memory note `mem://features/trainer-platform-subscriptions/model-and-constraints` currently says "₹5988 annual (425 days)". I'll refresh it to "₹9,999 annual (365 days)" after approval.

## Confirmation requested

1. Confirm new monthly-equivalent display: **~₹833/month, ~17% less than monthly**. OK?---yes, okay
2. Confirm replacement bullet: **"Lock pricing for the year"**. OK or prefer different wording?---- I gave my input on it above.
3. Confirm Terms wording: **"₹9,999/year — 12 months access, unlimited clients"** and remove the "365 + 60 bonus = 425 days" line entirely. OK? ---- okay

On approval I will execute changes A1–A4, B5, B6, regenerate the dark cold-outreach PDF, and refresh the memory note.