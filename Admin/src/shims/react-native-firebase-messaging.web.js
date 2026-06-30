// Admin/src/shims/react-native-firebase-messaging.web.js
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, VAPID_KEY } from '../lib/firebaseConfig.web';

const SW_PATH = '/firebase-messaging-sw.js'; // change if served under a subpath, e.g. '/demo/admin/firebase-messaging-sw.js'

let messagingInstance = null;
let swRegistration = null;

const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 };

async function ensureMessaging() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register(SW_PATH);
    } catch (err) {
      console.warn('[push] service worker registration failed', err);
    }
  }

  try {
    messagingInstance = getMessaging(app);
  } catch (error) {
    console.warn('[push] messaging service not available', error);
    return null;
  }
  return messagingInstance;
}

function messaging() {
  return {
    requestPermission: async () => {
      if (typeof Notification === 'undefined') return AuthorizationStatus.DENIED;
      const permission = await Notification.requestPermission();
      return permission === 'granted' ? AuthorizationStatus.AUTHORIZED : AuthorizationStatus.DENIED;
    },

    getToken: async () => {
      const instance = await ensureMessaging();
      if (!instance) return null;
      if (!VAPID_KEY) {
        console.warn('[push] VAPID_KEY is empty — web tokens cannot be generated without it.');
        return null;
      }
      try {
        return (await getToken(instance, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration || undefined,
        })) || null;
      } catch (err) {
        console.warn('[push] getToken failed', err);
        return null;
      }
    },

    // Web tokens don't rotate the way native ones do — kept as a no-op for a matching call signature.
    onTokenRefresh: () => () => { },

    onMessage: (callback) => {
      let unsubscribe = () => { };
      ensureMessaging().then((instance) => {
        if (instance) unsubscribe = onMessage(instance, callback);
      }).catch(err => {
        console.warn('[push] ensureMessaging failed in onMessage', err);
      });
      return () => unsubscribe();
    },

    // Web push doesn't support notification-opened-app detection the same way native does.
    onNotificationOpenedApp: () => () => { },
    getInitialNotification: async () => null,
    setBackgroundMessageHandler: () => { }, // handled in firebase-messaging-sw.js instead
  };
}

messaging.AuthorizationStatus = AuthorizationStatus;
export default messaging;