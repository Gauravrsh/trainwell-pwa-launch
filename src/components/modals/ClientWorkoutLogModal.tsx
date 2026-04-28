import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Save, ChevronDown, ChevronUp, Plus, X, Search, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { gymExercises } from '@/data/gymExercises';
import { MetricType, METRIC_TYPE_OPTIONS, DEFAULT_METRIC_TYPE, summarizeRecommendation } from '@/types/exerciseMetrics';

// What the trainer prescribed for one exercise.
export interface TrainerPlannedExercise {
  name: string;
  metricType: MetricType;
  sets?: { weight: number; reps: number }[];  // reps_weight / reps_only
  durationSeconds?: number;                     // time / distance_time
  distanceMeters?: number;                      // distance_time
  rounds?: number;                              // amrap target
  emomMinutes?: number;                         // amrap / emom
  emomReps?: number;                            // emom
}

// What the client logs — flat per-exercise payload (one row per exercise).
export interface ClientLoggedExercise {
  name: string;
  metricType: MetricType;
  sets?: { weight: number; reps: number }[];
  durationSeconds?: number;
  distanceMeters?: number;
  rounds?: number;
  emomMinutes?: number;
  emomReps?: number;
}

interface ExerciseBlock {
  id: string;
  exerciseName: string;
  searchTerm: string;
  showDropdown: boolean;
  metricType: MetricType;
  recommended: TrainerPlannedExercise | null;
  sets: { weight: number; reps: number }[];   // actuals for reps_weight/reps_only
  durationSeconds: number;
  distanceMeters: number;
  rounds: number;
  emomMinutes: number;
  emomReps: number;
  isExpanded: boolean;
  isFromTrainer: boolean;
}

interface ClientWorkoutLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercises: ClientLoggedExercise[], caloriesBurnt?: number) => void;
  date?: Date;
  trainerExercises?: TrainerPlannedExercise[];
  existingActuals?: ClientLoggedExercise[];
  mode?: 'log' | 'edit';
}

