import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { PermissionGuard, usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, UserCog, Mail, Phone, ShieldCheck } from "lucide-react-native";

interface User { id: string; name: string; role: string; description: string; phone: string; email: string; status: string; }

const initialData: User[] = [
  { id: "1", name: "Admin User", role: "Admin", description: "System administrator", phone: "9876543210", email: "admin@crackers.com", status: "Active" },
  { id: "2", name: "Sales Person", role: "Sales", description: "Sales team member", phone: "9876543211", email: "sales@crackers.com", status: "Active" },
];

const MODULE = "Users";

export default function Users() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: User) => {
    setEditItem(item || null);
    setForm(item || { status: "Active", role: "Viewer" });
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...form } as User : i));
    } else {
      setData([...data, { ...form, id: String(Date.now()) } as User]);
    }
    setFormOpen(false);
  };

  const columns: Column<User>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "role",
      label: "Role",
      render: (i) => (
        <View className="bg-primary/10 px-2 py-0.5 rounded-full self-start">
          <Text className="text-primary text-[10px] font-bold uppercase">{i.role}</Text>
        </View>
      )
    },
    { key: "phone", label: "Phone", mobileHide: true },
    { key: "email", label: "Email", mobileHide: true },
    { key: "status", label: "Status", render: (i) => <StatusBadge status={i.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (i) => (
        <View className="flex-row gap-2">
          <PermissionGuard module={MODULE} action="Update">
            <Button variant="ghost" size="icon" onPress={() => openForm(i)}>
              <Pencil size={18} color="#4f46e5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard module={MODULE} action="Delete">
            <Button variant="ghost" size="icon" onPress={() => setDeleteId(i.id)}>
              <Trash2 size={18} color="#ef4444" />
            </Button>
          </PermissionGuard>
        </View>
      )
    },
  ];

  const handleExport = (format: string) => {
    console.log(`Exporting ${MODULE} as ${format}`);
  };

  const handleImport = (importedData: any[]) => {
    setData([...data, ...importedData.map(i => ({ ...i, id: String(Date.now() + Math.random()) }))]);
  };

  return (
    <MasterScreenLayout
      title="Users"
      subtitle="Manage system users & staff"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={[
        { key: "name", label: "Full Name" },
        { key: "role", label: "Role" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status" }
      ]}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search users..."
        searchKeys={["name", "email", "phone"]}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={hasPermission(MODULE, "Bulk Delete") ? (ids) => {
          setData(data.filter((d) => !ids.includes(d.id)));
          setSelectedIds([]);
        } : undefined}
        filterComponent={
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
                className="h-10"
              />
            </View>
          </View>
        }
        renderCardHeader={(i) => (
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 rounded-full bg-indigo-50 items-center justify-center border border-indigo-100">
              <UserCog size={20} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{i.name}</Text>
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={10} color="#4f46e5" />
                <Text className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{i.role}</Text>
              </View>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="bg-muted/50 p-3 rounded-xl border border-border/50 gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Mail size={12} color="#64748b" />
                  <Text className="text-xs font-medium text-foreground">{i.email}</Text>
                </View>
                <StatusBadge status={i.status} />
              </View>
              {i.phone && (
                <View className="flex-row items-center gap-2 pt-1 border-t border-border/30">
                  <Phone size={12} color="#64748b" />
                  <Text className="text-xs text-muted-foreground">{i.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        renderCardFooter={(i) => (
          <View className="flex-row items-center border-t border-border/40 mt-3 pt-0.5">
            <PermissionGuard module={MODULE} action="Update" className="flex-1 border-r border-border/30">
              <Button
                variant="ghost"
                className="w-full h-12 flex-row items-center justify-center"
                onPress={() => openForm(i)}
              >
                <Pencil size={20} color="#4f46e5" />
              </Button>
            </PermissionGuard>

            <PermissionGuard module={MODULE} action="Delete" className="flex-1">
              <Button
                variant="ghost"
                className="w-full h-12 flex-row items-center justify-center"
                onPress={() => setDeleteId(i.id)}
              >
                <Trash2 size={20} color="#ef4444" />
              </Button>
            </PermissionGuard>
          </View>
        )}
      />

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? "Edit User" : "Add User"}
        footer={
          <>
            <Button variant="outline" label="Cancel" onPress={() => setFormOpen(false)} />
            <Button label="Save" onPress={handleSubmit} />
          </>
        }
      >
        <ScrollView className="max-h-[70vh]">
          <View className="gap-5 pb-10 p-1">
            <Input
              label="Full Name *"
              value={form.name || ""}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="e.g. Michael Scott"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Select
                  label="User Role *"
                  value={form.role || "Viewer"}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                  options={[
                    { label: "Admin", value: "Admin" },
                    { label: "Manager", value: "Manager" },
                    { label: "Sales", value: "Sales" },
                    { label: "Viewer", value: "Viewer" },
                  ]}
                />
              </View>
              <View className="flex-1">
                <Select
                  label="Status"
                  value={form.status || "Active"}
                  onValueChange={(v) => setForm({ ...form, status: v as any })}
                  options={[
                    { label: "Active", value: "Active" },
                    { label: "Inactive", value: "Inactive" },
                  ]}
                />
              </View>
            </View>
            <Input
              label="Phone Number"
              keyboardType="phone-pad"
              value={form.phone || ""}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              placeholder="10-digit mobile"
            />
            <Input
              label="Email Address *"
              keyboardType="email-address"
              value={form.email || ""}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="user@example.com"
            />
            <Textarea
              label="Description / Bio"
              value={form.description || ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Internal notes or title..."
            />
          </View>
        </ScrollView>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName="user"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
