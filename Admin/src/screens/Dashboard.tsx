import React from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import {
  BarChart3,
  FileText,
  FolderTree,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueries } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { useResponsive } from '../hooks/useResponsive';
import { cn } from '../lib/utils';
import api from '../api/api';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

interface StatConfig {
  label: string;
  icon: typeof Package;
  bg: string;
  iconColor: string;
  link: string;
  qk: string;
}

const STAT_CONFIG: StatConfig[] = [
  { label: 'Products', icon: Package, bg: 'bg-primary/10', iconColor: colors.primary, link: 'Products', qk: 'products' },
  { label: 'Categories', icon: FolderTree, bg: 'bg-secondary/10', iconColor: colors.secondary, link: 'Categories', qk: 'categories' },
  { label: 'Customers', icon: Users, bg: 'bg-info/10', iconColor: colors.info, link: 'Customers', qk: 'customers' },
  { label: 'Orders', icon: ShoppingCart, bg: 'bg-warning/10', iconColor: colors.warning, link: 'Orders', qk: 'orders' },
  { label: 'Invoices', icon: FileText, bg: 'bg-accent/10', iconColor: colors.accent, link: 'Bill History', qk: 'invoices' },
];

const QUICK_ACTIONS = [
  { label: 'New Bill', screen: 'Create Bill', color: 'bg-primary' },
  { label: 'New Order', screen: 'Orders', color: 'bg-secondary' },
  { label: 'Add Product', screen: 'Products', color: 'bg-accent' },
  { label: 'Scan QR', screen: 'QrScan', color: 'bg-info' },
];

const SYSTEM_INFO = [
  { label: 'Platform', value: 'React Native CLI' },
  { label: 'Web Engine', value: 'Webpack 5' },
  { label: 'Database', value: 'PostgreSQL + Drizzle' },
  { label: 'API', value: 'Express.js + TypeScript' },
];

const getStatCount = (response: any): number => {
  if (typeof response?.pagination?.total === 'number') return response.pagination.total;
  if (typeof response?.data?.pagination?.total === 'number') return response.data.pagination.total;
  if (typeof response?.total === 'number') return response.total;
  if (typeof response?.data?.total === 'number') return response.data.total;
  if (Array.isArray(response?.data)) return response.data.length;
  if (Array.isArray(response?.data?.data)) return response.data.data.length;
  if (Array.isArray(response)) return response.length;
  return 0;
};

const StatCard = ({
  label,
  icon: Icon,
  bg,
  iconColor,
  link,
  count,
}: StatConfig & { count?: number }) => {
  const nav = useNavigation<any>();
  const displayCount = typeof count === 'number' && Number.isFinite(count) ? count : 0;

  return (
    <Pressable
      onPress={() => nav.navigate(link)}
      style={globalStyles.card}
      className="active:opacity-70 p-4"
    >
      <View className={cn('w-11 h-11 rounded-xl items-center justify-center mb-3', bg)}>
        <Icon size={20} color={iconColor} />
      </View>
      <Text className="text-2xl font-black text-foreground" style={{ fontFamily: Fonts.display }}>{displayCount}</Text>
      <Text className="text-xs text-muted-foreground font-medium mt-0.5" style={{ fontFamily: Fonts.body }}>{label}</Text>
    </Pressable>
  );
};

// Slice-like hook for Dashboard stats
export const useDashboardQueries = () => {
  const queries = useQueries({
    queries: STAT_CONFIG.map((item) => ({
      queryKey: [item.qk],
      queryFn: async () => {
        try {
          const { data } = await api.get(`/${item.qk}?limit=1`);
          return getStatCount(data);
        } catch {
          return 0;
        }
      },
      retry: false,
    })),
  });
  return queries;
};

export default function Dashboard() {
  const { isMobile } = useResponsive();
  const nav = useNavigation<any>();

  const queries = useDashboardQueries();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: isMobile ? 16 : 24, paddingBottom: 60 }}
    >
      <StatusBar barStyle="dark-content" />

      <View className="mb-6">
        <Text className="text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: Fonts.display }}>Dashboard</Text>
        <Text className="text-sm text-muted-foreground mt-1" style={{ fontFamily: Fonts.body }}>Crackers Kingdom - POS & Billing Admin</Text>
      </View>

      <View className="flex-row flex-wrap gap-3 mb-8">
        {STAT_CONFIG.map((item, index) => (
          <View key={item.label} style={{ width: isMobile ? '47%' : '18%', minWidth: 130 }}>
            <StatCard {...item} count={queries[index].data} />
          </View>
        ))}
      </View>

      <Card className="mb-6">
        <View className="px-4 py-3 border-b border-border">
          <Text className="font-black text-base text-foreground" style={{ fontFamily: Fonts.display }}>Quick Actions</Text>
        </View>
        <View className="p-4 flex-row flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => nav.navigate(action.screen)}
              className={cn('px-5 h-11 rounded-xl items-center justify-center active:opacity-75', action.color)}
              style={{ borderRadius: Radius.xl }}
            >
              <Text className="text-sm font-bold text-white" style={{ fontFamily: Fonts.body }}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View className="flex-row flex-wrap gap-4">
        <Card className="flex-1 min-w-[280px]">
          <View className="px-4 py-3 border-b border-border flex-row items-center gap-2">
            <TrendingUp size={16} color={colors.primary} />
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.display }}>Platform</Text>
          </View>
          <View className="p-4 items-center py-8">
            <View style={{ borderRadius: Radius.full, borderColor: colors.primary + '20' }} className="w-24 h-24 border-8 items-center justify-center">
              <Text className="text-xl font-black text-primary" style={{ fontFamily: Fonts.display }}>CK</Text>
            </View>
            <Text className="text-sm text-muted-foreground mt-4 text-center font-medium" style={{ fontFamily: Fonts.body }}>
              Crackers Kingdom Admin{'\n'}ERP & Billing System
            </Text>
          </View>
        </Card>

        <Card className="flex-1 min-w-[280px]">
          <View className="px-4 py-3 border-b border-border flex-row items-center gap-2">
            <BarChart3 size={16} color={colors.primary} />
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.display }}>System Info</Text>
          </View>
          <View className="p-4 gap-3">
            {SYSTEM_INFO.map((item) => (
              <View key={item.label} className="flex-row items-center justify-between py-1.5 border-b border-border/40">
                <Text className="text-xs text-muted-foreground font-medium" style={{ fontFamily: Fonts.body }}>{item.label}</Text>
                <Text className="text-xs font-bold text-foreground" style={{ fontFamily: Fonts.body }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

