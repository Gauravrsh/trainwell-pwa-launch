/**
 * Step OCR — extracts a step count from a fitness-tracker screenshot.
 *
 * Problem with Math.max-based extraction: fitness screens always contain
 * multiple numbers — step goal (often bigger), calories, distance, clock,
 * heart rate, distance decimals. Picking "largest number" routinely picks
 * the goal (e.g. 15,000) or kcal (e.g. 2,397) instead of actual steps.
 *
 * Approach (TW-022):
 *  1. Let Tesseract read FULL text (no digit-only whitelist) so context
 *     words like "steps", "kcal", "goal", "km" survive to drive scoring.
 *  2. Score every number candidate using surrounding tokens:
 *       + near "step"/"steps"                     +100
 *       + visually large (bbox height)            + height_in_px
 *       - near kcal/cal/calorie/km/bpm/%/min      -200
 *       - near goal/target or preceded by "/"     -150
 *       - matches clock HH:MM / H:MM              -300
 *       - contains decimal point (distance)       -250
 *  3. Pick the highest scoring candidate in range [100, 100000].
 *
 * Fallback when bbox data is unavailable (plain text tests): identical
 * scoring using regex-based neighbour tokens in a text window.
 */

const MIN_STEPS = 100;
const MAX_STEPS = 100000;

const NEG_UNIT = /\b(k?cal|calorie|kilocalorie|km|m|bpm|min|mins|minute|minutes|%)\b/i;
const NEG_GOAL = /\b(goal|target|daily\s*goal|of)\b/i;
const POS_STEP = /\b(steps?)\b/i;
const CLOCK = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

interface Candidate {
  value: number;
  raw: string;
  score: number;
  source?: "bbox" | "text";
}

function scoreFromText(
  rawText: string,
  idx: number,
  raw: string,
  value: number,
): number {
  let score = 0;

  // Decimal → distance, not steps.
  if (/[.,]\d{1,2}\s*(km|m)?$/i.test(raw) && /\./.test(raw)) score -= 250;

  // Context windows.
  const before = rawText.slice(Math.max(0, idx - 20), idx);
  const after = rawText.slice(idx + raw.length, idx + raw.length + 20);
  // Goal is only meaningful if it's the IMMEDIATELY preceding label.
  const immediateBefore = rawText.slice(Math.max(0, idx - 12), idx);

  if (POS_STEP.test(after) || POS_STEP.test(before)) score += 100;
  if (NEG_UNIT.test(after)) score -= 200;
  if (NEG_GOAL.test(immediateBefore) || NEG_GOAL.test(after)) score -= 150;

  // "/15,000 steps" → goal.
  if (/\/\s*$/.test(before)) score -= 150;

  // Clock times in original text (e.g. " 8:47 ").
  const surrounding = rawText.slice(Math.max(0, idx - 2), idx + raw.length + 3);
  if (/\b\d{1,2}:\d{2}\b/.test(surrounding)) {
    // Only penalise if THIS number is part of the clock match.
    const clockMatch = surrounding.match(/\b(\d{1,2}:\d{2})\b/);
    if (clockMatch && clockMatch[1].includes(value.toString())) score -= 300;
  }

  // Favour middle-of-range step counts slightly.
  if (value >= 1000 && value <= 30000) score += 10;

  return score;
}

/**
 * Text-only extraction (used by unit tests and as fallback).
 */
