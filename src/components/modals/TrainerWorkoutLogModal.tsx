import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Dumbbell, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gymExercises, getDefaultMetricForExercise } from '@/data/gymExercises';
import { format, isBefore, startOfDay } from 'date-fns';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { SubscriptionEnforcementBanner } from '@/components/subscription/SubscriptionEnforcementBanner';
import { MetricType, METRIC_TYPE_OPTIONS, DEFAULT_METRIC_TYPE } from '@/types/exerciseMetrics';

export interface PlannedExercisePayload {
  name: string;
  metricType: MetricType;
  sets?: { weight: number; reps: number }[];
  durationSeconds?: number;
  distanceMeters?: number;
  rounds?: number;
  emomMinutes?: number;
  emomReps?: number;
}

interface SetRow { id: string; weight: number; reps: number }

interface ExerciseBlock {
  id: string;
  exerciseName: string;
  searchTerm: string;
  showDropdown: boolean;
  metricType: MetricType;
  sets: SetRow[];
  durationSeconds: number;
  distanceMeters: number;
  rounds: number;
  emomMinutes: number;
  emomReps: number;
  isExpanded: boolean;
}

interface TrainerWorkoutLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercises: PlannedExercisePayload[]) => void;
  date?: Date;
  existingExercises?: PlannedExercisePayload[];
  clientHasLogged?: boolean;
  onOpenPlanSelection?: () => void;
}

