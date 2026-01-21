import { motion } from 'framer-motion';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionEnforcementBannerProps {
  reason: 'no_subscription' | 'subscription_expired' | string | null;
  onSelectPlan?: () => void;
  compact?: boolean;
}

export function SubscriptionEnforcementBanner({
  reason,
  onSelectPlan,
  compact = false,
}: SubscriptionEnforcementBannerProps) {
  if (!reason) return null;

  const isExpired = reason === 'subscription_expired';
  const isNoSubscription = reason === 'no_subscription';

  const title = isExpired
    ? 'Subscription Expired'
    : isNoSubscription
      ? 'No Active Subscription'
      : 'Read-Only Mode';

  const description = isExpired
    ? 'Your subscription has expired. Renew to continue managing your clients and logging data.'
    : isNoSubscription
      ? 'Start your free trial or select a plan to begin managing clients.'
      : 'You are currently in read-only mode. Select a plan to unlock full access.';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm"
      >
        <Lock className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="text-destructive font-medium flex-1">{title}</span>
        {onSelectPlan && (
          <Button size="sm" variant="destructive" onClick={onSelectPlan} className="h-7 text-xs">
            Select Plan
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-destructive mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {onSelectPlan && (
            <Button onClick={onSelectPlan} variant="destructive" size="sm">
              Select Plan
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
