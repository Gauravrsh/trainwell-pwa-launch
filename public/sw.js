// Minimal service worker for Web Push notifications only — no caching
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Vecto', body: event.data.text() };
  }

  const { title, body, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title || 'Vecto', {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data || {},
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlPath = event.notification.data?.url || '/calendar';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlPath);
          return;
        }
      }
      // Open new window
      return clients.openWindow(urlPath);
    })
  );
});
