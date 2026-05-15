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
import { useQueries, useQuery } from '@tanstack/react-query';
import { LineChart, PieChart } from 'react-native-chart-kit';
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

// Dashboard data fetched via API

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
      queryKey: [item.qk, 'stat'],
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

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics');
      return data.data;
    }
  });

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(29, 158, 117, ${opacity})`, // colors.primary equivalent
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // muted-foreground
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

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
        {/* Monthly Revenue Line Chart */}
        <Card className="flex-1 min-w-[320px]">
          <View className="px-4 py-3 border-b border-border flex-row items-center gap-2">
            <TrendingUp size={16} color={colors.primary} />
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.display }}>Monthly Revenue</Text>
          </View>
          <View className="p-2 items-center">
            {analytics?.monthlyRevenue ? (
              <LineChart
                data={{
                  labels: analytics.monthlyRevenue.labels,
                  datasets: [{ data: analytics.monthlyRevenue.data }],
                }}
                width={isMobile ? 320 : 450}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 12, marginVertical: 8 }}
                yAxisLabel="₹"
                withInnerLines={false}
              />
            ) : (
              <View className="h-[220px] items-center justify-center">
                <Text className="text-muted-foreground text-xs">No revenue data available</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Payment Method Pie Chart */}
        <Card className="flex-1 min-w-[320px]">
          <View className="px-4 py-3 border-b border-border flex-row items-center gap-2">
            <BarChart3 size={16} color={colors.primary} />
            <Text className="font-black text-sm text-foreground" style={{ fontFamily: Fonts.display }}>Payment Methods</Text>
          </View>
          <View className="p-2 items-center">
            {analytics?.paymentDistribution ? (
              <PieChart
                data={analytics.paymentDistribution}
                width={isMobile ? 320 : 400}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
              />
            ) : (
              <View className="h-[220px] items-center justify-center">
                <Text className="text-muted-foreground text-xs">No payment data available</Text>
              </View>
            )}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

