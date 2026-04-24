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
const DIGIT_WORD = /^[\d,\s]+$/;

function stitchBrokenThousandsGroups(rawText: string): string {
  return rawText
    .replace(/\b(\d{1,3},\d{1,2})\s+(\d{1,2})\b/g, (match, left, right) => {
      const digitsAfterComma = (left.split(",").pop() ?? "").length;
      return digitsAfterComma + right.length === 3 ? `${left}${right}` : match;
    })
    .replace(/\b(\d{1,3},)\s+(\d{1,3})\b/g, (_match, left, right) => `${left}${right}`);
}

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

  const text = stitchBrokenThousandsGroups(rawText).replace(/\s+/g, " ");
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

function bboxHeight(bbox: WordLike["bbox"]): number {
  return Math.max(1, bbox.y1 - bbox.y0);
}

function bboxCenterY(bbox: WordLike["bbox"]): number {
  return (bbox.y0 + bbox.y1) / 2;
}

function isDigitWord(text: string): boolean {
  const trimmed = (text || "").trim();
  return Boolean(trimmed) && DIGIT_WORD.test(trimmed) && !CLOCK.test(trimmed) && !/\d\.\d/.test(trimmed);
}

function canMergeDigitFragments(
  currentText: string,
  currentBbox: WordLike["bbox"],
  nextWord: WordLike,
): boolean {
  const compactCurrent = currentText.replace(/\s+/g, "");
  const compactNext = nextWord.text.trim().replace(/\s+/g, "");

  if (!isDigitWord(compactCurrent) || !isDigitWord(compactNext)) return false;
  if (!/^\d{1,3},\d{0,2}$/.test(compactCurrent) && !/^\d{1,3},$/.test(compactCurrent)) {
    return false;
  }

  const nextDigits = compactNext.replace(/,/g, "");
  if (nextDigits.length === 0 || nextDigits.length > 2) return false;

  const currentHeight = bboxHeight(currentBbox);
  const nextHeight = bboxHeight(nextWord.bbox);
  const gap = nextWord.bbox.x0 - currentBbox.x1;

  if (gap < 0 || gap > Math.max(24, Math.min(currentHeight, nextHeight) * 0.18)) return false;
  if (Math.abs(bboxCenterY(currentBbox) - bboxCenterY(nextWord.bbox)) > Math.max(currentHeight, nextHeight) * 0.35) {
    return false;
  }

  const mergedDigitsLength = `${compactCurrent}${compactNext}`.replace(/,/g, "").length;
  return mergedDigitsLength >= 4 && mergedDigitsLength <= 6;
}

function buildBboxCandidate(
  words: WordLike[],
  startIndex: number,
  endIndex: number,
  rawText: string,
  bbox: WordLike["bbox"],
  maxDigitHeight: number,
): Candidate | null {
  const trimmed = (rawText || "").trim();
  if (!isDigitWord(trimmed)) return null;

  const currentYear = new Date().getFullYear();
  const normalized = parseInt(trimmed.replace(/[,\s]/g, ""), 10);
  if (!Number.isFinite(normalized)) return null;
  if (normalized === currentYear) return null;
  if (normalized < MIN_STEPS || normalized > MAX_STEPS) return null;

  const height = bboxHeight(bbox);
  const centerY = bboxCenterY(bbox);
  const neighbourText = [
    ...words.slice(Math.max(0, startIndex - 3), startIndex).map((word) => word.text),
    ...words.slice(endIndex + 1, endIndex + 4).map((word) => word.text),
    ...words
      .filter(
        (word, index) =>
          (index < startIndex || index > endIndex) && Math.abs(bboxCenterY(word.bbox) - centerY) < height,
      )
      .map((word) => word.text),
  ]
    .filter(Boolean)
    .join(" ");

  let score = height;

  if (maxDigitHeight > 0 && height >= maxDigitHeight * 0.9) score += 200;
  if (maxDigitHeight > 0 && height < maxDigitHeight * 0.6) score -= 150;

  if (POS_STEP.test(neighbourText)) score += 100;
  if (NEG_UNIT.test(neighbourText)) score -= 200;
  if (NEG_GOAL.test(neighbourText)) score -= 150;

  const prev = words[startIndex - 1]?.text?.trim();
  if (prev === "/") score -= 150;
  if (prev && /\/$/.test(prev)) score -= 200;
  if (prev && /^of$/i.test(prev)) score -= 200;

  const next = words[endIndex + 1]?.text?.trim() || "";
  if (/^(k?cal|calorie|kilocalorie)/i.test(next)) return null;

  return { value: normalized, raw: trimmed, score, source: "bbox" };
}

function extractFromWords(words: WordLike[]): number | null {
  if (!words || words.length === 0) return null;

  const candidates: Candidate[] = [];

  // Find the visually largest digit-word height to use as a "hero number" anchor.
  let maxDigitHeight = 0;
  for (const w of words) {
    const t = (w.text || "").trim();
    if (isDigitWord(t)) {
      const h = bboxHeight(w.bbox);
      if (h > maxDigitHeight) maxDigitHeight = h;
    }
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const t = (w.text || "").trim();
    if (!t) continue;

    if (!isDigitWord(t)) continue;

    let raw = t;
    let bbox = { ...w.bbox };
    let endIndex = i;
    while (endIndex + 1 < words.length && canMergeDigitFragments(raw, bbox, words[endIndex + 1])) {
      const nextWord = words[endIndex + 1];
      raw = `${raw}${nextWord.text.trim()}`;
      bbox = {
        x0: Math.min(bbox.x0, nextWord.bbox.x0),
        y0: Math.min(bbox.y0, nextWord.bbox.y0),
        x1: Math.max(bbox.x1, nextWord.bbox.x1),
        y1: Math.max(bbox.y1, nextWord.bbox.y1),
      };
      endIndex += 1;
    }

    const candidate = buildBboxCandidate(words, i, endIndex, raw, bbox, maxDigitHeight);
    if (candidate) candidates.push(candidate);
    i = endIndex;
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
  const { createWorker } = await import("tesseract.js");
  // NOTE: no char whitelist — we NEED context words (steps/kcal/goal/km).
  // Tesseract v5+ disables `blocks` (word bboxes) by default. Must use a
  // worker and pass an explicit output spec to get word-level data.
  const worker = await createWorker("eng");
  let data: { text?: string; blocks?: unknown };
  try {
    const result = await worker.recognize(
      file,
      {},
      { text: true, blocks: true } as unknown as Record<string, boolean>,
    );
    data = result.data as unknown as { text?: string; blocks?: unknown };
  } finally {
    await worker.terminate();
  }

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

  const fromText = extractStepCount(data?.text ?? "");
  const fromWords = words.length > 0 ? extractFromWords(words) : null;
  if (fromWords != null && (fromText == null || fromWords >= fromText)) {
    if (typeof console !== "undefined") console.info("[stepOcr] result via bbox:", fromWords);
    return fromWords;
  }
  if (fromText != null) {
    if (typeof console !== "undefined") console.info("[stepOcr] result via text fallback:", fromText);
    return fromText;
  }
  return fromWords;
}
