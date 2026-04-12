import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
import { Pencil, Trash2, Shield, Fingerprint, ShieldAlert } from "lucide-react-native";

interface Role { id: string; name: string; description: string; status: string; }

const initialData: Role[] = [
  { id: "1", name: "Admin", description: "Full system access", status: "Active" },
  { id: "2", name: "Sales", description: "Sales & billing access", status: "Active" },
  { id: "3", name: "Manager", description: "Reports & inventory", status: "Active" },
  { id: "4", name: "Viewer", description: "Read-only access", status: "Inactive" },
];

const MODULE = "Roles";

export default function Roles() {
  const navigation = useNavigation<any>();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Role>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: Role) => {
    setEditItem(item || null);
    setForm(item || { status: "Active" });
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...form } as Role : i));
    } else {
      setData([...data, { ...form, id: String(Date.now()) } as Role]);
    }
    setFormOpen(false);
  };

  const columns: Column<Role>[] = [
    { key: "name", label: "Role Name", sortable: true },
    { key: "description", label: "Description", mobileHide: true },
    { key: "status", label: "Status", render: (i) => <StatusBadge status={i.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (i) => (
        <View className="flex-row gap-2">
          <PermissionGuard module="Permissions" action="Update">
            <Button variant="ghost" size="icon" onPress={() => navigation.navigate('Permissions', { roleId: i.id })}>
              <Shield size={18} color="#f97316" />
            </Button>
          </PermissionGuard>
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
      title="Roles"
      subtitle="Manage security levels & user roles"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={[
        { key: "name", label: "Role Name" },
        { key: "description", label: "Description" },
        { key: "status", label: "Status" }
      ]}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search roles..."
        searchKeys={["name", "description"]}
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
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{i.name}</Text>
            <View className="flex-row items-center gap-2">
              <Fingerprint size={10} color="#f97316" />
              <Text className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{MODULE} ACCESS</Text>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="bg-muted/50 p-3 rounded-xl border border-border/50 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] text-muted-foreground uppercase font-black">DESCRIPTION</Text>
                <StatusBadge status={i.status} />
              </View>
              <Text className="text-xs text-foreground font-medium italic">"{i.description || 'No description provided'}"</Text>
            </View>
          </View>
        )}
        renderCardFooter={(i) => (
          <View className="flex-row items-center border-t border-border/40 mt-3 pt-0.5">
            <PermissionGuard module="Permissions" action="Update" className="flex-1 border-r border-border/30">
              <Button
                variant="ghost"
                className="w-full h-12 flex-row items-center justify-center"
                onPress={() => navigation.navigate('Permissions', { roleId: i.id })}
              >
                <Shield size={20} color="#f97316" />
              </Button>
            </PermissionGuard>

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
        title={editItem ? "Edit Role" : "Add Role"}
        footer={
          <>
            <Button variant="outline" label="Cancel" onPress={() => setFormOpen(false)} />
            <Button label="Save" onPress={handleSubmit} />
          </>
        }
      >
        <ScrollView className="max-h-[70vh]">
          <View className="gap-5 pb-10 p-1">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Role Name *"
                  value={form.name || ""}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                  placeholder="e.g. Sales Team"
                />
              </View>
              <View className="w-24">
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
            <Textarea
              label="Scope & Permissions Description"
              value={form.description || ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Detail the access levels for this role..."
            />
          </View>
        </ScrollView>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName="role"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
