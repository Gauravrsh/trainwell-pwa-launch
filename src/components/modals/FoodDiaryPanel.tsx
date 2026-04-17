import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Trash2, Sparkles, Sparkle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorUtils';
import { FoodDiaryEditModal, FoodDiaryEditValues } from './FoodDiaryEditModal';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface DiaryRow {
  id: string;
  meal_type: MealType;
  raw_text: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  pending_analysis: boolean;
  matched_dictionary_id: string | null;
}

interface Props {
  clientId: string | null;
  loggedDate: string; // yyyy-MM-dd
  isToday: boolean;
  isReadOnly: boolean; // true for trainers
  refreshSignal: number; // bump to force refetch (after a save)
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙',
};

export const FoodDiaryPanel = ({ clientId, loggedDate, isToday, isReadOnly, refreshSignal }: Props) => {
  const [rows, setRows] = useState<DiaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<DiaryRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('food_logs')
        .select('id, meal_type, raw_text, calories, protein, carbs, fat, pending_analysis, matched_dictionary_id')
        .eq('client_id', clientId)
        .eq('logged_date', loggedDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setRows((data || []) as DiaryRow[]);
    } catch (err) {
      logError('FoodDiaryPanel.fetch', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, loggedDate]);

  useEffect(() => { void fetchRows(); }, [fetchRows, refreshSignal]);

  const grouped = MEAL_ORDER
    .map((m) => ({ meal: m, items: rows.filter((r) => r.meal_type === m) }))
    .filter((g) => g.items.length > 0);

  const completed = rows.filter((r) => !r.pending_analysis);
  const pendingCount = rows.length - completed.length;
  const totals = completed.reduce(
    (a, r) => ({
      kcal: a.kcal + (r.calories || 0),
      p: a.p + (r.protein || 0),
      c: a.c + (r.carbs || 0),
      f: a.f + (r.fat || 0),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const handleDelete = async (row: DiaryRow) => {
    // Snapshot for undo
    const snapshot = { ...row };
    // Optimistic remove
    setRows((prev) => prev.filter((r) => r.id !== row.id));

    const { error } = await supabase.from('food_logs').delete().eq('id', row.id);
    if (error) {
      logError('FoodDiaryPanel.delete', error);
      toast.error('Failed to delete');
      void fetchRows();
      return;
    }

    // Cache feedback (negative signal)
    if (snapshot.matched_dictionary_id) {
      void supabase.functions.invoke('record-food-edit', {
        body: {
          action: 'delete',
          dictionaryId: snapshot.matched_dictionary_id,
          original: {
            kcal: snapshot.calories || 0,
            protein: snapshot.protein || 0,
            carbs: snapshot.carbs || 0,
            fat: snapshot.fat || 0,
          },
        },
      });
    }

    toast('Meal deleted', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: async () => {
          const { error: insErr } = await supabase.from('food_logs').insert({
            id: snapshot.id,
            client_id: clientId!,
            logged_date: loggedDate,
            meal_type: snapshot.meal_type,
            raw_text: snapshot.raw_text,
            calories: snapshot.calories,
            protein: snapshot.protein,
            carbs: snapshot.carbs,
            fat: snapshot.fat,
            pending_analysis: snapshot.pending_analysis,
            matched_dictionary_id: snapshot.matched_dictionary_id,
          });
          if (insErr) {
            logError('FoodDiaryPanel.undoDelete', insErr);
            toast.error('Undo failed');
          } else {
            void fetchRows();
          }
        },
      },
    });
  };

  const handleEditSave = async (values: FoodDiaryEditValues) => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('food_logs')
        .update({
          calories: values.calories,
          protein: values.protein,
          carbs: values.carbs,
          fat: values.fat,
          pending_analysis: false,
        })
        .eq('id', editing.id);
      if (error) throw error;

      // Cache feedback (positive correction)
      if (editing.matched_dictionary_id) {
        void supabase.functions.invoke('record-food-edit', {
          body: {
            action: 'edit',
            dictionaryId: editing.matched_dictionary_id,
            foodName: editing.raw_text || 'edited entry',
            original: {
              kcal: editing.calories || 0,
              protein: editing.protein || 0,
              carbs: editing.carbs || 0,
              fat: editing.fat || 0,
            },
            edited: {
              kcal: values.calories,
              protein: values.protein,
              carbs: values.carbs,
              fat: values.fat,
            },
          },
        });
      }

      toast.success('Updated');
      setEditing(null);
      void fetchRows();
    } catch (err) {
      logError('FoodDiaryPanel.editSave', err);
      toast.error('Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!clientId) return null;

  return (
    <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Diary
        </span>
        {!loading && rows.length > 0 && (
          <span className="text-xs tabular-nums">
            <span className="text-primary font-semibold">{Math.round(totals.kcal)} kcal</span>
            <span className="text-muted-foreground ml-2">
              P{Math.round(totals.p * 10) / 10} · C{Math.round(totals.c * 10) / 10} · F{Math.round(totals.f * 10) / 10}
            </span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nothing logged yet for this day.
        </p>
      ) : (
        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {grouped.map(({ meal, items }) => (
              <div key={meal} className="px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                  <span>{MEAL_EMOJI[meal]}</span>
                  <span className="capitalize">{meal}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-start gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{r.raw_text || 'Logged meal'}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {r.pending_analysis ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                              <Clock className="w-2.5 h-2.5" /> pending
                            </span>
                          ) : r.matched_dictionary_id ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                              <Sparkles className="w-2.5 h-2.5" /> kitchen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              <Sparkle className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                          {!r.pending_analysis && (
                            <span className="text-[10px] text-muted-foreground">
                              {r.calories || 0} kcal · P{r.protein || 0} C{r.carbs || 0} F{r.fat || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isReadOnly && isToday && (
                        <div className="flex-shrink-0 flex items-center gap-0.5">
                          <button
                            onClick={() => setEditing(r)}
                            className="text-muted-foreground hover:text-foreground p-1.5"
                            aria-label="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(r)}
                            className="text-muted-foreground hover:text-destructive p-1.5"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && rows.length > 0 && pendingCount > 0 && (
        <div className="px-3 py-1.5 border-t border-border bg-background/30">
          <p className="text-[10px] text-muted-foreground italic">
            * Total excludes {pendingCount} pending {pendingCount === 1 ? 'row' : 'rows'}.
          </p>
        </div>
      )}

      {!isReadOnly && !isToday && rows.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border bg-background/30">
          <p className="text-[10px] text-muted-foreground italic">Past entries locked.</p>
        </div>
      )}

      {isReadOnly && rows.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border bg-background/30">
          <p className="text-[10px] text-muted-foreground italic">Read-only — only your client can edit.</p>
        </div>
      )}

      <FoodDiaryEditModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={{
          calories: editing?.calories || 0,
          protein: editing?.protein || 0,
          carbs: editing?.carbs || 0,
          fat: editing?.fat || 0,
        }}
        mealLabel={editing ? `${MEAL_EMOJI[editing.meal_type]} ${editing.meal_type}` : ''}
        saving={savingEdit}
        onSave={handleEditSave}
      />
    </div>
  );
};
