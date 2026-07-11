import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logError } from '@/lib/errorUtils';

/**
 * Server-side admin check via public.user_roles.
 * Never trust localStorage / client flags for admin gating.
 */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (err) {
        logError('useIsAdmin', err);
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || loading };
}