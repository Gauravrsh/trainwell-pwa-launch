// Exercise metric types — Phase 4a.
// Each metric_type implies which recommended_/actual_ columns on `exercises` are meaningful.

export type MetricType =
  | 'reps_weight'     // Sets × Reps × Weight (kg) — default, legacy
  | 'reps_only'       // Sets × Reps (bodyweight)
  | 'time'            // Duration (seconds) — plank, dead hang, stretch hold
  | 'distance_time'   // Distance (meters) + Duration (seconds) — sprints, rowing
  | 'amrap'           // As Many Rounds As Possible in X minutes
  | 'emom';           // Every Minute On the Minute — X minutes × Y reps

export const METRIC_TYPE_OPTIONS: { value: MetricType; label: string; hint: string }[] = [
  { value: 'reps_weight', label: 'Sets × Reps × Weight', hint: 'Bench press, squats, curls' },
  { value: 'reps_only', label: 'Sets × Reps (bodyweight)', hint: 'Push-ups, pull-ups' },
  { value: 'time', label: 'Time hold', hint: 'Plank, dead hang, stretches' },
  { value: 'distance_time', label: 'Distance + time', hint: 'Sprints, rowing, running' },
  { value: 'amrap', label: 'AMRAP (rounds in time)', hint: 'As many rounds as possible' },
  { value: 'emom', label: 'EMOM (every minute)', hint: 'X reps every minute for Y mins' },
];

export const DEFAULT_METRIC_TYPE: MetricType = 'reps_weight';

// Describes a single trainer-prescribed exercise row going into the modal / DB.
export interface PlannedExercise {
  name: string;
  metricType: MetricType;
  // reps_weight / reps_only use `sets` as array of per-set tuples
  sets?: { weight: number; reps: number }[];
  // time
  durationSeconds?: number;
  // distance_time
  distanceMeters?: number;
  // amrap
  rounds?: number;              // target or actual rounds
  amrapMinutes?: number;        // time cap (stored in durationSeconds as minutes*60)
  // emom
  emomMinutes?: number;
  emomReps?: number;            // reps per minute — reuses `sets[0].reps`
}

// Returns true when the `actual_*` fields relevant to this metric type are populated.
// Used for workout-completion / calendar coloring.
export function isActualLogged(ex: {
  metric_type?: string | null;
  actual_sets?: number | null;
  actual_reps?: number | null;
  actual_weight?: number | null;
  actual_duration_seconds?: number | null;
  actual_distance_meters?: number | null;
  actual_rounds?: number | null;
  actual_emom_minutes?: number | null;
}): boolean {
  const t = (ex.metric_type ?? 'reps_weight') as MetricType;
  switch (t) {
    case 'reps_weight':
      return ex.actual_sets !== null || ex.actual_reps !== null || ex.actual_weight !== null;
    case 'reps_only':
      return ex.actual_sets !== null || ex.actual_reps !== null;
    case 'time':
      return ex.actual_duration_seconds !== null;
    case 'distance_time':
      return ex.actual_distance_meters !== null || ex.actual_duration_seconds !== null;
    case 'amrap':
      return ex.actual_rounds !== null;
    case 'emom':
      return ex.actual_emom_minutes !== null || ex.actual_reps !== null;
    default:
      return ex.actual_sets !== null || ex.actual_reps !== null || ex.actual_weight !== null;
  }
}

// Returns true when the `recommended_*` fields relevant to this metric type are populated.
export function isRecommended(ex: {
  metric_type?: string | null;
  recommended_sets?: number | null;
  recommended_reps?: number | null;
  recommended_weight?: number | null;
  recommended_duration_seconds?: number | null;
  recommended_distance_meters?: number | null;
  recommended_rounds?: number | null;
  recommended_emom_minutes?: number | null;
}): boolean {
  const t = (ex.metric_type ?? 'reps_weight') as MetricType;
  switch (t) {
    case 'reps_weight':
      return ex.recommended_sets !== null || ex.recommended_reps !== null || ex.recommended_weight !== null;
    case 'reps_only':
      return ex.recommended_sets !== null || ex.recommended_reps !== null;
    case 'time':
      return ex.recommended_duration_seconds !== null;
    case 'distance_time':
      return ex.recommended_distance_meters !== null || ex.recommended_duration_seconds !== null;
    case 'amrap':
      return ex.recommended_rounds !== null || ex.recommended_emom_minutes !== null;
    case 'emom':
      return ex.recommended_emom_minutes !== null || ex.recommended_reps !== null;
    default:
      return ex.recommended_sets !== null || ex.recommended_reps !== null || ex.recommended_weight !== null;
  }
}

// Render a short recommendation summary for the client view.
export function summarizeRecommendation(ex: {
  metric_type?: string | null;
  recommended_sets?: number | null;
  recommended_reps?: number | null;
  recommended_weight?: number | null;
  recommended_duration_seconds?: number | null;
  recommended_distance_meters?: number | null;
  recommended_rounds?: number | null;
  recommended_emom_minutes?: number | null;
}): string {
  const t = (ex.metric_type ?? 'reps_weight') as MetricType;
  switch (t) {
    case 'reps_weight':
      return `${ex.recommended_weight ?? 0}kg × ${ex.recommended_reps ?? 0}`;
    case 'reps_only':
      return `${ex.recommended_reps ?? 0} reps`;
    case 'time':
      return `${ex.recommended_duration_seconds ?? 0}s`;
    case 'distance_time':
      return `${ex.recommended_distance_meters ?? 0}m${ex.recommended_duration_seconds ? ` / ${ex.recommended_duration_seconds}s` : ''}`;
    case 'amrap':
      return `AMRAP ${ex.recommended_emom_minutes ?? 0}min`;
    case 'emom':
      return `EMOM ${ex.recommended_emom_minutes ?? 0}min × ${ex.recommended_reps ?? 0} reps`;
  }
}