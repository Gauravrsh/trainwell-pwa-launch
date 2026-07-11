
# Vecto Lead-Gen System — Deliverables Plan

## Reality check first (so we don't waste effort)

**Hermes Agent (Nous Research) — what it actually is:**
A self-improving *personal* agent you install on your Mac/Linux. Runs on Telegram, Discord, Slack, **WhatsApp**, Signal, Email, CLI. Persistent memory, scheduled tasks, self-generated skills. It is **not** a hosted SaaS SDR. It has **no Instagram connector** (Meta blocks unofficial IG automation — anything that scrapes DMs risks account bans).

**Where Hermes fits your stack:** WhatsApp reply-drafting + memory of every trainer conversation + scheduled follow-ups + a "lead brain" that never forgets who ghosted, who to nudge on day 3, who booked. **It does not do Instagram top-of-funnel for you.**

**What Lovable/Vecto is good for:** the *destination* — a public trainer landing page, a lead-capture form with UTM tracking, a lightweight admin CRM inside Vecto so you see every lead alongside your existing clients, and a WhatsApp click-to-chat CTA that opens a pre-filled message.

**What neither can do (be honest):** post reels for you, or replace 3 months of consistent content. "Minimum me, maximum agent" works for *follow-up and qualification*; it doesn't work for *IG reach*. Reach requires either (a) you post 3× a week, or (b) paid ads, or (c) creator partnerships. Since your budget is ₹0 and you won't create reels, we go route (c) + heavy repurposing of the carousels we already built.

## The funnel we're building

```text
IG carousels/reels (organic reach)
        │
        ▼
   Bio link → vecto.fit/for-trainers   (Vecto public page, UTM'd)
        │
        ├─ CTA #1: "WhatsApp me"  →  wa.me/<you>?text=<prefilled>  →  Hermes drafts your reply
        │
        └─ CTA #2: "Book a 15-min call"  →  Calendly free tier
                    │
                    ▼
        Lead lands in Vecto Admin CRM (new table, admin-only RLS)
                    │
                    ▼
        Hermes: day-1, day-3, day-7 WhatsApp nudge drafts based on lead status
                    │
                    ▼
        Booked call → you close → activate free Smart plan → onboard
```

## Deliverables — six concrete pieces

### 1. Positioning one-pager (I write, you approve)
One page: ICP (independent PT, 2–15 clients, ₹40K–1.5L/month, tier 1/2 India), the "chalta hai kills retention" wedge, the "mirror doesn't lie" promise, and 3 proof pillars. Everything else — reels, DMs, landing copy, Hermes reply templates — pulls from this doc so voice stays consistent.

### 2. Content engine on ₹0 (repurpose-first)
- Reuse the 4 brand carousels we already generated as IG posts (1/week for 4 weeks = baseline).
- 10 more carousel scripts I'll write, generated as images in the same Vecto template.
- 5 reel scripts (30-sec, single-take talking-head, phone-only) — you record when you can; if you truly won't record, we skip reels and lean on carousels + creator collabs.
- **Creator collab list**: 15 mid-tier Indian fitness creators (10K–50K followers) whose audience *is* PTs, not end-users. You pitch a free "Vecto for your trainer network" offer in exchange for one story mention. This is the highest-ROI organic move for a ₹0 budget.

### 3. Vecto public trainer landing page — `/for-trainers` (in-app build)
Currently `/` is the landing but it's mixed audience. Add a dedicated `/for-trainers` route:
- Trainer-only pitch (revenue, retention, "3 clients free forever")
- Two CTAs: "WhatsApp us" (opens `wa.me` with pre-filled "Hi, I saw Vecto on IG…") and "Book a 15-min call" (Calendly embed)
- Auto-captures `?utm_source=ig&utm_campaign=…` into a new `trainer_leads` table on submit
- Public route, no auth required

### 4. Admin lead CRM inside Vecto (in-app build)
New table `trainer_leads` (name, phone, IG handle, utm_source, utm_campaign, status enum: `new|dm_sent|call_booked|activated|dead`, notes, created_at). Admin-only RLS (only your user_id can read). Simple `/admin/leads` page — list, filter by status, edit notes, mark status. This is your source-of-truth that Hermes reads from.

### 5. Hermes ops setup on your Mac (I write the runbook, you install)
- Install Hermes Desktop, connect your WhatsApp Business number via its WhatsApp integration
- One Hermes "skill" I'll draft: **"Vecto Lead Reply Drafter"** — reads incoming WhatsApp message + your Vecto voice doc + the lead's status from a shared file/CSV export → drafts your reply in the Elite Jester tone → you approve/send with one tap
- Scheduled skill: **"Vecto Follow-Up Nudger"** — every morning at 9am, reviews leads in `dm_sent` for >3 days and `call_booked` no-shows, drafts follow-up messages, queues them for your approval
- Memory: Hermes remembers every trainer conversation permanently, so 6 months later when a ghosted lead pings back, it recalls the context

### 6. Weekly ops cadence (30 min/week from you)
- Mon: post 1 carousel, DM 5 new creators
- Wed: post 1 carousel/reel, review Hermes-drafted follow-ups
- Fri: review `/admin/leads`, close any hot ones on WhatsApp/call
- Everything else runs on Hermes + Calendly + the Vecto pages we built.

## What I'll build vs. what you do

| Piece | Who | When |
|---|---|---|
| Positioning one-pager | Me (doc) | This week |
| 10 carousel scripts + images | Me | Rolling, 2/week |
| `/for-trainers` public page + WhatsApp/Calendly CTAs | Me (in-app) | Next build turn |
| `trainer_leads` table + `/admin/leads` CRM | Me (in-app, RLS-gated) | Next build turn |
| Hermes install + skill runbook | Me (markdown doc) | After CRM ships |
| Actual IG posting, creator DMs, WhatsApp replies (with Hermes drafts), sales calls | You | Ongoing |

## Honest expectations
- **Timeline to first paid trainer**: 4–8 weeks of consistent posting + 30–50 creator DMs. There is no ₹0 shortcut faster than that.
- **Volume ceiling with this setup**: ~5–10 qualified conversations/week. Enough to hit your first 20–30 paid trainers. Beyond that you'll need paid ads.
- **Hermes replaces the "I forgot to follow up" tax and the "what do I even say" tax. It does not replace posting.**

## Not in scope for this plan
- Paid ads (excluded by ₹0 budget)
- LinkedIn/YouTube (excluded by your channel choice)
- Full CRM (Vecto admin table is deliberately minimal — swap to HubSpot free if volume grows)
- Any IG DM automation (Meta ToS risk; we do IG→WhatsApp handoff instead)

## Approve to proceed
On approval I'll start with **the positioning one-pager + `/for-trainers` page + `trainer_leads` admin CRM** in the first build turn, then hand you the Hermes runbook once the CRM exists for it to read from.
