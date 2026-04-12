import React, { useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, Platform, Pressable, StyleSheet } from 'react-native';
import * as Screens from '../screens';
import {
  LayoutDashboard, Package, FolderTree, Tags, Ruler, Video, Users, Shield, Lock,
  ShoppingCart, FileText, Receipt, UserCircle, Settings, ImageIcon,
  ChevronLeft, ChevronRight,
  LogOut,
  QrCode
} from "lucide-react-native";
import { usePermissions } from '../hooks/usePermissions';
import { useResponsive } from '../hooks/use-responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { cn } from '../lib/utils';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const { currentRole } = usePermissions();
  const { isCollapsed, setIsCollapsed, isDesktop } = props;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[drawerStyles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 20 }}
      >
        <View style={[drawerStyles.brandHeader, isCollapsed && { paddingHorizontal: 0, justifyContent: 'center' }]}>
          <View style={drawerStyles.brandAvatar}>
            <Text style={drawerStyles.brandAvatarText}>C</Text>
          </View>
          {!isCollapsed && (
            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
              <Text style={drawerStyles.brandName}>Crackers Kingdom</Text>
              <View style={drawerStyles.roleBadge}>
                <Text style={drawerStyles.roleBadgeText}>{currentRole || 'Admin'}</Text>
              </View>
            </View>
          )}
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* ── Footer ── */}
      <View style={[drawerStyles.footer, { paddingBottom: insets.bottom }]}>
        <Pressable
          onPress={() => navigation.replace('Login')}
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
        >
          <View style={[drawerStyles.logoutBtn, isCollapsed && { justifyContent: 'center' }]}>
            <View style={drawerStyles.logoutIconWrap}>
              <LogOut size={18} color="#ef4444" />
            </View>
            {!isCollapsed && (
              <Text style={[drawerStyles.logoutText, { marginLeft: 12 }]}>Sign Out</Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export function DrawerNavigation() {
  const { hasPermission } = usePermissions();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const screens = [
    { name: "Dashboard", component: Screens.Dashboard, icon: LayoutDashboard, module: "Dashboard" },
    { name: "Categories", component: Screens.Categories, icon: FolderTree, module: "Categories" },
    { name: "Products", component: Screens.Products, icon: Package, module: "Products" },
    { name: "Tags", component: Screens.Tags, icon: Tags, module: "Tags" },
    { name: "UOM", component: Screens.UOM, icon: Ruler, module: "UOM" },
    { name: "Videos", component: Screens.Videos, icon: Video, module: "Videos" },
    { name: "Media", component: Screens.Media, icon: ImageIcon, module: "Media Library" },
    { name: "Customers", component: Screens.Customers, icon: UserCircle, module: "Customers" },
    { name: "Orders", component: Screens.Orders, icon: ShoppingCart, module: "Orders" },
    { name: "Create Bill", component: Screens.CreateBill, icon: Receipt, module: "Bills" },
    { name: "Bill History", component: Screens.BillHistory, icon: FileText, module: "Bills" },
    { name: "Users", component: Screens.Users, icon: Users, module: "Users" },
    { name: "Roles", component: Screens.Roles, icon: Shield, module: "Roles" },
    { name: "Permissions", component: Screens.Permissions, icon: Lock, module: "Permissions", hidden: true },
    { name: "QrScan", component: Screens.QrScan, icon: QrCode, module: "Orders" },
    { name: "Settings", component: Screens.Settings, icon: Settings, module: "Settings" },
  ];

  const visibleScreens = screens.filter(s => hasPermission(s.module, "View"));

  const drawerWidth = isDesktop ? (isCollapsed ? 80 : 260) : 280;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isDesktop={isDesktop} />}
      screenOptions={{
        headerShown: true,
        drawerType: isDesktop ? 'permanent' : 'front',
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: '#ffffff',
          borderRightWidth: 1,
          borderRightColor: '#f1f5f9',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 2,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: '#0f172a',
        },
        drawerActiveBackgroundColor: '#eef2ff',
        drawerActiveTintColor: '#4f46e5',
        drawerInactiveTintColor: '#64748b',
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          display: isDesktop && isCollapsed ? 'none' : 'flex',
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: isDesktop && isCollapsed ? 8 : 10,
          paddingHorizontal: isDesktop && isCollapsed ? 0 : 4,
          marginVertical: 1,
        },
        swipeEnabled: !isDesktop,
      }}
    >
      {visibleScreens.map((s) => (
        <Drawer.Screen
          key={s.name}
          name={s.name}
          component={s.component}
          options={{
            drawerItemStyle: s.hidden ? { display: 'none' } : {
              borderRadius: 12,
              marginHorizontal: isDesktop && isCollapsed ? 8 : 12,
              paddingHorizontal: isDesktop && isCollapsed ? 0 : 4,
            },
            drawerIcon: ({ color, size }) => (
              <View className={cn(isDesktop && isCollapsed && "w-full items-center justify-center")}>
                <s.icon size={22} color={color} />
              </View>
            ),
            headerLeft: isDesktop ? () => (
              <Pressable
                onPress={() => setIsCollapsed(!isCollapsed)}
                style={({ pressed }) => [
                  { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
                  pressed && { opacity: 0.75 }
                ]}
              >
                 {isCollapsed ? <ChevronRight size={24} color="#64748b" /> : <ChevronLeft size={24} color="#64748b" />}
              </Pressable>
            ) : undefined,
          }}
        />
      ))}
    </Drawer.Navigator>
  );
}

const drawerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  brandAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'android' ? { elevation: 3 } : {
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  brandAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  roleBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
});
