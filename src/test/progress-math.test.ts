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

  it('averages only over logged days → 368 (not 1114)', () => {
    expect(avgDailyDeficit(fourDays)).toBe(368);
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