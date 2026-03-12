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
| **Client Management** | Invite clients via WhatsApp link, view all clients with daily status |
| **Training Plans** | Create plans with service type, billing model, session scheduling, lifecycle management |
| **Session Tracking** | Per-session status, trainer & client notes |
| **Payment Management** | Track subscription cycles, request payments via UPI, Razorpay integration |
| **Progress Monitoring** | View any client's action/outcome charts with date range filters |
| **Notifications** | Subscription expiry warnings, referral rewards, in-app notification inbox |
| **Referral Program** | Invite other trainers — earn 3 months extra validity |
| **Subscription** | 14-day free trial (3 clients max), Monthly ₹499, Annual ₹5,988 |

### Client Features
| Feature | Description |
|---------|-------------|
| **Workout Logging** | Log exercises with sets/reps/weight from curated exercise database |
| **AI Food Analysis** | Photograph or describe meals → AI returns calorie/macro breakdown |
| **Weight Tracking** | Daily weight logs with trend visualization |
| **BMR Tracking** | Track basal metabolic rate with stale warnings |
| **Progress Charts** | Net caloric deficit/surplus over time, weight trend |
| **Training Plans** | View assigned plans and session schedules from trainer |

---

## 4. Pricing

| Plan | Price | Duration | Highlights |
|------|-------|----------|------------|
| Trial | Free | 14 days | 3 clients max, all features |
| Monthly | ₹499/mo | 30 days + 3-day grace | Unlimited clients |
| Annual | ₹5,988/yr | 14 months | +3 months per annual trainer referral |

Clients use the platform for free.

---

## 5. Public Website Structure

### Routing
- `/` → Public Landing Page (redirect to `/dashboard` if authenticated)
- `/dashboard` → Calendar (protected, was previously `/`)
- All other protected routes unchanged

### Landing Page Sections
1. Hero — headline, subheadline, CTA buttons
2. How It Works — 3-step flow for trainers
3. Feature Showcase — trainer + client features
4. Pricing — trial, monthly, annual cards
5. FAQ
6. Footer
