/**
 * /src/components/SidebarMenu.tsx
 *
 * Renders only the menu items the current user has "View" permission for.
 * Dashboard and Settings are always visible (no permission gate).
 * Each item declares its module name (must match the DB modules.name exactly).
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePermissions } from '../hooks/usePermissions';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Shield,
  Settings,
  LogOut,
  ShoppingCart,
  Receipt,
  Video,
  User,
  Image as ImageIcon,
} from 'lucide-react-native';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfileModal } from './modals/UserProfileModal';

/* ─────────────────────────────────────────────────────────────────────────────
   Menu definition
   `module`: must match modules.name in the DB exactly (case-insensitive lookup
             is done in hasPermission, but keep it consistent with what you seed).
   `alwaysShow`: skips the permission check entirely (Dashboard, Settings).
───────────────────────────────────────────────────────────────────────────── */
interface MenuItem {
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
  /** DB module name used for View permission check */
  module?: string;
  /** If true, show regardless of permissions */
  alwaysShow?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    route: 'Dashboard',
    alwaysShow: true,           // dashboard is always accessible
  },
  {
    name: 'Orders',
    icon: ShoppingCart,
    route: 'Orders',
    module: 'Orders',
  },
  //{
   // name: 'Billing',
   // icon: Receipt,
    //route: 'Billing',
  //  module: 'Invoices',         // matches modules.name seeded as "Invoices"
//  },
  {
    name: 'Customers',
    icon: User,
    route: 'Customers',
    module: 'Customers',
  },
  {
    name: 'Categories',
    icon: FolderTree,
    route: 'Categories',
    module: 'Categories',
  },
  {
    name: 'Products',
    icon: Package,
    route: 'Products',
    module: 'Products',
  },
  {
    name: 'Roles',
    icon: Shield,
    route: 'Roles',
    module: 'Roles',
  },
  {
    name: 'Users',
    icon: Users,
    route: 'Users',
    module: 'Users',
  },
  {
    name: 'Videos',
    icon: Video,
    route: 'Videos',
    module: 'Videos',
  },
  {
    name: 'Media',
    icon: ImageIcon,
    route: 'Media',
    module: 'Media Library',
  },
  {
    name: 'Settings',
    icon: Settings,
    route: 'Settings',
    alwaysShow: true,           // settings is always accessible
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export const SidebarMenu = (props: any) => {
  const { state, navigation: drawerNav, isCollapsed } = props;
  const fallbackNav = useNavigation<any>();
  const navigation = drawerNav || fallbackNav;

  const route = useRoute();
  const currentRouteName = state
    ? state.routeNames[state.index]
    : route.name;

  const insets = useSafeAreaInsets();
  const { currentRole, hasPermission, initialized } = usePermissions();
  const [userName, setUserName] = React.useState('Admin User');
  const [profileOpen, setProfileOpen] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('user').then(raw => {
      if (!raw) return;
      try {
        const user = JSON.parse(raw);
        if (user?.name) setUserName(user.name);
      } catch { }
    });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    navigation.replace('Login');
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  /* ── Filter visible items ─────────────────────────── */
  // While permissions are loading we show nothing except always-visible items
  // to avoid a flash of full menu followed by a collapsed one.
  const visibleItems = MENU_ITEMS.filter(item => {
    if (item.alwaysShow) return true;
    if (!item.module) return false;         // no module declared → hide
    if (!initialized) return false;         // still loading → hide until ready
    return hasPermission(item.module, 'View');
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Brand */}
      <View style={[styles.brand, isCollapsed && styles.brandCollapsed]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        {!isCollapsed && (
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName} numberOfLines={1}>
              Crackers Kingdom
            </Text>
            <Text style={styles.brandSubtitle}>Admin Panel</Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <ScrollView
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        {...(Platform.OS === 'web' ? { className: 'custom-scrollbar' } as any : {})}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleItems.map(item => {
          const isActive = currentRouteName === item.route;
          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.route)}
              style={({ pressed }) => [
                isActive && styles.menuItemActive,
                pressed && styles.menuItemPressed,
                isCollapsed && styles.menuItemCollapsed,
              ]}
            >
              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.menuIconContainer,
                    isCollapsed && { marginRight: 0 },
                  ]}
                >
                  <item.icon
                    size={20}
                    color={
                      isActive
                        ? colors.sidebarPrimary
                        : 'rgba(255,255,255,0.6)'
                    }
                  />
                </View>
                {!isCollapsed && (
                  <View style={styles.menuLabelContainer}>
                    <Text
                      style={[
                        styles.menuLabel,
                        isActive && styles.menuLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer — user profile + logout */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => setProfileOpen(true)}
          style={({ pressed }) => [
            styles.profileContainer,
            isCollapsed && { paddingHorizontal: 0, justifyContent: 'center' },
            pressed && { opacity: 0.7 }
          ]}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{getInitials(userName)}</Text>
          </View>
          {!isCollapsed && (
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {currentRole || 'Administrator'}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            pressed && styles.menuItemPressed,
            isCollapsed && styles.menuItemCollapsed,
          ]}
        >
          <View style={styles.menuItem}>
            <View
              style={[
                styles.menuIconContainer,
                isCollapsed && { marginRight: 0 },
              ]}
            >
              <LogOut size={20} color={colors.destructive} />
            </View>
            {!isCollapsed && (
              <Text style={[styles.logoutLabel, { color: colors.destructive }]}>
                Sign Out
              </Text>
            )}
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
              } catch { }
            }
          });
        }}
      />
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sidebarBackground,
  },
  brand: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 20,
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
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  userInfo: { flex: 1 },
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
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabelContainer: { flex: 1 },
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
  menuLabelActive: { color: 'white' },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.body,
  },
});
