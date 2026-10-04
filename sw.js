// Service Worker for W3C Web Push Notifications with Desktop Mute Control
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = { title: 'Security Alert', body: 'A new security event has been recorded.' };
    try {
      if (event.data) {
        data = event.data.json();
      }
    } catch (e) {
      if (event.data) {
        data = event.data.text();
      }
    }

    // Check device type
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

    // On Desktop PC/Mac: Default is OFF (Silent). Only show if explicitly enabled in settings.
    if (!isMobile) {
      let desktopEnabled = false;
      try {
        const cache = await caches.open('lit-settings');
        const res = await cache.match('/desktop-notifications');
        if (res) {
          const cfg = await res.json();
          desktopEnabled = Boolean(cfg.enabled);
        }
      } catch (e) {}

      if (!desktopEnabled) {
        console.log('[LiT SW] Desktop notifications are muted by default. Skipping Windows notification banner.');
        return; // Silent on desktop by default
      }
    }

    const options = {
      body: data.body,
      icon: '/icons/icon128.png',
      badge: '/icons/icon128.png',
      vibrate: [200, 100, 200, 100, 200],
      data: data.data || {},
      actions: [
        { action: 'view', title: 'View Audit Log' }
      ]
    };

    await self.registration.showNotification(data.title, options);
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = '/hub.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes('hub.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
