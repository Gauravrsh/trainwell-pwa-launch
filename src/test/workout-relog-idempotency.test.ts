/**
 * TW-029 — Re-saving an already-completed workout must NOT keep appending
 * duplicate copies of client-added (non-planned) exercises.
 *
 * Pure-logic test that mirrors the reconciliation flow in
 * src/pages/Calendar.tsx → handleWorkoutSave. We simulate the DB
 * `exercises` table as an in-memory array and run the save twice with the
 * same payload, asserting the resulting row count is the same.
 */
import { describe, it, expect } from 'vitest';

type Row = {
  id: string;
  workout_id: string;
  exercise_name: string;
  recommended_sets: number | null;
  actual_distance_meters: number | null;
  actual_duration_seconds: number | null;
};

type ClientLogged = {
  name: string;
  metricType: 'distance_time' | 'reps_only';
  distanceMeters?: number;
  durationSeconds?: number;
  sets?: { weight: number; reps: number }[];
};

let nextId = 0;
const newId = () => `row-${++nextId}`;

function reconcileSave(
  db: Row[],
  workoutId: string,
  payload: ClientLogged[],
): Row[] {
  // Mirror of the FIXED behaviour in Calendar.tsx:
  //   1. Always wipe previous client-added (recommended_sets IS NULL) rows.
  //   2. For planned rows (recommended_sets IS NOT NULL), update in place.
  //   3. Insert new client-added rows from the payload.
  let next = db.filter(
    r => !(r.workout_id === workoutId && r.recommended_sets === null),
  );

  const plannedNames = new Set(
    next
      .filter(r => r.workout_id === workoutId && r.recommended_sets !== null)
      .map(r => r.exercise_name),
  );

  for (const ex of payload) {
    if (plannedNames.has(ex.name)) continue; // would have been an UPDATE
    next.push({
      id: newId(),
      workout_id: workoutId,
      exercise_name: ex.name,
      recommended_sets: null,
      actual_distance_meters: ex.distanceMeters ?? null,
      actual_duration_seconds: ex.durationSeconds ?? null,
    });
  }
  return next;
}

describe('TW-029 — workout re-save idempotency', () => {
  const W = 'workout-1';

  const seed = (): Row[] => [
    // One trainer-planned exercise already on the workout.
    {
      id: 'planned-1',
      workout_id: W,
      exercise_name: 'Hypertension',
      recommended_sets: 1,
      actual_distance_meters: null,
      actual_duration_seconds: null,
    },
  ];

  const payload: ClientLogged[] = [
    {
      name: 'Swimming - Freestyle',
      metricType: 'distance_time',
      distanceMeters: 750,
      durationSeconds: 3600,
    },
  ];

  it('saving once → 1 swimming row exists', () => {
    const after = reconcileSave(seed(), W, payload);
    const swims = after.filter(r => r.exercise_name === 'Swimming - Freestyle');
    expect(swims.length).toBe(1);
  });

  it('saving the SAME payload 7× in a row → still 1 swimming row (was 7 in TW-029)', () => {
    let db = seed();
    for (let i = 0; i < 7; i++) db = reconcileSave(db, W, payload);
    const swims = db.filter(r => r.exercise_name === 'Swimming - Freestyle');
    expect(swims.length).toBe(1);
  });

  it('removing a client-added exercise from payload removes it from DB', () => {
    let db = reconcileSave(seed(), W, payload);
    expect(db.filter(r => r.exercise_name === 'Swimming - Freestyle').length).toBe(1);
    // Second save with empty payload → wipe client-added, planned stays.
    db = reconcileSave(db, W, []);
    expect(db.filter(r => r.exercise_name === 'Swimming - Freestyle').length).toBe(0);
    expect(db.filter(r => r.exercise_name === 'Hypertension').length).toBe(1);
  });

  it('trainer-planned rows are never deleted by the cleanup', () => {
    let db = seed();
    for (let i = 0; i < 5; i++) db = reconcileSave(db, W, payload);
    expect(db.filter(r => r.recommended_sets !== null).length).toBe(1);
  });
});