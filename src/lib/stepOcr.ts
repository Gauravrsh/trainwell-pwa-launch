/**
 * Step OCR helper — extracts a plausible step count from OCR text.
 *
 * Strategy:
 *  - Find all number-like tokens including Indian lakh grouping (1,20,453) and
 *    space-separated thousands (12 345).
 *  - Normalize to integers.
 *  - Reject values that are:
 *      - adjacent to "kcal" / "cal" / "calorie" (calorie burn, not steps)
 *      - equal to the current year (header dates)
 *      - below 100 (too small to be a real day count)
 *      - above 100000 (sanity cap; nobody did a million steps)
 *  - Among the survivors, pick the LARGEST — on every fitness-tracker
 *    screenshot the step count is rendered as the biggest number on screen.
 */

const MIN_STEPS = 100;
const MAX_STEPS = 100000;

export function extractStepCount(rawText: string): number | null {
  if (!rawText) return null;

  const text = rawText.replace(/\s+/g, " ").toLowerCase();
  const currentYear = new Date().getFullYear();

  // Matches "8,432", "12 345", "1,20,453", "9876".
  // No leading \b — a digit that follows a comma is not at a word boundary,
  // which would cause Indian lakh groupings to be split.
  const numberPattern = /\d{1,3}(?:[,\s]\d{2,3})+|\d{3,6}/g;

  const candidates: number[] = [];

  for (const match of text.matchAll(numberPattern)) {
    const raw = match[0];
    const idx = match.index ?? 0;
    // Skip if this match is a tail of a larger grouped number we'll also see.
    // e.g. "1,20,453" — avoid re-picking "20,453" or "453" as separate hits.
    const prevChar = idx > 0 ? text[idx - 1] : "";
    if (prevChar === "," || prevChar === " " && /\d/.test(text[idx - 2] ?? "")) continue;

    // Look at a small window after the number for unit context.
    const tail = text.slice(idx + raw.length, idx + raw.length + 16);
    if (/\s*(k?cal|calorie|kilocalorie)/i.test(tail)) continue;

    const normalized = parseInt(raw.replace(/[,\s]/g, ""), 10);
    if (!Number.isFinite(normalized)) continue;
    if (normalized === currentYear) continue;
    if (normalized < MIN_STEPS || normalized > MAX_STEPS) continue;

    candidates.push(normalized);
  }

  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

/**
 * Run Tesseract.js against an image file and return extracted step count.
 * Lazy-imports tesseract.js so it never ships in the initial bundle.
 */
export async function scanStepCountFromImage(file: File): Promise<number | null> {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(file, "eng", {
    // @ts-expect-error — tessedit options are runtime-only
    tessedit_char_whitelist: "0123456789,. ",
  });
  return extractStepCount(data?.text ?? "");
}