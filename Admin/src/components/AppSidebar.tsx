import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import { NavLink } from './NavLink';
import {
  LayoutDashboard, FolderTree, Package, Tags, Ruler, Video, ImageIcon,
  UserCircle, ShoppingCart, Receipt, FileText, Users, Shield, Lock, Settings
} from 'lucide-react-native';

const menuGroups = [
  {
    label: "Master",
    items: [
      { title: "Dashboard", url: "Dashboard", icon: LayoutDashboard, module: "Dashboard" },
      { title: "Categories", url: "Categories", icon: FolderTree, module: "Categories" },
      { title: "Products", url: "Products", icon: Package, module: "Products" },
      { title: "Tags", url: "Tags", icon: Tags, module: "Tags" },
      { title: "UOM", url: "UOM", icon: Ruler, module: "UOM" },
      { title: "Videos", url: "Videos", icon: Video, module: "Videos" },
      { title: "Media Library", url: "Media", icon: ImageIcon, module: "Media Library" },
    ]
  },
  {
    label: "Business",
    items: [
      { title: "Customers", url: "Customers", icon: UserCircle, module: "Customers" },
      { title: "Orders", url: "Orders", icon: ShoppingCart, module: "Orders" },
      { title: "Create Bill", url: "Create Bill", icon: Receipt, module: "Bills" },
      { title: "Bill History", url: "Bill History", icon: FileText, module: "Bills" },
    ]
  },
  {
    label: "Admin",
    items: [
      { title: "Users", url: "Users", icon: Users, module: "Users" },
      { title: "Roles", url: "Roles", icon: Shield, module: "Roles" },
      { title: "Settings", url: "Settings", icon: Settings, module: "Settings" },
    ]
  }
];

export function AppSidebar() {
  const { hasPermission } = usePermissions();

  return (
    <ScrollView className="bg-card flex-1 p-4">
      <View className="flex-row items-center gap-2 mb-8 px-2">
        <View className="h-8 w-8 rounded-lg bg-primary items-center justify-center">
          <Text className="text-primary-foreground font-bold">CK</Text>
        </View>
        <Text className="text-lg font-bold text-foreground">Kingdom</Text>
      </View>

      {menuGroups.map((group) => {
        const visibleItems = group.items.filter(i => hasPermission(i.module, "View"));
        if (visibleItems.length === 0) return null;

        return (
          <View key={group.label} className="mb-6">
            <Text className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 px-2">
              {group.label}
            </Text>
            {visibleItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className="flex-row items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
                activeClassName="bg-primary/10"
              >
                <item.icon size={18} color="#4f46e5" />
                <Text className="text-sm font-medium text-foreground">{item.title}</Text>
              </NavLink>
            ))}
          </View>
        )
      })}
    </ScrollView>
  );
}
