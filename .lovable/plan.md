## Cold Outreach Deck — v4 Regeneration Plan

Generates `/mnt/documents/vecto-cold-outreach-dark-v4.pdf` via a fresh ReportLab script. All pages share one type system, one dark theme, and tighter margins so type can grow.

---

### Global rules (applied to every page)

- **Page size**: A4 portrait.
- **Margins**: ~24 pt all sides (down from current ~50–60 pt). Same on every page.
- **Background**: Solid `#0F172A` (Obsidian). White primary text, `#9FFF2B` (Vecto Neon) accent, `#94A3B8` muted.
- **Type system** (one family, used everywhere — Helvetica family in ReportLab as the closest universal stand-in for Inter):
  - Eyebrow / chips: 11 pt bold, tracked uppercase, neon
  - H1 / hero: 38 pt bold, white with neon accent words
  - H2 / page title: 28 pt bold
  - Body: 15 pt, line-height ~1.45
  - Microcopy: 11 pt muted
  - Pill / badge: 10 pt bold
- No page-to-page font drift. No mixed sizes.

---

### Page 1 — Hero (calendar)

- Eyebrow: `FOR TRAINERS WHO DELIVER RESULTS` (neon, tracked)
- H1: `Whatever Gets Tracked, Gets Done.` (`Gets Done.` in neon)
- Body (15 pt): "Your clients pay you for results. Results come from consistency. Yes, just consistency! And you know it. Vecto tracks every workout and every meal — **today, not tomorrow**."
- Neon CTA-styled chip: `Get Started` (visual only, no link)
- Microcopy: `No credit card · Upto 3 clients free · No question asked cancellation`
- Small pill: `● Used by top PTs across India`
- **Calendar — redrawn as ReportLab vector** to match the live `CalendarMockup.tsx`:
  - Header: `Client: Rahul M.` / `March 2026` / `85% Compliance` neon pill
  - 7-col grid, March 2026 starts on Sunday, day 23 = today
  - **Boundary-only tiles** (no fill, no emoji icons):
    - Today (23): filled neon, dark text
    - Logged: green border (`#22C55E`)
    - Holiday: muted gray border
    - Trainer Leave: amber border (`#F59E0B`)
    - Client Leave: red border (`#EF4444`)
    - Future / blank: faint card tint
  - Same day-status mapping as the live component (1–22 logged with leave/holiday exceptions on 4, 7, 10, 14, 19, 21; today=23; rest future)
  - **Legend underneath**: Today · Logged · Holiday · Trainer Leave · Client Leave (boundary swatches, matches live)
  - Italic footer: "Total visibility on why your client is (or isn't) winning."

### Page 2 — How It Works

- H2 + 3 numbered steps from the landing `HowItWorks` section, body at 15 pt
- Reduced top/bottom padding so each step gets generous block height
- Neon step-numbers in circles (visual motif)

### Page 3 — House Rules

- H2 + the rule list from `HouseRules` at 15 pt
- Two-column on rule rows where it helps density without shrinking type

### Page 4 — Comparison Table

- H2 + the comparison grid from `ComparisonTable`, rendered as a ReportLab Table at 14 pt
- Tighter margins, larger row height, generous cell padding for readability

### Page 5 — Pricing intro (clean)

- H2: `Small Investment Big Returns` (`Big Returns` neon)
- Paragraph (15 pt, centered, max ~70% width):
  > "That social media post where your client flaunts the results, and gives you the credit — what would you pay for that?
  >
  > It's priceless right?
  >
  > Focus on what truly matters and what will get your clients' results. Cutting corners on that is, well, a bad career decision!!"
- Neon `⚡ Special Beta Pricing*` pill
- Lots of breathing room — intentional editorial restraint (per your direction)

### Page 6 — Pricing cards (new page)

Three plan cards stacked vertically, each card laid out **horizontally**:

```text
┌───────────────────────────────────────────────────────┐
│  [icon]  Smart            │  ✓ Up to 3 active clients │
│  ₹0  forever              │  ✓ All features unlocked  │
│                           │  ✓ No card required       │
│  (left ~2/5)              │  ✓ Cancel anytime         │
└───────────────────────────────────────────────────────┘
```

Same template for Pro and Elite. Elite gets `BEST VALUE` badge + neon border.

Content (latest from landing page):

- **Smart · ₹0 forever**: Up to 3 active clients · All features unlocked · No card required · Cancel anytime
- **Pro · ₹999 /month**: Unlimited active clients · All features unlocked · UPI & card payments · Cancel anytime · Get invite to learning webinars
- **Elite · ₹9,999 /year** (sub-line: `~₹833/month · Unlimited clients · ~17% less than monthly plan`): Everything in Pro · **AI Powered Insights for your clients** · One payment. Year-long focus on clients. · Referral rewards (annual) · Priority support · Get invite to in-person meetups with elite trainers

Footnote (11 pt muted, centered): "* Beta launch pricing. Subject to revision. Existing paid subscribers continue at their paid rate until renewal."

No `Start Free / Go Pro / Go Elite` buttons inside cards — they read as web CTAs and waste vertical space in print.

### Page 7 — Flywheel + minimal CTA

- H2: `The Flywheel That Builds Your Reputation, and Your Career` (accents in neon)
- **Flywheel image: latest v9 5-node version** (`/mnt/documents/option1-final-v9.png` — Client Tracks → Gets Results → Testimonials & Referrals → More Clients → Repeat, empty center). Replaces the old 8-spoke "Flywheel of Growth".
- Subtle bordered panel (no header/microcopy):
  - `Sign up at vecto.fit` (`vecto.fit` in neon)
  - `Or DM us on WhatsApp`
- **Removed**: green "Start Free" button, "START IN 60 SECONDS" eyebrow, bottom "No card · 3 clients free · Cancel anytime" line.

---

### Output & QA

- Output: `/mnt/documents/vecto-cold-outreach-dark-v4.pdf`
- Render every page to JPG via `pdftoppm` and inspect each for: overflow, padding still too thick, type still small relative to landing, calendar legend correctness, plan content accuracy, removed elements actually gone, flywheel is the new v9.
- Iterate until clean, then deliver via `<lov-artifact>`.

### Technical notes

- ReportLab `SimpleDocTemplate` with custom `onPage` to paint full-bleed dark background (since A4 default is white).
- Custom `PageTemplate` with single `Frame` at the new tighter margins.
- Calendar drawn with `Drawing` + `Rect`/`String` primitives so it's vector-sharp and matches the live boundary style exactly.
- Plan cards built as a ReportLab `Table` with two columns (40% / 60%) and rounded corner styling via `BOX` + `LINEABOVE`/`LINEBELOW` (or a custom Flowable for true rounded corners if needed).
