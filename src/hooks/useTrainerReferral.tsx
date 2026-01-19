import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalDaysEarned: number;
  daysRemaining: number;
}

export interface TrainerReferral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referrer_plan_at_reward: string | null;
  referee_plan_at_reward: string | null;
  reward_days: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  rewarded_at: string | null;
}

export function useTrainerReferral() {
  const { profile, isTrainer } = useProfile();
  const [referrals, setReferrals] = useState<TrainerReferral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalDaysEarned: 0,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralData = useCallback(async () => {
    if (!profile || !isTrainer) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch referrals where user is the referrer
      const { data: referralData, error: refError } = await supabase
        .from('trainer_referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      setReferrals((referralData || []) as TrainerReferral[]);

      // Fetch stats using the database function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_trainer_referral_stats', { p_trainer_id: profile.id });

      if (statsError) throw statsError;

      if (statsData && statsData.length > 0) {
        const stat = statsData[0];
        setStats({
          totalReferrals: stat.total_referrals || 0,
          completedReferrals: stat.completed_referrals || 0,
          pendingReferrals: stat.pending_referrals || 0,
          totalDaysEarned: stat.total_days_earned || 0,
          daysRemaining: stat.days_remaining || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch referral data');
    } finally {
      setLoading(false);
    }
  }, [profile, isTrainer]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Generate referral link using trainer's unique_id
  const getReferralLink = useCallback(() => {
    if (!profile?.unique_id) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth?ref=${profile.unique_id}`;
  }, [profile?.unique_id]);

  // Get referral code (trainer's unique_id)
  const getReferralCode = useCallback(() => {
    return profile?.unique_id || '';
  }, [profile?.unique_id]);

  return {
    referrals,
    stats,
    loading,
    error,
    refetch: fetchReferralData,
    getReferralLink,
    getReferralCode,
  };
}
