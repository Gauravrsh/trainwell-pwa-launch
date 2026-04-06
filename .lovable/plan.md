

# Fix: Remaining "TrainWell" in mockup + PWA icon guidance

## Issue 1: "Open in TrainWell" banner
The banner at the bottom of your screenshot ("You can open this link in TrainWell") is **not from our code** — it's Android reading your **old installed TrainWell PWA** from your home screen. The actual footer in the app already says "Vecto" correctly.

**Fix:** Delete the old TrainWell shortcut/app from your home screen. That banner will disappear.

## Issue 2: Lovable icon + browser badging (DuckDuckGo)
DuckDuckGo browser does **not support PWA "Add to Home Screen"** properly — it creates a browser shortcut with its own icon and badge, not a standalone app. This is a browser limitation, not a code issue.

**What to do:**
1. Open `https://vecto.fit` in **Chrome** (not DuckDuckGo)
2. Delete the old TrainWell from home screen
3. In Chrome, tap the three-dot menu → "Add to Home Screen" or "Install app"
4. The Vecto Pure V icon will appear with the name "Vecto" and no browser badging

Chrome is the only Android browser that fully supports standalone PWA installation in India's market.

## Code change: Clean up the static mockup file
The only remaining "TrainWell" references in the codebase are in `public/landing-mockup.html` (a static HTML mockup, not the live React app). We should either delete it or update its references to Vecto for consistency.

**File:** `public/landing-mockup.html` — 37 instances of "TrainWell" to replace with "Vecto" branding, or delete the file entirely since the live React landing page is the real one.

