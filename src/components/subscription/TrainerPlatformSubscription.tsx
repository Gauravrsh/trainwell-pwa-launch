import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Clock, AlertTriangle, Sparkles, Lock, Users } from 'lucide-react';
import { logError } from '@/lib/errorUtils';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { PlanSelectionModal } from './PlanSelectionModal';
import { SubscriptionExpiryWarning } from './SubscriptionExpiryWarning';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function TrainerPlatformSubscription() {
  const { subscription, loading, status, startTrial, selectPlan, renewPlan } = useTrainerSubscription();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isStartingFree, setIsStartingFree] = useState(false);

  const handleStartFree = async () => {
    try {
      setIsStartingFree(true);
      await startTrial(); // RPC now starts the FREE tier
    } catch (error) {
      logError('TrainerPlatformSubscription.startFree', error);
    } finally {
      setIsStartingFree(false);
    }
  };

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    try {
      if (status.hasSubscription) {
        await renewPlan(planType);
      } else {
        await selectPlan(planType);
      }
      setShowPlanModal(false);
    } catch (error) {
      logError('TrainerPlatformSubscription.selectPlan', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  // No subscription row at all → onboard to FREE
  if (!status.hasSubscription) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-br from-card to-secondary/30 rounded-2xl border border-primary/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Start free, forever</h3>
              <p className="text-sm text-muted-foreground">3 active clients · all features</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartFree}
              disabled={isStartingFree}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {isStartingFree ? 'Activating...' : 'Activate Free Plan'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPlanModal(true)}
              className="flex-1"
            >
              View Paid Plans
            </Button>
          </div>
        </motion.div>

        <PlanSelectionModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={handleSelectPlan}
          isRenewal={false}
        />
      </>
    );
  }

  // FREE plan view → show slot counter + upgrade CTA
  if (status.isFree) {
    const used = status.activeClientCount;
    const max = 3;
    const pct = Math.min(100, (used / max) * 100);

    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border bg-card border-border"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Plan (Free)</h3>
                <p className="text-sm text-muted-foreground">All features unlocked, forever</p>
              </div>
            </div>
          </div>

          {/* Active client slot meter */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Active clients
              </span>
              <span className={`font-bold ${used >= max ? 'text-destructive' : 'text-foreground'}`}>
                {used} / {max}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  used >= max ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {used >= max && (
              <p className="text-xs text-destructive mt-2">
                Free limit reached. Upgrade to add more clients.
              </p>
            )}
          </div>

          <Button
            onClick={() => setShowPlanModal(true)}
            className="w-full bg-primary text-primary-foreground"
          >
            Upgrade for Unlimited Clients
          </Button>
        </motion.div>

        <PlanSelectionModal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={handleSelectPlan}
          isRenewal={true}
          currentPlan="free"
        />
      </>
    );
  }

  // Paid plan view (monthly / annual)
  return (
    <>
      <AnimatePresence>
        {status.showExpiryWarning && (
          <SubscriptionExpiryWarning
            daysRemaining={status.daysRemaining}
            endDate={subscription?.end_date || ''}
            onRenew={() => setShowPlanModal(true)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-4 rounded-2xl border ${
          status.isReadOnly
            ? 'bg-destructive/10 border-destructive/30'
            : status.isInGracePeriod
            ? 'bg-warning/10 border-warning/30'
            : 'bg-card border-border'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              status.isReadOnly
                ? 'bg-destructive/20'
                : status.isInGracePeriod
                ? 'bg-warning/20'
                : 'bg-primary/20'
            }`}>
              {status.isReadOnly ? (
                <Lock className="w-5 h-5 text-destructive" />
              ) : status.isInGracePeriod ? (
                <AlertTriangle className="w-5 h-5 text-warning" />
              ) : (
                <Crown className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {subscription?.plan_type === 'annual' ? 'Elite' : subscription?.plan_type === 'monthly' ? 'Pro' : (subscription?.plan_type ?? '')} Plan
              </h3>
              <p className={`text-sm ${
                status.isReadOnly
                  ? 'text-destructive'
                  : status.isInGracePeriod
                  ? 'text-warning'
                  : 'text-muted-foreground'
              }`}>
                {status.isReadOnly
                  ? 'Subscription expired - Read only mode'
                  : status.isInGracePeriod
                  ? 'Grace period - Renew to continue'
                  : `Valid until ${format(new Date(subscription?.end_date || ''), 'dd MMM yyyy')}`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status.isActive
              ? 'bg-success/20 text-success'
              : status.isInGracePeriod
              ? 'bg-warning/20 text-warning'
              : 'bg-destructive/20 text-destructive'
          }`}>
            {status.isActive ? 'Active' : status.isInGracePeriod ? 'Grace Period' : 'Expired'}
          </span>

          {status.daysRemaining > 0 && !status.isReadOnly && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {status.daysRemaining} days left
            </span>
          )}
        </div>

        <div className="flex gap-3">
          {status.isReadOnly || status.isInGracePeriod || status.showExpiryWarning ? (
            <Button
              onClick={() => setShowPlanModal(true)}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Renew Plan
            </Button>
          ) : null}
        </div>
      </motion.div>

      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handleSelectPlan}
        isRenewal={status.hasSubscription}
        currentPlan={subscription?.plan_type}
      />
    </>
  );
}
