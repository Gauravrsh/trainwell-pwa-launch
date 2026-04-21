

## Plan: Keyword-Triggered Bug Logging Protocol (SOP-2)

Goal: zero-discretion bug repository updates. When you say a trigger word, a rigid protocol fires. When I finish a debug, a mandatory closing checklist fires. No "I forgot."

### How it works (your side)

Three trigger keywords in your messages activate the protocol automatically:

| Keyword | What it does |
|---|---|
| **`bug:`** or **`Bug:`** | Opens a new TW-### entry in `triage` status before any debugging starts. I quote your symptom verbatim into the entry. |
| **`issue:`** or **`Issue:`** | Same as `bug:` — alias for natural phrasing. |
| **`regression:`** | Same, but I'm forced to first search the repository for any prior TW-### with overlapping files/symptoms and link it. If found, the new entry becomes `TW-XXX-R1` (regression of XXX) — proves the prevention layer worked or didn't. |

You don't have to use them — but when you do, the protocol is non-negotiable.

### How it works (my side — the enforcement)

Every debug response I produce must end with a **Closing Block**. No closing block = response is malformed. The block has four lines, all mandatory:

```
---
TW-ID: TW-### (status: triage | investigating | fixed | known-nonblocking)
Files touched: <list or "none">
Repo updated: yes | no — <reason if no>
Regression check: <prior TW-### searched, none found | linked to TW-###>
```

If `Repo updated: no` for any reason other than "no code change made," I must immediately update it in the same turn. No exceptions, no "I'll do it next time."

### What gets stored where

**1. `docs/issue-repository.md`** (already exists, keeps growing)
The human-readable log. One entry per TW-###. Adds two new fields to the existing template:
- **Detected via:** (user-reported / security scan / linter / runtime error)
- **Prevention:** (what guardrail was added — test, lint rule, RLS policy, error mapping, etc. "None" is allowed but flagged)

**2. New file: `docs/issue-repository-index.md`**
A compact one-line-per-issue index for fast scanning and regression-search:
```
TW-001 | Critical | Fixed | Razorpay payment freeze | PlanSelectionModal.tsx
TW-010 | High | Fixed | HIBP error generic message | errorUtils.ts
```
This is what I grep first on every `regression:` trigger and at the start of every debug session. Fast, cheap, complete.

**3. Update `mem://technical/issue-tracking-sop`** → rename to **SOP-2** with the new protocol baked in, including the trigger words and the mandatory closing block. This puts it in Core Memory (always-in-context), not buried in a referenced file.

### Backfill (one-time)

Audit the last ~30 days of conversation for any debugging work that wasn't logged. Specifically:
- The `disable_signup` initial fix (already TW-009 ✓)
- The HIBP password fix (already TW-010 ✓)
- The heartbeat work (already TW-008 ✓)
- **Possibly missing:** Group A/B profile cleanup, BMR fallback chart fix, security scan findings (trainer poaching, day_marks RLS) — these may not be "bugs" but qualify as fixes/prevention work and should at minimum get index entries with a `Severity: Hardening` tag.

I'll review and add any missed entries when this plan is approved.

### What this does NOT do

- **Does not auto-create entries for casual mentions.** "this thing is buggy" without the colon trigger does not fire the protocol — avoids noise.
- **Does not auto-close entries.** I cannot mark `Fixed` without your confirmation that the symptom is gone in production. Default closing status is `awaiting-verification`.
- **Does not replace the security scan flow.** Security findings still go through the security tooling first; only confirmed-and-fixed ones flow into the repository.

### Files changed

1. `docs/issue-repository.md` — append template field updates (Detected via, Prevention) + any backfill entries
2. `docs/issue-repository-index.md` — new file, compact index
3. `mem://technical/issue-tracking-sop` — rewrite as SOP-2 with trigger words + mandatory closing block
4. `mem://index.md` — promote SOP-2 to Core (replacing the current passive reference)

### Verification after apply

Next time you send a message with `bug:` or `issue:`, you should see:
1. Immediate creation of a TW-### entry before I start debugging
2. A Closing Block at the bottom of every debug response
3. If I omit the block, you flag it once and I treat that as a P0 process failure to fix immediately

