import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { logError } from '@/lib/errorUtils';
import type { TrainerProfileSummary } from '@/components/trainer-profile/TrainerProfileCard';

/**
 * Item 6 — Fetches the calling client's mapped trainer profile via
 * the security-definer RPC `get_my_trainer_profile`. Returns null if
 * the user is a trainer or has no mapped trainer.
 *
 * If the trainer has stored an avatar in the `avatars` bucket, this
 * hook resolves a short-lived signed URL on the way through, since the
 * bucket is private (avatars listing was tightened by Phase 3 migration).
 */
export function useMyTrainerProfile() {
  const { profile, isClient } = useProfile();

  return useQuery<TrainerProfileSummary | null>({
    queryKey: ['my-trainer-profile', profile?.id],
    enabled: !!profile && isClient && !!profile.trainer_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_trainer_profile');
      if (error) {
        logError('useMyTrainerProfile.rpc', error);
        throw error;
      }
      const row = (data || [])[0];
      if (!row) return null;

      // Resolve avatar URL: stored as a path within the avatars bucket
      // (e.g. "<auth-uid>/avatar.jpg"). Generate a signed URL valid for 1h.
      let avatarSignedUrl: string | null = null;
      if (row.avatar_url) {
        try {
          const { data: signed } = await supabase.storage
            .from('avatars')
            .createSignedUrl(row.avatar_url, 3600);
          avatarSignedUrl = signed?.signedUrl ?? null;
        } catch (err) {
          logError('useMyTrainerProfile.signedUrl', err);
        }
      }

      return {
        id: row.id,
        full_name: row.full_name,
        unique_id: row.unique_id,
        city: row.city,
        whatsapp_no: row.whatsapp_no,
        avatar_url: avatarSignedUrl,
        years_experience: row.years_experience,
        bio: row.bio,
        certifications: row.certifications,
        specializations: row.specializations,
      };
    },
  });
}