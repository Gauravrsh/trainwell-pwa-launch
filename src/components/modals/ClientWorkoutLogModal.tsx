import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Save, ChevronDown, ChevronUp, Plus, X, Search, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { gymExercises } from '@/data/gymExercises';

interface RecommendedSet {
  weight: number;
  reps: number;
}

interface ExerciseBlock {
  id: string;
  exerciseName: string;
  recommendedSets: RecommendedSet[];
  actualSets: { weight: number; reps: number }[];
  isExpanded: boolean;
  isFromTrainer: boolean;
}

interface ClientWorkoutLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercises: { name: string; sets: number; reps: number; weight: number }[]) => void;
  date?: Date;
  trainerExercises?: { name: string; sets: { weight: number; reps: number }[] }[];
}

export const ClientWorkoutLogModal = ({
  open,
  onOpenChange,
  onSave,
  date,
  trainerExercises = [],
}: ClientWorkoutLogModalProps) => {
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [customExercises, setCustomExercises] = useState<string[]>([]);

  // Initialize exercise blocks from trainer exercises
  useEffect(() => {
    if (open) {
      if (trainerExercises.length > 0) {
        setExerciseBlocks(
          trainerExercises.map((ex, index) => ({
            id: `exercise-${index}`,
            exerciseName: ex.name,
            recommendedSets: ex.sets,
            actualSets: ex.sets.map(set => ({ weight: set.weight, reps: set.reps })),
            isExpanded: true,
            isFromTrainer: true,
          }))
        );
      } else {
        setExerciseBlocks([]);
      }
    }
  }, [open, trainerExercises]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const allExercises = useMemo(() => {
    return [...customExercises, ...gymExercises];
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return allExercises;
    const term = searchTerm.toLowerCase();
    return allExercises.filter(ex => ex.toLowerCase().includes(term));
  }, [searchTerm, allExercises]);

  const exactMatchExists = useMemo(() => {
    return allExercises.some(ex => ex.toLowerCase() === searchTerm.toLowerCase());
  }, [searchTerm, allExercises]);

  const addExerciseBlock = () => {
    const newBlock: ExerciseBlock = {
      id: generateId(),
      exerciseName: '',
      recommendedSets: [],
      actualSets: [{ weight: 0, reps: 0 }],
      isExpanded: true,
      isFromTrainer: false,
    };
    setExerciseBlocks(prev => [...prev, newBlock]);
    setShowExerciseDropdown(true);
    setSearchTerm('');
  };

  const selectExercise = (blockId: string, exerciseName: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, exerciseName } : block
      )
    );
    setShowExerciseDropdown(false);
    setSearchTerm('');
  };

  const addCustomExercise = (blockId: string) => {
    if (searchTerm.trim() && !exactMatchExists) {
      const newExercise = searchTerm.trim();
      setCustomExercises(prev => [newExercise, ...prev]);
      selectExercise(blockId, newExercise);
    }
  };

  const removeExerciseBlock = (blockId: string) => {
    setExerciseBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, isExpanded: !block.isExpanded } : block
      )
    );
  };

  const updateActualSet = (blockId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              actualSets: block.actualSets.map((set, idx) =>
                idx === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : block
      )
    );
  };

  const addSet = (blockId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, actualSets: [...block.actualSets, { weight: 0, reps: 0 }] }
          : block
      )
    );
  };

  const removeSet = (blockId: string, setIndex: number) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, actualSets: block.actualSets.filter((_, idx) => idx !== setIndex) }
          : block
      )
    );
  };

  const handleSave = () => {
    // Transform blocks to the expected format - flatten sets
    const validExercises = exerciseBlocks
      .filter(block => block.exerciseName && block.actualSets.length > 0)
      .flatMap(block =>
        block.actualSets.map((set, idx) => ({
          name: block.exerciseName,
          sets: 1,
          reps: set.reps,
          weight: set.weight,
        }))
      );

    if (validExercises.length > 0) {
      onSave(validExercises);
    }
  };

  const hasValidExercises = exerciseBlocks.some(
    block => block.exerciseName && block.actualSets.some(s => s.reps > 0)
  );

  const hasTrainerPlan = trainerExercises.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Log Workout
          </DialogTitle>
          {date && (
            <p className="text-sm text-muted-foreground">
              {format(date, 'EEEE, MMMM d')}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Trainer Plan Notice */}
            {hasTrainerPlan && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Trainer's Recommended Workout
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Edit the values below to log what you actually completed
                  </p>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {exerciseBlocks.map((block, blockIndex) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="border border-border rounded-xl overflow-hidden bg-card"
                >
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex-1">
                      {block.exerciseName ? (
                        <button
                          type="button"
                          onClick={() => toggleBlockExpanded(block.id)}
                          className="flex items-center gap-2 font-medium text-foreground"
                        >
                          <span className="text-sm text-muted-foreground">
                            #{blockIndex + 1}
                          </span>
                          {block.exerciseName}
                          {block.isFromTrainer && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                              Trainer
                            </span>
                          )}
                          {block.isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search exercise..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowExerciseDropdown(true);
                              }}
                              onFocus={() => setShowExerciseDropdown(true)}
                              className="pl-9 bg-background"
                            />
                          </div>

                          {showExerciseDropdown && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {!exactMatchExists && searchTerm.trim() && (
                                <button
                                  type="button"
                                  onClick={() => addCustomExercise(block.id)}
                                  className="w-full px-4 py-3 text-left text-sm bg-primary/10 hover:bg-primary/20 text-primary font-medium border-b border-border"
                                >
                                  <Plus className="w-4 h-4 inline mr-2" />
                                  Add "{searchTerm.trim()}"
                                </button>
                              )}
                              {filteredExercises.slice(0, 10).map((exercise) => (
                                <button
                                  key={exercise}
                                  type="button"
                                  onClick={() => selectExercise(block.id, exercise)}
                                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
                                >
                                  {exercise}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!block.isFromTrainer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExerciseBlock(block.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Sets */}
                  <AnimatePresence>
                    {block.isExpanded && block.exerciseName && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {/* Set Headers */}
                          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                            <div className="col-span-2">Set</div>
                            {block.isFromTrainer && (
                              <>
                                <div className="col-span-2 text-center">Rec.</div>
                                <div className="col-span-3">Weight (Kg)</div>
                                <div className="col-span-3">Reps</div>
                              </>
                            )}
                            {!block.isFromTrainer && (
                              <>
                                <div className="col-span-4">Weight (Kg)</div>
                                <div className="col-span-4">Reps</div>
                              </>
                            )}
                            <div className="col-span-2"></div>
                          </div>

                          {/* Set Rows */}
                          {block.actualSets.map((set, setIndex) => {
                            const recommended = block.recommendedSets[setIndex];
                            
                            return (
                              <motion.div
                                key={setIndex}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-12 gap-2 items-center"
                              >
                                <div className="col-span-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {setIndex + 1}
                                  </span>
                                </div>
                                
                                {block.isFromTrainer && (
                                  <div className="col-span-2 text-center">
                                    {recommended && (
                                      <span className="text-xs text-muted-foreground">
                                        {recommended.weight}×{recommended.reps}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <div className={block.isFromTrainer ? "col-span-3" : "col-span-4"}>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={set.weight || ''}
                                    onChange={(e) =>
                                      updateActualSet(block.id, setIndex, 'weight', parseFloat(e.target.value) || 0)
                                    }
                                    placeholder={recommended ? String(recommended.weight) : "0"}
                                    className="h-9"
                                  />
                                </div>
                                <div className={block.isFromTrainer ? "col-span-3" : "col-span-4"}>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={set.reps || ''}
                                    onChange={(e) =>
                                      updateActualSet(block.id, setIndex, 'reps', parseInt(e.target.value) || 0)
                                    }
                                    placeholder={recommended ? String(recommended.reps) : "0"}
                                    className="h-9"
                                  />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                  {block.actualSets.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeSet(block.id, setIndex)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* Add Set Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSet(block.id)}
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Set
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Exercise Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                variant="outline"
                onClick={addExerciseBlock}
                className="w-full h-14 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Extra Exercise
              </Button>
            </motion.div>

            {exerciseBlocks.length === 0 && (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No workout assigned for this day.
                  <br />
                  Add your own exercises below.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={!hasValidExercises}
            className="w-full h-12 rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            Log Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
