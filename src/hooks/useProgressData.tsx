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
      const startDate = subDays(endDate, dateRange);
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [profileRes, foodLogsRes, workoutsRes, weightLogsRes] = await Promise.all([
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
      ]);

      if (profileRes.error) throw profileRes.error;
      if (foodLogsRes.error) throw foodLogsRes.error;
      if (workoutsRes.error) throw workoutsRes.error;
      if (weightLogsRes.error) throw weightLogsRes.error;

      // Default BMR estimation if not set (Harris-Benedict rough estimate)
      const bmr = profileRes.data?.bmr || 1800;

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

      // Generate daily progress data
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const progressData: DailyProgress[] = days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const intake = foodByDate[dateStr] ?? null;
        const burnt = workoutsByDate[dateStr] ?? null;
        const weight = weightByDate[dateStr] ?? null;
        
        const totalExpenditure = bmr + (burnt || 0);
        const netDeficit = totalExpenditure - (intake || 0);
        const isMissed = intake === null && burnt === null;

        return {
          date: dateStr,
          intake,
          burnt,
          bmr,
          totalExpenditure,
          netDeficit,
          weight,
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
