import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image, StatusBar } from 'react-native';
import { Menu, Bell, User } from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { Fonts, Radius } from '../styles/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfileModal } from './modals/UserProfileModal';
import { NotificationModal } from './modals/NotificationModal';
import { useNotification } from '../contexts/NotificationContext';

interface HeaderBarProps {
  title: string;
  isDesktop?: boolean;
  onMenuPress?: () => void;
}

export const HeaderBar = ({ title, isDesktop, onMenuPress }: HeaderBarProps) => {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('Admin User');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { unreadCount } = useNotification();

  useEffect(() => {
    AsyncStorage.getItem('user').then(raw => {
      if (raw) {
        try {
          const u = JSON.parse(raw);
          if (u.name) setUserName(u.name);
        } catch {}
      }
    });
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.left}>
        <Pressable onPress={onMenuPress} style={styles.iconButton}>
          <Menu size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <Pressable style={styles.iconButton} onPress={() => setNotificationOpen(true)}>
          <Bell size={20} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.userProfile} onPress={() => setProfileOpen(true)}>
          {isDesktop && <Text style={styles.userName}>{userName}</Text>}
          <View style={styles.avatar}>
            <User size={18} color="white" />
          </View>
        </Pressable>
      </View>

      <UserProfileModal 
        open={profileOpen} 
        onClose={() => {
          setProfileOpen(false);
          // Refresh user name on close in case it was edited
          AsyncStorage.getItem('user').then(raw => {
            if (raw) {
              try {
                const u = JSON.parse(raw);
                if (u.name) setUserName(u.name);
              } catch {}
            }
          });
        }} 
      />

      <NotificationModal 
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === "android" ? 95 : 64,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
    fontFamily: Fonts.display,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.destructive,
    borderWidth: 1.5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: Fonts.body,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: Fonts.body,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
