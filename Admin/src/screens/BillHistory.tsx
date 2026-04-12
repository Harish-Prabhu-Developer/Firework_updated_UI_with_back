import React, { useState } from "react";
import { View, Text } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { StatusBadge } from "../components/StatusBadge";
import { usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Download, XCircle, Share2 } from "lucide-react-native";

interface Bill { 
  id: string; 
  billNo: string; 
  date: string; 
  customer: string; 
  paymentMode: string; 
  total: number; 
  status: string; 
}

const initialData: Bill[] = [
  { id: "1", billNo: "BILL-001", date: "2024-12-20", customer: "Rajesh Kumar", paymentMode: "Cash", total: 2500, status: "Paid" },
  { id: "2", billNo: "BILL-002", date: "2024-12-19", customer: "Priya Sharma", paymentMode: "UPI", total: 8750, status: "Paid" },
  { id: "3", billNo: "BILL-003", date: "2024-12-18", customer: "Vijay Anand", paymentMode: "Card", total: 15000, status: "Cancelled" },
];

const MODULE = "Bills";

export default function BillHistory() {
  const { hasPermission } = usePermissions();
  const [data] = useState(initialData);

  const columns: Column<Bill>[] = [
    { 
      key: "billNo", 
      label: "Bill No.", 
      sortable: true, 
      render: (i) => <Text className="font-mono font-medium text-foreground">{i.billNo}</Text> 
    },
    { key: "date", label: "Date", sortable: true, mobileHide: true },
    { key: "customer", label: "Customer", sortable: true },
    { 
      key: "paymentMode", 
      label: "Payment", 
      render: (i) => <StatusBadge status={i.paymentMode} /> 
    },
    { 
      key: "total", 
      label: "Total", 
      sortable: true, 
      render: (i) => <Text className="font-medium text-foreground">₹{i.total.toLocaleString()}</Text> 
    },
    { 
      key: "status", 
      label: "Status", 
      render: (i) => <StatusBadge status={i.status === "Paid" ? "Active" : "Cancelled"} /> 
    },
    { 
      key: "actions", 
      label: "Actions", 
      render: (i) => (
        <View className="flex-row gap-1">
          <Button variant="ghost" size="icon">
            <Download size={16} color="#4f46e5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 size={16} color="#4f46e5" />
          </Button>
          <Button variant="ghost" size="icon">
            <XCircle size={16} color="#ef4444" />
          </Button>
        </View>
      )
    },
  ];

  return (
    <MasterScreenLayout 
      title="Bill History" 
      subtitle="View all generated bills & invoices" 
      totalCount={data.length} 
      onAddNew={() => console.log("Create bill")} 
      module={MODULE}
    >
      <AdaptiveTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Search bills..." 
        searchKeys={["billNo", "customer"]}
      />
    </MasterScreenLayout>
  );
}
