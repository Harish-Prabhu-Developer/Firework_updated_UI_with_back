import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../services/api'; // Or wherever the axios instance is

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
      // In web, you typically use firebase/messaging.
      // Assuming firebase is initialized somewhere if needed.
      // This is a stub for the client app assuming the setup is done as requested.
      if (!('Notification' in window)) return;

      if (Notification.permission === 'granted') {
          // get token and register
      } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              // get token and register
          }
      }
  };

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, requestPermissionAndRegister }}>
      {children}
    </NotificationContext.Provider>
  );
};
