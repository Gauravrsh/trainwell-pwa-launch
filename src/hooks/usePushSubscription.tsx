import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { isServiceWorkerAllowed } from '@/lib/buildFreshness';
import { logError } from '@/lib/errorUtils';

// VAPID public key — must match the VAPID_PUBLIC_KEY secret stored in backend
const VAPID_PUBLIC_KEY = 'BCD1FEQO1T8hO6dNEVpJBlA96gQ0yLTwFd0VFQHIpWSkNm_0FzDTFi8NkMf_c93AoIcGbMEIFShbGt-GEIQ8u4E';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { profile } = useProfile();
  const attemptedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!profile?.id) return false;
    if (!isServiceWorkerAllowed() || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      await registration.update();
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      const key = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      if (!key || !auth) return false;

      const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
      const authKey = btoa(String.fromCharCode(...new Uint8Array(auth)));

      // Upsert subscription — use endpoint as unique identifier
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            profile_id: profile.id,
            endpoint: subscription.endpoint,
            p256dh_key: p256dh,
            auth_key: authKey,
          },
          { onConflict: 'endpoint' }
        );

      if (error) {
        logError('usePushSubscription.save', error);
        return false;
      }

      console.log('Push subscription saved successfully');
      return true;
    } catch (err) {
      logError('usePushSubscription.subscribe', err);
      return false;
    }
  }, [profile?.id]);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (attemptedRef.current || !profile?.id) return;
    if (Notification.permission === 'granted') {
      attemptedRef.current = true;
      subscribe();
    }
  }, [profile?.id, subscribe]);

  return { subscribe };
}
