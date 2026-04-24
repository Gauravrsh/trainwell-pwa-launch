import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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
  bmr: number | null;
  bmr_updated_at: string | null;
  // Item 6 — Trainer Profile (optional, trainer-only meaningful)
  whatsapp_no: string | null;
  avatar_url: string | null;
  years_experience: number | null;
  bio: string | null;
  certifications: string[] | null;
  specializations: string[] | null;
}

interface PaymentInfo {
  vpa_address: string | null;
}

interface ProfileContextValue {
  profile: Profile | null;
  paymentInfo: PaymentInfo | null;
  loading: boolean;
  error: Error | null;
  refetchProfile: () => Promise<void>;
  needsRoleSelection: boolean;
  needsProfileSetup: boolean;
  isTrainer: boolean;
  isClient: boolean;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setPaymentInfo(null);
      setLoading(false);
      return;
    }

    try {
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(profileData);

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
      } else {
        setPaymentInfo(null);
      }
    } catch (err) {
      logError('useProfile.fetchProfile', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to initialise before deciding profile state.
    if (authLoading) return;
    setLoading(true);
    fetchAll(user?.id ?? null);
  }, [user?.id, authLoading, fetchAll]);

  const refetchProfile = useCallback(async () => {
    setLoading(true);
    await fetchAll(user?.id ?? null);
  }, [user?.id, fetchAll]);

  const needsRoleSelection = profile === null && user !== null && !loading;
  const needsProfileSetup = profile !== null && !profile.profile_complete && user !== null && !loading;

  const value: ProfileContextValue = {
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

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
};
