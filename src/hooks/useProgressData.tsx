import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { logError } from '@/lib/errorUtils';

export interface DailyProgress {
  date: string;
  intake: number | null;
  burnt: number | null;
  bmr: number;
  totalExpenditure: number;
  netDeficit: number;
  weight: number | null;
  steps: number | null;
  stepCalories: number;
  isMissed: boolean;
}

interface UseProgressDataResult {
  data: DailyProgress[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProgressData = (
  clientId: string | null,
  dateRange: number = 30
): UseProgressDataResult => {
  const { profile } = useProfile();
  const [data, setData] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetClientId = clientId || profile?.id;

  const fetchProgressData = async () => {
    if (!targetClientId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      // TW-028: "View last N days" must produce exactly N days, including today.
      // Previously subDays(endDate, dateRange) produced N+1 days (off-by-one).
      const startDate = subDays(endDate, Math.max(0, dateRange - 1));
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [profileRes, foodLogsRes, workoutsRes, weightLogsRes, stepLogsRes, bmrLogsRes, bmrPriorRes, weightPriorRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('bmr, weight_kg')
          .eq('id', targetClientId)
          .single(),
        supabase
          .from('food_logs')
          .select('logged_date, calories')
          .eq('client_id', targetClientId)
          .gte('logged_date', startDateStr)
          .lte('logged_date', endDateStr),
        supabase
          .from('workouts')
          .select('date, calories_burnt')
          .eq('client_id', targetClientId)
          .gte('date', startDateStr)
          .lte('date', endDateStr),
        supabase
          .from('weight_logs')
          .select('logged_date, weight_kg')
          .eq('client_id', targetClientId)
          .gte('logged_date', startDateStr)
          .lte('logged_date', endDateStr)
          .order('logged_date', { ascending: true }),
        supabase
          .from('step_logs')
          .select('logged_date, step_count, estimated_calories')
          .eq('client_id', targetClientId)
          .gte('logged_date', startDateStr)
          .lte('logged_date', endDateStr),
        // TW-028: BMR rows whose effective_date falls inside the window.
        supabase
          .from('bmr_logs')
          .select('bmr, effective_date')
          .eq('client_id', targetClientId)
          .gte('effective_date', startDateStr)
          .lte('effective_date', endDateStr)
          .order('effective_date', { ascending: true }),
        // TW-028: latest BMR effective strictly BEFORE the window — needed to seed day 1.
        supabase
          .from('bmr_logs')
          .select('bmr, effective_date')
          .eq('client_id', targetClientId)
          .lt('effective_date', startDateStr)
          .order('effective_date', { ascending: false })
          .limit(1),
        // Weight carry-forward: latest weight log strictly BEFORE the window —
        // needed to seed day 1 with the most recent prior weight.
        supabase
          .from('weight_logs')
          .select('weight_kg, logged_date')
          .eq('client_id', targetClientId)
          .lt('logged_date', startDateStr)
          .order('logged_date', { ascending: false })
          .limit(1),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (foodLogsRes.error) throw foodLogsRes.error;
      if (workoutsRes.error) throw workoutsRes.error;
      if (weightLogsRes.error) throw weightLogsRes.error;
      if (stepLogsRes.error) throw stepLogsRes.error;
      if (bmrLogsRes.error) throw bmrLogsRes.error;
      if (bmrPriorRes.error) throw bmrPriorRes.error;
      if (weightPriorRes.error) throw weightPriorRes.error;

      // TW-028: Build a per-day historical BMR resolver.
      // - Seed with the latest BMR row strictly before the window (or 0 if none).
      // - As we walk days ascending, advance the "current BMR" pointer whenever
      //   an effective_date matches that day.
      // This guarantees that updating today's BMR never rewrites past days.
      const bmrChanges = (bmrLogsRes.data ?? []).map((r) => ({
        date: r.effective_date as string,
        bmr: Number(r.bmr) || 0,
      }));
      const seedBmr = Number(bmrPriorRes.data?.[0]?.bmr ?? 0);
      const bmrChangeMap: Record<string, number> = {};
      bmrChanges.forEach((c) => { bmrChangeMap[c.date] = c.bmr; });

      // Group food logs by date
      const foodByDate: Record<string, number> = {};
      foodLogsRes.data?.forEach((log) => {
        const date = log.logged_date;
        foodByDate[date] = (foodByDate[date] || 0) + (log.calories || 0);
      });

      // Group workouts by date
      const workoutsByDate: Record<string, number> = {};
      workoutsRes.data?.forEach((workout) => {
        const date = workout.date;
        workoutsByDate[date] = (workoutsByDate[date] || 0) + (workout.calories_burnt || 0);
      });

      // Map weight logs by date
      const weightByDate: Record<string, number> = {};
      weightLogsRes.data?.forEach((log) => {
        weightByDate[log.logged_date] = Number(log.weight_kg);
      });

      // Map step logs by date
      const stepsByDate: Record<string, { steps: number; calories: number }> = {};
      stepLogsRes.data?.forEach((log) => {
        stepsByDate[log.logged_date] = {
          steps: log.step_count,
          calories: log.estimated_calories || Math.round(log.step_count * 0.04),
        };
      });

      // Generate daily progress data
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      let currentBmr = seedBmr;
      // Weight carry-forward: seed with latest log before window (or null if
      // the user has never logged a weight). Days before the first-ever log
      // remain null — no fabricated history.
      const seedWeightRaw = weightPriorRes.data?.[0]?.weight_kg;
      let currentWeight: number | null =
        seedWeightRaw !== undefined && seedWeightRaw !== null ? Number(seedWeightRaw) : null;
      const progressData: DailyProgress[] = days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        // Advance to a new BMR if one became effective on this day.
        if (bmrChangeMap[dateStr] !== undefined) {
          currentBmr = bmrChangeMap[dateStr];
        }
        const bmr = currentBmr;
        const intake = foodByDate[dateStr] ?? null;
        const burnt = workoutsByDate[dateStr] ?? null;
        // Carry-forward: if a fresh weight was logged today, advance the
        // pointer; otherwise hold the previous value (which may still be
        // null if no weight has ever been logged up to this day).
        if (weightByDate[dateStr] !== undefined) {
          currentWeight = weightByDate[dateStr];
        }
        const weight = currentWeight;
        const stepData = stepsByDate[dateStr];
        const steps = stepData?.steps ?? null;
        const stepCalories = stepData?.calories ?? 0;
        
        const totalExpenditure = bmr + (burnt || 0) + stepCalories;
        const netDeficit = totalExpenditure - (intake || 0);
        const isMissed = intake === null && burnt === null && steps === null;

        return {
          date: dateStr,
          intake,
          burnt,
          bmr,
          totalExpenditure,
          netDeficit,
          weight,
          steps,
          stepCalories,
          isMissed,
        };
      });

      setData(progressData);
    } catch (err) {
      logError('useProgressData.fetchProgressData', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [targetClientId, dateRange]);

  return {
    data,
    loading,
    error,
    refetch: fetchProgressData,
  };
};
