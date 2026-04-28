import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, startOfDay, isSameDay, isAfter, isBefore, differenceInDays, getDaysInMonth, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Check, Clock, X, AlertCircle, Utensils, UserPlus, Share2, Eye, Footprints, CalendarOff, UserX, Palmtree } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClientWorkoutLogModal } from '@/components/modals/ClientWorkoutLogModal';
import { TrainerWorkoutLogModal } from '@/components/modals/TrainerWorkoutLogModal';
import type { TrainerPlannedExercise, ClientLoggedExercise } from '@/components/modals/ClientWorkoutLogModal';
import type { PlannedExercisePayload } from '@/components/modals/TrainerWorkoutLogModal';
import { MetricType, DEFAULT_METRIC_TYPE, isActualLogged, isRecommended } from '@/types/exerciseMetrics';
import { FoodLogModal } from '@/components/modals/FoodLogModal';
import { StepLogModal } from '@/components/modals/StepLogModal';
import { ClientFilter } from '@/components/calendar/ClientFilter';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { SubscriptionEnforcementBanner } from '@/components/subscription/SubscriptionEnforcementBanner';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useSelectedClient } from '@/hooks/useSelectedClient';

interface Workout {
  id: string;
  date: string;
  status: 'pending' | 'completed' | 'skipped';
  client_id: string;
}

interface Exercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  metric_type: string | null;
  recommended_sets: number | null;
  recommended_reps: number | null;
  recommended_weight: number | null;
  recommended_duration_seconds: number | null;
  recommended_distance_meters: number | null;
  recommended_rounds: number | null;
  recommended_emom_minutes: number | null;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  actual_duration_seconds: number | null;
  actual_distance_meters: number | null;
  actual_rounds: number | null;
  actual_emom_minutes: number | null;
}

interface Client {
  id: string;
  unique_id: string;
  full_name?: string | null;
}

interface DayMark {
  id: string;
  client_id: string;
  mark_date: string;
  mark_type: 'trainer_leave' | 'client_leave' | 'holiday';
}

