import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image } from 'react-native';
import { Menu, Bell, User } from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { Fonts, Radius } from '../styles/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderBarProps {
  title: string;
  isDesktop?: boolean;
  onMenuPress?: () => void;
}

export const HeaderBar = ({ title, isDesktop, onMenuPress }: HeaderBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.left}>
        <Pressable onPress={onMenuPress} style={styles.iconButton}>
          <Menu size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.right}>
        <Pressable style={styles.iconButton}>
          <Bell size={20} color={colors.foreground} />
          <View style={styles.badge} />
        </Pressable>

        <View style={styles.userProfile}>
          {isDesktop && <Text style={styles.userName}>Admin User</Text>}
          <View style={styles.avatar}>
            <User size={18} color="white" />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === "android" ? 100 : 64,
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
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
    borderWidth: 1.5,
    borderColor: 'white',
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
