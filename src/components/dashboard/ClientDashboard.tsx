import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, Check, Clock, Flame, Trophy, ChevronRight, Footprints } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { WorkoutLogModal } from '@/components/modals/WorkoutLogModal';
import { FoodLogModal } from '@/components/modals/FoodLogModal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';

export const ClientDashboard = () => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [stepCount, setStepCount] = useState('');
  const [stepLoading, setStepLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's workout
  const { data: todayWorkout } = useQuery({
    queryKey: ['today-workout', profile?.id, today],
    queryFn: async () => {
      if (!profile) return null;

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Fetch today's food logs
  const { data: todayFoodLogs = [] } = useQuery({
    queryKey: ['today-food', profile?.id, today],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('client_id', profile.id)
        .eq('logged_date', today);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // Fetch today's step log
  const { data: todayStepLog } = useQuery({
    queryKey: ['today-steps', profile?.id, today],
    queryFn: async () => {
      if (!profile) return null;
      const { data, error } = await supabase
        .from('step_logs')
        .select('*')
        .eq('client_id', profile.id)
        .eq('logged_date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  // Calculate totals
  const totalCalories = todayFoodLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = todayFoodLogs.reduce((sum, log) => sum + (log.protein || 0), 0);

  const workoutComplete = todayWorkout?.status === 'completed';
  const hasFoodLogs = todayFoodLogs.length > 0;
  const hasSteps = !!todayStepLog;

  const handleStepSave = async () => {
    if (!profile) return;
    const count = parseInt(stepCount, 10);
    if (isNaN(count) || count < 0) {
      toast.error('Please enter a valid step count');
      return;
    }
    setStepLoading(true);
    try {
      if (todayStepLog) {
        const { error } = await supabase
          .from('step_logs')
          .update({ step_count: count })
          .eq('id', todayStepLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('step_logs')
          .insert({ client_id: profile.id, logged_date: today, step_count: count });
        if (error) throw error;
      }
      toast.success('Steps logged!');
      queryClient.invalidateQueries({ queryKey: ['today-steps'] });
      setStepCount('');
    } catch (error) {
      logError('ClientDashboard.handleStepSave', error);
      toast.error('Failed to save steps');
    } finally {
      setStepLoading(false);
    }
  };

  const handleWorkoutSave = async (exercises: { name: string; sets: number; reps: number; weight: number }[]) => {
    if (!profile) return;

    try {
      let workoutId: string;

      if (todayWorkout) {
        workoutId = todayWorkout.id;
        await supabase
          .from('workouts')
          .update({ status: 'completed' })
          .eq('id', workoutId);
      } else {
        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            client_id: profile.id,
            date: today,
            status: 'completed'
          })
          .select()
          .single();

        if (workoutError) throw workoutError;
        workoutId = newWorkout.id;
      }

      const exerciseInserts = exercises.map(ex => ({
        workout_id: workoutId,
        exercise_name: ex.name,
        actual_sets: ex.sets,
        actual_reps: ex.reps,
        actual_weight: ex.weight
      }));

      const { error: exerciseError } = await supabase
        .from('exercises')
        .insert(exerciseInserts);

      if (exerciseError) throw exerciseError;

      toast.success('Workout logged!');
      queryClient.invalidateQueries({ queryKey: ['today-workout'] });
      setShowWorkoutModal(false);
    } catch (error) {
      logError('ClientDashboard.handleWorkoutSave', error);
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
  }) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('food_logs')
        .insert({
          client_id: profile.id,
          logged_date: today,
          meal_type: data.mealType,
          raw_text: data.rawText,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        });

      if (error) throw error;

      toast.success('Food logged!');
      queryClient.invalidateQueries({ queryKey: ['today-food'] });
      setShowFoodModal(false);
    } catch (error) {
      logError('ClientDashboard.handleFoodSave', error);
      toast.error('Failed to save food');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground text-sm font-medium mb-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Daily Checklist
          </h1>
        </motion.div>
      </div>

      {/* Progress Ring */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-8 py-6"
        >
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(workoutComplete && hasFoodLogs ? 100 : workoutComplete || hasFoodLogs ? 50 : 0) * 3.52} 352`}
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {(workoutComplete ? 1 : 0) + (hasFoodLogs ? 1 : 0)}/2
              </span>
              <span className="text-xs text-muted-foreground">Tasks</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${workoutComplete ? 'bg-success' : 'bg-muted'}`} />
              <span className="text-sm text-muted-foreground">Workout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${hasFoodLogs ? 'bg-success' : 'bg-muted'}`} />
              <span className="text-sm text-muted-foreground">Nutrition</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Tasks */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Today's Tasks
        </h2>

        <div className="space-y-3">
          {/* Workout Task */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className={`p-4 rounded-2xl border-2 transition-colors ${
              workoutComplete
                ? 'bg-success/5 border-success/30'
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  workoutComplete ? 'bg-success/20' : 'bg-primary/20'
                }`}>
                  {workoutComplete ? (
                    <Check className="w-6 h-6 text-success" />
                  ) : (
                    <Dumbbell className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {workoutComplete ? 'Workout Complete!' : 'Log Your Workout'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayWorkout 
                      ? `Status: ${todayWorkout.status}`
                      : 'No workout logged yet'}
                  </p>
                </div>
              </div>
              {workoutComplete && (
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-4 h-4 text-success-foreground" />
                </div>
              )}
            </div>
            
            {!workoutComplete && (
              <Button 
                className="w-full"
                onClick={() => setShowWorkoutModal(true)}
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Log Workout
              </Button>
            )}
          </motion.div>

          {/* Food Task */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-2xl border-2 transition-colors ${
              hasFoodLogs
                ? 'bg-success/5 border-success/30'
                : 'bg-card border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  hasFoodLogs ? 'bg-success/20' : 'bg-primary/20'
                }`}>
                  {hasFoodLogs ? (
                    <Check className="w-6 h-6 text-success" />
                  ) : (
                    <Utensils className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {hasFoodLogs ? 'Nutrition Logged!' : 'Log Your Meals'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasFoodLogs 
                      ? `${todayFoodLogs.length} meal${todayFoodLogs.length > 1 ? 's' : ''} logged`
                      : 'No meals logged yet'}
                  </p>
                </div>
              </div>
              {hasFoodLogs && (
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-4 h-4 text-success-foreground" />
                </div>
              )}
            </div>

            {/* Nutrition Summary */}
            {hasFoodLogs && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-background text-center">
                  <p className="text-lg font-bold text-primary">{totalCalories}</p>
                  <p className="text-xs text-muted-foreground">Calories</p>
                </div>
                <div className="p-2 rounded-lg bg-background text-center">
                  <p className="text-lg font-bold text-foreground">{totalProtein}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full"
              variant={hasFoodLogs ? "outline" : "default"}
              onClick={() => setShowFoodModal(true)}
            >
              <Utensils className="w-4 h-4 mr-2" />
              {hasFoodLogs ? 'Add Another Meal' : 'Log Food'}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Today's Stats
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-2xl p-4 text-center border border-border">
            <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border">
            <Flame className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalCalories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {(workoutComplete ? 1 : 0) + (hasFoodLogs ? 1 : 0)}
            </p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </div>
        </motion.div>
      </div>

      {/* Workout Modal */}
      <WorkoutLogModal
        open={showWorkoutModal}
        onOpenChange={setShowWorkoutModal}
        onSave={handleWorkoutSave}
        date={new Date()}
      />

      {/* Food Modal */}
      <FoodLogModal
        open={showFoodModal}
        onOpenChange={setShowFoodModal}
        onSave={handleFoodSave}
      />
    </div>
  );
};
