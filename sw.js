// Minimaler Service Worker für Mischa Zoo — ermöglicht Benachrichtigungen,
// die auch dann erscheinen, wenn der Tab im Hintergrund/minimiert ist,
// solange der Browser läuft. Ohne eigenen Server keine echte
// "auch bei komplett geschlossenem Browser"-Push-Zustellung möglich.

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Zeigt eine Benachrichtigung an — wird von der Seite via
// registration.showNotification(...) direkt aufgerufen, kein
// echter Push-Server nötig.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
