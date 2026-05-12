import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePermissions } from '../hooks/usePermissions';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Ruler,
  Users,
  Shield,
  Settings,
  LogOut,
  ShoppingCart,
  Receipt,
  Image,
  Video
} from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, route: 'Dashboard' },
  { name: 'Orders', icon: ShoppingCart, route: 'Orders' },
  { name: 'Billing', icon: Receipt, route: 'Billing' },
  { name: 'Categories', icon: FolderTree, route: 'Categories' },
  { name: 'UOM', icon: Ruler, route: 'UOM' },
  { name: 'Products', icon: Package, route: 'Products' },
  { name: 'Tags', icon: Tags, route: 'Tags' },
  { name: 'Roles', icon: Shield, route: 'Roles' },
  { name: 'Users', icon: Users, route: 'Users' },
  { name: 'Media', icon: Image, route: 'Media' },
  { name: 'Videos', icon: Video, route: 'Videos' },
  { name: 'Settings', icon: Settings, route: 'Settings' },
];

interface SidebarMenuProps {
  isCollapsed?: boolean;
}

export const SidebarMenu = (props: any) => {
  const { state, navigation: drawerNav, isCollapsed } = props;
  const fallbackNav = useNavigation<any>();
  const navigation = drawerNav || fallbackNav;

  const route = useRoute();
  const currentRouteName = state ? state.routeNames[state.index] : route.name;
  const insets = useSafeAreaInsets();
  const { currentRole } = usePermissions();
  const [userName, setUserName] = React.useState('Admin User');

  React.useEffect(() => {
    AsyncStorage.getItem('user').then(raw => {
      if (raw) {
        const user = JSON.parse(raw);
        if (user.name) setUserName(user.name);
      }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    navigation.replace('Login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Brand */}
      <View style={[styles.brand, isCollapsed && styles.brandCollapsed]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        {!isCollapsed && (
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName} numberOfLines={1}>Crackers Kingdom</Text>
            <Text style={styles.brandSubtitle}>Admin Panel</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {MENU_ITEMS.map((item) => {
          const isActive = currentRouteName === item.route;
          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && styles.menuItemActive,
                pressed && styles.menuItemPressed,
                isCollapsed && styles.menuItemCollapsed
              ]}
            >
              <item.icon
                size={20}
                color={isActive ? colors.sidebarPrimary : 'rgba(255,255,255,0.6)'}
              />
              {!isCollapsed && (
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.name}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer / User Profile & Logout */}
      <View style={styles.footer}>
        {/* User Profile */}
        <View style={[styles.profileContainer, isCollapsed && { paddingHorizontal: 0, justifyContent: 'center' }]}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{getInitials(userName)}</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.userRole} numberOfLines={1}>{currentRole || 'Administrator'}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutItem,
            pressed && styles.menuItemPressed,
            isCollapsed && styles.menuItemCollapsed
          ]}
        >
          <LogOut size={20} color={colors.destructive} />
          {!isCollapsed && <Text style={[styles.logoutLabel, { color: colors.destructive }]}>Sign Out</Text>}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sidebarBackground,
  },
  brand: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: colors.sidebarPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.sidebarBackground,
    fontSize: 24,
    fontWeight: '900',
  },
  brandName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.display,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.body,
  },
  userRole: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    marginBottom: 4,
    gap: 12,
  },
  menuItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuItemPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  menuLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.body,
  },
  menuLabelActive: {
    color: 'white',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    gap: 12,
  },
  logoutLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.body,
  },
});
