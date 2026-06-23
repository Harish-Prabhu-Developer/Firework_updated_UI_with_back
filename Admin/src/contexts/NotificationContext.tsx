import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import api from '../api/api'; // Axios instance
import { useNavigation } from '@react-navigation/native';
import { navigationRef } from '../navigation/NavigationService';

interface NotificationContextProps {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  requestPermissionAndRegister: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  requestPermissionAndRegister: async () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/my-notifications?limit=1');
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.log('Failed to fetch unread count:', error);
    }
  };

  const requestPermissionAndRegister = async () => {
    if (Platform.OS === 'web') {
      // For React Native Web, using standard web push or firebase JS SDK
      // Depending on setup, handle web token registration
      try {
          const token = await messaging().getToken();
          if (token) {
              await api.post('/auth/update-fcm', { fcmToken: token, fcmPlatform: 'web' });
          }
      } catch(e) { console.log('Web push error', e) }
      return;
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        if (token) {
          // Instead of /auth/update-fcm, maybe just log it since Login API handles initial.
          // But if token refreshes during session, update it:
          await api.post('/auth/update-fcm', { fcmToken: token, fcmPlatform: Platform.OS });
        }
      }
    } catch (error) {
      console.log('FCM Permission Error:', error);
    }
  };

  useEffect(() => {
    // Refresh count on mount
    refreshUnreadCount();

    // Listen to token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      try {
        await api.post('/auth/update-fcm', { fcmToken: token, fcmPlatform: Platform.OS });
      } catch (e) {}
    });

    // Foreground message handler
    const unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      refreshUnreadCount();
      // Optionally show an in-app toast here
    });

    // Handle background notification clicks
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      handleNotificationClick(remoteMessage);
    });

    // Check if app was opened by notification from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          setTimeout(() => handleNotificationClick(remoteMessage), 1000); // give time for navigator to mount
        }
      });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeMessage();
    };
  }, []);

  const handleNotificationClick = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const { screen, route, referenceId } = remoteMessage.data || {};
    
    if (screen === 'Order' && referenceId) {
      // Ensure we navigate correctly
      navigationRef.current?.navigate('Main', { 
          screen: 'Orders', 
          params: { referenceId } 
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, requestPermissionAndRegister }}>
      {children}
    </NotificationContext.Provider>
  );
};
