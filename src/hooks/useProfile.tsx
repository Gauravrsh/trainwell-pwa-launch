import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorUtils';

interface Profile {
  id: string;
  user_id: string;
  role: 'trainer' | 'client';
  unique_id: string;
  trainer_id: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  city: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentInfo {
  vpa_address: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setPaymentInfo(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile data
        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setProfile(profileData);

        // Fetch payment info separately (owner-only access)
        if (profileData?.id) {
          const { data: paymentData, error: paymentError } = await supabase
            .from('payment_info')
            .select('vpa_address')
            .eq('profile_id', profileData.id)
            .maybeSingle();

          if (paymentError) {
            logError('useProfile.fetchPaymentInfo', paymentError);
          } else {
            setPaymentInfo(paymentData);
          }
        }
      } catch (err) {
        logError('useProfile.fetchProfile', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const refetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(profileData);

      // Refetch payment info
      if (profileData?.id) {
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_info')
          .select('vpa_address')
          .eq('profile_id', profileData.id)
          .maybeSingle();

        if (paymentError) {
          logError('useProfile.refetchPaymentInfo', paymentError);
        } else {
          setPaymentInfo(paymentData);
        }
      }
    } catch (err) {
      logError('useProfile.refetchProfile', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user needs to select a role (no profile exists)
  const needsRoleSelection = profile === null && user !== null && !loading;

  // Check if user has selected role but hasn't completed profile setup
  const needsProfileSetup = profile !== null && !profile.profile_complete && user !== null && !loading;

  return { 
    profile, 
    paymentInfo,
    loading, 
    error, 
    refetchProfile,
    needsRoleSelection,
    needsProfileSetup,
    isTrainer: profile?.role === 'trainer',
    isClient: profile?.role === 'client',
  };
};
