import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PlanCard } from './PlanCard';
import { CreatePlanModal } from './CreatePlanModal';
import { useTrainingPlans, type CreatePlanData } from '@/hooks/useTrainingPlans';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { SubscriptionEnforcementBanner } from '@/components/subscription/SubscriptionEnforcementBanner';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
interface Client {
  id: string;
  unique_id: string;
  full_name: string | null;
}

export function PlansList() {
  const { profile, isTrainer } = useProfile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  // Subscription access for trainers
  const { isReadOnly, reason, loading: subscriptionLoading } = useSubscriptionAccess();
  const { renewPlan, status } = useTrainerSubscription();

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    await renewPlan(planType);
    setShowPlanModal(false);
  };

  const {
    plans,
    activePlans,
    draftPlans,
    completedPlans,
    pausedPlans,
    isLoading,
    createPlan,
    activatePlan,
    pausePlan,
    resumePlan,
    cancelPlan,
    completePlan,
    deletePlan,
    isCreating,
  } = useTrainingPlans();

  // Fetch clients for the create modal
  const { data: clients = [] } = useQuery({
    queryKey: ['trainer-clients', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase.rpc('get_trainer_clients');
      if (error) throw error;
      return (data || []) as Client[];
    },
    enabled: !!profile && isTrainer,
  });

  const handleCreatePlan = async (data: CreatePlanData) => {
    await createPlan(data);
  };

  const getPlansForTab = (tab: string) => {
    switch (tab) {
      case 'active': return activePlans;
      case 'draft': return draftPlans;
      case 'paused': return pausedPlans;
      case 'completed': return completedPlans;
      default: return plans;
    }
  };

  const currentPlans = getPlansForTab(activeTab);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Billing & Plans
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Manage Billing
            </h1>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2" disabled={isReadOnly}>
            <Plus className="w-4 h-4" />
            New Plan
          </Button>
        </motion.div>
      </div>

      {/* Subscription Enforcement Banner */}
      {!subscriptionLoading && isReadOnly && (
        <div className="px-4 mb-4">
          <SubscriptionEnforcementBanner
            reason={reason}
            onSelectPlan={() => setShowPlanModal(true)}
          />
        </div>
      )}

      {/* Stats Summary - Clickable */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { label: 'Active', count: activePlans.length, color: 'text-success', tab: 'active' },
            { label: 'Draft', count: draftPlans.length, color: 'text-muted-foreground', tab: 'draft' },
            { label: 'Paused', count: pausedPlans.length, color: 'text-warning', tab: 'paused' },
            { label: 'Done', count: completedPlans.length, color: 'text-primary', tab: 'completed' },
          ].map(stat => (
            <motion.button
              key={stat.label}
              onClick={() => setActiveTab(stat.tab)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'bg-card rounded-xl p-3 text-center border transition-all',
                activeTab === stat.tab 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/30'
              )}
            >
              <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Plans List */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentPlans.length > 0 ? (
              <div className="space-y-4">
                {currentPlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onActivate={activatePlan}
                    onPause={pausePlan}
                    onResume={resumePlan}
                    onCancel={cancelPlan}
                    onComplete={completePlan}
                    onDelete={deletePlan}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No {activeTab} plans
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {activeTab === 'active' 
                    ? 'Create a new plan to get started'
                    : `No plans in ${activeTab} status`}
                </p>
                {activeTab === 'active' && (
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Plan
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <CreatePlanModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        clients={clients}
        onSubmit={handleCreatePlan}
        isSubmitting={isCreating}
      />

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSelectPlan={handleSelectPlan}
        isRenewal={status.hasSubscription}
        currentPlan={status.subscription?.plan_type}
      />
    </div>
  );
}
