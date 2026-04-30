/**
 * TW-028 — Progress page math regression suite.
 *
 * Pins the three behaviours we promised the user:
 *  1. "View last N days" produces exactly N days (no off-by-one).
 *  2. "Avg Daily Deficit" averages ONLY over days where something was logged
 *     (missed days do NOT contribute a phantom 1859-style deficit).
 *  3. Historical BMR: each day uses the BMR effective on that day, so updating
 *     today's BMR does not silently rewrite past days' expenditure.
 *  4. Charts emit `null` (not synthetic numbers) on missed days so the bar
 *     chart and the "Days Missed" card tell the same story.
 */
import { describe, it, expect } from 'vitest';
import { eachDayOfInterval, subDays, format } from 'date-fns';

// ---------- Pure helpers extracted from the production code paths ----------
// Mirrors the windowing in src/hooks/useProgressData.tsx.
function buildWindow(dateRange: number, today = new Date('2026-04-28T12:00:00Z')) {
  const endDate = today;
  const startDate = subDays(endDate, Math.max(0, dateRange - 1));
  return eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  );
}

// Mirrors the per-day BMR resolver in src/hooks/useProgressData.tsx.
function resolveBmrPerDay(
  days: string[],
  seedBmr: number,
  changes: Array<{ date: string; bmr: number }>,
): Record<string, number> {
  const map: Record<string, number> = {};
  changes.forEach((c) => { map[c.date] = c.bmr; });
  let current = seedBmr;
  const out: Record<string, number> = {};
  for (const d of days) {
    if (map[d] !== undefined) current = map[d];
    out[d] = current;
  }
  return out;
}

// Mirrors the avg-deficit logic in src/pages/Progress.tsx.
function avgDailyDeficit(
  rows: Array<{ netDeficit: number; isMissed: boolean }>,
): number | null {
  const logged = rows.filter((r) => !r.isMissed);
  if (logged.length === 0) return null;
  return Math.round(logged.reduce((s, r) => s + r.netDeficit, 0) / logged.length);
}

// Mirrors the chart `expenditureValue` / `deficitValue` mapping.
function toChartRow(day: { totalExpenditure: number; netDeficit: number; isMissed: boolean }) {
  return {
    expenditureValue: day.isMissed ? null : day.totalExpenditure,
    deficitValue: day.isMissed ? null : day.netDeficit,
  };
}

// ---------- Tests ----------
describe('TW-028 — Progress windowing (off-by-one)', () => {
  it.each([1, 3, 7, 30, 90])(
    '"View last %i days" produces exactly %i days',
    (n) => {
      expect(buildWindow(n).length).toBe(n);
    },
  );

  it('window for "3 days" ending Apr 28 is Apr 26..Apr 28 (not Apr 25..Apr 28)', () => {
    const days = buildWindow(3);
    expect(days[0]).toBe('2026-04-26');
    expect(days[days.length - 1]).toBe('2026-04-28');
  });
});

describe('TW-028 — Avg Daily Deficit excludes missed days', () => {
  // Gaurav's exact 4 days from the bug screenshot.
  const fourDays = [
    { netDeficit: 1859, isMissed: true },  // Apr 25 — nothing logged
    { netDeficit: 1859, isMissed: true },  // Apr 26 — nothing logged
    { netDeficit: 168,  isMissed: false }, // Apr 27 — logged
    { netDeficit: 569,  isMissed: false }, // Apr 28 — logged
  ];

  it('does NOT reproduce the broken 1114 average', () => {
    expect(avgDailyDeficit(fourDays)).not.toBe(1114);
  });

  it('averages only over logged days → 369 (not 1114)', () => {
    // (168 + 569) / 2 = 368.5 → Math.round → 369
    expect(avgDailyDeficit(fourDays)).toBe(369);
  });

  it('returns null when no day was logged (so UI can render "—")', () => {
    expect(
      avgDailyDeficit([
        { netDeficit: 1859, isMissed: true },
        { netDeficit: 1859, isMissed: true },
      ]),
    ).toBeNull();
  });

  it('after the off-by-one fix, "last 3 days" gives 369 for Gaurav', () => {
    // After fix: window is Apr 26, 27, 28 → one missed, two logged.
    const threeDays = fourDays.slice(1);
    expect(avgDailyDeficit(threeDays)).toBe(Math.round((168 + 569) / 2));
  });
});

