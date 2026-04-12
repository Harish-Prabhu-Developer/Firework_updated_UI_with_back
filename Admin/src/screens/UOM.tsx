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
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, Ruler } from "lucide-react-native";

interface UOM { id: string; name: string; code: string; status: string; }

const initialData: UOM[] = [
  { id: "1", name: "Piece", code: "PCS", status: "Active" },
  { id: "2", name: "Box", code: "BOX", status: "Active" },
  { id: "3", name: "Kilogram", code: "KG", status: "Inactive" },
];

const MODULE = "UOM";

export default function UOM() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<UOM | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<UOM>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: UOM) => {
    setEditItem(item || null);
    setForm(item || { status: "Active" });
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...form } as UOM : i));
    } else {
      setData([...data, { ...form, id: String(Date.now()) } as UOM]);
    }
    setFormOpen(false);
  };

  const columns: Column<UOM>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (i) => (
        <View className="bg-muted px-2 py-0.5 rounded">
          <Text className="font-mono text-xs text-foreground uppercase">{i.code}</Text>
        </View>
      )
    },
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
      title="UOM"
      subtitle="Manage units of measurement"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={[
        { key: "name", label: "UOM Name" },
        { key: "code", label: "Code" },
        { key: "status", label: "Status" }
      ]}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search UOM..."
        searchKeys={["name", "code"]}
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
             <Text className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{i.code}</Text>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
             <View className="flex-row justify-between items-center bg-muted/50 p-3 rounded-xl border border-border/50">
                <View>
                   <Text className="text-[10px] text-muted-foreground uppercase font-black mb-0.5">SYMBOL</Text>
                   <Text className="text-sm font-bold text-foreground font-mono">{i.code}</Text>
                </View>
                <StatusBadge status={i.status} />
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
        title={editItem ? "Edit UOM" : "Add UOM"}
        footer={
          <>
            <Button variant="outline" label="Cancel" onPress={() => setFormOpen(false)} />
            <Button label="Save" onPress={handleSubmit} />
          </>
        }
      >
        <View className="gap-5 pb-10">
          <Input
            label="UOM Name *"
            value={form.name || ""}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="e.g. Kilogram"
          />
          <Input
            label="Code *"
            value={form.code || ""}
            onChangeText={(v) => setForm({ ...form, code: v })}
            placeholder="e.g. KG"
          />
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
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName="UOM"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
