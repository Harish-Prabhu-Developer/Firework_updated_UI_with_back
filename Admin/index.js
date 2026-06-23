import './global.css';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import './src/lib/firebaseConfig';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

// Web entry
if (typeof document !== 'undefined') {
    const rootTag = document.getElementById('root') || document.getElementById('app');
    AppRegistry.runApplication(appName, { rootTag });

    // Register Firebase service worker for web push notifications
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('[SW] Firebase messaging SW registered:', registration.scope);
            })
            .catch((err) => {
                console.warn('[SW] Firebase messaging SW registration failed:', err);
            });
    }
}
