import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Check, Clock, X, AlertCircle, Utensils, UserPlus, Share2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClientWorkoutLogModal } from '@/components/modals/ClientWorkoutLogModal';
import { TrainerWorkoutLogModal } from '@/components/modals/TrainerWorkoutLogModal';
import { FoodLogModal } from '@/components/modals/FoodLogModal';
import { ClientFilter } from '@/components/calendar/ClientFilter';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';

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
  recommended_sets: number | null;
  recommended_reps: number | null;
  recommended_weight: number | null;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
}

interface Client {
  id: string;
  unique_id: string;
  full_name?: string | null;
}

const Calendar = () => {
  const { profile, isTrainer } = useProfile();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [showClientActionSheet, setShowClientActionSheet] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showTrainerWorkoutModal, setShowTrainerWorkoutModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [existingExercises, setExistingExercises] = useState<{ name: string; sets: { weight: number; reps: number }[] }[]>([]);
  const [clientHasLogged, setClientHasLogged] = useState(false);
  const [clientTrainerExercises, setClientTrainerExercises] = useState<{ name: string; sets: { weight: number; reps: number }[] }[]>([]);

  // Calculate cycle dates - cycle starts from when client joined trainer or account creation
  const cycleStartDate = useMemo(() => {
    const today = new Date();
    return startOfDay(subDays(today, today.getDate() - 1));
  }, []);

  const today = startOfDay(new Date());
  const currentCycleStart = cycleStartDate;
  const currentCycleEnd = addDays(currentCycleStart, 29);
  const previousCycleStart = subDays(currentCycleStart, 30);
  const previousCycleEnd = subDays(currentCycleStart, 1);

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
      
      // Use secure RPC that returns only non-sensitive client data
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

  // Generate all dates to display (previous cycle + current cycle + future)
  const allDates = useMemo(() => {
    const dates: { date: Date; section: 'past' | 'current' | 'future' }[] = [];
    
    // Previous cycle (30 days)
    for (let i = 0; i < 30; i++) {
      dates.push({
        date: addDays(previousCycleStart, i),
        section: 'past'
      });
    }
    
    // Current cycle (30 days)
    for (let i = 0; i < 30; i++) {
      dates.push({
        date: addDays(currentCycleStart, i),
        section: 'current'
      });
    }
    
    // Future (next 30 days after current cycle)
    for (let i = 1; i <= 30; i++) {
      dates.push({
        date: addDays(currentCycleEnd, i),
        section: 'future'
      });
    }
    
    return dates;
  }, [previousCycleStart, currentCycleStart, currentCycleEnd]);

  const getWorkoutForDate = (date: Date, workoutList: Workout[] = workouts) => {
    return workoutList.find(w => isSameDay(new Date(w.date), date));
  };

  const getStatusStyles = (status?: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <Check className="w-3.5 h-3.5" />,
          bg: 'bg-success',
          text: 'text-success-foreground',
          ring: 'ring-success/50',
          cellBg: 'bg-success/20 border-success/40',
        };
      case 'skipped':
        return {
          icon: <X className="w-3.5 h-3.5" />,
          bg: 'bg-destructive',
          text: 'text-destructive-foreground',
          ring: 'ring-destructive/50',
          cellBg: 'bg-destructive/20 border-destructive/40',
        };
      case 'pending':
        return {
          icon: <Dumbbell className="w-3 h-3" />,
          bg: 'bg-primary/80',
          text: 'text-primary-foreground',
          ring: 'ring-primary/30',
          cellBg: 'border-primary/30',
        };
      default:
        return null;
    }
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    
    if (isTrainer) {
      if (!selectedClientId) {
        toast.error('Please select a client first');
        return;
      }
      
      // Fetch existing exercises for this date
      const workout = getWorkoutForDate(date, clientWorkouts);
      if (workout) {
        const { data: exercises, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workout.id);
        
        if (!error && exercises) {
          // Check if client has logged actual values
          const hasActualValues = exercises.some(ex => 
            ex.actual_sets !== null || ex.actual_reps !== null || ex.actual_weight !== null
          );
          setClientHasLogged(hasActualValues);
          
          // Group exercises by name with their sets (only trainer-planned sets)
          const exerciseMap = new Map<string, { weight: number; reps: number }[]>();
          exercises.forEach(ex => {
            const name = ex.exercise_name.trim();
            const isPlannedSet =
              ex.recommended_sets !== null ||
              ex.recommended_reps !== null ||
              ex.recommended_weight !== null;

            if (!name || !isPlannedSet) return;

            const sets = exerciseMap.get(name) || [];
            sets.push({
              weight: ex.recommended_weight ?? 0,
              reps: ex.recommended_reps ?? 0,
            });
            exerciseMap.set(name, sets);
          });
          
          setExistingExercises(
            Array.from(exerciseMap.entries()).map(([name, sets]) => ({ name, sets }))
          );
        }
      } else {
        setExistingExercises([]);
        setClientHasLogged(false);
      }
      
      setShowTrainerWorkoutModal(true);
    } else {
      // Client view - fetch trainer-assigned exercises for this date
      const workout = getWorkoutForDate(date);
      if (workout) {
        const { data: exercises, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workout.id);
        
        if (!error && exercises) {
          // Group exercises by name with their recommended sets (ignore client-only logged rows)
          const exerciseMap = new Map<string, { weight: number; reps: number }[]>();
          exercises.forEach(ex => {
            const name = ex.exercise_name.trim();
            const isPlannedSet =
              ex.recommended_sets !== null ||
              ex.recommended_reps !== null ||
              ex.recommended_weight !== null;

            if (!name || !isPlannedSet) return;

            const sets = exerciseMap.get(name) || [];
            sets.push({
              weight: ex.recommended_weight ?? 0,
              reps: ex.recommended_reps ?? 0,
            });
            exerciseMap.set(name, sets);
          });
          
          setClientTrainerExercises(
            Array.from(exerciseMap.entries()).map(([name, sets]) => ({ name, sets }))
          );
        } else {
          setClientTrainerExercises([]);
        }
      } else {
        setClientTrainerExercises([]);
      }
      
      setShowClientActionSheet(true);
    }
  };

  const handleTrainerWorkoutSave = async (exercises: { name: string; sets: { weight: number; reps: number }[] }[]) => {
    if (!selectedClientId || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Check if workout exists for this date
      const existingWorkout = getWorkoutForDate(selectedDate, clientWorkouts);
      let workoutId: string;
      
      if (existingWorkout) {
        workoutId = existingWorkout.id;
        
        // Delete existing exercises for this workout
        await supabase
          .from('exercises')
          .delete()
          .eq('workout_id', workoutId);
      } else {
        // Create new workout
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

      // Insert exercises with recommended values (each set as a separate row)
      const normalizedExercises = exercises
        .map(ex => ({ ...ex, name: ex.name.trim() }))
        .filter(ex => ex.name.length > 0);

      const exerciseInserts = normalizedExercises.flatMap(ex =>
        ex.sets.map(set => ({
          workout_id: workoutId,
          exercise_name: ex.name,
          recommended_sets: 1, // Each row represents one set
          recommended_reps: set.reps,
          recommended_weight: set.weight,
        }))
      );

      const { error: exerciseError } = await supabase
        .from('exercises')
        .insert(exerciseInserts);

      if (exerciseError) throw exerciseError;

      toast.success('Workout saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['client-workouts', selectedClientId] });
      setShowTrainerWorkoutModal(false);
    } catch (error) {
      logError('Calendar.handleTrainerWorkoutSave', error);
      toast.error('Failed to save workout');
    }
  };

  const handleWorkoutSave = async (exercises: { name: string; sets: number; reps: number; weight: number }[]) => {
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

      // Remove any previous client-only log rows for this workout (these caused duplicate/blank sets in UI)
      const { error: cleanupError } = await supabase
        .from('exercises')
        .delete()
        .eq('workout_id', workoutId)
        .is('recommended_sets', null);
      if (cleanupError) throw cleanupError;

      // Fetch trainer-planned rows (if any) so we can update them with actual values instead of inserting duplicates
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

      const actualByName = new Map<string, { sets: number; reps: number; weight: number }[]>();
      cleanedExercises.forEach(ex => {
        const list = actualByName.get(ex.name) || [];
        list.push({ sets: ex.sets, reps: ex.reps, weight: ex.weight });
        actualByName.set(ex.name, list);
      });

      const updates: { id: string; sets: number; reps: number; weight: number }[] = [];
      const inserts: { workout_id: string; exercise_name: string; actual_sets: number; actual_reps: number; actual_weight: number }[] = [];

      // Update planned rows first (best UX: client fills in the trainer plan)
      for (const [name, planned] of plannedByName.entries()) {
        const actual = actualByName.get(name) || [];

        const count = Math.min(planned.length, actual.length);
        for (let i = 0; i < count; i++) {
          updates.push({ id: planned[i].id, ...actual[i] });
        }

        // Extra actual sets beyond the plan become additional rows
        for (let i = count; i < actual.length; i++) {
          inserts.push({
            workout_id: workoutId,
            exercise_name: name,
            actual_sets: actual[i].sets,
            actual_reps: actual[i].reps,
            actual_weight: actual[i].weight,
          });
        }

        actualByName.delete(name);
      }

      // Any remaining exercises were client-added (no trainer plan) — insert them
      for (const [name, actual] of actualByName.entries()) {
        actual.forEach(set => {
          inserts.push({
            workout_id: workoutId,
            exercise_name: name,
            actual_sets: set.sets,
            actual_reps: set.reps,
            actual_weight: set.weight,
          });
        });
      }

      // Apply updates
      if (updates.length > 0) {
        const results = await Promise.all(
          updates.map(u =>
            supabase
              .from('exercises')
              .update({
                actual_sets: u.sets,
                actual_reps: u.reps,
                actual_weight: u.weight,
              })
              .eq('id', u.id)
          )
        );
        const updateError = results.find(r => r.error)?.error;
        if (updateError) throw updateError;
      }

      // Insert extras/client-only rows
      if (inserts.length > 0) {
        const { error: exerciseError } = await supabase
          .from('exercises')
          .insert(inserts);
        if (exerciseError) throw exerciseError;
      }

      toast.success('Workout logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      setShowWorkoutModal(false);
      setShowClientActionSheet(false);
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
  }) => {
    if (!profile || !selectedDate) return;

    try {
      const { error } = await supabase
        .from('food_logs')
        .insert({
          client_id: profile.id,
          logged_date: format(selectedDate, 'yyyy-MM-dd'),
          meal_type: data.mealType,
          raw_text: data.rawText,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        });

      if (error) throw error;

      toast.success('Food logged successfully!');
      setShowFoodModal(false);
      setShowClientActionSheet(false);
    } catch (error) {
      logError('Calendar.handleFoodSave', error);
      toast.error('Failed to save food log');
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

  // Ref for current section to auto-scroll
  const currentSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current training cycle on mount
  useEffect(() => {
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      if (currentSectionRef.current) {
        currentSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
                const inviteUrl = `https://trainwell.lovable.app/auth?trainer=${profile.unique_id}`;
                const message = `Hey! Join me on TrainWell for personalized fitness coaching. Click here to sign up: ${inviteUrl}`;
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
              ref={isCurrentSection ? currentSectionRef : undefined}
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
                  
                  {/* Date Cells */}
                  {sectionDates.map(({ date }) => {
                    const workout = getWorkoutForDate(date, displayWorkouts);
                    const isToday = isSameDay(date, today);
                    const isPast = isBefore(date, today);
                    const hasWorkout = !!workout;
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const statusStyles = getStatusStyles(workout?.status);

                    return (
                      <motion.button
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        whileTap={{ scale: 0.9 }}
                        className={`
                          relative aspect-square rounded-xl flex flex-col items-center justify-center
                          transition-all duration-200 text-sm font-medium border-2
                          ${isToday 
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' 
                            : isSelected
                              ? 'bg-secondary ring-2 ring-primary/50 border-primary/50'
                              : hasWorkout && statusStyles
                                ? statusStyles.cellBg
                                : isPast && section === 'past'
                                  ? 'bg-muted/50 text-muted-foreground border-transparent'
                                  : 'bg-card hover:bg-secondary text-foreground border-transparent hover:border-border'
                          }
                        `}
                      >
                        <span className={`${isToday ? 'font-bold' : ''} ${hasWorkout && !isToday ? 'mb-0.5' : ''}`}>
                          {format(date, 'd')}
                        </span>
                        
                        {/* Workout Status Indicator */}
                        {hasWorkout && statusStyles && !isToday && (
                          <div className={`absolute bottom-1 rounded-full p-0.5 ${statusStyles.bg} ${statusStyles.text}`}>
                            {statusStyles.icon}
                          </div>
                        )}
                        
                        {/* Workout indicator on today */}
                        {hasWorkout && isToday && (
                          <div className="absolute bottom-1">
                            <Dumbbell className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* Status Legend for current section */}
              {isCurrentSection && (
                <div className="flex flex-wrap gap-3 mt-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                      <Check className="w-3 h-3 text-success-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Missed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
                      <Dumbbell className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

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
              
              return (
                <div className="space-y-4">
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
                        Log your progress for this workout
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowWorkoutModal(true)}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <Dumbbell className="w-7 h-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">Log Workout</p>
                        <p className="text-xs text-muted-foreground">Track exercises</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFoodModal(true)}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                        <Utensils className="w-7 h-7 text-success" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">Log Food</p>
                        <p className="text-xs text-muted-foreground">Track nutrition</p>
                      </div>
                    </motion.button>
                  </div>

                  {/* Quick Status Update */}
                  {workout && workout.status === 'pending' && (
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
      />

      {/* Food Log Modal */}
      <FoodLogModal
        open={showFoodModal}
        onOpenChange={setShowFoodModal}
        onSave={handleFoodSave}
      />
    </div>
  );
};

export default Calendar;
