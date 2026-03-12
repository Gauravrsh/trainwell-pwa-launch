import { motion, AnimatePresence } from 'framer-motion';
import { X, MoreVertical, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPromptModalProps {
  open: boolean;
  onClose: () => void;
  onRemindLater: () => void;
}

export function InstallPromptModal({ open, onClose, onRemindLater }: InstallPromptModalProps) {
  if (!open) return null;

  const steps = [
    { number: 1, text: 'Tap the More button', icon: <MoreVertical className="inline w-5 h-5 text-muted-foreground" /> },
    { number: 2, text: 'Select', boldText: 'Add to Home Screen' },
    { number: 3, text: 'Tap', boldText: 'Install', suffix: 'in the popup' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
          >
            <div className="relative bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Header */}
                <h2 className="text-2xl font-bold text-foreground mb-2">
                   Install TrainWell
                 </h2>
                 <p className="text-muted-foreground mb-6">
                   Get the full app experience – add TrainWell to your home screen for quick and easy access!
                </p>

                {/* Steps */}
                <div className="space-y-4 mb-6">
                  {steps.map((step) => (
                    <div key={step.number} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-medium flex-shrink-0">
                        {step.number}
                      </div>
                      <p className="text-foreground">
                        {step.text}{' '}
                        {step.icon}
                        {step.boldText && <span className="font-semibold">{step.boldText}</span>}
                        {step.suffix && ` ${step.suffix}`}
                        {step.number === 1 && '.'}
                        {step.number === 2 && '.'}
                        {step.number === 3 && '.'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Phone illustration */}
                <div className="bg-secondary/50 rounded-xl p-6 mb-6">
                  <div className="relative mx-auto w-48 h-64 bg-card rounded-3xl border-4 border-muted overflow-hidden shadow-lg">
                    {/* Phone screen content */}
                    <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
                      <div className="w-8 h-1.5 bg-muted rounded-full" />
                      <div className="w-2 h-1.5 bg-muted rounded-full" />
                      <div className="w-2 h-1.5 bg-muted rounded-full" />
                    </div>
                    
                    {/* Browser bar mockup */}
                    <div className="absolute top-10 left-3 right-3 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 h-6 bg-muted rounded-md" />
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 text-muted-foreground">+</div>
                        <div className="w-4 h-4 border border-muted-foreground rounded-sm" />
                        <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
                          <MoreVertical className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Content placeholders */}
                    <div className="absolute top-24 left-3 right-3 space-y-3">
                      <div className="flex justify-between">
                        <div className="w-16 h-4 bg-muted rounded" />
                        <div className="w-12 h-4 bg-muted rounded" />
                      </div>
                      <div className="w-full h-3 bg-muted rounded" />
                      <div className="w-3/4 h-3 bg-muted rounded" />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={onClose}
                    className="w-full h-12 bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90"
                  >
                    OK
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onRemindLater}
                    className="w-full h-12 border-border text-foreground font-medium hover:bg-secondary"
                  >
                    Remind me later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
