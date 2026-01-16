import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  role: 'trainer' | 'client';
  unique_id: string;
  trainer_id: string | null;
  vpa_address: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
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
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      console.error('Error refetching profile:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user needs to select a role (new signup)
  // A user needs role selection if they have the default 'client' role 
  // but haven't been explicitly assigned (we'll track this by checking if they have a trainer_id or not)
  // For now, we'll add a flag to indicate role selection is needed
  const needsRoleSelection = profile === null && user !== null && !loading;

  return { 
    profile, 
    loading, 
    error, 
    refetchProfile,
    needsRoleSelection,
    isTrainer: profile?.role === 'trainer',
    isClient: profile?.role === 'client',
  };
};
