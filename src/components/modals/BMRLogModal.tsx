import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/errorUtils';

interface BMRLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const BMRLogModal = ({ open, onOpenChange, onSuccess }: BMRLogModalProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [bmrValue, setBmrValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill with current BMR when modal opens
  useEffect(() => {
    if (open && profile?.bmr) {
      setBmrValue(profile.bmr.toString());
    }
  }, [open, profile?.bmr]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    const bmr = parseInt(bmrValue, 10);
    if (isNaN(bmr) || bmr < 500 || bmr > 10000) {
      toast({
        title: 'Invalid BMR',
        description: 'Please enter a BMR between 500 and 10,000 kcal',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bmr, bmr_updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'BMR updated',
        description: `Your BMR has been set to ${bmr} kcal/day`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      logError('BMRLogModal.handleSave', err);
      toast({
        title: 'Error',
        description: 'Failed to update BMR',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Log BMR
          </DialogTitle>
          <DialogDescription>
            Enter your Basal Metabolic Rate (kcal/day)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bmr-input">BMR (kcal/day)</Label>
            <Input
              id="bmr-input"
              type="number"
              min={500}
              max={10000}
              placeholder="e.g. 1800"
              value={bmrValue}
              onChange={(e) => setBmrValue(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !bmrValue}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save BMR'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
