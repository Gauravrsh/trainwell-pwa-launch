## Plan: Trainer Nudge CTA → WhatsApp with Pre-filled Message

### Change

Update the trainer push notification so the CTA opens WhatsApp (via `wa.me`) with the pre-configured message instead of navigating to `/calendar`. CTA Button text for trainer - Remind Clients to Log

### What changes

**1. `supabase/functions/nudge-trainers/index.ts**`

- Change the `data.url` in the push payload from `/calendar` to a `wa.me` URL:
`https://wa.me/?text=The%20day%20is%20still%20not%20over.%20We%20got%20work%20to%20be%20done.%20Please%20make%20sure%20all%20of%20your%20workout%20-%20meals%20-%20steps%20are%20logged%20for%20today.`

**2. `public/sw.js**`

- Update `notificationclick` handler to detect external URLs (starting with `http`) and use `clients.openWindow()` directly for those, instead of trying to navigate an existing app window.

### Files to modify


| File                                         | Change                                     |
| -------------------------------------------- | ------------------------------------------ |
| `supabase/functions/nudge-trainers/index.ts` | Change payload `data.url` to `wa.me` link  |
| `public/sw.js`                               | Handle external URLs in notification click |
