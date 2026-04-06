import { ReactNode, useState } from 'react';
import { BottomNav } from './BottomNav';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { NotificationBell } from '@/components/notifications';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isTrainer } = useProfile();
  const { renewPlan, status } = useTrainerSubscription();
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    await renewPlan(planType);
    setShowPlanModal(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Trainer notification header */}
      {isTrainer && (
        <div className="fixed top-0 right-0 z-50 p-3 safe-top">
          <NotificationBell onOpenPlanSelection={() => setShowPlanModal(true)} />
        </div>
      )}

      <motion.main
        className="flex-1 pb-20"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
      <BottomNav />

      {/* Plan Selection Modal for notifications CTA */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handleSelectPlan}
        isRenewal={status.hasSubscription}
        currentPlan={status.subscription?.plan_type}
      />
    </div>
  );
};