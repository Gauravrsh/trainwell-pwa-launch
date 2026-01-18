import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
  searchTerm: string;
  showDropdown: boolean;
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
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const generateId = useCallback(() => Math.random().toString(36).substring(2, 9), []);

  // Initialize exercise blocks from trainer exercises
  useEffect(() => {
    if (open) {
      if (trainerExercises.length > 0) {
        setExerciseBlocks(
          trainerExercises.map((ex, index) => ({
            id: `exercise-${index}-${generateId()}`,
            exerciseName: ex.name,
            searchTerm: '',
            showDropdown: false,
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
  }, [open, trainerExercises, generateId]);

  const allExercises = useMemo(() => {
    return [...customExercises, ...gymExercises];
  }, [customExercises]);

  // Only show exercises when user types something
  const getFilteredExercises = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allExercises.filter(ex => ex.toLowerCase().includes(term));
  }, [allExercises]);

  const checkExactMatch = useCallback((searchTerm: string) => {
    return allExercises.some(ex => ex.toLowerCase() === searchTerm.toLowerCase());
  }, [allExercises]);

  const addExerciseBlock = () => {
    const newId = generateId();
    const newBlock: ExerciseBlock = {
      id: newId,
      exerciseName: '',
      searchTerm: '',
      showDropdown: true,
      recommendedSets: [],
      actualSets: [{ weight: 0, reps: 0 }],
      isExpanded: true,
      isFromTrainer: false,
    };
    setExerciseBlocks(prev => [...prev, newBlock]);
    
    setTimeout(() => {
      inputRefs.current[newId]?.focus();
    }, 50);
  };

  const updateBlockSearch = (blockId: string, searchTerm: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, searchTerm, showDropdown: true } : block
      )
    );
  };

  const setBlockDropdownOpen = (blockId: string, showDropdown: boolean) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, showDropdown } : block
      )
    );
  };

  const selectExercise = (blockId: string, exerciseName: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId 
          ? { ...block, exerciseName, searchTerm: '', showDropdown: false } 
          : block
      )
    );
  };

  const addCustomExercise = (blockId: string, searchTerm: string) => {
    if (searchTerm.trim()) {
      const newExercise = searchTerm.trim();
      if (!checkExactMatch(searchTerm)) {
        setCustomExercises(prev => [newExercise, ...prev]);
      }
      selectExercise(blockId, newExercise);
    }
  };

  const handleKeyDown = (blockId: string, e: React.KeyboardEvent, searchTerm: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const filtered = getFilteredExercises(searchTerm);
      
      if (filtered.length > 0 && searchTerm.trim()) {
        const firstMatch = filtered.find(ex => 
          ex.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (firstMatch) {
          selectExercise(blockId, firstMatch);
        } else {
          addCustomExercise(blockId, searchTerm);
        }
      } else if (searchTerm.trim()) {
        addCustomExercise(blockId, searchTerm);
      }
    } else if (e.key === 'Escape') {
      setBlockDropdownOpen(blockId, false);
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
    const validExercises = exerciseBlocks
      .filter(block => block.exerciseName && block.actualSets.length > 0)
      .flatMap(block =>
        block.actualSets.map((set) => ({
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
      <DialogContent className="max-w-lg h-[85vh] h-[85dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
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

          <div 
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-6 py-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
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

            {exerciseBlocks.map((block, blockIndex) => {
              const filteredExercises = getFilteredExercises(block.searchTerm);
              const exactMatchExists = checkExactMatch(block.searchTerm);

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-xl bg-card relative"
                >
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex-1 relative">
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
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                            <Input
                              ref={(el) => { inputRefs.current[block.id] = el; }}
                              placeholder="Search exercise..."
                              value={block.searchTerm}
                              onChange={(e) => updateBlockSearch(block.id, e.target.value)}
                              onFocus={() => setBlockDropdownOpen(block.id, true)}
                              onKeyDown={(e) => handleKeyDown(block.id, e, block.searchTerm)}
                              className="pl-9 bg-background"
                            />
                          </div>

                          {block.showDropdown && (
                            <div 
                              className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                              style={{ zIndex: 9999, top: '100%' }}
                            >
                              {!exactMatchExists && block.searchTerm.trim() && (
                                <button
                                  type="button"
                                  onClick={() => addCustomExercise(block.id, block.searchTerm)}
                                  className="w-full px-4 py-3 text-left text-sm bg-primary/10 hover:bg-primary/20 text-primary font-medium border-b border-border flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add "{block.searchTerm.trim()}"
                                </button>
                              )}
                              {filteredExercises.length > 0 ? (
                                filteredExercises.slice(0, 10).map((exercise) => (
                                  <button
                                    key={exercise}
                                    type="button"
                                    onClick={() => selectExercise(block.id, exercise)}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors text-foreground"
                                  >
                                    {exercise}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-muted-foreground">
                                  No exercises found - press Enter to add custom
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!block.isFromTrainer && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExerciseBlock(block.id)}
                        className="text-destructive hover:bg-destructive/10 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Sets - Only show when exercise is selected */}
                  {block.isExpanded && block.exerciseName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
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
                </motion.div>
              );
            })}

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

            {exerciseBlocks.length === 0 && !hasTrainerPlan && (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No workout assigned for today
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add exercises to log your workout
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border flex-shrink-0 safe-bottom">
          <Button
            onClick={handleSave}
            disabled={!hasValidExercises}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Log Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};