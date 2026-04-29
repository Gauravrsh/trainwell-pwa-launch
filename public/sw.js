self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const isFreshShellRequest = (req) => {
  const url = new URL(req.url);
  return req.mode === 'navigate'
    || url.pathname === '/build-id.json'
    || url.pathname === '/manifest.json'
    || url.pathname === '/sw.js'
    || url.pathname.startsWith('/assets/');
};

const networkOnly = async (req) => fetch(req, { cache: 'no-store' }).catch(() => fetch(req));

// Minimal service worker for Web Push + fresh-shell guard for installed PWAs.
// Network-only for app-shell resources ensures stale bundles cannot resurrect old UI.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (isFreshShellRequest(req)) {
    event.respondWith(networkOnly(req));
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
