import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface SubscriptionExpiryWarningProps {
  daysRemaining: number;
  endDate: string;
}

export function SubscriptionExpiryWarning({
  daysRemaining,
  endDate,
}: SubscriptionExpiryWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const formattedDate = endDate ? format(new Date(endDate), 'dd MMMM yyyy') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="p-4 bg-warning/10 border border-warning/30 rounded-2xl mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground">
              Subscription Expiring Soon
            </h4>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your plan ends on <span className="font-medium text-foreground">{formattedDate}</span> 
            {daysRemaining > 0 && ` (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining)`}.
            After 3 grace days, both you and your clients will have read-only access.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
