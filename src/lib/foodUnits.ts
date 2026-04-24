// Canonical food quantity units — used by the Food Log dropdown and persisted
// into `food_logs.quantity_unit`. Keep this list tight: if a unit isn't here,
// the AI response falls back to `serving`.
export const FOOD_UNITS = [
  'serving',
  'piece',
  'slice',
  'cup',
  'tbsp',
  'tsp',
  'bowl',
  'plate',
  'glass',
  'g',
  'kg',
  'ml',
  'l',
  'oz',
] as const;

export type FoodUnit = typeof FOOD_UNITS[number];

const UNIT_ALIASES: Record<string, FoodUnit> = {
  serving: 'serving',
  servings: 'serving',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  slice: 'slice',
  slices: 'slice',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  bowl: 'bowl',
  bowls: 'bowl',
  plate: 'plate',
  plates: 'plate',
  glass: 'glass',
  glasses: 'glass',
  g: 'g',
  gm: 'g',
  gms: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  lt: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
};

// Parse a free-form quantity string (e.g. "150 g", "1 slice", "2 cups") into
// a structured { value, unit } pair. Returns sensible defaults when the input
// is unparseable so the UI can still render a valid dropdown selection.
export function parseQuantity(raw: string | undefined | null): {
  value: number;
  unit: FoodUnit;
} {
  if (!raw) return { value: 1, unit: 'serving' };
  const trimmed = raw.trim().toLowerCase();
  // Match leading number (supports decimals and simple fractions like "1/2")
  const fracMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  let value = 1;
  let rest = trimmed;
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den > 0) value = num / den;
    rest = fracMatch[3];
  } else {
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (numMatch) {
      value = parseFloat(numMatch[1]) || 1;
      rest = numMatch[2];
    }
  }
  // First word of the remainder is the unit candidate
  const unitToken = rest.split(/\s+/)[0] ?? '';
  const normalized = unitToken.replace(/[^a-z]/g, '');
  const unit = UNIT_ALIASES[normalized] ?? 'serving';
  return { value: value > 0 ? value : 1, unit };
}