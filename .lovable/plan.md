

# Update Logo on Role Selection Screen

## What
Replace the old `logo-trainwell.png` image on the Role Selection page with the new waveform SVG logo (the two lime waveforms on dark background, matching `favicon.svg`).

## How

**File: `src/pages/RoleSelection.tsx`**

1. Remove the `import logoTrainwell` line
2. Replace the two `<img src={logoTrainwell} ...>` elements (one in the auto-processing loading state, one in the main view) with an inline SVG rendering the waveform logo:
   - Dark rounded rectangle background (`#0a0a0a`, `rounded-2xl`)
   - Two lime (`#BFFF00`) waveform paths matching the favicon design
   - Scaled to fit the existing `w-20 h-20` container

Both instances (loading spinner view ~line 148 and main header view ~line 170) will be updated.

