

# TrainWell — Public Website PRD

## 1. Product Overview

**TrainWell** is a mobile-first SaaS platform for independent personal trainers in India to manage their fitness coaching business end-to-end, and for their clients to stay accountable through daily logging.

---

## 2. Users & Value Proposition

### Primary User: Personal Trainers (Paying Customer)
Independent fitness trainers who manage 3-50+ clients, typically operating via WhatsApp/spreadsheets today.

**Value prop:** "Run your personal training business from your phone — manage clients, plans, payments, and progress in one place."

### Secondary User: Fitness Clients (Free)
Individuals working with a personal trainer who need accountability and tracking tools.

**Value prop:** "Stay accountable to your trainer with daily workout & nutrition logging, AI-powered food analysis, and real-time progress tracking."

---

## 3. Complete Feature Inventory (from codebase)

### Trainer Features
| Feature | Description |
|---------|-------------|
| **Client Management** | Invite clients via WhatsApp link, view all clients with daily status (workout done / food logged) |
| **Training Plans** | Create plans with service type (workout/nutrition/both), billing model (prepaid/postpaid), session scheduling, lifecycle management (draft → active → paused → completed/cancelled) |
| **Session Tracking** | Per-session status (scheduled/completed/missed/cancelled/rescheduled), trainer & client notes |
| **Payment Management** | Track subscription cycles, request payments via UPI (VPA address), Razorpay integration |
| **Progress Monitoring** | View any client's action charts (calories in vs out) and outcome charts (weight trend) with date range filters |
| **Notifications** | Subscription expiry warnings, referral rewards, in-app notification inbox |
| **Referral Program** | Invite other trainers — earn 3 months extra validity when referee subscribes to annual plan |
| **Subscription** | 14-day free trial (3 clients max), Monthly ₹499, Annual ₹5,988 (14 months access) |

### Client Features
| Feature | Description |
|---------|-------------|
| **Workout Logging** | Log exercises with sets/reps/weight from a curated Indian gym exercise database |
| **AI Food Analysis** | Photograph or describe meals → AI returns per-item calorie/macro breakdown |
| **Weight Tracking** | Daily weight logs with trend visualization |
| **BMR Tracking** | Track basal metabolic rate, stale BMR warnings (>90 days) |
| **Progress Charts** | Net caloric deficit/surplus over time, weight trend, missed day tracking |
| **Training Plans** | View assigned plans and session schedules from trainer |

### Platform Features
| Feature | Description |
|---------|-------------|
| **PWA / Installable** | manifest.json, install prompt, splash screen |
| **Dark theme** | Mobile-first dark UI with glassmorphism |
| **Role-based routing** | Trainer vs client dashboards, conditional navigation |
| **Email auth** | Sign up, sign in, password reset, email verification |
| **Security** | RLS on all tables, SECURITY DEFINER RPCs, HMAC webhook validation, no anonymous access |

---

## 4. Pricing (Current)

| Plan | Price | Duration | Highlights |
|------|-------|----------|------------|
| Trial | Free | 14 days | 3 clients max, all features |
| Monthly | ₹499/mo | 30 days + 3-day grace | Unlimited clients |
| Annual | ₹5,988/yr | 14 months | +3 months per annual trainer referral |

Clients use the platform for free.

---

## 5. Public Website — Recommended Structure

### Pages to Build

**Landing Page (`/`)** — the public homepage
- Hero section with headline, subheadline, CTA buttons (Start Free Trial / Sign In)
- "How it works" — 3-step flow for trainers
- Feature showcase — trainer features (primary) + client features (secondary)
- Pricing section — trial, monthly, annual cards
- Social proof / testimonials placeholder
- FAQ section
- Footer with links

**Pricing Page (`/pricing`)** — dedicated pricing with comparison table

**Terms Page** — already exists at `/terms`

### Routing Changes Required

```text
Current:
  / → Calendar (protected)
  /auth → Auth page

Proposed:
  / → Public Landing Page (no auth required)
  /dashboard → Calendar (protected, replaces current /)
  /auth → Auth page (unchanged)
  All other protected routes unchanged
```

- Authenticated users visiting `/` get redirected to `/dashboard`
- Unauthenticated users see the public landing page

---

## 6. Implementation Plan

### Step 1: Create the PRD file
Save this document as `docs/landing-page-prd.md` in the project for persistent context.

### Step 2: Build the Landing Page
Create `src/pages/Landing.tsx` with sections:
- Hero, How It Works, Features, Pricing, FAQ, Footer
- Mobile-first, consistent with existing dark theme and design system
- No backend changes needed

### Step 3: Update Routing
- Move `Calendar` from `/` to `/dashboard`
- Add public `Landing` at `/`
- Update `BottomNav` home link to `/dashboard`
- Redirect authenticated users from `/` to `/dashboard`

### Step 4: Optional — Pricing Page
Create `src/pages/Pricing.tsx` as a standalone page linked from landing and nav.

### Files to Create/Modify
| File | Action |
|------|--------|
| `docs/landing-page-prd.md` | Create — this PRD |
| `src/pages/Landing.tsx` | Create — public landing page |
| `src/pages/Pricing.tsx` | Create — standalone pricing page (optional) |
| `src/App.tsx` | Modify — update routing |
| `src/components/layout/BottomNav.tsx` | Modify — home link → `/dashboard` |

### No Backend Changes
The landing page is entirely static/client-side. No database migrations, edge functions, or RLS changes needed.

---

## 7. Recommended Next Steps

1. **Approve this PRD** → I save it as `docs/landing-page-prd.md`
2. **Build landing page** → one section at a time (hero first, then features, pricing, etc.)
3. **Update routing** → make `/` public, move dashboard to `/dashboard`
4. **Review and iterate** on copy, visuals, mobile responsiveness

