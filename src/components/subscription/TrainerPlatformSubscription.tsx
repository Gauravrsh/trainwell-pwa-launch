import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Clock, AlertTriangle, Check, Sparkles, Lock } from 'lucide-react';
import { logError } from '@/lib/errorUtils';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { PlanSelectionModal } from './PlanSelectionModal';
import { SubscriptionExpiryWarning } from './SubscriptionExpiryWarning';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function TrainerPlatformSubscription() {
  const { subscription, loading, status, startTrial, selectPlan, renewPlan } = useTrainerSubscription();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const handleStartTrial = async () => {
    try {
      setIsStartingTrial(true);
      await startTrial();
    } catch (error) {
      logError('TrainerPlatformSubscription.startTrial', error);
    } finally {
      setIsStartingTrial(false);
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
      console.error('Failed to select plan:', error);
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

  // No subscription - show onboarding
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
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">TrainWell Platform</h3>
              <p className="text-sm text-muted-foreground">Start managing clients today</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success" />
              <span>Manage up to 3 clients during trial</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success" />
              <span>Full access to all features</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartTrial}
              disabled={isStartingTrial}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {isStartingTrial ? 'Starting...' : 'Start Free Trial'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPlanModal(true)}
              className="flex-1"
            >
              View Plans
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

  // Has subscription - show status
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
              <h3 className="font-semibold text-foreground capitalize">
                {subscription?.plan_type} Plan
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

        {/* Status Pills */}
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
          
          {subscription?.plan_type === 'trial' && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
              {status.trialClientsRemaining} clients remaining
            </span>
          )}

          {status.daysRemaining > 0 && !status.isReadOnly && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {status.daysRemaining} days left
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status.isReadOnly || status.isInGracePeriod || status.showExpiryWarning ? (
            <Button
              onClick={() => setShowPlanModal(true)}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Renew Plan
            </Button>
          ) : subscription?.plan_type === 'trial' ? (
            <Button
              onClick={() => setShowPlanModal(true)}
              variant="outline"
              className="flex-1"
            >
              Upgrade to Paid Plan
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
