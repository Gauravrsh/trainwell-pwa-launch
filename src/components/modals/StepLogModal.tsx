import { useState, useEffect, useRef } from 'react';
import { Footprints, ScanLine, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { scanStepCountFromImage } from '@/lib/stepOcr';
import { logError } from '@/lib/errorUtils';

interface StepLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  existingStepLog: { id: string; step_count: number } | null;
  onSave: (stepCount: number) => Promise<void>;
  loading: boolean;
}

export function StepLogModal({
  open,
  onOpenChange,
  date,
  existingStepLog,
  onSave,
  loading,
}: StepLogModalProps) {
  const [stepCount, setStepCount] = useState('');
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStepCount(existingStepLog ? String(existingStepLog.step_count) : '');
      setOcrNotice(null);
      setOcrRunning(false);
    }
  }, [open, existingStepLog]);

  const handleSave = async () => {
    const count = parseInt(stepCount);
    if (isNaN(count) || count <= 0) return;
    await onSave(count);
  };

  const handleScanClick = () => {
    setOcrNotice(null);
    fileInputRef.current?.click();
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so picking the same file twice still fires onChange.
    if (e.target) e.target.value = '';
    if (!file) return;

    setOcrRunning(true);
    setOcrNotice(null);
    try {
      const detected = await scanStepCountFromImage(file);
      if (detected == null) {
        setOcrNotice("Couldn't read a step count from this image. Please type it in.");
      } else {
        setStepCount(String(detected));
        setOcrNotice(`Detected ${detected.toLocaleString()} — confirm or edit before saving.`);
      }
    } catch (err) {
      logError('StepLogModal.ocr', err);
      setOcrNotice("Couldn't read the screenshot. Please type the number in.");
    } finally {
      setOcrRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-content sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" />
            {existingStepLog ? 'Update Steps' : 'Log Steps'}
          </DialogTitle>
          {date && (
            <p className="text-sm text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Step Count</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g., 8000"
              value={stepCount}
              onChange={(e) => setStepCount(e.target.value)}
              className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScanFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleScanClick}
              disabled={ocrRunning || loading}
              className="w-full"
            >
              {ocrRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reading step count…
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 mr-2" />
                  Scan screenshot
                </>
              )}
            </Button>
            {ocrNotice && (
              <p className="text-xs text-muted-foreground">{ocrNotice}</p>
            )}
          </div>

          {stepCount && parseInt(stepCount) > 0 && (
            <div className="flex items-center justify-around text-center p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {(parseInt(stepCount) * 0.0008).toFixed(1)} km
                </p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {Math.round(parseInt(stepCount) * 0.04)} kcal
                </p>
                <p className="text-xs text-muted-foreground">Energy</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={loading || !stepCount || parseInt(stepCount) <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? 'Saving...' : existingStepLog ? 'Update Steps' : 'Log Steps'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
