

# Standard Operating Procedures

## SOP-1: Issue Repository (MANDATORY)

**Before ANY bug fix, code change, or enhancement**, read `docs/issue-repository.md` first.

- Check if the issue has been encountered before (search by symptom, file, or component name)
- Do NOT re-introduce any previously fixed issue (TW-XXX)
- After every bug fix, append the new issue to `docs/issue-repository.md` with the next TW-XXX ID
- This is mandatory and unconditional — not dependent on user instruction

---

# Pitch Deck: TrainWell Community Manager Recruit

## What we're building
A new `/pitch` route — a public, scroll-based interactive pitch deck styled in TrainWell's dark theme with lime accents. It presents the company vision, team structure, the community manager role, growth goals, and the compensation offer in a personal, founder-to-recruit tone.

## Slide sections (single scrollable page, section-by-section with fade-in animations)

1. **Title** — "TrainWell: Join the Founding Team" with a short personal line from you
2. **The Problem** — Why trainers lose clients (no tracking, no accountability, low retention). Quick stats framing the opportunity in the Indian PT market.
3. **The Solution** — "Whatever Gets Tracked, Gets Done." 2-3 app screenshots/mockups showing calendar view, food logging, progress charts. Moderate product walkthrough.
4. **The Triad** — Visual triangle diagram mirroring your sketch: Product + Strategy (Founder), Community + Social (Her role), AI + Automation (Third co-builder). Clean SVG/CSS triangle.
5. **Your Role: Community + Social** — Detailed responsibilities pulled from your notes:
   - Onboard trainers personally, ensure 100% logging adherence for their clients
   - Drive community engagement: contests, leaderboards, workshops, webinars
   - Social media strategy: Instagram/FB reels, posts, engagement
   - Trainer referral activation
6. **The Playbook** — Growth roadmap diagram (from sketch 2):
   - **0-90 days**: Get 20 trainers, 150-200 clients, 100% logging adherence, cashback contest, validate product-proposition fit
   - **90-180 days**: Achieve PMF, scale to 500 paying trainers
   - Community manager personally nurturing T1→T6 and their clients
7. **Compensation** — Transparent: small monthly stipend during 0-6 month validation phase. After PMF confirmation, formal salary + equity/shares discussion. Framed as a founding opportunity, not a job.
8. **Why Now** — The product is built and live. First trainers are onboarding. This is the ground floor.
9. **CTA** — "Let's build this together." with contact/next steps.

## Technical approach

- **New file**: `src/pages/Pitch.tsx` — single-page scrollable deck with section components
- **New route**: `/pitch` added to `App.tsx` as a public route (no auth required)
- **Styling**: Uses existing TrainWell dark theme (`bg-background`, `text-foreground`, lime `primary` accents)
- **Animations**: Framer Motion `whileInView` fade-ups for each section as user scrolls
- **Responsive**: Mobile-first (411px viewport), scales up gracefully
- **Triangle diagram**: CSS/Tailwind positioned elements with connecting lines, no external images
- **Growth roadmap**: Styled timeline component with milestone markers

No database changes needed. No new dependencies.
