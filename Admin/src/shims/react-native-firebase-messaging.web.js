// Web shim for @react-native-firebase/messaging
// Bridges the RN Firebase messaging API to the Firebase JS SDK (web)
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, VAPID_KEY } from '../lib/firebaseConfig.web';

let _messaging = null;

function getWebMessaging() {
  if (!_messaging) {
    try {
      _messaging = getMessaging(app);
    } catch (e) {
      console.warn('[FCM Web Shim] Could not initialise web messaging:', e);
    }
  }
  return _messaging;
}

export default function messaging() {
  return {
    requestPermission: async () => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') return 1;   // AUTHORIZED
      if (permission === 'denied')  return 0;   // DENIED
      return -1;                                 // NOT_DETERMINED
    },

    getToken: async () => {
      const m = getWebMessaging();
      if (!m) return null;
      try {
        const opts = VAPID_KEY ? { vapidKey: VAPID_KEY } : undefined;
        const token = await getToken(m, opts);
        return token || null;
      } catch (e) {
        console.warn('[FCM Web Shim] getToken failed:', e);
        return null;
      }
    },

    onTokenRefresh: (callback) => {
      // Firebase JS SDK v9+ doesn't have a dedicated onTokenRefresh.
      // Token refresh happens automatically; we no-op here.
      return () => {};
    },

    onMessage: (callback) => {
      const m = getWebMessaging();
      if (!m) return () => {};
      return onMessage(m, (payload) => {
        // Re-shape the web payload to match RN Firebase's RemoteMessage
        const remoteMessage = {
          notification: payload.notification || {},
          data: payload.data || {},
          messageId: payload.messageId,
        };
        callback(remoteMessage);
      });
    },

    onNotificationOpenedApp: () => () => {},
    getInitialNotification: async () => null,
    setBackgroundMessageHandler: async () => {},
  };
}

messaging.AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  EPHEMERAL: 3,
};
