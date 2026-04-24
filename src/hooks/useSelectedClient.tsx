import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { logError } from '@/lib/errorUtils';

/**
 * Item 5 — Cross-page client selection (session-scoped).
 *
 * Per-session shared default for the trainer's "currently selected client".
 * Persists in sessionStorage so it survives in-tab refreshes but dies with
 * the tab and on sign-out (sign-out clears it explicitly in useAuth).
 *
 * Client-role users: hook still works but is a no-op consumer surface —
 * existing pages already special-case via `targetClientId = isTrainer ? selectedClientId : profile?.id`.
 *
 * On mount, validates the stored ID against the trainer's current client
 * list (via get_trainer_clients RPC). If the stored client is archived /
 * unlinked, the value is silently cleared so the dropdown shows
 * "Select a client" instead of crashing or pointing at a stranger.
 */

const STORAGE_KEY = 'vecto.selectedClientId';

export const useSelectedClient = () => {
  const { profile, isTrainer } = useProfile();
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Validate the stored id against the live client list once we know who the trainer is.
  useEffect(() => {
    if (!isTrainer || !profile || !selectedClientId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_trainer_clients');
        if (error) throw error;
        if (cancelled) return;
        const stillValid = (data || []).some((c: { id: string }) => c.id === selectedClientId);
        if (!stillValid) {
          try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
          setSelectedClientIdState(null);
        }
      } catch (err) {
        logError('useSelectedClient.validate', err);
      }
    })();
    return () => { cancelled = true; };
    // Intentionally not depending on selectedClientId — we only validate the
    // initial hydration. Subsequent setSelectedClient writes are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrainer, profile?.id]);

  const setSelectedClientId = useCallback((id: string | null) => {
    try {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* sessionStorage may be unavailable in private mode */ }
    setSelectedClientIdState(id);
  }, []);

  const clearSelectedClient = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    setSelectedClientIdState(null);
  }, []);

  return { selectedClientId, setSelectedClientId, clearSelectedClient };
};

/**
 * Module-level helper used by useAuth.signOut() so we don't depend on a
 * React hook from outside React.
 */
export const clearSelectedClientStorage = () => {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
};