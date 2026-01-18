import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Search, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gymExercises } from '@/data/gymExercises';
import { format, isBefore, startOfDay } from 'date-fns';

interface Set {
  id: string;
  weight: number;
  reps: number;
}

interface ExerciseBlock {
  id: string;
  exerciseName: string;
  searchTerm: string;
  showDropdown: boolean;
  sets: Set[];
  isExpanded: boolean;
}

interface TrainerWorkoutLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercises: { name: string; sets: { weight: number; reps: number }[] }[]) => void;
  date?: Date;
  existingExercises?: { name: string; sets: { weight: number; reps: number }[] }[];
  clientHasLogged?: boolean;
}

export const TrainerWorkoutLogModal = ({
  open,
  onOpenChange,
  onSave,
  date,
  existingExercises = [],
  clientHasLogged = false,
}: TrainerWorkoutLogModalProps) => {
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [customExercises, setCustomExercises] = useState<string[]>([]);

  const today = startOfDay(new Date());
  const isPastDate = date ? isBefore(startOfDay(date), today) : false;
  const isReadOnly = isPastDate || clientHasLogged;

  const generateId = useCallback(() => Math.random().toString(36).substring(2, 9), []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      if (existingExercises.length > 0) {
        setExerciseBlocks(
          existingExercises.map((ex, index) => ({
            id: `exercise-${index}-${generateId()}`,
            exerciseName: ex.name,
            searchTerm: '',
            showDropdown: false,
            sets: ex.sets.map((set, setIndex) => ({
              id: `set-${index}-${setIndex}-${generateId()}`,
              weight: set.weight,
              reps: set.reps,
            })),
            isExpanded: true,
          }))
        );
      } else {
        setExerciseBlocks([]);
      }
    }
  }, [open, existingExercises, generateId]);

  // Combined exercises list
  const allExercises = useMemo(() => {
    return [...customExercises, ...gymExercises];
  }, [customExercises]);

  // Get filtered exercises for a specific block
  const getFilteredExercises = useCallback((searchTerm: string) => {
    if (!searchTerm) return allExercises;
    const term = searchTerm.toLowerCase();
    return allExercises.filter(ex => ex.toLowerCase().includes(term));
  }, [allExercises]);

  const checkExactMatch = useCallback((searchTerm: string) => {
    return allExercises.some(ex => ex.toLowerCase() === searchTerm.toLowerCase());
  }, [allExercises]);

  const addExerciseBlock = () => {
    const newBlock: ExerciseBlock = {
      id: generateId(),
      exerciseName: '',
      searchTerm: '',
      showDropdown: true,
      sets: [{ id: generateId(), weight: 0, reps: 0 }],
      isExpanded: true,
    };
    setExerciseBlocks(prev => [...prev, newBlock]);
  };

  const removeExerciseBlock = (blockId: string) => {
    setExerciseBlocks(prev => prev.filter(b => b.id !== blockId));
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
    if (searchTerm.trim() && !checkExactMatch(searchTerm)) {
      const newExercise = searchTerm.trim();
      setCustomExercises(prev => [newExercise, ...prev]);
      selectExercise(blockId, newExercise);
    }
  };

  const addSetToBlock = (blockId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, sets: [...block.sets, { id: generateId(), weight: 0, reps: 0 }] }
          : block
      )
    );
  };

  const removeSetFromBlock = (blockId: string, setId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, sets: block.sets.filter(s => s.id !== setId) }
          : block
      )
    );
  };

  const updateSet = (blockId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              sets: block.sets.map(set =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : block
      )
    );
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExerciseBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, isExpanded: !block.isExpanded } : block
      )
    );
  };

  const handleSave = () => {
    const validExercises = exerciseBlocks
      .filter(block => block.exerciseName && block.sets.length > 0)
      .map(block => ({
        name: block.exerciseName,
        sets: block.sets.map(set => ({ weight: set.weight, reps: set.reps })),
      }));

    if (validExercises.length === 0) {
      return;
    }

    onSave(validExercises);
  };

  const hasValidExercises = exerciseBlocks.some(
    block => block.exerciseName && block.sets.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {isReadOnly ? 'View Workout' : 'Log Workout'}
            {date && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {format(date, 'MMM d, yyyy')}
              </span>
            )}
          </DialogTitle>
          {isReadOnly && (
            <p className="text-sm text-muted-foreground mt-1">
              {clientHasLogged
                ? 'Client has logged their workout. View only.'
                : 'Past dates cannot be edited.'}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {exerciseBlocks.map((block, blockIndex) => {
              const filteredExercises = getFilteredExercises(block.searchTerm);
              const exactMatchExists = checkExactMatch(block.searchTerm);

              return (
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
                          disabled={isReadOnly}
                        >
                          <span className="text-sm text-muted-foreground">
                            #{blockIndex + 1}
                          </span>
                          {block.exerciseName}
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
                              value={block.searchTerm}
                              onChange={(e) => updateBlockSearch(block.id, e.target.value)}
                              onFocus={() => setBlockDropdownOpen(block.id, true)}
                              onBlur={() => {
                                // Delay to allow click on dropdown item
                                setTimeout(() => setBlockDropdownOpen(block.id, false), 200);
                              }}
                              className="pl-9 bg-background"
                              disabled={isReadOnly}
                              autoFocus
                            />
                          </div>
                          
                          {/* Exercise Dropdown */}
                          {block.showDropdown && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {!exactMatchExists && block.searchTerm.trim() && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    addCustomExercise(block.id, block.searchTerm);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm bg-primary/10 hover:bg-primary/20 text-primary font-medium border-b border-border"
                                >
                                  <Plus className="w-4 h-4 inline mr-2" />
                                  Add "{block.searchTerm.trim()}" as new exercise
                                </button>
                              )}
                              {filteredExercises.slice(0, 10).map((exercise) => (
                                <button
                                  key={exercise}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectExercise(block.id, exercise);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
                                >
                                  {exercise}
                                </button>
                              ))}
                              {filteredExercises.length === 0 && block.searchTerm && exactMatchExists && (
                                <div className="px-4 py-3 text-sm text-muted-foreground">
                                  No exercises found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExerciseBlock(block.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Sets */}
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
                          <div className="col-span-4">Weight (Kg)</div>
                          <div className="col-span-4">Reps</div>
                          <div className="col-span-2"></div>
                        </div>

                        {/* Set Rows */}
                        {block.sets.map((set, setIndex) => (
                          <motion.div
                            key={set.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {setIndex + 1}
                              </span>
                            </div>
                            <div className="col-span-4">
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={set.weight || ''}
                                onChange={(e) =>
                                  updateSet(block.id, set.id, 'weight', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="h-9"
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                type="number"
                                min="0"
                                value={set.reps || ''}
                                onChange={(e) =>
                                  updateSet(block.id, set.id, 'reps', parseInt(e.target.value) || 0)
                                }
                                placeholder="0"
                                className="h-9"
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              {block.sets.length > 1 && !isReadOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSetFromBlock(block.id, set.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}

                        {/* Add Set Button */}
                        {!isReadOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSetToBlock(block.id)}
                            className="w-full mt-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Set
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Add Exercise Button */}
            {!isReadOnly && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  variant="outline"
                  onClick={addExerciseBlock}
                  className="w-full h-14 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Exercise
                </Button>
              </motion.div>
            )}

            {exerciseBlocks.length === 0 && (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {isReadOnly
                    ? 'No workout logged for this date'
                    : 'Start by adding an exercise'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isReadOnly && (
          <div className="p-6 pt-4 border-t border-border">
            <Button
              onClick={handleSave}
              disabled={!hasValidExercises}
              className="w-full"
            >
              Save Workout
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};