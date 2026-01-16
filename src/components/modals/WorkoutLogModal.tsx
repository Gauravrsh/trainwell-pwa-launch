import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Dumbbell, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface WorkoutLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercises: Omit<Exercise, 'id'>[]) => void;
  date?: Date;
}

export const WorkoutLogModal = ({ open, onOpenChange, onSave, date }: WorkoutLogModalProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: '', sets: 3, reps: 10, weight: 0 }
  ]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now().toString(), name: '', sets: 3, reps: 10, weight: 0 }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(exercises.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleSave = () => {
    const validExercises = exercises
      .filter(e => e.name.trim())
      .map(({ id, ...rest }) => rest);
    
    if (validExercises.length > 0) {
      onSave(validExercises);
      setExercises([{ id: '1', name: '', sets: 3, reps: 10, weight: 0 }]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Log Workout
          </DialogTitle>
          {date && (
            <p className="text-sm text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <AnimatePresence mode="popLayout">
            {exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Exercise {index + 1}
                  </span>
                  {exercises.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeExercise(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor={`name-${exercise.id}`} className="text-xs text-muted-foreground">
                    Exercise Name
                  </Label>
                  <Input
                    id={`name-${exercise.id}`}
                    placeholder="e.g., Bench Press"
                    value={exercise.name}
                    onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`sets-${exercise.id}`} className="text-xs text-muted-foreground">
                      Sets
                    </Label>
                    <Input
                      id={`sets-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                      className="mt-1 text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`reps-${exercise.id}`} className="text-xs text-muted-foreground">
                      Reps
                    </Label>
                    <Input
                      id={`reps-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                      className="mt-1 text-center"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`weight-${exercise.id}`} className="text-xs text-muted-foreground">
                      Weight (kg)
                    </Label>
                    <Input
                      id={`weight-${exercise.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                      className="mt-1 text-center"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={addExercise}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <Button 
            className="w-full h-12 rounded-xl"
            onClick={handleSave}
            disabled={!exercises.some(e => e.name.trim())}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