export function extractStepCount(rawText: string): number | null {
  if (!rawText) return null;

  const text = rawText.replace(/\s+/g, " ");
  const currentYear = new Date().getFullYear();

  // Matches "8,432", "12 345", "1,20,453", "9876", also "4.34" (so we can reject it).
  const numberPattern =
    /(?<![\d,.])\d{1,3}(?:[,\s]\d{2,3})+(?!\d)|(?<![\d.])\d+\.\d+(?!\d)|(?<!\d)\d{3,6}(?!\d)/g;

  const candidates: Candidate[] = [];

  for (const match of text.matchAll(numberPattern)) {
    const raw = match[0];
    const idx = match.index ?? 0;

    // Reject decimals outright — distances, not steps.
    if (raw.includes(".")) continue;

    const normalized = parseInt(raw.replace(/[,\s]/g, ""), 10);
    if (!Number.isFinite(normalized)) continue;
    if (normalized === currentYear) continue;
    if (normalized < MIN_STEPS || normalized > MAX_STEPS) continue;

    const score = scoreFromText(text, idx, raw, normalized);

    // Hard-reject clocks: if immediately preceded or followed by ":dd" pattern.
    const tail = text.slice(idx + raw.length, idx + raw.length + 3);
    const head = text.slice(Math.max(0, idx - 3), idx);
    if (/^:\d{2}/.test(tail) || /\d{1,2}:$/.test(head)) continue;

    // Hard-reject kcal/cal/calorie adjacency (preserves prior behaviour).
    if (/\s*(k?cal|calorie|kilocalorie)\b/i.test(tail + text.slice(idx + raw.length + 3, idx + raw.length + 16))) {
      continue;
    }

    candidates.push({ value: normalized, raw, score });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  return candidates[0].value;
}

/**
 * Bbox-aware extraction. Uses Tesseract word-level output so the visually
 * largest number on the screen gets a tiebreaker boost — on every fitness
 * app the step count is rendered as the biggest figure.
 */
interface WordLike {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

function extractFromWords(words: WordLike[]): number | null {
  if (!words || words.length === 0) return null;

  const currentYear = new Date().getFullYear();
  const candidates: Candidate[] = [];

  // Find the visually largest digit-word height to use as a "hero number" anchor.
  let maxDigitHeight = 0;
  for (const w of words) {
    const t = (w.text || "").trim();
    if (/^[\d,\s]+$/.test(t) && !CLOCK.test(t)) {
      const h = Math.max(1, w.bbox.y1 - w.bbox.y0);
      if (h > maxDigitHeight) maxDigitHeight = h;
    }
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const t = (w.text || "").trim();
    if (!t) continue;

    // Skip decimals (distances) and clocks.
    if (/\d\.\d/.test(t)) continue;
    if (CLOCK.test(t)) continue;

    const digitMatch = t.match(/^[\d,\s]+$/);
    if (!digitMatch) continue;

    const normalized = parseInt(t.replace(/[,\s]/g, ""), 10);
    if (!Number.isFinite(normalized)) continue;
    if (normalized === currentYear) continue;
    if (normalized < MIN_STEPS || normalized > MAX_STEPS) continue;

    const height = Math.max(1, w.bbox.y1 - w.bbox.y0);

    // Collect neighbour words (prev 3 + next 3 + same row).
    const neighbourText = [
      words[i - 3]?.text,
      words[i - 2]?.text,
      words[i - 1]?.text,
      words[i + 1]?.text,
      words[i + 2]?.text,
      words[i + 3]?.text,
      ...words.filter(
        (ow, oi) =>
          oi !== i &&
          Math.abs((ow.bbox.y0 + ow.bbox.y1) / 2 - (w.bbox.y0 + w.bbox.y1) / 2) <
            height,
      ).map((ow) => ow.text),
    ]
      .filter(Boolean)
      .join(" ");

    let score = height; // visually biggest wins ties

    // Hero-number bonus: by far the tallest digit on screen is almost always
    // the live step count on fitness apps. Goals are rendered smaller.
    if (maxDigitHeight > 0 && height >= maxDigitHeight * 0.9) score += 200;
    // Penalise small numbers when a much larger digit exists elsewhere — these
    // are almost certainly secondary stats (kcal, distance, goal).
    if (maxDigitHeight > 0 && height < maxDigitHeight * 0.6) score -= 150;

    if (POS_STEP.test(neighbourText)) score += 100;
    if (NEG_UNIT.test(neighbourText)) score -= 200;
    if (NEG_GOAL.test(neighbourText)) score -= 150;

    // If the previous word is "/" this is a goal denominator.
    const prev = words[i - 1]?.text?.trim();
    if (prev === "/") score -= 150;
    // "6,729 / 15,000" — the value AFTER the slash is the goal.
    if (prev && /\/$/.test(prev)) score -= 200;
    // "of 15,000" — goal phrasing.
    if (prev && /^of$/i.test(prev)) score -= 200;

    // Hard reject kcal adjacency.
    const next = words[i + 1]?.text?.trim() || "";
    if (/^(k?cal|calorie|kilocalorie)/i.test(next)) continue;

    candidates.push({ value: normalized, raw: t, score, source: "bbox" });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  if (typeof console !== "undefined") {
    console.info("[stepOcr] bbox candidates", candidates.slice(0, 5));
  }
  return candidates[0].value;
}

/**
 * Run Tesseract.js against an image file and return extracted step count.
 * Lazy-imports tesseract.js so it never ships in the initial bundle.
 */
export async function scanStepCountFromImage(file: File): Promise<number | null> {
  const { recognize } = await import("tesseract.js");
  // NOTE: no char whitelist — we NEED context words (steps/kcal/goal/km).
  // Tesseract v5+ requires explicit output flags to receive word-level bboxes.
  const { data } = await recognize(file, "eng", undefined, {
    blocks: true,
    text: true,
  } as unknown as Record<string, unknown>);

  // Collect word-level output with bboxes if available.
  const words: WordLike[] = [];
  const blocks = (data as unknown as { blocks?: Array<{ paragraphs?: Array<{ lines?: Array<{ words?: WordLike[] }> }> }> }).blocks;
  if (blocks) {
    for (const b of blocks) {
      for (const p of b.paragraphs ?? []) {
        for (const l of p.lines ?? []) {
          for (const w of l.words ?? []) {
            if (w?.text && w.bbox) words.push({ text: w.text, bbox: w.bbox });
          }
        }
      }
    }
  }

  if (typeof console !== "undefined") {
    console.info("[stepOcr] tesseract returned", {
      wordCount: words.length,
      textLength: (data?.text ?? "").length,
      textSample: (data?.text ?? "").slice(0, 200),
    });
  }

  const fromWords = words.length > 0 ? extractFromWords(words) : null;
  if (fromWords != null) {
    if (typeof console !== "undefined") console.info("[stepOcr] result via bbox:", fromWords);
    return fromWords;
  }

  const fromText = extractStepCount(data?.text ?? "");
  if (typeof console !== "undefined") console.info("[stepOcr] result via text fallback:", fromText);
  return fromText;
}
