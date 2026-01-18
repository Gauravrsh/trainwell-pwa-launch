import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { useProfile } from '@/hooks/useProfile';

/**
 * Hook to check if current user has access to modify data (not read-only)
 * Trainers need active subscription, clients always have access
 */
export function useSubscriptionAccess() {
  const { isTrainer, isClient, loading: profileLoading } = useProfile();
  const { status, loading: subscriptionLoading } = useTrainerSubscription();

  const loading = profileLoading || (isTrainer && subscriptionLoading);

  // Clients always have full access (free to use)
  if (isClient) {
    return {
      loading,
      hasAccess: true,
      isReadOnly: false,
      canInviteClients: false, // Not applicable for clients
      reason: null,
    };
  }

  // Trainers need active subscription
  if (isTrainer) {
    if (!status.hasSubscription) {
      return {
        loading,
        hasAccess: false,
        isReadOnly: true,
        canInviteClients: false,
        reason: 'no_subscription',
      };
    }

    if (status.isReadOnly) {
      return {
        loading,
        hasAccess: false,
        isReadOnly: true,
        canInviteClients: false,
        reason: 'subscription_expired',
      };
    }

    return {
      loading,
      hasAccess: true,
      isReadOnly: false,
      canInviteClients: status.canInviteClients,
      reason: null,
      trialClientsRemaining: status.trialClientsRemaining,
    };
  }

  return {
    loading,
    hasAccess: false,
    isReadOnly: true,
    canInviteClients: false,
    reason: 'unknown_role',
  };
}
