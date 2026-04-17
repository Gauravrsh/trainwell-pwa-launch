import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface FoodDiaryEditValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: FoodDiaryEditValues;
  mealLabel: string;
  saving?: boolean;
  onSave: (v: FoodDiaryEditValues) => void;
}

export const FoodDiaryEditModal = ({ open, onOpenChange, initial, mealLabel, saving, onSave }: Props) => {
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useEffect(() => {
    if (open) {
      setKcal(String(initial.calories ?? 0));
      setProtein(String(initial.protein ?? 0));
      setCarbs(String(initial.carbs ?? 0));
      setFat(String(initial.fat ?? 0));
    }
  }, [open, initial.calories, initial.protein, initial.carbs, initial.fat]);

  const handleSave = () => {
    onSave({
      calories: Math.max(0, Math.round(Number(kcal) || 0)),
      protein: Math.max(0, Math.round((Number(protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(fat) || 0) * 10) / 10),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit macros · {mealLabel}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Calories (kcal)</Label>
            <input
              type="number"
              inputMode="numeric"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Protein (g)</Label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Carbs (g)</Label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Fat (g)</Label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
