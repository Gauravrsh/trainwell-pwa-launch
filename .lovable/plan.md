

## Plan: Remove Number Input Spinners Globally

The native browser spinner arrows on `<input type="number">` are tiny and awkward on mobile. The fix is a global CSS rule that hides them across all number inputs app-wide.

### What changes

**Single file: `src/index.css`**

Add CSS to hide the native number spinner in all browsers:

```css
/* Hide number input spinners */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
```

This covers:
- DateRangeFilter (the 30 days field in Progress page)
- All workout log modals (sets, reps, weight, calories)
- Weight log, BMR log, payment amount
- Training plan creation (sessions, price)

No component changes needed — one global CSS rule handles everything.

