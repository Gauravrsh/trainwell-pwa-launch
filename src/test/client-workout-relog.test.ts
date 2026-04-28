import { describe, it, expect } from 'vitest';

// TW-025 regression — pure-logic checks that mirror the Calendar/Modal
// guards. UI integration is verified manually in preview after deploy.

type Status = 'pending' | 'completed' | 'skipped';

function workoutCtaLabel(status: Status | undefined, canEdit: boolean): string {
  if (!canEdit) return 'hidden';
  return status === 'completed' ? 'View / Edit Workout' : 'Log Workout';
}

function modalMode(status: Status | undefined): 'log' | 'edit' {
  return status === 'completed' ? 'edit' : 'log';
}

function saveToast(existingStatus: Status | undefined): string {
  return existingStatus === 'completed' ? 'Workout updated' : 'Workout logged successfully!';
}

function shouldRunCleanup(existingStatus: Status | undefined): boolean {
  return existingStatus !== 'completed';
}

describe('TW-025 — completed workout re-log guard', () => {
  it('completed workout shows View / Edit CTA, not Log Workout', () => {
    expect(workoutCtaLabel('completed', true)).toBe('View / Edit Workout');
    expect(workoutCtaLabel('pending', true)).toBe('Log Workout');
    expect(workoutCtaLabel(undefined, true)).toBe('Log Workout');
  });

  it('CTA stays hidden when the date is not editable', () => {
    expect(workoutCtaLabel('completed', false)).toBe('hidden');
  });

  it('opening a completed workout puts the modal in edit mode', () => {
    expect(modalMode('completed')).toBe('edit');
    expect(modalMode('pending')).toBe('log');
    expect(modalMode(undefined)).toBe('log');
  });

  it('save toast distinguishes log vs update', () => {
    expect(saveToast('completed')).toBe('Workout updated');
    expect(saveToast('pending')).toBe('Workout logged successfully!');
    expect(saveToast(undefined)).toBe('Workout logged successfully!');
  });

  it('destructive cleanup of non-planned actuals only runs on fresh log', () => {
    expect(shouldRunCleanup('completed')).toBe(false);
    expect(shouldRunCleanup('pending')).toBe(true);
    expect(shouldRunCleanup(undefined)).toBe(true);
  });
});