export const TrainerWorkoutLogModal = ({
  open,
  onOpenChange,
  onSave,
  date,
  existingExercises = [],
  clientHasLogged = false,
  onOpenPlanSelection,
}: TrainerWorkoutLogModalProps) => {
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { isReadOnly: subscriptionReadOnly, reason: subscriptionReason } = useSubscriptionAccess();

  const today = startOfDay(new Date());
  const isPastDate = date ? isBefore(startOfDay(date), today) : false;
  const isReadOnly = isPastDate || clientHasLogged || subscriptionReadOnly;

  const generateId = useCallback(() => Math.random().toString(36).substring(2, 9), []);

  useEffect(() => {
    if (!open) return;
    if (existingExercises.length > 0) {
      setExerciseBlocks(
        existingExercises.map((ex, index) => ({
          id: `exercise-${index}-${generateId()}`,
          exerciseName: ex.name,
          searchTerm: '',
          showDropdown: false,
          metricType: ex.metricType ?? DEFAULT_METRIC_TYPE,
          sets: (ex.sets ?? [{ weight: 0, reps: 0 }]).map((set, setIndex) => ({
            id: `set-${index}-${setIndex}-${generateId()}`,
            weight: set.weight,
            reps: set.reps,
          })),
          durationSeconds: ex.durationSeconds ?? 0,
          distanceMeters: ex.distanceMeters ?? 0,
          rounds: ex.rounds ?? 0,
          emomMinutes: ex.emomMinutes ?? 0,
          emomReps: ex.emomReps ?? 0,
          isExpanded: true,
        }))
      );
    } else {
      setExerciseBlocks([]);
    }
  }, [open, existingExercises, generateId]);

  const allExercises = useMemo(() => [...customExercises, ...gymExercises], [customExercises]);
  const getFilteredExercises = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allExercises.filter(ex => ex.toLowerCase().includes(term));
  }, [allExercises]);
  const checkExactMatch = useCallback((searchTerm: string) =>
    allExercises.some(ex => ex.toLowerCase() === searchTerm.toLowerCase())
  , [allExercises]);

  const addExerciseBlock = () => {
    const newId = generateId();
    const newBlock: ExerciseBlock = {
      id: newId,
      exerciseName: '',
      searchTerm: '',
      showDropdown: true,
      metricType: DEFAULT_METRIC_TYPE,
      sets: [{ id: generateId(), weight: 0, reps: 0 }],
      durationSeconds: 0,
      distanceMeters: 0,
      rounds: 0,
      emomMinutes: 0,
      emomReps: 0,
      isExpanded: true,
    };
    setExerciseBlocks(prev => [...prev, newBlock]);
    setTimeout(() => { inputRefs.current[newId]?.focus(); }, 50);
  };

  const patchBlock = (blockId: string, patch: Partial<ExerciseBlock>) =>
    setExerciseBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...patch } : b));

  const removeExerciseBlock = (blockId: string) =>
    setExerciseBlocks(prev => prev.filter(b => b.id !== blockId));

  const selectExercise = (blockId: string, name: string) =>
    patchBlock(blockId, {
      exerciseName: name,
      searchTerm: '',
      showDropdown: false,
      metricType: getDefaultMetricForExercise(name),
    });

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
      if (filtered.length > 0 && searchTerm.trim()) {
        selectExercise(blockId, filtered[0]);
      } else if (searchTerm.trim()) {
        addCustomExercise(blockId, searchTerm);
      }
    } else if (e.key === 'Escape') {
      patchBlock(blockId, { showDropdown: false });
    }
  };

  const addSetToBlock = (blockId: string) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: [...b.sets, { id: generateId(), weight: 0, reps: 0 }] }
      : b));
  };

  const removeSetFromBlock = (blockId: string, setId: string) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: b.sets.filter(s => s.id !== setId) }
      : b));
  };

  const updateSet = (blockId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId
      ? { ...b, sets: b.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
      : b));
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExerciseBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isExpanded: !b.isExpanded } : b));
  };

  const isBlockValid = (b: ExerciseBlock): boolean => {
    if (!b.exerciseName) return false;
    switch (b.metricType) {
      case 'reps_weight':
      case 'reps_only':
        return b.sets.length > 0;
      case 'time':
        return b.durationSeconds > 0;
      case 'distance_time':
        return b.distanceMeters > 0 || b.durationSeconds > 0;
      case 'amrap':
        return b.emomMinutes > 0;
      case 'emom':
        return b.emomMinutes > 0 && b.emomReps > 0;
      default:
        return false;
    }
  };

  const handleSave = () => {
    const valid: PlannedExercisePayload[] = exerciseBlocks
      .filter(isBlockValid)
      .map(b => {
        const base: PlannedExercisePayload = { name: b.exerciseName, metricType: b.metricType };
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
    onSave(valid);
  };

  const hasValidExercises = exerciseBlocks.some(isBlockValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-modal flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
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
              {subscriptionReadOnly
                ? 'Your subscription has expired. View only.'
                : clientHasLogged
                  ? 'Client has logged their workout. View only.'
                  : 'Past dates cannot be edited.'}
            </p>
          )}
        </DialogHeader>

        <div className="dialog-scroll-area px-6 py-4">
          {subscriptionReadOnly && (
            <div className="mb-4">
              <SubscriptionEnforcementBanner reason={subscriptionReason} onSelectPlan={onOpenPlanSelection} compact />
            </div>
          )}

          <div className="space-y-4">
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
                  <div className="flex items-center justify-between p-4 bg-secondary/30">
                    <div className="flex-1 relative">
                      {block.exerciseName ? (
                        <button
                          type="button"
                          onClick={() => toggleBlockExpanded(block.id)}
                          className="flex items-center gap-2 font-medium text-foreground"
                          disabled={isReadOnly}
                        >
                          <span className="text-sm text-muted-foreground">#{blockIndex + 1}</span>
                          {block.exerciseName}
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
                              disabled={isReadOnly}
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
                                  Add "{block.searchTerm.trim()}" as new exercise
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

                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExerciseBlock(block.id)}
                        className="text-destructive hover:bg-destructive/10 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
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
                        {/* Metric type selector */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Metric type</Label>
                          <Select
                            value={block.metricType}
                            onValueChange={(v) => patchBlock(block.id, { metricType: v as MetricType })}
                            disabled={isReadOnly}
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

                        {/* reps_weight or reps_only: Sets grid */}
                        {(block.metricType === 'reps_weight' || block.metricType === 'reps_only') && (
                          <>
                            <div className={`grid gap-2 text-xs text-muted-foreground font-medium ${
                              block.metricType === 'reps_weight' ? 'grid-cols-12' : 'grid-cols-12'
                            }`}>
                              <div className="col-span-2">Set</div>
                              {block.metricType === 'reps_weight' && <div className="col-span-4">Weight (Kg)</div>}
                              <div className={block.metricType === 'reps_weight' ? 'col-span-4' : 'col-span-8'}>Reps</div>
                              <div className="col-span-2"></div>
                            </div>
                            {block.sets.map((set, setIndex) => (
                              <motion.div
                                key={set.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-12 gap-2 items-center"
                              >
                                <div className="col-span-2">
                                  <span className="text-sm font-medium text-muted-foreground">{setIndex + 1}</span>
                                </div>
                                {block.metricType === 'reps_weight' && (
                                  <div className="col-span-4">
                                    <Input
                                      type="number" min="0" step="0.5"
                                      value={set.weight || ''}
                                      onChange={(e) => updateSet(block.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                      placeholder="0" className="h-9" disabled={isReadOnly}
                                    />
                                  </div>
                                )}
                                <div className={block.metricType === 'reps_weight' ? 'col-span-4' : 'col-span-8'}>
                                  <Input
                                    type="number" min="0"
                                    value={set.reps || ''}
                                    onChange={(e) => updateSet(block.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                    placeholder="0" className="h-9" disabled={isReadOnly}
                                  />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                  {block.sets.length > 1 && !isReadOnly && (
                                    <Button
                                      variant="ghost" size="icon"
                                      onClick={() => removeSetFromBlock(block.id, set.id)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                            {!isReadOnly && (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => addSetToBlock(block.id)}
                                className="w-full mt-2"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Set
                              </Button>
                            )}
                          </>
                        )}

                        {/* time: duration hold */}
                        {block.metricType === 'time' && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Target duration (seconds)</Label>
                            <Input
                              type="number" min="0"
                              value={block.durationSeconds || ''}
                              onChange={(e) => patchBlock(block.id, { durationSeconds: parseInt(e.target.value) || 0 })}
                              placeholder="e.g. 60" className="h-10" disabled={isReadOnly}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Plank, dead hang, wall sit, stretch hold.
                            </p>
                          </div>
                        )}

                        {/* distance_time: distance + optional time cap */}
                        {block.metricType === 'distance_time' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Distance (meters)</Label>
                              <Input
                                type="number" min="0"
                                value={block.distanceMeters || ''}
                                onChange={(e) => patchBlock(block.id, { distanceMeters: parseFloat(e.target.value) || 0 })}
                                placeholder="e.g. 400" className="h-10" disabled={isReadOnly}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Time cap (sec, opt.)</Label>
                              <Input
                                type="number" min="0"
                                value={block.durationSeconds || ''}
                                onChange={(e) => patchBlock(block.id, { durationSeconds: parseInt(e.target.value) || 0 })}
                                placeholder="e.g. 90" className="h-10" disabled={isReadOnly}
                              />
                            </div>
                          </div>
                        )}

                        {/* amrap: minutes + target rounds (optional) */}
                        {block.metricType === 'amrap' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Time cap (min)</Label>
                              <Input
                                type="number" min="0"
                                value={block.emomMinutes || ''}
                                onChange={(e) => patchBlock(block.id, { emomMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="e.g. 10" className="h-10" disabled={isReadOnly}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Target rounds (opt.)</Label>
                              <Input
                                type="number" min="0"
                                value={block.rounds || ''}
                                onChange={(e) => patchBlock(block.id, { rounds: parseInt(e.target.value) || 0 })}
                                placeholder="e.g. 8" className="h-10" disabled={isReadOnly}
                              />
                            </div>
                          </div>
                        )}

                        {/* emom */}
                        {block.metricType === 'emom' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Duration (min)</Label>
                              <Input
                                type="number" min="0"
                                value={block.emomMinutes || ''}
                                onChange={(e) => patchBlock(block.id, { emomMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="e.g. 12" className="h-10" disabled={isReadOnly}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Reps per minute</Label>
                              <Input
                                type="number" min="0"
                                value={block.emomReps || ''}
                                onChange={(e) => patchBlock(block.id, { emomReps: parseInt(e.target.value) || 0 })}
                                placeholder="e.g. 10" className="h-10" disabled={isReadOnly}
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

            {!isReadOnly && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                  {isReadOnly ? 'No workout logged for this date' : 'Start by adding an exercise'}
                </p>
              </div>
            )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="dialog-footer p-6 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={!hasValidExercises} className="w-full">
              Save Workout
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
