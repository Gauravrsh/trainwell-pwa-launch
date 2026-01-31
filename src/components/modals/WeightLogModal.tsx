import { useState } from 'react';
import { Scale, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorUtils';

interface WeightLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: Date;
}

export const WeightLogModal = ({
  open,
  onOpenChange,
  onSuccess,
  defaultDate = new Date(),
}: WeightLogModalProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(format(defaultDate, 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 20 || weightValue > 500) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a weight between 20 and 500 kg',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Upsert to handle updating same day's entry
      const { error } = await supabase
        .from('weight_logs')
        .upsert(
          {
            client_id: profile.id,
            weight_kg: weightValue,
            logged_date: date,
          },
          { onConflict: 'client_id,logged_date' }
        );

      if (error) throw error;

      // Also update profile's current weight
      await supabase
        .from('profiles')
        .update({ weight_kg: weightValue })
        .eq('id', profile.id);

      toast({
        title: 'Weight logged',
        description: `${weightValue} kg recorded for ${format(new Date(date), 'MMM d, yyyy')}`,
      });

      setWeight('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      logError('WeightLogModal.handleSave', err);
      toast({
        title: 'Error',
        description: 'Failed to save weight. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Log Weight
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              min={20}
              max={500}
              step={0.1}
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!weight || saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Weight'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
