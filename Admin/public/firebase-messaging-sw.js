// Firebase Cloud Messaging Service Worker
// Required for web push notifications (background & foreground)

importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCRW3P5cfp2tC5181z1cUgQlDxxwJdosOM",
  authDomain: "crackers-kingdom.firebaseapp.com",
  projectId: "crackers-kingdom",
  storageBucket: "crackers-kingdom.firebasestorage.app",
  messagingSenderId: "96958305522",
  appId: "1:96958305522:web:054a2df7ec74fa957c2c6b",
  measurementId: "G-JKT69HR98W"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data,
    tag: payload.data?.orderNumber || 'default',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  // Open / focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow('/');
    })
  );
});