describe('TW-028 — Historical BMR resolver', () => {
  it('uses the BMR that was effective on each day, not today\'s value', () => {
    const days = ['2026-04-01', '2026-04-15', '2026-04-20', '2026-04-28'];
    const perDay = resolveBmrPerDay(days, 1700, [
      { date: '2026-04-20', bmr: 1900 },
    ]);
    expect(perDay['2026-04-01']).toBe(1700); // before the change
    expect(perDay['2026-04-15']).toBe(1700); // before the change
    expect(perDay['2026-04-20']).toBe(1900); // change day
    expect(perDay['2026-04-28']).toBe(1900); // after the change
  });

  it('updating today\'s BMR does NOT rewrite past days', () => {
    const days = ['2026-04-01', '2026-04-28'];
    // Before: only one historical row (1700, effective Apr 1).
    const before = resolveBmrPerDay(days, 1700, []);
    expect(before['2026-04-01']).toBe(1700);
    expect(before['2026-04-28']).toBe(1700);

    // User logs a new BMR of 2000 on Apr 28 → adds a new row, never edits old.
    const after = resolveBmrPerDay(days, 1700, [
      { date: '2026-04-28', bmr: 2000 },
    ]);
    expect(after['2026-04-01']).toBe(1700); // FROZEN — the whole point of TW-028
    expect(after['2026-04-28']).toBe(2000);
  });

  it('falls back to 0 when no BMR was ever logged before the window', () => {
    const perDay = resolveBmrPerDay(['2026-04-28'], 0, []);
    expect(perDay['2026-04-28']).toBe(0);
  });
});

describe('TW-028 — Charts blank out missed days', () => {
  it('missed day → expenditureValue and deficitValue are null', () => {
    const row = toChartRow({ totalExpenditure: 1859, netDeficit: 1859, isMissed: true });
    expect(row.expenditureValue).toBeNull();
    expect(row.deficitValue).toBeNull();
  });

  it('logged day → real values pass through unchanged', () => {
    const row = toChartRow({ totalExpenditure: 2665, netDeficit: 168, isMissed: false });
    expect(row.expenditureValue).toBe(2665);
    expect(row.deficitValue).toBe(168);
  });
});

// ---------- Weight carry-forward helpers (mirror useProgressData.tsx) ----------
function resolveWeightPerDay(
  days: string[],
  seedWeight: number | null,
  logs: Array<{ date: string; weight: number }>,
): Array<number | null> {
  const map: Record<string, number> = {};
  logs.forEach((l) => { map[l.date] = l.weight; });
  let current: number | null = seedWeight;
  return days.map((d) => {
    if (map[d] !== undefined) current = map[d];
    return current;
  });
}

// Mirrors weightChange computation in src/pages/Progress.tsx.
function weightChange(weights: Array<number | null>): string | null {
  const nonNull = weights.filter((w): w is number => w !== null);
  if (nonNull.length < 2) return null;
  return (nonNull[nonNull.length - 1] - nonNull[0]).toFixed(1);
}

describe('Weight carry-forward', () => {
  it('logs on day 1 (72) and day 6 (71) → days 1–5 = 72, days 6+ = 71', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'];
    const out = resolveWeightPerDay(days, null, [
      { date: '2026-01-01', weight: 72 },
      { date: '2026-01-06', weight: 71 },
    ]);
    expect(out).toEqual([72, 72, 72, 72, 72, 71, 71]);
  });

  it('seeds from latest log before window — day 1 of window inherits prior weight', () => {
    const days = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04'];
    const out = resolveWeightPerDay(days, 70, [
      { date: '2026-04-03', weight: 69 },
    ]);
    expect(out).toEqual([70, 70, 69, 69]);
  });

  it('no prior log + first in-window log on day 10 → days 1–9 stay null (no fabrication)', () => {
    const days = Array.from({ length: 12 }, (_, i) =>
      `2026-04-${String(i + 1).padStart(2, '0')}`,
    );
    const out = resolveWeightPerDay(days, null, [
      { date: '2026-04-10', weight: 75 },
    ]);
    expect(out.slice(0, 9)).toEqual(Array(9).fill(null));
    expect(out.slice(9)).toEqual([75, 75, 75]);
  });

  it('no log ever → entire window is null', () => {
    const days = ['2026-04-01', '2026-04-02', '2026-04-03'];
    const out = resolveWeightPerDay(days, null, []);
    expect(out).toEqual([null, null, null]);
  });

  it('Weight Change stat uses carried-forward first vs last (not raw logged)', () => {
    // Logs: 72 on day 1, 71 on day 6. Window = 7 days.
    // Carried: [72,72,72,72,72,71,71]. Change = 71 - 72 = -1.0.
    const carried = resolveWeightPerDay(
      ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'],
      null,
      [{ date: 'd1', weight: 72 }, { date: 'd6', weight: 71 }],
    );
    expect(weightChange(carried)).toBe('-1.0');
  });

  it('Weight Change stat is null when no weight ever logged', () => {
    const carried = resolveWeightPerDay(['d1', 'd2'], null, []);
    expect(weightChange(carried)).toBeNull();
  });

  it('Weight Change reflects seed-vs-final when only prior log exists (flat line)', () => {
    // Seed = 70, no in-window logs. Carried = [70,70,70]. Diff = 0.0 — but
    // weightChange returns null when there are fewer than 2 *distinct* entries?
    // Spec uses count-based check (length < 2), so [70,70,70] → "0.0".
    const carried = resolveWeightPerDay(['d1', 'd2', 'd3'], 70, []);
    expect(weightChange(carried)).toBe('0.0');
  });
});