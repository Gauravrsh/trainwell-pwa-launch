// Minimal service worker for Web Push + fresh-shell guard for installed PWAs
// Network-first for HTML navigations ensures users always get latest index.html
// (JS/CSS are content-hashed by Vite, so they cache safely.)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});

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

  // External URLs (wa.me, https://) → open directly in new window
  if (urlPath.startsWith('http')) {
    event.waitUntil(clients.openWindow(urlPath));
    return;
  }

  // Internal app paths → focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlPath);
          return;
        }
      }
      return clients.openWindow(urlPath);
    })
  );
});
