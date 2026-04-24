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
  // The lookbehind ensures we start at a true boundary (not mid-group), so
  // Indian lakh groupings like "1,20,453" match as ONE token instead of
  // splitting into "20,453" + "453".
  const numberPattern = /(?<![\d,])\d{1,3}(?:[,\s]\d{2,3})+|(?<!\d)\d{3,6}(?!\d)/g;

  const candidates: number[] = [];

  for (const match of text.matchAll(numberPattern)) {
    const raw = match[0];
    const idx = match.index ?? 0;

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