export const ClientWorkoutLogModal = ({
  open,
  onOpenChange,
  onSave,
  date,
  trainerExercises = [],
  existingActuals,
  mode = 'log',
}: ClientWorkoutLogModalProps) => {
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [caloriesBurnt, setCaloriesBurnt] = useState<string>('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const generateId = useCallback(() => Math.random().toString(36).substring(2, 9), []);

  useEffect(() => {
    if (!open) return;
    setCaloriesBurnt('');
    // Edit mode: hydrate from previously saved actuals so the user sees what they logged.
    if (existingActuals && existingActuals.length > 0) {
      const trainerNameSet = new Set(trainerExercises.map(t => t.name));
      const trainerByName = new Map(trainerExercises.map(t => [t.name, t]));
      setExerciseBlocks(
        existingActuals.map((ex, index) => {
          const fromTrainer = trainerNameSet.has(ex.name);
          const rec = trainerByName.get(ex.name) ?? null;
          return {
            id: `existing-${index}-${generateId()}`,
            exerciseName: ex.name,
            searchTerm: '',
            showDropdown: false,
            metricType: ex.metricType ?? DEFAULT_METRIC_TYPE,
            recommended: rec,
            sets: (ex.sets && ex.sets.length > 0)
              ? ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
              : [{ weight: 0, reps: 0 }],
            durationSeconds: ex.durationSeconds ?? 0,
            distanceMeters: ex.distanceMeters ?? 0,
            rounds: ex.rounds ?? 0,
            emomMinutes: ex.emomMinutes ?? 0,
            emomReps: ex.emomReps ?? 0,
            isExpanded: true,
            isFromTrainer: fromTrainer,
          };
        })
      );
    } else if (trainerExercises.length > 0) {
      setExerciseBlocks(
        trainerExercises.map((ex, index) => ({
          id: `exercise-${index}-${generateId()}`,
          exerciseName: ex.name,
          searchTerm: '',
          showDropdown: false,
          metricType: ex.metricType ?? DEFAULT_METRIC_TYPE,
          recommended: ex,
          sets: (ex.sets ?? [{ weight: 0, reps: 0 }]).map(s => ({ weight: s.weight, reps: s.reps })),
          durationSeconds: ex.durationSeconds ?? 0,
          distanceMeters: ex.distanceMeters ?? 0,
          rounds: ex.rounds ?? 0,
          emomMinutes: ex.emomMinutes ?? 0,
          emomReps: ex.emomReps ?? 0,
          isExpanded: true,
          isFromTrainer: true,
        }))
      );
    } else {
      setExerciseBlocks([]);
    }
  }, [open, trainerExercises, existingActuals, generateId]);

  const allExercises = useMemo(() => [...customExercises, ...gymExercises], [customExercises]);
  const getFilteredExercises = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allExercises.filter(ex => ex.toLowerCase().includes(term));
  }, [allExercises]);
  const checkExactMatch = useCallback((searchTerm: string) =>
    allExercises.some(ex => ex.toLowerCase() === searchTerm.toLowerCase())
  , [allExercises]);

  const patchBlock = (blockId: string, patch: Partial<ExerciseBlock>) =>
    setExerciseBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...patch } : b));

  const addExerciseBlock = () => {
    const newId = generateId();
    const newBlock: ExerciseBlock = {
      id: newId,
      exerciseName: '',
      searchTerm: '',
      showDropdown: true,
      metricType: DEFAULT_METRIC_TYPE,
      recommended: null,
      sets: [{ weight: 0, reps: 0 }],
      durationSeconds: 0,
      distanceMeters: 0,
      rounds: 0,
      emomMinutes: 0,
      emomReps: 0,
      isExpanded: true,
      isFromTrainer: false,
    };
    setExerciseBlocks(prev => [...prev, newBlock]);
    setTimeout(() => { inputRefs.current[newId]?.focus(); }, 50);
  };

  const selectExercise = (blockId: string, name: string) =>
    patchBlock(blockId, { exerciseName: name, searchTerm: '', showDropdown: false });

  const addCustomExercise = (blockId: string, searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const name = searchTerm.trim();
    if (!checkExactMatch(searchTerm)) setCustomExercises(prev => [name, ...prev]);
    selectExercise(blockId, name);
  };

  const handleKeyDown = (blockId: string, e: React.KeyboardEvent, searchTerm: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const filtered = getFilteredExercises(searchTerm);
      if (filtered.length > 0 && searchTerm.trim()) selectExercise(blockId, filtered[0]);
      else if (searchTerm.trim()) addCustomExercise(blockId, searchTerm);
    } else if (e.key === 'Escape') {
      patchBlock(blockId, { showDropdown: false });
    }
  };

  const removeExerciseBlock = (blockId: string) =>
    setExerciseBlocks(prev => prev.filter(b => b.id !== blockId));

  const toggleBlockExpanded = (blockId: string) =>
    setExerciseBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isExpanded: !b.isExpanded } : b));

  const updateActualSet = (blockId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: b.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s) }
      : b));
  };

  const addSet = (blockId: string) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: [...b.sets, { weight: 0, reps: 0 }] } : b));
  };

  const removeSet = (blockId: string, setIndex: number) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: b.sets.filter((_, i) => i !== setIndex) } : b));
  };

  const isBlockValid = (b: ExerciseBlock): boolean => {
    if (!b.exerciseName) return false;
    switch (b.metricType) {
      case 'reps_weight':
      case 'reps_only':
        return b.sets.some(s => s.reps > 0);
      case 'time':
        return b.durationSeconds > 0;
      case 'distance_time':
        return b.distanceMeters > 0 || b.durationSeconds > 0;
      case 'amrap':
        return b.rounds > 0 || b.emomMinutes > 0;
      case 'emom':
        return b.emomMinutes > 0 && b.emomReps > 0;
      default:
        return false;
    }
  };

  const handleSave = () => {
    const valid: ClientLoggedExercise[] = exerciseBlocks
      .filter(isBlockValid)
      .map(b => {
        const base: ClientLoggedExercise = { name: b.exerciseName, metricType: b.metricType };
        switch (b.metricType) {
          case 'reps_weight':
            return { ...base, sets: b.sets.map(s => ({ weight: s.weight, reps: s.reps })) };
          case 'reps_only':
            return { ...base, sets: b.sets.map(s => ({ weight: 0, reps: s.reps })) };
          case 'time':
            return { ...base, durationSeconds: b.durationSeconds };
          case 'distance_time':
            return { ...base, distanceMeters: b.distanceMeters, durationSeconds: b.durationSeconds };
          case 'amrap':
            return { ...base, emomMinutes: b.emomMinutes, rounds: b.rounds };
          case 'emom':
            return { ...base, emomMinutes: b.emomMinutes, emomReps: b.emomReps };
        }
        return base;
      });

    if (valid.length === 0) return;
    const calories = caloriesBurnt ? parseInt(caloriesBurnt, 10) : undefined;
    onSave(valid, calories && !isNaN(calories) ? calories : undefined);
  };

  const hasValidExercises = exerciseBlocks.some(isBlockValid);
  const hasTrainerPlan = trainerExercises.length > 0;

  const recommendationSummary = (b: ExerciseBlock): string | null => {
    if (!b.recommended) return null;
    const r = b.recommended;
    return summarizeRecommendation({
      metric_type: r.metricType,
      recommended_sets: r.sets?.length ?? null,
      recommended_reps: r.sets?.[0]?.reps ?? r.emomReps ?? null,
      recommended_weight: r.sets?.[0]?.weight ?? null,
      recommended_duration_seconds: r.durationSeconds ?? null,
      recommended_distance_meters: r.distanceMeters ?? null,
      recommended_rounds: r.rounds ?? null,
      recommended_emom_minutes: r.emomMinutes ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-modal flex flex-col p-0 gap-0">
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

        <div className="dialog-scroll-area px-6 py-4">
          <div className="space-y-4">
            {hasTrainerPlan && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Trainer's Recommended Workout</p>
                  <p className="text-xs text-muted-foreground">
                    Edit values below to log what you actually completed
                  </p>
                </div>
              </motion.div>
            )}

            {exerciseBlocks.map((block, blockIndex) => {
              const filteredExercises = getFilteredExercises(block.searchTerm);
              const exactMatchExists = checkExactMatch(block.searchTerm);
              const recSummary = recommendationSummary(block);

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-xl bg-card relative"
                >
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex-1 relative">
                      {block.exerciseName ? (
                        <button
                          type="button"
                          onClick={() => toggleBlockExpanded(block.id)}
                          className="flex items-center gap-2 font-medium text-foreground"
                        >
                          <span className="text-sm text-muted-foreground">#{blockIndex + 1}</span>
                          {block.exerciseName}
                          {block.isFromTrainer && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                              Trainer
                            </span>
                          )}
                          {block.isExpanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                            <Input
                              ref={(el) => { inputRefs.current[block.id] = el; }}
                              placeholder="Search exercise..."
                              value={block.searchTerm}
                              onChange={(e) => patchBlock(block.id, { searchTerm: e.target.value, showDropdown: true })}
                              onFocus={() => patchBlock(block.id, { showDropdown: true })}
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
                                  No exercises found — press Enter to add custom
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!block.isFromTrainer && (
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => removeExerciseBlock(block.id)}
                        className="text-destructive hover:bg-destructive/10 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {block.isExpanded && block.exerciseName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Recommendation badge */}
                        {recSummary && block.isFromTrainer && (
                          <div className="text-xs text-muted-foreground bg-secondary/40 rounded-md px-3 py-1.5">
                            <span className="font-semibold text-foreground">Target: </span>{recSummary}
                          </div>
                        )}

                        {/* For non-trainer blocks, allow metric type selection */}
                        {!block.isFromTrainer && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Metric type</Label>
                            <Select
                              value={block.metricType}
                              onValueChange={(v) => patchBlock(block.id, { metricType: v as MetricType })}
                            >
                              <SelectTrigger className="h-9 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {METRIC_TYPE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex flex-col">
                                      <span>{opt.label}</span>
                                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* reps_weight / reps_only: per-set grid */}
                        {(block.metricType === 'reps_weight' || block.metricType === 'reps_only') && (
                          <>
                            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                              <div className="col-span-2">Set</div>
                              {block.isFromTrainer && block.metricType === 'reps_weight' && (
                                <>
                                  <div className="col-span-2 text-center">Rec.</div>
                                  <div className="col-span-3">Weight (Kg)</div>
                                  <div className="col-span-3">Reps</div>
                                </>
                              )}
                              {!block.isFromTrainer && block.metricType === 'reps_weight' && (
                                <>
                                  <div className="col-span-4">Weight (Kg)</div>
                                  <div className="col-span-4">Reps</div>
                                </>
                              )}
                              {block.metricType === 'reps_only' && (
                                <div className="col-span-8">Reps</div>
                              )}
                              <div className="col-span-2"></div>
                            </div>
                            {block.sets.map((set, setIndex) => {
                              const recommended = block.recommended?.sets?.[setIndex];
                              return (
                                <motion.div
                                  key={setIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="grid grid-cols-12 gap-2 items-center"
                                >
                                  <div className="col-span-2">
                                    <span className="text-sm font-medium text-muted-foreground">{setIndex + 1}</span>
                                  </div>
                                  {block.isFromTrainer && block.metricType === 'reps_weight' && (
                                    <div className="col-span-2 text-center">
                                      {recommended && (
                                        <span className="text-xs text-muted-foreground">
                                          {recommended.weight}×{recommended.reps}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {block.metricType === 'reps_weight' && (
                                    <div className={block.isFromTrainer ? 'col-span-3' : 'col-span-4'}>
                                      <Input
                                        type="number" min="0" step="0.5"
                                        value={set.weight || ''}
                                        onChange={(e) => updateActualSet(block.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                        placeholder={recommended ? String(recommended.weight) : '0'}
                                        className="h-9"
                                      />
                                    </div>
                                  )}
                                  <div className={
                                    block.metricType === 'reps_only' ? 'col-span-8' :
                                    block.isFromTrainer ? 'col-span-3' : 'col-span-4'
                                  }>
                                    <Input
                                      type="number" min="0"
                                      value={set.reps || ''}
                                      onChange={(e) => updateActualSet(block.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                      placeholder={recommended ? String(recommended.reps) : '0'}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                    {block.sets.length > 1 && (
                                      <Button
                                        variant="ghost" size="icon"
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
                            <Button
                              variant="outline" size="sm"
                              onClick={() => addSet(block.id)}
                              className="w-full mt-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Set
                            </Button>
                          </>
                        )}

                        {/* time */}
                        {block.metricType === 'time' && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                              Actual duration (seconds)
                            </Label>
                            <Input
                              type="number" min="0"
                              value={block.durationSeconds || ''}
                              onChange={(e) => patchBlock(block.id, { durationSeconds: parseInt(e.target.value) || 0 })}
                              placeholder={String(block.recommended?.durationSeconds ?? 0)}
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* distance_time */}
                        {block.metricType === 'distance_time' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Distance (m)</Label>
                              <Input
                                type="number" min="0"
                                value={block.distanceMeters || ''}
                                onChange={(e) => patchBlock(block.id, { distanceMeters: parseFloat(e.target.value) || 0 })}
                                placeholder={String(block.recommended?.distanceMeters ?? 0)}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Time (sec)</Label>
                              <Input
                                type="number" min="0"
                                value={block.durationSeconds || ''}
                                onChange={(e) => patchBlock(block.id, { durationSeconds: parseInt(e.target.value) || 0 })}
                                placeholder={String(block.recommended?.durationSeconds ?? 0)}
                                className="h-10"
                              />
                            </div>
                          </div>
                        )}

                        {/* amrap: log rounds completed */}
                        {block.metricType === 'amrap' && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                              Rounds completed
                              {block.recommended?.emomMinutes ? ` (in ${block.recommended.emomMinutes} min)` : ''}
                            </Label>
                            <Input
                              type="number" min="0"
                              value={block.rounds || ''}
                              onChange={(e) => patchBlock(block.id, {
                                rounds: parseInt(e.target.value) || 0,
                                emomMinutes: block.recommended?.emomMinutes ?? block.emomMinutes,
                              })}
                              placeholder={String(block.recommended?.rounds ?? 0)}
                              className="h-10"
                            />
                          </div>
                        )}

                        {/* emom */}
                        {block.metricType === 'emom' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Minutes completed</Label>
                              <Input
                                type="number" min="0"
                                value={block.emomMinutes || ''}
                                onChange={(e) => patchBlock(block.id, { emomMinutes: parseInt(e.target.value) || 0 })}
                                placeholder={String(block.recommended?.emomMinutes ?? 0)}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Reps per min</Label>
                              <Input
                                type="number" min="0"
                                value={block.emomReps || ''}
                                onChange={(e) => patchBlock(block.id, { emomReps: parseInt(e.target.value) || 0 })}
                                placeholder={String(block.recommended?.emomReps ?? 0)}
                                className="h-10"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

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
                <p className="text-muted-foreground">No workout assigned for today</p>
                <p className="text-sm text-muted-foreground mt-1">Add exercises to log your workout</p>
              </div>
            )}

            {exerciseBlocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-border"
              >
                <label htmlFor="caloriesBurnt" className="text-sm text-muted-foreground block mb-2">
                  Total Calories Burnt (optional)
                </label>
                <Input
                  id="caloriesBurnt"
                  type="number" min={0} max={50000}
                  placeholder="e.g. 350"
                  value={caloriesBurnt}
                  onChange={(e) => setCaloriesBurnt(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter estimated calories from your fitness tracker or workout
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <div className="dialog-footer p-6 pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={!hasValidExercises} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Log Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
