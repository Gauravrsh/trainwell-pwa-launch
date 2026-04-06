
What I found

- The draft file does exist in the codebase at `public/vecto-app-icon-draft.png`.
- Sending the raw asset URL again is not a good review flow here:
  - the preview domain is access-controlled
  - the published domain currently does not expose that draft file reliably
- So the problem is not that the file never existed; it is that the current way of sharing it is not dependable for your review.

Updated plan

1. Create a temporary public review page for the icon
   - Add a simple route such as `/icon-review`
   - Show the draft icon large, centered, and easy to inspect
   - Also show it in realistic launcher-size mockups so you can judge actual app-icon behavior

2. Compare icon vs wordmark directly
   - On the same review page, place the icon next to the live `VECTO` wordmark
   - This lets you judge whether the standalone `V` uses the exact same letter construction as the `V` in `VECTO`
   - Only scale and spacing will differ, not the letterform itself

3. Preserve the branding rule everywhere else
   - Keep all places where `VECTO` is already written as text-only
   - Do not place the app icon beside the wordmark in nav, auth, splash, footer, etc.
   - Reserve the icon for app-install and favicon surfaces only unless you explicitly approve other usage

4. Get icon approval before replacing production app icons
   - If needed, prepare 2-3 extremely close variants of the same `V` with only padding/centering changes
   - No alternate logo concepts, no decorative icon-plus-wordmark combinations

5. After approval, apply only to icon surfaces
   - Replace:
     - `public/icons/icon-192.png`
     - `public/icons/icon-512-standard.png`
     - `public/icons/icon-maskable-192.png`
     - `public/icons/icon-maskable-512.png`
     - favicon / Apple touch icon if used
   - Do not alter wordmark placements

6. Verify end-to-end after publish
   - Open the review route on phone and desktop
   - Confirm the chosen icon looks correct at small size
   - Then test install behavior on Android browsers and iPhone home-screen save flow

Technical details

- The app wordmark is currently text-based, not image-based, which is correct for your rule:
  - `src/components/landing/LandingNav.tsx`
  - `src/components/SplashScreen.tsx`
- The base font stack currently uses Inter:
  - `src/index.css` sets `font-family: 'Inter', ...`
  - `tailwind.config.ts` sets `fontFamily.sans` to Inter
- That means the approved app icon should be derived from the same live wordmark glyph logic, not from a separate stylized mark.
- The existing draft file path is `public/vecto-app-icon-draft.png`, but I would stop relying on raw static-file links and instead expose a dedicated review URL so you get one stable clickable page.
