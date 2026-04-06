# Vecto Full Rebrand Plan

## Overview

Generate two production-ready brand assets (Pure V icon + VECTO wordmark), then execute a comprehensive TrainWell → Vecto rebrand across the entire codebase.

---

## Phase 1: Asset Generation (Python/PIL)

### 1A. Pure V App Icon (`src/assets/logo-vecto.png`)

- 1024x1024 PNG, lime `#BFFF00` V on dark `#0A0A0A` background
- V fills ~80% of canvas, thick geometric strokes
- Will be used as app icon, splash screen, auth pages, role selection, profile setup

### 1B. VECTO Wordmark (`src/assets/logo-vecto-wordmark.png`)

- Horizontal wordmark: lime **V** + white **ECTO** in Outfit-Bold (or best available bold font)
- Transparent or dark background, suitable for nav bar usage
- Used in LandingNav and anywhere the full brand name appears inline

### 1C. PWA Icon Suite

Generate all required PWA sizes from the Pure V:

- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-standard.png`
- `public/icons/icon-maskable-192.png`, `icon-maskable-512.png` (with 40% safe zone padding)
- `public/icons/apple-touch-icon-180.png`
- `public/favicon.png`

---

## Phase 2: Full Codebase Rebrand

### Files to modify (25+ files):

**Meta & Config:**

- `index.html` — Title → "Vecto — Performance with Direction", all meta tags (og, twitter, author, description, apple-mobile-web-app-title), favicon reference
- `public/manifest.json` — name/short_name → "Vecto", description updated
- `src/index.css` — Comment line 5 → "Vecto Design System"

**Asset Imports (swap `logo-trainwell` → `logo-vecto`):**

- `src/pages/Auth.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/ProfileSetup.tsx`
- `src/pages/RoleSelection.tsx`
- `src/components/SplashScreen.tsx`
- `src/components/landing/LandingNav.tsx`
- `src/components/landing/LandingFooter.tsx`

**Landing Page Copy:**

- `LandingNav.tsx` — Replace "Train**Well**" wordmark with VECTO wordmark image or styled text (lime V + white ECTO)
- `HeroSection.tsx` — "TrainWell tracks every workout" → "Get Client results with Vecto"
- `ComparisonTable.tsx` — Column header + data keys: `trainwell` → `vecto`, heading "TrainWell" → "Vecto"
- `LandingFooter.tsx` — "Train**Well**" → "Vecto" wordmark, copyright → "Vecto", email → `contact@vecto.fit`, add `vecto.fit` as the address per brand strategy
- `CTASection.tsx` — No TrainWell text (already clean)

**App Pages:**

- `Auth.tsx` — "TrainWell" h1 → "Vecto", tagline → "Effort | Direction | Discipline"
- `ResetPassword.tsx` — "TrainWell" h1 → "Vecto"
- `SplashScreen.tsx` — "TrainWell" h1 → "Vecto", tagline → "Effort | Direction | Discipline"
- `Profile.tsx` — fallback "TrainWell User" → "Vecto User"
- `Pitch.tsx` — All "TrainWell" references → "Vecto" (title section, solution section, triad section, footer copyright, contact email)
- `RoleSelection.tsx` — alt text, logo swap

**Subscription & Billing:**

- `TrainerPlatformSubscription.tsx` — "TrainWell Platform" → "Vecto Platform"
- `ClientSubscriptionView.tsx` — "TrainWell is Free for Clients" → "Vecto is Free for Clients"
- `PlanSelectionModal.tsx` — Legal footer: "TrainWell" → "Vecto"
- `InstallPromptModal.tsx` — "Install TrainWell" → "Install Vecto", description updated

**Referral & Terms:**

- `ReferralTermsAccordion.tsx` — All "TrainWell" → "Vecto" (4 instances)
- `Terms.tsx` — "TrainWell" → "Vecto" in legal copy
- `Refer.tsx` — Share text: "Join TrainWell" → "Join Vecto", "TrainWell" → "Vecto"

**Invite Links:**

- `TrainerDashboard.tsx` — WhatsApp message: "TrainWell" → "Vecto", URL stays as `window.location.origin` (already dynamic or hardcoded `trainwell.lovable.app` → will need domain update later)
- `Calendar.tsx` — Same invite link copy update

**Hooks:**

- `useInstallPrompt.tsx` — Storage key `trainwell_install_prompt` → `vecto_install_prompt` (note: this resets install prompt state for existing users — acceptable)

---

## Brand Strategy Compliance

- **Nav (LandingNav):** Styled "VECTO" text (lime V + white ECTO) — no `.fit` suffix
- **Footer (LandingFooter):** "vecto.fit" as the digital address + copyright "Vecto"
- **Tagline:** "Effort | Direction | Discipline" replaces "Your fitness journey starts here"
- **Email:** `contact@vecto.fit` replaces `contact@trainwell.app`

---

## Technical Notes

- Delete old `src/assets/logo-trainwell.png` after confirming no remaining imports
- PWA cache busting: bump version query strings from `?v=20260122` to `?v=20260406`
- The `trainwell.lovable.app` hardcoded URLs in invite messages (TrainerDashboard, Calendar) will use `window.location.origin` for now until custom domain is configured