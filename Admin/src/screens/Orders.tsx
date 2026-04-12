import React, { useState } from "react";
import { View, Text } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { StatusBadge } from "../components/StatusBadge";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Eye, ArrowRightLeft, Receipt } from "lucide-react-native";
import { format } from "date-fns";

interface Order { 
  id: string; 
  orderId: string; 
  customer: string; 
  phone: string;
  email: string;
  date: string; 
  total: number; 
  status: string; 
}

const initialData: Order[] = [
  { id: "1", orderId: "ORD-001", customer: "Rajesh Kumar", phone: "+91 9876543210", email: "rajesh@example.com", date: "2024-12-20", total: 2500, status: "Pending" },
  { id: "2", orderId: "ORD-002", customer: "Priya Sharma", phone: "+91 8765432109", email: "priya@example.com", date: "2024-12-19", total: 8750, status: "Confirmed" },
  { id: "3", orderId: "ORD-003", customer: "Vijay Anand", phone: "+91 7654321098", email: "vijay@example.com", date: "2024-12-18", total: 15000, status: "Converted" },
  { id: "4", orderId: "ORD-004", customer: "Lakshmi Devi", phone: "+91 6543210987", email: "lakshmi@example.com", date: "2024-12-17", total: 3200, status: "Cancelled" },
];

const MODULE = "Orders";

export default function Orders() {
  const { hasPermission } = usePermissions();
  const [data] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = data.filter((d) => statusFilter === "all" || d.status === statusFilter);

  const columns: Column<Order>[] = [
    { 
      key: "orderId", 
      label: "Order ID", 
      sortable: true, 
      render: (i) => <Text className="font-mono font-medium text-foreground">{i.orderId}</Text> 
    },
    { key: "customer", label: "Customer", sortable: true },
    { key: "date", label: "Date", sortable: true, mobileHide: true },
    { 
      key: "total", 
      label: "Total", 
      sortable: true, 
      render: (i) => <Text className="font-medium text-foreground">₹{i.total.toLocaleString()}</Text> 
    },
    { 
      key: "status", 
      label: "Status", 
      render: (i) => <StatusBadge status={i.status} /> 
    },
    { 
      key: "actions", 
      label: "Actions", 
      render: (i) => (
        <View className="flex-row gap-1">
          <Button variant="ghost" size="icon">
            <Eye size={16} color="#4f46e5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ArrowRightLeft size={16} color="#4f46e5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Receipt size={16} color="#4f46e5" />
          </Button>
        </View>
      )
    },
  ];

  return (
    <MasterScreenLayout 
      title="Orders" 
      subtitle="Manage incoming orders" 
      totalCount={data.length} 
      module={MODULE}
    >
      <AdaptiveTable 
        data={filtered} 
        columns={columns} 
        searchPlaceholder="Search orders..." 
        searchKeys={["orderId", "customer"]}
        renderCardHeader={(i) => (
          <View>
            <Text className="text-lg font-bold text-foreground mb-0.5">{i.orderId}</Text>
            <Text className="text-sm font-medium text-foreground">{i.customer}</Text>
            <Text className="text-xs text-muted-foreground">{i.phone}</Text>
            <Text className="text-xs text-muted-foreground">{i.email}</Text>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-2">
            <View className="flex-row justify-between items-center bg-muted/50 p-2 rounded-lg">
              <View>
                <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Ordered Date</Text>
                <Text className="text-sm font-medium">{format(new Date(i.date), "d MMM yyyy")}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Total</Text>
                <Text className="text-sm font-bold text-primary">₹{i.total.toLocaleString()}</Text>
              </View>
            </View>
            <View className="flex-row">
              <StatusBadge status={i.status} />
            </View>
          </View>
        )}
        renderCardFooter={(i) => (
          <View className="flex-row items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1" label="View" onPress={() => {}}>
              <Eye size={14} color="#64748b" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" label="Convert" onPress={() => {}}>
              <ArrowRightLeft size={14} color="#64748b" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" label="Bill" onPress={() => {}}>
              <Receipt size={14} color="#64748b" />
            </Button>
          </View>
        )}
      />
    </MasterScreenLayout>
  );
}
