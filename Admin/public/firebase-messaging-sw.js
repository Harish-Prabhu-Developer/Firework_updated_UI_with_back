// Admin/public/firebase-messaging-sw.js  (new file)
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Crackers Kingdom', {
    body: body || '',
    data: payload.data,
  });
});


