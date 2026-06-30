import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Platform } from 'react-native';
import { X, CheckCircle2, Bell } from 'lucide-react-native';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';
import api from '../../api/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigation } from '@react-navigation/native';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationModal = ({ open, onClose }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshUnreadCount } = useNotification();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications/my-notifications?limit=20');
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      refreshUnreadCount();
    } catch (error) {
      console.log('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
    } catch (error) {
      console.log('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    
    onClose();
    if (item.referenceType === 'ORDER' && item.referenceId) {
      navigation.navigate('Main', { 
        screen: 'Orders',
        params: { referenceId: item.referenceId }
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <Pressable 
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]} 
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
    </Pressable>
  );

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={styles.content} 
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Bell size={20} color={colors.foreground} />
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {notifications.some(n => !n.isRead) && (
                <Pressable onPress={markAllAsRead} style={styles.markAllBtn}>
                  <CheckCircle2 size={16} color={colors.primary} />
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.border} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
    padding: Platform.OS === 'web' ? 16 : 0,
    paddingTop: Platform.OS === 'web' ? 70 : 0,
  },
  content: {
    backgroundColor: 'white',
    width: Platform.OS === 'web' ? 400 : '90%',
    maxHeight: Platform.OS === 'web' ? '80%' : '70%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: Fonts.display,
  },
  closeBtn: {
    padding: 4,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: Fonts.body,
  },
  listContent: {
    paddingBottom: 16,
  },
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  unreadItem: {
    backgroundColor: 'rgba(212,160,23,0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: Fonts.body,
    flex: 1,
    marginRight: 12,
  },
  unreadText: {
    fontWeight: '800',
    color: colors.primary,
  },
  itemDate: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontFamily: Fonts.body,
  },
  itemMessage: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.mutedForeground,
    fontFamily: Fonts.body,
  }
});
