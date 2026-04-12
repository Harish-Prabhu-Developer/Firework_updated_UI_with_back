import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar } from 'react-native';
import { Package, FolderTree, Users, ShoppingCart, FileText, TrendingUp, IndianRupee, BarChart3 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { Card, CardContent } from '../components/ui/Card';
import { useResponsive } from '../hooks/use-responsive';
import { cn } from '../lib/utils';
import { BarChart, LineChart, PieChart, ContributionGraph, StackedBarChart } from 'react-native-chart-kit';

const stats = [
  { label: "Products", value: "124", icon: Package, color: "bg-indigo-100 text-indigo-600", link: "Products" },
  { label: "Categories", value: "8", icon: FolderTree, color: "bg-emerald-100 text-emerald-600", link: "Categories" },
  { label: "Customers", value: "56", icon: Users, color: "bg-sky-100 text-sky-600", link: "Customers" },
  { label: "Orders", value: "23", icon: ShoppingCart, color: "bg-orange-100 text-orange-600", link: "Orders" },
  { label: "Bills", value: "189", icon: FileText, color: "bg-violet-100 text-violet-600", link: "BillHistory" },
  { label: "Revenue", value: "₹2.4L", icon: TrendingUp, color: "bg-rose-100 text-rose-600", link: "BillHistory" },
];

const monthlySales = {
  labels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [{
    data: [45000, 72000, 58000, 125000, 185000, 240000]
  }]
};

const paymentBreakdown = [
  { name: "Cash", population: 95, color: "#10b981", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  { name: "UPI", population: 62, color: "#6366f1", legendFontColor: "#7F7F7F", legendFontSize: 12 },
  { name: "Card", population: 32, color: "#8b5cf6", legendFontColor: "#7F7F7F", legendFontSize: 12 },
];

const topProducts = [
  { name: "Flower Pots Small", sold: 320, revenue: 19200 },
  { name: "Sky Shot 30", sold: 180, revenue: 90000 },
  { name: "Classic Laxmi Bomb", sold: 450, revenue: 11250 },
  { name: "Sparkler Pack 10", sold: 290, revenue: 43500 },
  { name: "Ground Chakra", sold: 210, revenue: 16800 },
];

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
};

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const { isMobile, width } = useResponsive();
  const screenWidth = width - (isMobile ? 32 : 64);
  const chartWidth = isMobile ? screenWidth : (screenWidth / 2) - 32;

  return (
    <ScrollView className="flex-1 bg-background p-4 md:p-6">
      <StatusBar barStyle="dark-content" />
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
        <Text className="text-muted-foreground text-sm mt-1">Crackers Kingdom — POS & Billing Admin</Text>
      </View>

      {/* Stat Cards */}
      <View className="flex-row flex-wrap -mx-2 mb-6">
        {stats.map((s) => (
          <View key={s.label} className="w-1/2 md:w-1/3 lg:w-1/6 px-2 mb-4">
            <Pressable
              onPress={() => navigation.navigate(s.link)}
              className="bg-card border border-border rounded-lg p-4 shadow-sm active:opacity-70"
            >
              <View className={cn("h-10 w-10 rounded-lg items-center justify-center mb-3", s.color)}>
                <s.icon size={20} color="currentColor" />
              </View>
              <Text className="text-2xl font-bold text-card-foreground">{s.value}</Text>
              <Text className="text-xs text-muted-foreground">{s.label}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Charts Row 1 */}
      <View className={cn("flex-row flex-wrap -mx-3 mb-6", isMobile ? "flex-col" : "")}>
        <View className={cn("px-3 mb-6", isMobile ? "w-full" : "w-1/2")}>
          <Card>
            <View className="p-4 border-b border-border flex-row items-center gap-2">
              <IndianRupee size={18} color="#4f46e5" />
              <Text className="font-semibold text-lg">Monthly Revenue</Text>
            </View>
            <View className="p-4 items-center">
              <BarChart
                data={monthlySales}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                yAxisLabel="₹"
                yAxisSuffix=""
                fromZero
              />
            </View>
          </Card>
        </View>

        <View className={cn("px-3 mb-6", isMobile ? "w-full" : "w-1/2")}>
          <Card>
            <View className="p-4 border-b border-border flex-row items-center gap-2">
              <TrendingUp size={18} color="#4f46e5" />
              <Text className="font-semibold text-lg">Revenue Trend</Text>
            </View>
            <View className="p-4 items-center">
              <LineChart
                data={monthlySales}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                yAxisLabel="₹"
              />
            </View>
          </Card>
        </View>
      </View>

      {/* Row 2 */}
      <View className={cn("flex-row flex-wrap -mx-3 mb-10", isMobile ? "flex-col" : "")}>
        <View className={cn("px-3 mb-6", isMobile ? "w-full" : "w-1/3")}>
          <Card>
            <View className="p-4 border-b border-border">
              <Text className="font-semibold text-lg">Payment Methods</Text>
            </View>
            <View className="p-4 items-center">
              <PieChart
                data={paymentBreakdown}
                width={chartWidth}
                height={200}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            </View>
          </Card>
        </View>

        <View className={cn("px-3 mb-6", isMobile ? "w-full" : "w-1/3")}>
          <Card>
            <View className="p-4 border-b border-border flex-row items-center gap-2">
              <BarChart3 size={18} color="#4f46e5" />
              <Text className="font-semibold text-lg">Top Products</Text>
            </View>
            <View className="p-4 space-y-4">
              {topProducts.map((p, i) => (
                <View key={p.name}>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm font-medium text-foreground truncate flex-1">{p.name}</Text>
                    <Text className="text-sm font-bold">₹{(p.revenue / 1000).toFixed(1)}k</Text>
                  </View>
                  <View className="h-2 bg-muted rounded-full">
                    <View className="h-full bg-primary rounded-full" style={{ width: `${(p.sold / 450) * 100}%` }} />
                  </View>
                  <View className="flex-row justify-end mt-0.5">
                    <Text className="text-[10px] text-muted-foreground">{p.sold} sold</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View className={cn("px-3 mb-6", isMobile ? "w-full" : "w-1/3")}>
          <Card>
            <View className="p-4 border-b border-border">
              <Text className="font-semibold text-lg">Platform Status</Text>
            </View>
            <View className="p-6 items-center justify-center">
              <View className="h-32 w-32 rounded-full border-8 border-primary items-center justify-center">
                <Text className="text-2xl font-bold">85%</Text>
                <Text className="text-[10px] text-muted-foreground">Efficiency</Text>
              </View>
              <Text className="text-center mt-4 text-sm text-muted-foreground italic">
                Mobile & Web views optimized for performance.
              </Text>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
