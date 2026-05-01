# Pricing modal + Flywheel updates

## A. Pricing — landing section + in-app modal

Both surfaces must stay in sync: `src/components/landing/PricingSection.tsx` and `src/components/subscription/PlanSelectionModal.tsx`.

### A1. Smart (Free) — remove description line

- Drop the `description` line "Up to 3 active clients · All features unlocked" from rendering.
- Keep the 4 bullets (`Up to 3 active clients`, `All features unlocked`, `No card required`, `Cancel anytime`).
- In landing card: skip the `<p>{description}</p>` when description is empty/null.
- In modal: the Smart card is informational (not in `paidPlans`). Remove the "Up to 3 active clients · All features unlocked" `<p>` line and the "Upgrade below to remove the 3-client cap" subnote so it shows only price + a clean bullet list (we'll add the same 4 bullets there for parity).

### A2. Pro — remove description line

- Drop "30 days + 3-day grace · Unlimited clients" from rendering (landing + modal).
- Grace period stays as backend-only logic. No user-visible mention anywhere.
- Bullets unchanged.

### A3. Elite — add bullet + center the badge

- Insert `'AI insights for your clients'` as bullet #2, immediately after `'Everything in Pro'`. Applies to landing + modal.
- Center the BEST VALUE badge:
  - Landing card already uses `absolute -top-3 left-1/2 -translate-x-1/2` — verify it actually centers visually; the issue is likely the card's `flex flex-col` with no `relative` quirk, or the badge's `whitespace-nowrap` width. Will switch to a flex-wrapper approach: badge inside a centered absolutely-positioned `div` (`left-0 right-0 flex justify-center -top-3`) so its own width doesn't bias placement.
  - Modal card: badge currently lives inline in the header row (visually right-of-name). Move it to an absolute centered chip on the card, same pattern as landing, so it sits dead-center on the top border.-------no change to be done here. in horizontal alignment of the BEST VALUE chip

### A4. Cleanup

- Remove now-unused `description` field rendering path or accept empty string and conditionally render. Keep the data shape stable.
- No copy changes elsewhere.

## B. Flywheel of Growth — regenerate PNG

Asset path: `src/assets/flywheel-mockups/option1-final-v9.png` (bump version so PWA cache busts).
Update import in `src/components/landing/CTASection.tsx` and the alt text.

### B1. Composition rules

- 5 nodes only, evenly spaced at 72° intervals around a circle, starting at 12 o'clock and going clockwise:
  1. Client Tracks
  2. Gets Results
  3. Testimonials & Referrals (use the existing "refers friends" icon — two-people / share icon)
  4. More Clients
  5. Repeat
- 5 curved neon arrows, one between each consecutive pair, all the same arc length, same curvature, same arrowhead size. Equal radial distance from center for every node and every arrow midpoint.
- Center: completely empty. No wordmark, no "Flywheel of Growth" text, no V. mark.

### B2. Visual style (match current dark theme)

- Background: Obsidian Black (#0F172A).
- Arrows + arrowheads: Vecto Neon (#9FFF2B).
- Node circles: dark fill with neon stroke; icon inside in neon; label in white sans-serif below each node.
- Same icon weight, font, and stroke widths as `option1-final-v8.png` so it visually swaps in cleanly.

### B3. Generation method

- Use Lovable AI Gateway image model (`google/gemini-3-pro-image-preview`) with a precise prompt enforcing: 5 nodes, 72° spacing, 5 equal curved arrows clockwise, empty center, exact labels and order, dark+neon palette.
- Output to `/tmp`, QA by viewing the PNG, iterate prompt until spacing/arrow count are correct, then save final to `src/assets/flywheel-mockups/option1-final-v9.png`.
- Update CTASection import to `option1-final-v9.png` and refresh `alt` text to: "Vecto Flywheel of Growth: client tracks, gets results, testimonials and referrals, more clients, repeat."

## Files touched

- `src/components/landing/PricingSection.tsx`
- `src/components/subscription/PlanSelectionModal.tsx`
- `src/components/landing/CTASection.tsx`
- `src/assets/flywheel-mockups/option1-final-v9.png` (new)

## Out of scope

- No backend, RLS, pricing-amount, or webhook changes (₹0 / ₹999 / ₹9,999 stay as-is).
- No changes to Terms page or marketing PDFs in this pass.

## Verification

- Visual check at 414px and 897px viewports for both pricing surfaces (badge centered, no leftover description lines).
- Open flywheel PNG at full size to confirm 5 nodes, equal arrow spacing, empty center, labels correct.