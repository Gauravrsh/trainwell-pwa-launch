import { motion } from 'framer-motion';
import { Crown, Users, ChevronRight } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { TrainerPlatformSubscription } from './TrainerPlatformSubscription';
import { ClientSubscriptionView } from './ClientSubscriptionView';

interface SubscriptionSectionProps {
  onNavigateToClientPlans?: () => void;
}

export function SubscriptionSection({ onNavigateToClientPlans }: SubscriptionSectionProps) {
  const { isTrainer, isClient } = useProfile();

  if (isClient) {
    return <ClientSubscriptionView />;
  }

  if (isTrainer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Subscriptions</h2>
        </div>

        {/* Platform Subscription */}
        <TrainerPlatformSubscription />

        {/* Client Plans Navigation */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToClientPlans}
          className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Client Training Plans</p>
              <p className="text-sm text-muted-foreground">Manage plans with your clients</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </motion.div>
    );
  }

  return null;
}
