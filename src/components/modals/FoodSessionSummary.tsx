import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import type { DiaryRow } from './FoodDiaryPanel';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodSessionSummaryProps {
  /**
   * TW-032: All of today's diary rows from the DB. The summary is now a pure
   * derived view — never a parallel store — so it cannot disagree with the
   * Today's Diary header.
   */
  rows: DiaryRow[];
  /**
   * ISO timestamp captured when the modal opened. Rows whose created_at >=
   * this value count as "this session"; the pill collapses anything older
   * into the count but only highlights session adds. When omitted, every row
   * counts (back-compat).
   */
  modalOpenedAt?: string;
}

const mealEmojis: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎'
};

export const FoodSessionSummary = ({ rows, modalOpenedAt }: FoodSessionSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only count completed (non-pending) rows logged in this modal session.
  const sessionRows = rows.filter((r) => {
    if (r.pending_analysis) return false;
    if (!modalOpenedAt) return true;
    return r.created_at >= modalOpenedAt;
  });

  if (sessionRows.length === 0) return null;

  const meals = sessionRows.map((r) => ({
    mealType: r.meal_type as MealType,
    calories: r.calories || 0,
    protein: r.protein || 0,
    carbs: r.carbs || 0,
    fat: r.fat || 0,
  }));

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4"
      aria-live="polite"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {meals.slice(0, 3).map((meal, i) => (
                  <span key={i} className="text-sm">{mealEmojis[meal.mealType]}</span>
                ))}
                {meals.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">+{meals.length - 3}</span>
                )}
              </div>
              <span className="text-sm font-medium text-foreground">
                {meals.length} meal{meals.length > 1 ? 's' : ''} logged
              </span>
              <span className="text-sm font-bold text-primary">
                {totals.calories} kcal
              </span>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 space-y-2"
          >
            {/* Cumulative totals */}
            <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-secondary/50 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <Flame className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary">{totals.calories}</span>
                <span className="text-[10px] text-muted-foreground">kcal</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Beef className="w-3 h-3 text-red-400" />
                <span className="text-xs font-bold text-foreground">{totals.protein}g</span>
                <span className="text-[10px] text-muted-foreground">Protein</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Wheat className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-bold text-foreground">{totals.carbs}g</span>
                <span className="text-[10px] text-muted-foreground">Carbs</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-bold text-foreground">{totals.fat}g</span>
                <span className="text-[10px] text-muted-foreground">Fat</span>
              </div>
            </div>

            {/* Individual meals */}
            <div className="space-y-1">
              {meals.map((meal, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{mealEmojis[meal.mealType]}</span>
                    <span className="text-sm capitalize text-foreground">{meal.mealType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{meal.calories} kcal</span>
                    <span>P:{meal.protein}g</span>
                    <span>C:{meal.carbs}g</span>
                    <span>F:{meal.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};
