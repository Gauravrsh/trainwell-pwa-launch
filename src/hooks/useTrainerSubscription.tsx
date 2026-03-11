import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

export interface TrainerSubscription {
  id: string;
  trainer_id: string;
  plan_type: 'trial' | 'monthly' | 'annual';
  status: 'trial' | 'active' | 'grace' | 'expired' | 'cancelled';
  amount: number;
  start_date: string;
  end_date: string;
  grace_end_date: string | null;
  is_trial_used: boolean;
  trial_clients_count: number;
  max_trial_clients: number;
  payment_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: TrainerSubscription | null;
  isActive: boolean;
  isReadOnly: boolean;
  daysRemaining: number;
  isInGracePeriod: boolean;
  canInviteClients: boolean;
  trialClientsRemaining: number;
  showExpiryWarning: boolean;
}

export function useTrainerSubscription() {
  const { user } = useAuth();
  const { profile, isTrainer } = useProfile();
  const [subscription, setSubscription] = useState<TrainerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user || !profile || !isTrainer) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('trainer_platform_subscriptions')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setSubscription(data as TrainerSubscription | null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [user, profile, isTrainer]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const getStatus = (): SubscriptionStatus => {
    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
        isActive: false,
        isReadOnly: true,
        daysRemaining: 0,
        isInGracePeriod: false,
        canInviteClients: false,
        trialClientsRemaining: 3,
        showExpiryWarning: false,
      };
    }

    // Use UTC-based "today" to match server CURRENT_DATE
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    const endDate = new Date(subscription.end_date + 'T00:00:00Z');
    
    const graceEndDate = subscription.grace_end_date 
      ? new Date(subscription.grace_end_date + 'T00:00:00Z') 
      : null;

    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isInGracePeriod = subscription.status === 'grace' || (daysRemaining < 0 && graceEndDate && today <= graceEndDate);
    
    const isExpired = subscription.status === 'expired' || 
      (graceEndDate && today > graceEndDate) ||
      (daysRemaining < 0 && !graceEndDate);

    const isActive = ['trial', 'active'].includes(subscription.status) && daysRemaining >= 0;
    const isReadOnly = isExpired;

    const trialClientsRemaining = subscription.plan_type === 'trial' 
      ? subscription.max_trial_clients - subscription.trial_clients_count 
      : Infinity;

    const canInviteClients = (isActive || isInGracePeriod) && trialClientsRemaining > 0;
    
    // Show warning if 7 days or less remaining
    const showExpiryWarning = daysRemaining <= 7 && daysRemaining >= 0;

    return {
      hasSubscription: true,
      subscription,
      isActive,
      isReadOnly,
      daysRemaining: Math.max(0, daysRemaining),
      isInGracePeriod,
      canInviteClients,
      trialClientsRemaining: subscription.plan_type === 'trial' ? trialClientsRemaining : Infinity,
      showExpiryWarning,
    };
  };

  const startTrial = async () => {
    if (!profile) throw new Error('Profile not found');

    const { data, error: rpcError } = await supabase
      .rpc('start_trainer_trial', { p_trainer_id: profile.id })
      .single();

    if (rpcError) throw rpcError;
    setSubscription(data as TrainerSubscription);
    return data;
  };

  const selectPlan = async (planType: 'monthly' | 'annual') => {
    if (!profile) throw new Error('Profile not found');

    const { data, error: rpcError } = await supabase
      .rpc('create_trainer_subscription', {
        p_trainer_id: profile.id,
        p_plan_type: planType,
        p_is_trial_used: subscription?.is_trial_used || false,
      })
      .single();

    if (rpcError) throw rpcError;
    setSubscription(data as TrainerSubscription);
    return data;
  };

  const renewPlan = async (planType: 'monthly' | 'annual') => {
    if (!subscription) throw new Error('No existing subscription');

    const amount = planType === 'monthly' ? 499 : 5988;
    const durationDays = planType === 'monthly' ? 30 : 365;

    // If active, extend from current end date; if expired, start fresh
    const status = getStatus();
    const startDate = status.isActive && !status.isInGracePeriod
      ? new Date(subscription.end_date)
      : new Date();
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + 3);

    const { data, error: updateError } = await supabase
      .from('trainer_platform_subscriptions')
      .update({
        plan_type: planType,
        status: 'active',
        amount,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        grace_end_date: graceEndDate.toISOString().split('T')[0],
        payment_status: 'pending',
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) throw updateError;
    setSubscription(data as TrainerSubscription);
    return data;
  };

  return {
    subscription,
    loading,
    error,
    status: getStatus(),
    refetch: fetchSubscription,
    startTrial,
    selectPlan,
    renewPlan,
  };
}
