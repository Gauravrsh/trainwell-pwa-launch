import { motion } from 'framer-motion';
import { Crown, Check, Calendar, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';

export function ClientSubscriptionView() {
  const { profile } = useProfile();

  const { data: trainingPlans, isLoading } = useQuery({
    queryKey: ['clientTrainingPlans', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('client_training_plans')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">My Training Plans</h2>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  const activePlan = trainingPlans?.find(p => p.status === 'active');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">My Training Plans</h2>
      </div>

      {/* Free Badge */}
      <div className="p-4 bg-success/10 rounded-2xl border border-success/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Vecto is Free for Clients</p>
            <p className="text-sm text-muted-foreground">
              No platform fees. Your trainer handles the billing.
            </p>
          </div>
        </div>
      </div>

      {/* Active Training Plan */}
      {activePlan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-card rounded-2xl border border-border"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{activePlan.plan_name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {activePlan.service_type === 'both' 
                  ? 'Workout & Nutrition' 
                  : activePlan.service_type}
              </p>
            </div>
            <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(activePlan.start_date), 'dd MMM')} - {format(new Date(activePlan.end_date), 'dd MMM yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span className="capitalize">{activePlan.billing_model}</span>
            </div>
          </div>

          {/* Session Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sessions</span>
              <span className="text-foreground font-medium">
                {activePlan.completed_sessions} / {activePlan.total_sessions}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ 
                  width: `${(activePlan.completed_sessions / activePlan.total_sessions) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Payment Status */}
          {activePlan.amount_due > 0 && (
            <div className="mt-4 p-3 bg-warning/10 rounded-xl border border-warning/30">
              <p className="text-sm text-warning font-medium">
                ₹{activePlan.amount_due.toLocaleString()} due
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="p-6 bg-card rounded-2xl border border-border text-center">
          <p className="text-muted-foreground mb-2">No active training plan</p>
          <p className="text-sm text-muted-foreground">
            Your trainer will set up your plan when you get started.
          </p>
        </div>
      )}

      {/* Past Plans */}
      {trainingPlans && trainingPlans.filter(p => p.status !== 'active').length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Past Plans</h3>
          {trainingPlans
            .filter(p => p.status !== 'active')
            .slice(0, 3)
            .map((plan) => (
              <div 
                key={plan.id}
                className="p-3 bg-muted/50 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{plan.plan_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(plan.start_date), 'MMM yyyy')} - {format(new Date(plan.end_date), 'MMM yyyy')}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  plan.status === 'completed' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {plan.status}
                </span>
              </div>
            ))}
        </div>
      )}
    </motion.div>
  );
}
