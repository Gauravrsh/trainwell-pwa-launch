import { describe, it, expect } from 'vitest';
import {
  exerciseDatabase,
  exerciseCategories,
  gymExercises,
  getDefaultMetricForExercise,
  EXERCISE_DEFAULT_METRIC,
} from '@/data/gymExercises';

describe('Exercise vault — TW-027 expansion', () => {
  it('contains all 8 newly added strength/mobility/functional entries', () => {
    const required = [
      'Prone IYTW (Bodyweight)',
      'Standing IYTW (Bodyweight)',
      'Banded IYTW (Standing, Cable/Band)',
      'Prone IYTW (Weighted)',
      'Prone Hyperextension (Bodyweight)',
      'Weighted Prone Hyperextension',
      'Mountain Pose / Tadasana Hold',
      'Adductor Stretch (Seated Butterfly)',
    ];
    for (const name of required) {
      expect(gymExercises, `missing exercise: ${name}`).toContain(name);
    }
  });

  it('exposes the new "Cardio & Endurance" category with 25 entries', () => {
    expect(exerciseCategories).toContain('Cardio & Endurance');
    const cardio = exerciseDatabase.find(c => c.category === 'Cardio & Endurance');
    expect(cardio).toBeDefined();
    const sub = cardio!.subcategories.find(s => s.name === 'Cardio Machines & Sports');
    expect(sub).toBeDefined();
    expect(sub!.exercises).toHaveLength(25);
    // Spot-check
    expect(sub!.exercises).toContain('Swimming - Freestyle');
    expect(sub!.exercises).toContain('Outdoor Running');
    expect(sub!.exercises).toContain('Indoor Rowing (Erg)');
  });

  it('returns the correct default metric for new entries', () => {
    expect(getDefaultMetricForExercise('Mountain Pose / Tadasana Hold')).toBe('time');
    expect(getDefaultMetricForExercise('Adductor Stretch (Seated Butterfly)')).toBe('time');
    expect(getDefaultMetricForExercise('Outdoor Running')).toBe('distance_time');
    expect(getDefaultMetricForExercise('Swimming - Freestyle')).toBe('distance_time');
    expect(getDefaultMetricForExercise('Jump Rope - Double Unders')).toBe('reps_only');
    expect(getDefaultMetricForExercise('Spin Bike Intervals')).toBe('time');
    expect(getDefaultMetricForExercise('Prone IYTW (Bodyweight)')).toBe('reps_only');
    expect(getDefaultMetricForExercise('Prone Hyperextension (Bodyweight)')).toBe('reps_only');
  });

  it('falls back to reps_weight for legacy/custom entries (no regression)', () => {
    expect(getDefaultMetricForExercise('Barbell Back Squats (High Bar)')).toBe('reps_weight');
    expect(getDefaultMetricForExercise('Dumbbell Flat Bench Press')).toBe('reps_weight');
    expect(getDefaultMetricForExercise('Weighted Prone Hyperextension')).toBe('reps_weight');
    expect(getDefaultMetricForExercise('Some Custom Exercise User Typed')).toBe('reps_weight');
    expect(getDefaultMetricForExercise('')).toBe('reps_weight');
  });

  it('every key in EXERCISE_DEFAULT_METRIC matches an actual vault entry', () => {
    for (const name of Object.keys(EXERCISE_DEFAULT_METRIC)) {
      expect(gymExercises, `default-metric key has no matching exercise: ${name}`).toContain(name);
    }
  });
});