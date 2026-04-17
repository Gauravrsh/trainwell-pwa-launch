import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorUtils';

export interface TrainerSubscription {
  id: string;
  trainer_id: string;
  plan_type: 'free' | 'trial' | 'monthly' | 'annual';
  status: 'trial' | 'active' | 'grace' | 'expired' | 'cancelled' | 'pending_payment';
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
  isPendingPayment: boolean;
  isFree: boolean;
  daysRemaining: number;
  isInGracePeriod: boolean;
  canInviteClients: boolean;
  activeClientCount: number;
  freeClientsRemaining: number;
  trialClientsRemaining: number;
  showExpiryWarning: boolean;
}

export function useTrainerSubscription() {
  const { user } = useAuth();
  const { profile, isTrainer } = useProfile();
  const [subscription, setSubscription] = useState<TrainerSubscription | null>(null);
  const [activeClientCount, setActiveClientCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user || !profile || !isTrainer) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [subRes, countRes] = await Promise.all([
        supabase
          .from('trainer_platform_subscriptions')
          .select('*')
          .eq('trainer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)('get_active_client_count', { p_trainer_id: profile.id }),
      ]);

      if (subRes.error) throw subRes.error;
      setSubscription(subRes.data as TrainerSubscription | null);
      if (!countRes.error && typeof countRes.data === 'number') {
        setActiveClientCount(countRes.data);
      }
    } catch (err) {
      logError('useTrainerSubscription', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [user, profile, isTrainer]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const getStatus = (): SubscriptionStatus => {
    // Treat orphan `pending_payment` rows (abandoned checkout, no webhook confirm)
    // as "no subscription" so the trainer sees the Free / Upgrade onboarding,
    // not a dead-end "Payment incomplete" wall.
    if (!subscription || subscription.status === 'pending_payment') {
      return {
        hasSubscription: false,
        subscription: null,
        isActive: false,
        isReadOnly: true,
        isPendingPayment: false,
        isFree: false,
        daysRemaining: 0,
        isInGracePeriod: false,
        canInviteClients: false,
        activeClientCount,
        freeClientsRemaining: 3,
        trialClientsRemaining: 3,
        showExpiryWarning: false,
      };
    }

    const isFree = subscription.plan_type === 'free';

    // Free tier: never expires, full access, 3 active client cap
    if (isFree) {
      const remaining = Math.max(0, 3 - activeClientCount);
      return {
        hasSubscription: true,
        subscription,
        isActive: true,
        isReadOnly: false,
        isPendingPayment: false,
        isFree: true,
        daysRemaining: 0,
        isInGracePeriod: false,
        canInviteClients: remaining > 0,
        activeClientCount,
        freeClientsRemaining: remaining,
        trialClientsRemaining: remaining,
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
    const isPendingPayment = false; // pending_payment handled in early-return above
    const isExpired = subscription.status === 'expired' ||
      (graceEndDate && today > graceEndDate) ||
      (daysRemaining < 0 && !graceEndDate);

    const isActive = ['trial', 'active'].includes(subscription.status) && daysRemaining >= 0;
    // Pending payment is NOT read-only — trainer keeps prior access until expiry/grace
    const isReadOnly = isExpired;
    const showExpiryWarning = daysRemaining <= 7 && daysRemaining >= 0;

    return {
      hasSubscription: true,
      subscription,
      isActive,
      isReadOnly,
      isPendingPayment,
      isFree: false,
      daysRemaining: Math.max(0, daysRemaining),
      isInGracePeriod,
      canInviteClients: isActive || isInGracePeriod,
      activeClientCount,
      freeClientsRemaining: 0,
      trialClientsRemaining: Infinity,
      showExpiryWarning,
    };
  };

  // Backward-compat: this now starts the FREE tier (no expiry)
  const startTrial = async () => {
    if (!profile) throw new Error('Profile not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await (supabase.rpc as any)('start_trainer_free', { p_trainer_id: profile.id }).single();
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

    const currentStatus = getStatus();
    const isActive = currentStatus.isActive && !currentStatus.isInGracePeriod && !currentStatus.isFree;

    const { data, error: rpcError } = await supabase
      .rpc('renew_trainer_subscription', {
        p_subscription_id: subscription.id,
        p_plan_type: planType,
        p_is_active: isActive,
      })
      .single();

    if (rpcError) throw rpcError;
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
