import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { useProfile } from '@/hooks/useProfile';

/**
 * Hook to check if current user has access to modify data (not read-only)
 * - Free tier trainers: full access to all features. Invite gating handled separately by canInviteClients.
 * - Paid (monthly/annual) trainers: full access while active.
 * - Expired trainers: read-only.
 * - Clients: always full access (free to use).
 */
export function useSubscriptionAccess() {
  const { isTrainer, isClient, loading: profileLoading } = useProfile();
  const { status, loading: subscriptionLoading } = useTrainerSubscription();

  const loading = profileLoading || (isTrainer && subscriptionLoading);

  if (loading) {
    return {
      loading: true,
      hasAccess: true,
      isReadOnly: false,
      canInviteClients: false,
      isFree: false,
      activeClientCount: 0,
      freeClientsRemaining: 3,
      reason: null,
    };
  }

  if (isClient) {
    return {
      loading,
      hasAccess: true,
      isReadOnly: false,
      canInviteClients: false,
      isFree: false,
      activeClientCount: 0,
      freeClientsRemaining: 0,
      reason: null,
    };
  }

  if (isTrainer) {
    if (!status.hasSubscription) {
      return {
        loading,
        hasAccess: false,
        isReadOnly: true,
        canInviteClients: false,
        isFree: false,
        activeClientCount: 0,
        freeClientsRemaining: 0,
        reason: 'no_subscription',
      };
    }

    if (status.isReadOnly) {
      return {
        loading,
        hasAccess: false,
        isReadOnly: true,
        canInviteClients: false,
        isFree: false,
        activeClientCount: status.activeClientCount,
        freeClientsRemaining: 0,
        reason: 'subscription_expired',
      };
    }

    return {
      loading,
      hasAccess: true,
      isReadOnly: false,
      canInviteClients: status.canInviteClients,
      isFree: status.isFree,
      activeClientCount: status.activeClientCount,
      freeClientsRemaining: status.freeClientsRemaining,
      reason: null,
      trialClientsRemaining: status.trialClientsRemaining,
    };
  }

  return {
    loading,
    hasAccess: false,
    isReadOnly: true,
    canInviteClients: false,
    isFree: false,
    activeClientCount: 0,
    freeClientsRemaining: 0,
    reason: 'unknown_role',
  };
}
