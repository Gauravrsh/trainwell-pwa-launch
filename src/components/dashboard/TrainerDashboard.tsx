import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Check, X, IndianRupee, Dumbbell, Utensils, ChevronRight, UserPlus, Share2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PaymentRequestModal } from '@/components/modals/PaymentRequestModal';
import { toast } from 'sonner';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { SubscriptionEnforcementBanner } from '@/components/subscription/SubscriptionEnforcementBanner';
import { PlanSelectionModal } from '@/components/subscription/PlanSelectionModal';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';

interface ClientWithStatus {
  id: string;
  unique_id: string;
  hasWorkoutToday: boolean;
  hasFoodToday: boolean;
  workoutStatus?: 'pending' | 'completed' | 'skipped';
}

export const TrainerDashboard = () => {
  const { profile, paymentInfo } = useProfile();
  const [selectedClient, setSelectedClient] = useState<ClientWithStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  const { isReadOnly, reason, loading } = useSubscriptionAccess();
  const { renewPlan, status } = useTrainerSubscription();

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    await renewPlan(planType);
    setShowPlanModal(false);
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch clients with their today's status
  const { data: clientsWithStatus = [], isLoading } = useQuery({
    queryKey: ['trainer-clients-status', profile?.id, today],
    queryFn: async () => {
      if (!profile) return [];

      // Use secure RPC that returns only non-sensitive client data
      const { data: clients, error: clientsError } = await supabase
        .rpc('get_trainer_clients');

      if (clientsError) throw clientsError;
      if (!clients?.length) return [];

      const clientIds = clients.map(c => c.id);

      // Get today's workouts for these clients
      const { data: workouts } = await supabase
        .from('workouts')
        .select('client_id, status')
        .in('client_id', clientIds)
        .eq('date', today);

      // Get today's food logs for these clients
      const { data: foodLogs } = await supabase
        .from('food_logs')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('logged_date', today);

      const workoutMap = new Map(workouts?.map(w => [w.client_id, w.status]) || []);
      const foodSet = new Set(foodLogs?.map(f => f.client_id) || []);

      return clients.map(client => ({
        ...client,
        hasWorkoutToday: workoutMap.has(client.id),
        workoutStatus: workoutMap.get(client.id) as 'pending' | 'completed' | 'skipped' | undefined,
        hasFoodToday: foodSet.has(client.id),
      })) as ClientWithStatus[];
    },
    enabled: !!profile,
  });

  const completedClients = clientsWithStatus.filter(
    c => c.workoutStatus === 'completed' && c.hasFoodToday
  ).length;

  const handleRequestPayment = (client: ClientWithStatus) => {
    setSelectedClient(client);
    setShowPaymentModal(true);
  };

  const handleInviteClient = () => {
    if (!profile?.unique_id) {
      toast.error('Unable to generate invite link. Please try again.');
      return;
    }

    const inviteUrl = `${window.location.origin}/auth?trainer=${profile.unique_id}`;
    const message = `Hey! Join me on Vecto for personalized fitness coaching. Click here to sign up: ${inviteUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to share invite link');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground text-sm font-medium mb-1">
            Trainer Dashboard
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Today's Overview
          </h1>
        </motion.div>
      </div>

      {/* Subscription Enforcement Banner */}
      {!loading && isReadOnly && (
        <div className="px-4 mb-4">
          <SubscriptionEnforcementBanner
            reason={reason}
            onSelectPlan={() => setShowPlanModal(true)}
          />
        </div>
      )}

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-2xl p-4 text-center border border-border">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{clientsWithStatus.length}</p>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-success/30">
            <Check className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{completedClients}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-destructive/30">
            <X className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-destructive">
              {clientsWithStatus.length - completedClients}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </motion.div>
      </div>

      {/* Client List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Client Status
          </h2>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), 'EEEE, MMM d')}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : clientsWithStatus.length > 0 ? (
          <div className="space-y-3">
            {clientsWithStatus.map((client, index) => {
              const isComplete = client.workoutStatus === 'completed' && client.hasFoodToday;
              
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-2xl border-2 transition-colors ${
                    isComplete
                      ? 'bg-success/5 border-success/30'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete ? 'bg-success/20' : 'bg-secondary'
                      }`}>
                        <span className="text-sm font-semibold text-foreground">
                          {client.unique_id.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Client #{client.unique_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isComplete ? 'All tasks completed' : 'Tasks pending'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      isComplete ? 'bg-success' : 'bg-destructive'
                    }`} />
                  </div>

                  {/* Status Indicators */}
                  <div className="flex gap-2 mb-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      client.workoutStatus === 'completed'
                        ? 'bg-success/20 text-success'
                        : client.workoutStatus === 'skipped'
                          ? 'bg-destructive/20 text-destructive'
                          : client.hasWorkoutToday
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted text-muted-foreground'
                    }`}>
                      <Dumbbell className="w-3 h-3" />
                      {client.workoutStatus === 'completed' 
                        ? 'Workout Done' 
                        : client.workoutStatus === 'skipped'
                          ? 'Skipped'
                          : client.hasWorkoutToday
                            ? 'In Progress'
                            : 'No Workout'}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      client.hasFoodToday
                        ? 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Utensils className="w-3 h-3" />
                      {client.hasFoodToday ? 'Food Logged' : 'No Food Log'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => handleRequestPayment(client)}
                      disabled={isReadOnly}
                    >
                      <IndianRupee className="w-3.5 h-3.5 mr-1.5" />
                      Request Payment
                    </Button>
                    <Button size="sm" variant="ghost">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              Invite your first client to start their fitness journey with you
            </p>
            <Button 
              onClick={handleInviteClient}
              size="lg"
              className="gap-2"
              disabled={isReadOnly}
            >
              <Share2 className="w-5 h-5" />
              Invite Client via WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Your unique trainer ID: <span className="font-mono font-semibold text-foreground">{profile?.unique_id}</span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedClient && (
        <PaymentRequestModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          clientName={`Client #${selectedClient.unique_id}`}
          clientId={selectedClient.unique_id}
          trainerVpa={paymentInfo?.vpa_address || ''}
        />
      )}

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
};
