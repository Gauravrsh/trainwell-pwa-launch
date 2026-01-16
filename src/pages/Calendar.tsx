import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Check, Clock, X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface Workout {
  id: string;
  date: string;
  status: 'pending' | 'completed' | 'skipped';
  client_id: string;
}

interface Client {
  id: string;
  unique_id: string;
}

const Calendar = () => {
  const { profile, isTrainer } = useProfile();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showClientSheet, setShowClientSheet] = useState(false);

  // Calculate cycle dates - cycle starts from when client joined trainer or account creation
  const cycleStartDate = useMemo(() => {
    // For simplicity, we'll use the start of the current month as cycle start
    // In production, this would come from subscription_cycles table
    const today = new Date();
    return startOfDay(subDays(today, today.getDate() - 1));
  }, []);

  const today = startOfDay(new Date());
  const currentCycleStart = cycleStartDate;
  const currentCycleEnd = addDays(currentCycleStart, 29);
  const previousCycleStart = subDays(currentCycleStart, 30);
  const previousCycleEnd = subDays(currentCycleStart, 1);

  // Fetch workouts for the user
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

  // Fetch trainer's clients
  const { data: clients = [] } = useQuery({
    queryKey: ['trainer-clients', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, unique_id')
        .eq('trainer_id', profile.id);
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!profile && isTrainer,
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

  const getWorkoutForDate = (date: Date) => {
    return workouts.find(w => isSameDay(new Date(w.date), date));
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3 text-primary" />;
      case 'skipped':
        return <X className="w-3 h-3 text-destructive" />;
      default:
        return null;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (isTrainer) {
      setShowClientSheet(true);
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
      </div>

      {/* Calendar Sections */}
      <div className="px-4 py-4 space-y-6">
        {sections.map((section, sectionIndex) => {
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

              {/* Dates Grid */}
              <div className={`rounded-2xl border ${
                isCurrentSection ? 'border-primary/30 bg-primary/5' : 
                isPastSection ? 'border-border/50 bg-muted/30' : 'border-border bg-card/50'
              } p-3`}>
                <div className="grid grid-cols-7 gap-1">
                  {/* Weekday Headers */}
                  {sectionIndex === 0 && ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* Date Cells */}
                  {sectionDates.map(({ date }, index) => {
                    const workout = getWorkoutForDate(date);
                    const isToday = isSameDay(date, today);
                    const isPast = isBefore(date, today);
                    const hasWorkout = !!workout;
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                      <motion.button
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        whileTap={{ scale: 0.9 }}
                        className={`
                          relative aspect-square rounded-xl flex flex-col items-center justify-center
                          transition-all duration-200 text-sm font-medium
                          ${isToday 
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : isSelected
                              ? 'bg-secondary ring-2 ring-primary/50'
                              : isPast && section === 'past'
                                ? 'bg-muted/50 text-muted-foreground'
                                : 'bg-card hover:bg-secondary text-foreground'
                          }
                          ${hasWorkout && !isToday ? 'border-2 border-primary/50' : ''}
                        `}
                      >
                        <span className={isToday ? 'font-bold' : ''}>
                          {format(date, 'd')}
                        </span>
                        
                        {/* Workout indicator */}
                        {hasWorkout && (
                          <div className="absolute bottom-1">
                            {getStatusIcon(workout.status) || (
                              <Dumbbell className="w-2.5 h-2.5 text-primary" />
                            )}
                          </div>
                        )}
                        
                        {/* Month label for first day */}
                        {date.getDate() === 1 && (
                          <span className="absolute -top-5 left-0 text-[10px] text-muted-foreground font-medium">
                            {format(date, 'MMM')}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Client Selection Sheet for Trainers */}
      <Sheet open={showClientSheet} onOpenChange={setShowClientSheet}>
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
          
          {clients.length > 0 ? (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-3">
                Select a client to assign a workout
              </p>
              {clients.map((client) => (
                <motion.button
                  key={client.id}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                  onClick={() => {
                    // Navigate to workout creation for this client
                    setShowClientSheet(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-semibold text-foreground">
                        {client.unique_id.slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      Client #{client.unique_id}
                    </span>
                  </div>
                  <Plus className="w-5 h-5 text-primary" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No clients yet. Share your trainer ID to get started!
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Workout Details Sheet for Clients */}
      {!isTrainer && selectedDate && (
        <Sheet open={!!selectedDate && !isTrainer} onOpenChange={() => setSelectedDate(null)}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  {format(selectedDate, 'EEEE, MMMM d')}
                </span>
              </SheetTitle>
            </SheetHeader>
            
            {(() => {
              const workout = getWorkoutForDate(selectedDate);
              if (workout) {
                return (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">Assigned Workout</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          workout.status === 'completed' 
                            ? 'bg-primary/20 text-primary' 
                            : workout.status === 'skipped'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-secondary text-muted-foreground'
                        }`}>
                          {workout.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        View exercises and log your progress
                      </p>
                    </div>
                    <Button className="w-full h-12 rounded-xl">
                      View Workout Details
                    </Button>
                  </div>
                );
              }
              return (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No workout scheduled for this day
                  </p>
                </div>
              );
            })()}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default Calendar;