const Calendar = () => {
  const { profile, isTrainer } = useProfile();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showClientActionSheet, setShowClientActionSheet] = useState(false);
  const [showTrainerActionSheet, setShowTrainerActionSheet] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showTrainerWorkoutModal, setShowTrainerWorkoutModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  // Item 5: session-shared client selection across Calendar/Progress/Plans.
  const { selectedClientId, setSelectedClientId } = useSelectedClient();
  const [existingExercises, setExistingExercises] = useState<PlannedExercisePayload[]>([]);
  const [clientHasLogged, setClientHasLogged] = useState(false);
  const [clientTrainerExercises, setClientTrainerExercises] = useState<TrainerPlannedExercise[]>([]);
  const [clientExistingActuals, setClientExistingActuals] = useState<ClientLoggedExercise[]>([]);
  const [workoutModalMode, setWorkoutModalMode] = useState<'log' | 'edit'>('log');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);
  const [existingStepLog, setExistingStepLog] = useState<{ id: string; step_count: number } | null>(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [dayMarkLoading, setDayMarkLoading] = useState(false);

  // Subscription access for trainers
  const { isReadOnly: subscriptionReadOnly, reason: subscriptionReason, loading: subscriptionLoading } = useSubscriptionAccess();
  const { renewPlan, status } = useTrainerSubscription();
  const { subscribe: subscribePush } = usePushSubscription();

  // Prompt push permission once after first successful log
  const pushPromptedRef = useRef(false);
  const promptPushPermission = useCallback(() => {
    if (pushPromptedRef.current) return;
    if (Notification.permission === 'default') {
      pushPromptedRef.current = true;
      subscribePush();
    }
  }, [subscribePush]);

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    await renewPlan(planType);
    setShowPlanModal(false);
  };

  // Calculate cycle dates based on actual calendar months
  const today = useMemo(() => startOfDay(new Date()), []);
  
  // Current month boundaries
  const currentCycleStart = useMemo(() => startOfMonth(today), [today]);
  const daysInCurrentMonth = useMemo(() => getDaysInMonth(currentCycleStart), [currentCycleStart]);
  const currentCycleEnd = useMemo(() => addDays(currentCycleStart, daysInCurrentMonth - 1), [currentCycleStart, daysInCurrentMonth]);
  
  // Previous month boundaries
  const previousCycleStart = useMemo(() => {
    const prevMonth = subDays(currentCycleStart, 1);
    return startOfMonth(prevMonth);
  }, [currentCycleStart]);
  const daysInPreviousMonth = useMemo(() => getDaysInMonth(previousCycleStart), [previousCycleStart]);
  const previousCycleEnd = useMemo(() => subDays(currentCycleStart, 1), [currentCycleStart]);

  // Fetch workouts for the user (client view)
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', profile.id)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as Workout[];
    },
    enabled: !!profile && !isTrainer,
  });

  // Fetch trainer's clients using secure RPC (excludes payment info)
  const { data: clients = [] } = useQuery({
    queryKey: ['trainer-clients', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase.rpc('get_trainer_clients');
      
      if (error) throw error;
      return (data || []) as Client[];
    },
    enabled: !!profile && isTrainer,
  });

  // Fetch workouts for selected client (trainer view)
  const { data: clientWorkouts = [] } = useQuery({
    queryKey: ['client-workouts', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as Workout[];
    },
    enabled: !!selectedClientId && isTrainer,
  });

  // Fetch day marks for selected client (trainer view) or own marks (client view)
  const { data: dayMarks = [] } = useQuery({
    queryKey: ['day-marks', isTrainer ? selectedClientId : profile?.id],
    queryFn: async () => {
      const clientId = isTrainer ? selectedClientId : profile?.id;
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('day_marks')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data as DayMark[];
    },
    enabled: !!(isTrainer ? selectedClientId : profile?.id),
  });

  // Generate all dates to display (previous cycle + current cycle + future)
  const allDates = useMemo(() => {
    const dates: { date: Date; section: 'past' | 'current' | 'future' }[] = [];
    
    // Previous month (dynamic days based on actual month)
    for (let i = 0; i < daysInPreviousMonth; i++) {
      dates.push({
        date: addDays(previousCycleStart, i),
        section: 'past'
      });
    }
    
    // Current month (dynamic days based on actual month)
    for (let i = 0; i < daysInCurrentMonth; i++) {
      dates.push({
        date: addDays(currentCycleStart, i),
        section: 'current'
      });
    }
    
    // Future - only the immediate next calendar month
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const nextMonth = currentMonth + 1;
    const nextMonthYear = nextMonth > 11 ? currentYear + 1 : currentYear;
    const nextMonthNormalized = nextMonth > 11 ? 0 : nextMonth;
    
    const nextMonthStart = new Date(nextMonthYear, nextMonthNormalized, 1);
    const nextMonthEnd = new Date(nextMonthYear, nextMonthNormalized + 1, 0);
    const daysInNextMonth = nextMonthEnd.getDate();
    
    for (let i = 0; i < daysInNextMonth; i++) {
      dates.push({
        date: addDays(nextMonthStart, i),
        section: 'future'
      });
    }
    
    return dates;
  }, [previousCycleStart, currentCycleStart, today, daysInPreviousMonth, daysInCurrentMonth]);

  const getWorkoutForDate = (date: Date, workoutList: Workout[] = workouts) => {
    return workoutList.find(w => isSameDay(new Date(w.date), date));
  };

  // Build trainer-planned exercise payloads from raw `exercises` rows.
  // For reps_weight / reps_only we group per exercise_name and collect per-set rows.
  // For other metric types (time / distance_time / amrap / emom) one row = one exercise.
  const parsePlannedExercises = (rows: Exercise[]): PlannedExercisePayload[] => {
    const planned = rows.filter(isRecommended);
    const repsBased: Map<string, { weight: number; reps: number }[]> = new Map();
    const result: PlannedExercisePayload[] = [];

    for (const ex of planned) {
      const name = ex.exercise_name?.trim();
      if (!name) continue;
      const metricType = (ex.metric_type ?? DEFAULT_METRIC_TYPE) as MetricType;

      if (metricType === 'reps_weight' || metricType === 'reps_only') {
        const sets = repsBased.get(name) ?? [];
        sets.push({
          weight: ex.recommended_weight ?? 0,
          reps: ex.recommended_reps ?? 0,
        });
        repsBased.set(name, sets);
        // Remember the metric for this exercise group (first one wins)
        if (!result.find(r => r.name === name)) {
          result.push({ name, metricType, sets });
        }
      } else if (metricType === 'time') {
        result.push({ name, metricType, durationSeconds: ex.recommended_duration_seconds ?? 0 });
      } else if (metricType === 'distance_time') {
        result.push({
          name, metricType,
          distanceMeters: ex.recommended_distance_meters ?? 0,
          durationSeconds: ex.recommended_duration_seconds ?? 0,
        });
      } else if (metricType === 'amrap') {
        result.push({
          name, metricType,
          emomMinutes: ex.recommended_emom_minutes ?? 0,
          rounds: ex.recommended_rounds ?? 0,
        });
      } else if (metricType === 'emom') {
        result.push({
          name, metricType,
          emomMinutes: ex.recommended_emom_minutes ?? 0,
          emomReps: ex.recommended_reps ?? 0,
        });
      }
    }
    // Ensure reps-based entries reference the grouped sets array
    return result.map(r =>
      (r.metricType === 'reps_weight' || r.metricType === 'reps_only')
        ? { ...r, sets: repsBased.get(r.name) ?? [] }
        : r
    );
  };

  const getDayMarkForDate = (date: Date): DayMark | undefined => {
    return dayMarks.find(m => isSameDay(new Date(m.mark_date), date));
  };

  // Reconstruct previously-saved actuals so the edit modal shows what the
  // client logged (instead of zeros). Mirrors parsePlannedExercises but for
  // actual_* columns. Reps-based metrics are grouped per exercise name.
  const parseLoggedActuals = (rows: Exercise[]): ClientLoggedExercise[] => {
    const logged = rows.filter(isActualLogged);
    const repsBased: Map<string, { weight: number; reps: number }[]> = new Map();
    const order: string[] = [];
    const result: ClientLoggedExercise[] = [];

    for (const ex of logged) {
      const name = ex.exercise_name?.trim();
      if (!name) continue;
      const metricType = (ex.metric_type ?? DEFAULT_METRIC_TYPE) as MetricType;

      if (metricType === 'reps_weight' || metricType === 'reps_only') {
        const sets = repsBased.get(name) ?? [];
        sets.push({
          weight: ex.actual_weight ?? 0,
          reps: ex.actual_reps ?? 0,
        });
        repsBased.set(name, sets);
        if (!order.includes(name)) {
          order.push(name);
          result.push({ name, metricType, sets });
        }
      } else if (metricType === 'time') {
        result.push({ name, metricType, durationSeconds: ex.actual_duration_seconds ?? 0 });
      } else if (metricType === 'distance_time') {
        result.push({
          name, metricType,
          distanceMeters: ex.actual_distance_meters ?? 0,
          durationSeconds: ex.actual_duration_seconds ?? 0,
        });
      } else if (metricType === 'amrap') {
        result.push({
          name, metricType,
          emomMinutes: ex.actual_emom_minutes ?? 0,
          rounds: ex.actual_rounds ?? 0,
        });
      } else if (metricType === 'emom') {
        result.push({
          name, metricType,
          emomMinutes: ex.actual_emom_minutes ?? 0,
          emomReps: ex.actual_reps ?? 0,
        });
      }
    }
    return result.map(r =>
      (r.metricType === 'reps_weight' || r.metricType === 'reps_only')
        ? { ...r, sets: repsBased.get(r.name) ?? [] }
        : r
    );
  };

  // Boundary-only styles for logged status (kept name for backward compat)
  const getStatusBorder = (status?: string): string | null => {
    if (status === 'completed') return 'border-success';
    return null; // pending / skipped → blank tile
  };

  // Boundary-only colors per day mark type
  const getDayMarkBorder = (markType: string): string | null => {
    switch (markType) {
      case 'client_leave':  return 'border-destructive';
      case 'trainer_leave': return 'border-warning';
      case 'holiday':       return 'border-muted-foreground/60';
      default: return null;
    }
  };

  // Check if a date is within the editable window (T-7 days)
  const isDateEditable = (date: Date): boolean => {
    const daysDiff = differenceInDays(today, date);
    return daysDiff <= 7 && daysDiff >= 0 || isAfter(date, today);
  };

  // Check if a date is today or future (for trainer day marks)
  const isDateTodayOrFuture = (date: Date): boolean => {
    return isSameDay(date, today) || isAfter(date, today);
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    
    if (isTrainer) {
      if (!selectedClientId) {
        toast.error('Please select a client first');
        return;
      }
      
      // Show the trainer action sheet instead of jumping to workout modal
      setShowTrainerActionSheet(true);
    } else {
      // Client view - fetch trainer-assigned exercises for this date
      const workout = getWorkoutForDate(date);
      if (workout) {
        const { data: exercises, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workout.id);
        
        if (!error && exercises) {
          setClientTrainerExercises(parsePlannedExercises(exercises as unknown as Exercise[]));
        } else {
          setClientTrainerExercises([]);
        }
      } else {
        setClientTrainerExercises([]);
      }
      
      // Fetch step log for the selected date
      fetchStepLog(date);
      setShowClientActionSheet(true);
    }
  };

  // Handler for when trainer clicks "Log Workout" from the action sheet
  const handleTrainerLogWorkout = async () => {
    if (!selectedDate || !selectedClientId) return;
    
    const workout = getWorkoutForDate(selectedDate, clientWorkouts);
    if (workout) {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_id', workout.id);
      
      if (!error && exercises) {
        const hasActualValues = (exercises as unknown as Exercise[]).some(isActualLogged);
        setClientHasLogged(hasActualValues);
        setExistingExercises(parsePlannedExercises(exercises as unknown as Exercise[]));
      }
    } else {
      setExistingExercises([]);
      setClientHasLogged(false);
    }
    
    setShowTrainerActionSheet(false);
    setShowTrainerWorkoutModal(true);
  };

  // Handler for when trainer clicks "Log Food" from the action sheet
  const handleTrainerLogFood = () => {
    setShowTrainerActionSheet(false);
    setShowFoodModal(true);
  };

  // Handler for day marks (TL/CL/HL)
  const handleDayMark = async (markType: 'trainer_leave' | 'client_leave' | 'holiday') => {
    if (!selectedDate || !selectedClientId || !profile) return;
    
    if (!isDateTodayOrFuture(selectedDate)) {
      toast.error('Day marks can only be set for today or future dates');
      return;
    }

    setDayMarkLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingMark = getDayMarkForDate(selectedDate);

      // If same mark exists, remove it (toggle off)
      if (existingMark && existingMark.mark_type === markType) {
        // Reverse the effect before deleting
        await reverseDayMarkEffect(existingMark);
        
        const { error } = await supabase
          .from('day_marks')
          .delete()
          .eq('id', existingMark.id);
        if (error) throw error;
        
        toast.success('Day mark removed');
      } else {
        // If different mark exists, reverse its effect and delete it first
        if (existingMark) {
          await reverseDayMarkEffect(existingMark);
          
          const { error: delError } = await supabase
            .from('day_marks')
            .delete()
            .eq('id', existingMark.id);
          if (delError) throw delError;
        }

        // Insert new mark
        const { error } = await supabase
          .from('day_marks')
          .insert({
            trainer_id: profile.id,
            client_id: selectedClientId,
            mark_date: dateStr,
            mark_type: markType,
          });
        if (error) throw error;

        // Apply the effect
        await applyDayMarkEffect(markType, selectedClientId);

        const labels: Record<string, string> = {
          trainer_leave: 'Trainer Leave',
          client_leave: 'Client Leave',
          holiday: 'Holiday',
        };
        toast.success(`${labels[markType]} marked`);
      }

      queryClient.invalidateQueries({ queryKey: ['day-marks', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['client-workouts', selectedClientId] });
      setShowTrainerActionSheet(false);
    } catch (error) {
      logError('Calendar.handleDayMark', error);
      toast.error('Failed to set day mark');
    } finally {
      setDayMarkLoading(false);
    }
  };

  // Apply session impact for a day mark
  const applyDayMarkEffect = async (markType: string, clientId: string) => {
    if (markType === 'client_leave') {
      // CL: increment missed_sessions on active plan
      const { data: plan } = await supabase
        .from('client_training_plans')
        .select('id, missed_sessions')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (plan) {
        await supabase
          .from('client_training_plans')
          .update({ missed_sessions: (plan.missed_sessions || 0) + 1 })
          .eq('id', plan.id);
      }
    } else if (markType === 'trainer_leave') {
      // TL: extend end_date of active plan by 1 day
      const { data: plan } = await supabase
        .from('client_training_plans')
        .select('id, end_date')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (plan) {
        const newEndDate = format(addDays(new Date(plan.end_date), 1), 'yyyy-MM-dd');
        await supabase
          .from('client_training_plans')
          .update({ end_date: newEndDate })
          .eq('id', plan.id);
      }
    }
    // HL: no plan changes
  };

  // Reverse the effect of a day mark (when removing/changing)
  const reverseDayMarkEffect = async (mark: DayMark) => {
    if (mark.mark_type === 'client_leave') {
      const { data: plan } = await supabase
        .from('client_training_plans')
        .select('id, missed_sessions')
        .eq('client_id', mark.client_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (plan && (plan.missed_sessions || 0) > 0) {
        await supabase
          .from('client_training_plans')
          .update({ missed_sessions: (plan.missed_sessions || 0) - 1 })
          .eq('id', plan.id);
      }
    } else if (mark.mark_type === 'trainer_leave') {
      const { data: plan } = await supabase
        .from('client_training_plans')
        .select('id, end_date')
        .eq('client_id', mark.client_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (plan) {
        const newEndDate = format(subDays(new Date(plan.end_date), 1), 'yyyy-MM-dd');
        await supabase
          .from('client_training_plans')
          .update({ end_date: newEndDate })
          .eq('id', plan.id);
      }
    }
  };

  const handleTrainerWorkoutSave = async (exercises: PlannedExercisePayload[]) => {
    if (!selectedClientId || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const existingWorkout = getWorkoutForDate(selectedDate, clientWorkouts);
      let workoutId: string;
      
      if (existingWorkout) {
        workoutId = existingWorkout.id;
        
        await supabase
          .from('exercises')
          .delete()
          .eq('workout_id', workoutId);
      } else {
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            client_id: selectedClientId,
            date: dateStr,
            status: 'pending'
          })
          .select()
          .single();
        
        if (workoutError) throw workoutError;
        workoutId = newWorkout.id;
      }

      const normalizedExercises = exercises
        .map(ex => ({ ...ex, name: ex.name.trim() }))
        .filter(ex => ex.name.length > 0);

      // Build metric-aware inserts. Reps-based metrics fan out per set;
      // other metric types produce a single row per exercise.
      const exerciseInserts: Record<string, unknown>[] = [];
      normalizedExercises.forEach(ex => {
        const baseRow = {
          workout_id: workoutId,
          exercise_name: ex.name,
          metric_type: ex.metricType,
        };
        switch (ex.metricType) {
          case 'reps_weight':
          case 'reps_only':
            (ex.sets ?? []).forEach(set => exerciseInserts.push({
              ...baseRow,
              recommended_sets: 1,
              recommended_reps: set.reps,
              recommended_weight: ex.metricType === 'reps_weight' ? set.weight : null,
            }));
            break;
          case 'time':
            exerciseInserts.push({ ...baseRow, recommended_duration_seconds: ex.durationSeconds ?? 0 });
            break;
          case 'distance_time':
            exerciseInserts.push({
              ...baseRow,
              recommended_distance_meters: ex.distanceMeters ?? 0,
              recommended_duration_seconds: ex.durationSeconds ?? null,
            });
            break;
          case 'amrap':
            exerciseInserts.push({
              ...baseRow,
              recommended_emom_minutes: ex.emomMinutes ?? 0,
              recommended_rounds: ex.rounds ?? null,
            });
            break;
          case 'emom':
            exerciseInserts.push({
              ...baseRow,
              recommended_emom_minutes: ex.emomMinutes ?? 0,
              recommended_reps: ex.emomReps ?? 0,
            });
            break;
        }
      });

      const { error: exerciseError } = await supabase
        .from('exercises')
        .insert(exerciseInserts as never);

      if (exerciseError) throw exerciseError;

      toast.success('Workout saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['client-workouts', selectedClientId] });
      setShowTrainerWorkoutModal(false);
    } catch (error) {
      logError('Calendar.handleTrainerWorkoutSave', error);
      toast.error('Failed to save workout');
    }
  };

  const handleWorkoutSave = async (exercises: ClientLoggedExercise[]) => {
    if (!profile || !selectedDate) return;

    try {
      const cleanedExercises = exercises
        .map(ex => ({ ...ex, name: ex.name.trim() }))
        .filter(ex => ex.name.length > 0);

      if (cleanedExercises.length === 0) {
        toast.error('Please add at least one exercise');
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      let workoutId: string;
      const existingWorkout = getWorkoutForDate(selectedDate);

      if (existingWorkout) {
        workoutId = existingWorkout.id;
        await supabase
          .from('workouts')
          .update({ status: 'completed' })
          .eq('id', workoutId);
      } else {
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            client_id: profile.id,
            date: dateStr,
            status: 'completed',
          })
          .select()
          .single();

        if (workoutError) throw workoutError;
        workoutId = newWorkout.id;
      }

      // Flatten client payload into per-set entries for reps-based metrics
      // (preserves matching to planned rows). Non-reps metrics produce one
      // synthetic entry so we can insert a single actual row.
      const flatActuals: { name: string; metricType: MetricType; sets: number; reps: number; weight: number; durationSeconds?: number; distanceMeters?: number; rounds?: number; emomMinutes?: number }[] = [];
      cleanedExercises.forEach(ex => {
        if (ex.metricType === 'reps_weight' || ex.metricType === 'reps_only') {
          (ex.sets ?? []).forEach(s => flatActuals.push({
            name: ex.name, metricType: ex.metricType, sets: 1, reps: s.reps, weight: s.weight,
          }));
        } else {
          flatActuals.push({
            name: ex.name, metricType: ex.metricType, sets: 0, reps: ex.emomReps ?? 0, weight: 0,
            durationSeconds: ex.durationSeconds,
            distanceMeters: ex.distanceMeters,
            rounds: ex.rounds,
            emomMinutes: ex.emomMinutes,
          });
        }
      });

      const { error: cleanupError } = await supabase
        .from('exercises')
        .delete()
        .eq('workout_id', workoutId)
        .is('recommended_sets', null);
      if (cleanupError) throw cleanupError;

      const { data: plannedRows, error: plannedError } = await supabase
        .from('exercises')
        .select('id, exercise_name, recommended_sets, created_at')
        .eq('workout_id', workoutId)
        .not('recommended_sets', 'is', null)
        .order('created_at', { ascending: true });
      if (plannedError) throw plannedError;

      const plannedByName = new Map<string, { id: string; exercise_name: string }[]>();
      (plannedRows || []).forEach(row => {
        const name = row.exercise_name.trim();
        if (!name) return;
        const list = plannedByName.get(name) || [];
        list.push({ id: row.id, exercise_name: name });
        plannedByName.set(name, list);
      });

      const actualByName = new Map<string, typeof flatActuals>();
      flatActuals.forEach(a => {
        const list = actualByName.get(a.name) || [];
        list.push(a);
        actualByName.set(a.name, list);
      });

      const updates: { id: string; actual: typeof flatActuals[number] }[] = [];
      const inserts: Record<string, unknown>[] = [];

      const buildActualRow = (name: string, a: typeof flatActuals[number]) => ({
        workout_id: workoutId,
        exercise_name: name,
        metric_type: a.metricType,
        actual_sets: a.metricType === 'reps_weight' || a.metricType === 'reps_only' ? a.sets : null,
        actual_reps: a.metricType === 'reps_weight' || a.metricType === 'reps_only' || a.metricType === 'emom' ? a.reps : null,
        actual_weight: a.metricType === 'reps_weight' ? a.weight : null,
        actual_duration_seconds: a.durationSeconds ?? null,
        actual_distance_meters: a.distanceMeters ?? null,
        actual_rounds: a.rounds ?? null,
        actual_emom_minutes: a.emomMinutes ?? null,
      });

      for (const [name, planned] of plannedByName.entries()) {
        const actual = actualByName.get(name) || [];

        const count = Math.min(planned.length, actual.length);
        for (let i = 0; i < count; i++) {
          updates.push({ id: planned[i].id, actual: actual[i] });
        }

        for (let i = count; i < actual.length; i++) {
          inserts.push(buildActualRow(name, actual[i]));
        }

        actualByName.delete(name);
      }

      for (const [name, actual] of actualByName.entries()) {
        actual.forEach(a => inserts.push(buildActualRow(name, a)));
      }

      if (updates.length > 0) {
        const results = await Promise.all(
          updates.map(u =>
            supabase
              .from('exercises')
              .update({
                metric_type: u.actual.metricType,
                actual_sets: u.actual.metricType === 'reps_weight' || u.actual.metricType === 'reps_only' ? u.actual.sets : null,
                actual_reps: u.actual.metricType === 'reps_weight' || u.actual.metricType === 'reps_only' || u.actual.metricType === 'emom' ? u.actual.reps : null,
                actual_weight: u.actual.metricType === 'reps_weight' ? u.actual.weight : null,
                actual_duration_seconds: u.actual.durationSeconds ?? null,
                actual_distance_meters: u.actual.distanceMeters ?? null,
                actual_rounds: u.actual.rounds ?? null,
                actual_emom_minutes: u.actual.emomMinutes ?? null,
              })
              .eq('id', u.id)
          )
        );
        const updateError = results.find(r => r.error)?.error;
        if (updateError) throw updateError;
      }

      if (inserts.length > 0) {
        const { error: exerciseError } = await supabase
          .from('exercises')
          .insert(inserts as never);
        if (exerciseError) throw exerciseError;
      }

      toast.success('Workout logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowWorkoutModal(false);
      setShowClientActionSheet(false);
      promptPushPermission();
    } catch (error) {
      logError('Calendar.handleWorkoutSave', error);
      toast.error('Failed to save workout');
    }
  };

  const handleFoodSave = async (data: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    rawText: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    pendingAnalysis?: boolean;
    matchedDictionaryId?: string | null;
    quantityValue?: number | null;
    quantityUnit?: string | null;
  }) => {
    if (!selectedDate) return;
    const clientId = isTrainer ? selectedClientId : profile?.id;
    if (!clientId) return;

    try {
      const { error } = await supabase
        .from('food_logs')
        .insert({
          client_id: clientId,
          logged_date: format(selectedDate, 'yyyy-MM-dd'),
          meal_type: data.mealType,
          raw_text: data.rawText,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          pending_analysis: data.pendingAnalysis ?? false,
          matched_dictionary_id: data.matchedDictionaryId ?? null,
          quantity_value: data.quantityValue ?? null,
          quantity_unit: data.quantityUnit ?? null,
        });

      if (error) throw error;

      // NOTE: modal stays open — diary panel inside the modal will refetch.
      promptPushPermission();
    } catch (error) {
      logError('Calendar.handleFoodSave', error);
      toast.error('Failed to save food log');
    }
  };

  // Fetch existing step log when action sheet opens
  const fetchStepLog = async (date: Date) => {
    if (!profile) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('step_logs')
      .select('id, step_count')
      .eq('client_id', profile.id)
      .eq('logged_date', dateStr)
      .maybeSingle();
    
    if (!error && data) {
      setExistingStepLog(data);
    } else {
      setExistingStepLog(null);
    }
  };

  const handleStepSave = async (count: number) => {
    if (!profile || !selectedDate) return;

    setStepLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      if (existingStepLog) {
        const { error } = await supabase
          .from('step_logs')
          .update({ step_count: count })
          .eq('id', existingStepLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('step_logs')
          .insert({
            client_id: profile.id,
            logged_date: dateStr,
            step_count: count,
          });
        if (error) throw error;
      }

      toast.success('Steps logged!');
      setExistingStepLog({ id: existingStepLog?.id || '', step_count: count });
      setShowStepModal(false);
      promptPushPermission();
    } catch (error) {
      logError('Calendar.handleStepSave', error);
      toast.error('Failed to save steps');
    } finally {
      setStepLoading(false);
    }
  };

  const getSectionLabel = (section: 'past' | 'current' | 'future') => {
    switch (section) {
      case 'past':
        return 'Previous Cycle';
      case 'current':
        return 'Current Training Cycle';
      case 'future':
        return 'Upcoming';
    }
  };

  // Group dates by section
  const sections = ['past', 'current', 'future'] as const;

  // Use client workouts for trainer view, regular workouts for client view
  const displayWorkouts = isTrainer && selectedClientId ? clientWorkouts : workouts;

  // Ensure we only auto-center once per "viewer + selected client + day" combination
  const lastAutoScrollKeyRef = useRef<string | null>(null);

  const centerScrollToNode = useCallback((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const targetTop = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });
  }, []);

  // Callback ref for today's cell; when it mounts we center it in the viewport.
  const todayCellRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) return;
      if (isTrainer && !selectedClientId) return;

      const viewerKey = (selectedClientId ?? profile?.id ?? 'self').toString();
      const dayKey = format(today, 'yyyy-MM-dd');
      const scrollKey = `${viewerKey}:${dayKey}`;

      if (lastAutoScrollKeyRef.current === scrollKey) return;
      lastAutoScrollKeyRef.current = scrollKey;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          centerScrollToNode(node);
        });
      });
    },
    [isTrainer, selectedClientId, profile?.id, today, centerScrollToNode]
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-foreground">Training Calendar</h1>
          <p className="text-sm text-muted-foreground">
            {isTrainer ? 'Manage client workouts' : 'Your workout schedule'}
          </p>
        </motion.div>

        {/* Client Filter for Trainers */}
        {isTrainer && clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <ClientFilter
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
            />
          </motion.div>
        )}
      </div>

      {/* Subscription Enforcement Banner for Trainers */}
      {isTrainer && !subscriptionLoading && subscriptionReadOnly && (
        <div className="px-4 py-2">
          <SubscriptionEnforcementBanner
            reason={subscriptionReason}
            onSelectPlan={() => setShowPlanModal(true)}
          />
        </div>
      )}

      {/* Calendar Sections */}
      <div className="px-4 py-4 space-y-6">
        {/* No client selected message for trainers */}
        {isTrainer && !selectedClientId && clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Select a client above to view and manage their workouts
            </p>
          </motion.div>
        )}

        {/* No clients message for trainers */}
        {isTrainer && clients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No clients yet. Invite your first client to get started!
            </p>
            <Button
              onClick={() => {
                if (!profile?.unique_id) return;
                const inviteUrl = `${window.location.origin}/auth?trainer=${profile.unique_id}`;
                const message = `Hey! Join me on Vecto for personalized fitness coaching. Click here to sign up: ${inviteUrl}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                toast.success('Opening WhatsApp to share invite link');
              }}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Invite via WhatsApp
            </Button>
          </motion.div>
        )}

        {/* Show calendar for clients OR trainers with selected client */}
        {(!isTrainer || selectedClientId) && sections.map((section, sectionIndex) => {
          const sectionDates = allDates.filter(d => d.section === section);
          const isCurrentSection = section === 'current';
          const isPastSection = section === 'past';
          const isFutureSection = section === 'future';

          return (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  isCurrentSection ? 'bg-primary' : 
                  isPastSection ? 'bg-muted-foreground' : 'bg-border'
                }`} />
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${
                  isCurrentSection ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {getSectionLabel(section)}
                </h2>
                {isCurrentSection && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Day {Math.min(today.getDate(), 30)} of 30
                  </span>
                )}
              </div>

              {/* Month Label */}
              {(() => {
                const firstDate = sectionDates[0]?.date;
                const lastDate = sectionDates[sectionDates.length - 1]?.date;
                const startMonth = firstDate ? format(firstDate, 'MMMM yyyy') : '';
                const endMonth = lastDate ? format(lastDate, 'MMMM yyyy') : '';
                const monthLabel = startMonth === endMonth ? startMonth : `${format(firstDate!, 'MMM')} - ${format(lastDate!, 'MMM yyyy')}`;
                
                return (
                  <div className="mb-2 px-1">
                    <span className="text-lg font-bold text-foreground">
                      {monthLabel}
                    </span>
                  </div>
                );
              })()}

              {/* Dates Grid */}
              <div className={`rounded-2xl border ${
                isCurrentSection ? 'border-primary/30 bg-primary/5' : 
                isPastSection ? 'border-border/50 bg-muted/30' : 'border-border bg-card/50'
              } p-3`}>
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Weekday Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="text-center text-xs text-muted-foreground font-semibold py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty spacer cells for day-of-week offset */}
                  {Array.from({ length: sectionDates[0]?.date.getDay() ?? 0 }).map((_, i) => (
                    <div key={`spacer-${i}`} />
                  ))}
                  
                  {/* Date Cells */}
                  {sectionDates.map(({ date }) => {
                    const workout = getWorkoutForDate(date, displayWorkouts);
                    const dayMark = getDayMarkForDate(date);
                    const isToday = isSameDay(date, today);
                    const isPast = isBefore(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    // Boundary-only model:
                    // priority: today > day mark > completed workout > default
                    const markBorder = dayMark ? getDayMarkBorder(dayMark.mark_type) : null;
                    const statusBorder = workout ? getStatusBorder(workout.status) : null;

                    let cellClass: string;
                    if (isToday) {
                      cellClass = 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 ring-offset-background';
                    } else if (isSelected) {
                      cellClass = 'bg-secondary border-primary/50 ring-2 ring-primary/50';
                    } else if (markBorder) {
                      cellClass = `bg-transparent text-foreground ${markBorder}`;
                    } else if (statusBorder) {
                      cellClass = `bg-transparent text-foreground ${statusBorder}`;
                    } else if (isPast && section === 'past') {
                      cellClass = 'bg-muted/30 text-muted-foreground border-transparent';
                    } else {
                      cellClass = 'bg-card hover:bg-secondary text-foreground border-transparent hover:border-border';
                    }

                    return (
                      <motion.button
                        key={date.toISOString()}
                        ref={isToday ? todayCellRef : undefined}
                        onClick={() => handleDateClick(date)}
                        whileTap={{ scale: 0.9 }}
                        className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-200 text-sm font-medium border-2 ${cellClass}`}
                      >
                        <span className={isToday ? 'font-bold' : ''}>
                          {format(date, 'd')}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Status Legend (boundary swatches only) */}
              {isCurrentSection && (
                <div className="flex flex-wrap gap-3 mt-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-primary border-2 border-primary" />
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-transparent border-2 border-success" />
                    <span className="text-xs text-muted-foreground">Logged</span>
                  </div>
                  {(isTrainer || dayMarks.length > 0) && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-transparent border-2 border-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">Holiday</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-transparent border-2 border-warning" />
                        <span className="text-xs text-muted-foreground">Trainer Leave</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-transparent border-2 border-destructive" />
                        <span className="text-xs text-muted-foreground">Client Leave</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trainer Action Sheet */}
      {isTrainer && (
        <Sheet open={showTrainerActionSheet} onOpenChange={setShowTrainerActionSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {selectedDate && (
                  <span className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>
            
            {(() => {
              const canMark = selectedDate ? isDateTodayOrFuture(selectedDate) : false;
              const existingMark = selectedDate ? getDayMarkForDate(selectedDate) : null;

              return (
                <div className="space-y-4">
                  {subscriptionReadOnly && (
                    <SubscriptionEnforcementBanner
                      reason={subscriptionReason}
                      onSelectPlan={() => setShowPlanModal(true)}
                      compact
                    />
                  )}

                  {/* Existing day mark indicator */}
                  {existingMark && (
                    <div className={`p-3 rounded-xl border ${
                      existingMark.mark_type === 'client_leave' 
                        ? 'bg-destructive/10 border-destructive/30' 
                        : 'bg-muted border-muted-foreground/30'
                    }`}>
                      <p className="text-sm font-medium text-foreground">
                        {existingMark.mark_type === 'trainer_leave' && '🏖️ Trainer Leave marked'}
                        {existingMark.mark_type === 'client_leave' && '🚫 Client Leave marked'}
                        {existingMark.mark_type === 'holiday' && '🎉 Holiday marked'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tap the same button below to remove this mark.
                      </p>
                    </div>
                  )}

                  {/* Primary Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTrainerLogWorkout}
                      disabled={subscriptionReadOnly}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground text-sm">Log Workout</p>
                        <p className="text-xs text-muted-foreground">Plan exercises</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTrainerLogFood}
                      disabled={subscriptionReadOnly}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                        <Utensils className="w-6 h-6 text-success" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground text-sm">Log Food</p>
                        <p className="text-xs text-muted-foreground">Track nutrition</p>
                      </div>
                    </motion.button>
                  </div>

                  {/* Day Mark Actions - smaller buttons */}
                  {canMark && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Day Status</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={existingMark?.mark_type === 'trainer_leave' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleDayMark('trainer_leave')}
                           disabled={dayMarkLoading || subscriptionReadOnly}
                          className={`text-xs h-10 ${
                            existingMark?.mark_type === 'trainer_leave'
                              ? 'bg-muted-foreground/50 hover:bg-muted-foreground/60 text-foreground'
                              : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <CalendarOff className="w-3.5 h-3.5 mr-1" />
                          TL
                        </Button>
                        <Button
                          variant={existingMark?.mark_type === 'client_leave' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleDayMark('client_leave')}
                           disabled={dayMarkLoading || subscriptionReadOnly}
                          className={`text-xs h-10 ${
                            existingMark?.mark_type !== 'client_leave'
                              ? 'border-destructive/50 text-destructive hover:bg-destructive/10'
                              : ''
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          CL
                        </Button>
                        <Button
                          variant={existingMark?.mark_type === 'holiday' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleDayMark('holiday')}
                           disabled={dayMarkLoading || subscriptionReadOnly}
                          className={`text-xs h-10 ${
                            existingMark?.mark_type === 'holiday'
                              ? 'bg-muted-foreground/50 hover:bg-muted-foreground/60 text-foreground'
                              : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <Palmtree className="w-3.5 h-3.5 mr-1" />
                          HL
                        </Button>
                      </div>
                      {subscriptionReadOnly && (
                        <p className="text-[10px] text-muted-foreground">
                          Select a plan to enable TL, CL, and HL day marks.
                        </p>
                      )}
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        <p><span className="font-medium">TL</span> = Trainer Leave (session shifts ahead)</p>
                        <p><span className="font-medium">CL</span> = Client Leave (session consumed)</p>
                        <p><span className="font-medium">HL</span> = Holiday (no impact)</p>
                      </div>
                    </div>
                  )}

                  {/* Past date notice for day marks */}
                  {!canMark && (
                    <div className="p-3 rounded-xl bg-muted border border-border">
                      <p className="text-xs text-muted-foreground">
                        Day marks can only be set for today or future dates.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </SheetContent>
        </Sheet>
      )}

      {/* Client Action Sheet - Log Workout or Food */}
      {!isTrainer && (
        <Sheet open={showClientActionSheet} onOpenChange={setShowClientActionSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {selectedDate && (
                  <span className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </span>
                )}
              </SheetTitle>
            </SheetHeader>
            
            {(() => {
              const workout = selectedDate ? getWorkoutForDate(selectedDate) : null;
              const dayMark = selectedDate ? getDayMarkForDate(selectedDate) : null;
              const canEdit = selectedDate ? isDateEditable(selectedDate) : false;
              
              return (
                <div className="space-y-4">
                  {/* Day mark notice for clients */}
                  {dayMark && (
                    <div className={`p-4 rounded-xl border ${
                      dayMark.mark_type === 'client_leave' 
                        ? 'bg-destructive/10 border-destructive/30' 
                        : 'bg-muted border-muted-foreground/30'
                    }`}>
                      <p className="font-semibold text-foreground text-sm">
                        {dayMark.mark_type === 'trainer_leave' && '🏖️ Trainer Leave'}
                        {dayMark.mark_type === 'client_leave' && '🚫 Client Leave'}
                        {dayMark.mark_type === 'holiday' && '🎉 Holiday'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dayMark.mark_type === 'trainer_leave' && 'Your trainer is on leave. Session validity extended.'}
                        {dayMark.mark_type === 'client_leave' && 'Marked as your leave. Session counted.'}
                        {dayMark.mark_type === 'holiday' && 'Holiday. No session scheduled.'}
                      </p>
                    </div>
                  )}

                  {/* View-Only Notice for old dates */}
                  {!canEdit && (
                    <div className="p-4 rounded-xl bg-muted border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">View Only</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Logging is only available for the last 7 days. This date is view-only.
                      </p>
                    </div>
                  )}

                  {/* Workout Status Card */}
                  {workout && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">Assigned Workout</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workout.status === 'completed' 
                            ? 'bg-success/20 text-success' 
                            : workout.status === 'skipped'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-secondary text-muted-foreground'
                        }`}>
                          {workout.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {canEdit ? 'Log your progress for this workout' : 'View your workout details'}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons - Edit mode */}
                  {canEdit && (
                    <div className="grid grid-cols-3 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowWorkoutModal(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Dumbbell className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-sm">Log Workout</p>
                          <p className="text-xs text-muted-foreground">Track exercises</p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowFoodModal(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                          <Utensils className="w-6 h-6 text-success" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-sm">Log Food</p>
                          <p className="text-xs text-muted-foreground">Track nutrition</p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowStepModal(true)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Footprints className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground text-sm">Log Steps</p>
                          <p className="text-xs text-muted-foreground">{existingStepLog ? `${existingStepLog.step_count} steps` : 'Track steps'}</p>
                        </div>
                      </motion.button>
                    </div>
                  )}

                  {/* View-Only Buttons */}
                  {!canEdit && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 border-2 border-border opacity-60">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Dumbbell className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-muted-foreground text-sm">Workout</p>
                          <p className="text-xs text-muted-foreground">{workout ? workout.status : 'No data'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 border-2 border-border opacity-60">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Utensils className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-muted-foreground text-sm">Food</p>
                          <p className="text-xs text-muted-foreground">View only</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 border-2 border-border opacity-60">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Footprints className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-muted-foreground text-sm">Steps</p>
                          <p className="text-xs text-muted-foreground">View only</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Status Update - Only show for editable dates */}
                  {canEdit && workout && workout.status === 'pending' && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Quick status update:</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await supabase
                              .from('workouts')
                              .update({ status: 'skipped' })
                              .eq('id', workout.id);
                            queryClient.invalidateQueries({ queryKey: ['workouts'] });
                            setShowClientActionSheet(false);
                            toast.success('Marked as missed');
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Missed
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-success/50 text-success hover:bg-success/10"
                          onClick={async () => {
                            await supabase
                              .from('workouts')
                              .update({ status: 'completed' })
                              .eq('id', workout.id);
                            queryClient.invalidateQueries({ queryKey: ['workouts'] });
                            setShowClientActionSheet(false);
                            toast.success('Marked as done!');
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </SheetContent>
        </Sheet>
      )}

      {/* Client Workout Log Modal */}
      <ClientWorkoutLogModal
        open={showWorkoutModal}
        onOpenChange={setShowWorkoutModal}
        onSave={handleWorkoutSave}
        date={selectedDate || undefined}
        trainerExercises={clientTrainerExercises}
      />

      {/* Trainer Workout Log Modal */}
      <TrainerWorkoutLogModal
        open={showTrainerWorkoutModal}
        onOpenChange={setShowTrainerWorkoutModal}
        onSave={handleTrainerWorkoutSave}
        date={selectedDate || undefined}
        existingExercises={existingExercises}
        clientHasLogged={clientHasLogged}
        onOpenPlanSelection={() => setShowPlanModal(true)}
      />

      {/* Food Log Modal */}
      <FoodLogModal
        open={showFoodModal}
        onOpenChange={setShowFoodModal}
        onSave={handleFoodSave}
        clientId={isTrainer ? selectedClientId : profile?.id ?? null}
        loggedDate={selectedDate ?? undefined}
        isReadOnly={isTrainer}
      />

      {/* Step Log Modal */}
      <StepLogModal
        open={showStepModal}
        onOpenChange={setShowStepModal}
        date={selectedDate}
        existingStepLog={existingStepLog}
        onSave={handleStepSave}
        loading={stepLoading}
      />

      {/* Plan Selection Modal for subscription renewal */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handleSelectPlan}
        isRenewal={status.hasSubscription}
        currentPlan={status.subscription?.plan_type}
      />
    </div>
  );
};

export default Calendar;
