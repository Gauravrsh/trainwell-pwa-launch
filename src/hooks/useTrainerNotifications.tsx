import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface TrainerNotification {
  id: string;
  trainer_id: string;
  notification_type: string;
  title: string;
  body: string;
  day_offset: number;
  cta_text: string | null;
  cta_action: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  scheduled_for: string;
  created_at: string;
}

export function useTrainerNotifications() {
  const { profile, isTrainer } = useProfile();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['trainer-notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('trainer_notifications')
        .select('*')
        .eq('trainer_id', profile.id)
        .eq('is_dismissed', false)
        .lte('scheduled_for', new Date().toISOString().split('T')[0])
        .order('scheduled_for', { ascending: false });

      if (error) throw error;
      return data as TrainerNotification[];
    },
    enabled: !!profile?.id && isTrainer,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;

      const { error } = await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .eq('trainer_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });

  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('trainer_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-notifications'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    dismissNotification: dismissNotification.mutate,
  };
}
