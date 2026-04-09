

# Add React ErrorBoundary to App.tsx

## What
Create a branded ErrorBoundary component and wrap `AppRoutes` in `App.tsx` to catch runtime crashes gracefully.

## Files

### 1. New: `src/components/ErrorBoundary.tsx`
- Class component implementing `componentDidCatch` and `getDerivedStateFromError`
- Fallback UI: Obsidian black background, Vecto branding
  - "V" in neon green (#9FFF2B), "ECTO" in white
  - Heading: "Uh! This shouldn't have happened"
  - Subtext: brief apology in grey
  - Full-width neon green "Reload" button calling `window.location.reload()`
- Matches existing dark theme aesthetic

### 2. Edit: `src/App.tsx`
- Import `ErrorBoundary`
- Wrap `<AppRoutes />` inside `<ErrorBoundary>` (inside `AppContent`, around the routes render)

Two files, minimal change, no dependencies added.

