# V5 Cold Outreach Deck — Update Plan

Source: `/mnt/documents/vecto-cold-outreach-dark-v3.pdf` (6 pages)
Output: `/mnt/documents/vecto-cold-outreach-dark-v5.pdf` (7 pages)

## Scope (only what was asked)

### 1. Calendar UI — page 1

Replace the current "icons + X dots + red fill" calendar with the latest **boundary-only** swatch system from `src/components/landing/CalendarMockup.tsx`:

- **Cells** show only the day number, no icons, no X marks.
- **States** (border-only, no fill except Today):
  - Logged → 2px green border
  - Client Leave → 2px red border
  - Trainer Leave → 2px amber border
  - Holiday → 2px muted-grey border
  - Today (23) → solid lime fill, black numeral, bold
  - Future / past blank → no border, faint card bg
- Reuse the **same March 2026 dataset** the live mockup uses (logged streak with leave/holiday markers — see CalendarMockup.tsx).
- **Legend** must match the live legend exactly: Today (lime fill), Logged, Holiday, Trainer Leave, Client Leave (border swatches only). No "Done / Missed / Pending" labels. No round dots.
- Header chip stays "85% Compliance"; subtitle stays "Total visibility on why your client is (or isn't) winning."

### 2. Pro & Elite cards — content refresh

Pull copy verbatim from `src/components/landing/PricingSection.tsx`:

**Smart** (already correct, but remove subtitle):

- Remove "Up to 3 active clients · All features unlocked" subtitle (landing has no description for Smart).

**Pro** (₹999/month):

- Remove subtitle "30 days + 3-day grace · Unlimited clients" (landing has no description).
- Features (unchanged): Unlimited active clients · All features unlocked · UPI & card payments · Cancel anytime · Get invite to learning webinars.

**Elite** (₹9,999/year):

- Description: `~₹833/month · Unlimited clients\n~17% less than monthly plan` (kept)
- Features (add one new bullet, second from top):
  1. Everything in Pro
  2. **AI Powered Insights for your clients** ← NEW
  3. One payment. Year-long focus on clients.
  4. Referral rewards (annual)
  5. Priority support
  6. Get invite to in-person meetups with elite trainers
- "BEST VALUE" badge stays. Ensure to have this badge centre aligned.

### 3. Split current page 5 → two pages

**New page 5 — Headline + intro copy** (centered, dark, generous whitespace):

- H2: `Small Investment` (white) +  `Big Returns` (lime gradient)
- Paragraph (verbatim from landing, preserving line breaks):
  > That social media post where your client flaunts the results, and gives you the credit — what would you pay for that?
  >
  > &nbsp;
  >
  > It's priceless right?
  >
  > &nbsp;
  >
  > Focus on what truly matters and what will get your clients' results. Cutting corners on that is, well, a bad career decision!!

**New page 6 — Beta chip + 3 plan blocks**:

- Beta pricing pill at top: lightning bolt + "Special Beta Pricing*"
- Three plan cards (Smart / Pro / Elite) with the refreshed copy above.
- Footer asterisk note: "* Beta launch pricing. Subject to revision. Existing paid subscribers continue at their paid rate until renewal."

(Existing page 6 — Flywheel/CTA — becomes page 7. No other changes.)

## Brand Compliance Constraints (non-negotiable)

- Background: Obsidian Black `#0A0A0A` everywhere.
- Lime accent `#BFFF00` (Vecto Neon), white `#FAFAFA` for data text, muted grey for body subdued.
- "VECTO" only ever appears with lime **V** + white **ECTO**, uppercase, Inter Black, tracking -0.02em.
- App icon `V.` is NOT used anywhere (forbidden adjacent to wordmark — already absent in V3, will stay absent).
- Neon coverage ≤ 15% of any composition.
- Inter font family throughout (Black for display, Regular/Medium for body).
- No drop shadows on wordmark, no gradients on letters, no Caregiver/Innocent/Hero language.
- Voice unchanged from V3 (Sage + Ruler + Jester).

## Implementation

```text
1. Write Python (reportlab) script at /tmp/build_v5.py mirroring V3 structure
   - Reuse v3 layout for pages 1–4 and 7 (was page 6)
   - Replace calendar block on page 1 with new boundary-only renderer
   - Update Pro/Elite card data
   - Split pricing into two pages
2. Render: python /tmp/build_v5.py → /mnt/documents/vecto-cold-outreach-dark-v5.pdf
3. QA: pdftoppm -jpeg -r 130 → inspect every page image with code--view
   - Brand check: colors, fonts, lime ratio, wordmark integrity
   - UI check: calendar legend matches live, pricing matches landing
   - Layout check: no overflow, no clipped text, page breaks clean
4. Iterate fix-and-verify until clean. Report QA findings in final message.
```

## Deliverable

`<lov-artifact path="vecto-cold-outreach-dark-v5.pdf" mime_type="application/pdf"></lov-artifact>`

Plus a short QA summary listing what was verified and any issues found+fixed during regression review.