// Admin/src/services/pushNotifications.ts
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import api from '../api/api'; // ← point this at your actual axios instance

async function requestAndroidRuntimePermission() {
    if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function registerTokenWithBackend(fcmToken: string) {
    const platform = Platform.OS === 'web' ? 'web' : Platform.OS; // 'android' | 'ios' | 'web'
    try {
        await api.post('/notifications/fcm-token', { fcmToken, platform });
    } catch (err) {
        console.warn('[push] failed to register token', err);
    }
}

export async function registerForPushNotifications() {
    try {
        if (Platform.OS === 'android' && !(await requestAndroidRuntimePermission())) return;

        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED
            || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return console.warn('[push] permission denied');

        const token = await messaging().getToken();
        if (token) await registerTokenWithBackend(token);

        messaging().onTokenRefresh((newToken: string) => registerTokenWithBackend(newToken));
        messaging().onMessage((remoteMessage: any) => console.log('[push] foreground message', remoteMessage));
    } catch (err) {
        console.error('[push] registerForPushNotifications failed', err);
    }
}

/** Call this on logout, before the auth token is cleared, so the
 *  unregister request still has a valid Authorization header. */
export async function unregisterPushNotifications() {
    try {
        const token = await messaging().getToken();
        if (token) await api.delete('/notifications/fcm-token', { data: { fcmToken: token } });
    } catch (err) {
        console.warn('[push] failed to unregister token', err);
    }
}