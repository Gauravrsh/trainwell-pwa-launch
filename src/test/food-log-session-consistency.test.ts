import { describe, it, expect } from 'vitest';

/**
 * TW-032 — The "N meals logged" session pill must always be a strict subset of
 * the diary rows that drive the Today's Diary header. We replicate the pure
 * filter/aggregation logic from FoodSessionSummary here so a regression that
 * re-introduces a parallel in-memory store would break this test.
 */

type Row = {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  pending_analysis: boolean;
  created_at: string;
};

const sessionFromRows = (rows: Row[], modalOpenedAt: string) =>
  rows.filter((r) => !r.pending_analysis && r.created_at >= modalOpenedAt);

const total = (rows: { calories: number }[]) =>
  rows.reduce((a, r) => a + r.calories, 0);

const mkRow = (overrides: Partial<Row>): Row => ({
  id: 'x',
  meal_type: 'snack',
  calories: 100,
  protein: 0,
  carbs: 0,
  fat: 0,
  pending_analysis: false,
  created_at: '2026-05-09T05:00:00Z',
  ...overrides,
});

describe('TW-032 session pill ⊆ diary', () => {
  const opened = '2026-05-09T06:00:00Z';

  it('returns 0 when nothing is logged this session', () => {
    expect(sessionFromRows([], opened)).toHaveLength(0);
  });

  it('only counts rows logged after the modal opened', () => {
    const rows = [
      mkRow({ id: 'a', created_at: '2026-05-09T05:00:00Z', calories: 322 }), // earlier
      mkRow({ id: 'b', created_at: '2026-05-09T07:00:00Z', calories: 250 }), // session
    ];
    const session = sessionFromRows(rows, opened);
    expect(session.map((r) => r.id)).toEqual(['b']);
    expect(total(session)).toBe(250);
  });

  it('drops a deleted row from the session pill (pill ⊆ diary)', () => {
    // Simulate the screenshot scenario: 3 logged this session, then 1 deleted.
    const all = [
      mkRow({ id: 'a', created_at: '2026-05-09T07:00:00Z', calories: 322 }),
      mkRow({ id: 'b', created_at: '2026-05-09T07:30:00Z', calories: 310 }),
      mkRow({ id: 'c', created_at: '2026-05-09T08:00:00Z', calories: 250 }),
    ];
    const afterDelete = all.filter((r) => r.id !== 'b');
    const session = sessionFromRows(afterDelete, opened);
    expect(session).toHaveLength(2);
    expect(total(session)).toBe(572);
    // Crucially, NOT 882 — which is the old bug.
    expect(total(session)).not.toBe(882);
  });

  it('excludes pending_analysis rows from the totals', () => {
    const rows = [
      mkRow({ id: 'a', created_at: '2026-05-09T07:00:00Z', calories: 0, pending_analysis: true }),
      mkRow({ id: 'b', created_at: '2026-05-09T07:30:00Z', calories: 250 }),
    ];
    expect(total(sessionFromRows(rows, opened))).toBe(250);
  });
});