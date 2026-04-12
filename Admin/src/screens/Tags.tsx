import React, { useState } from "react";
import { View, Text } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { PermissionGuard, usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, Palette } from "lucide-react-native";
import { ScrollView } from "react-native";

interface Tag { id: string; name: string; slug: string; color: string; status: string; }

const initialData: Tag[] = [
  { id: "1", name: "Diwali Special", slug: "diwali-special", color: "#f59e0b", status: "Active" },
  { id: "2", name: "New Arrival", slug: "new-arrival", color: "#3b82f6", status: "Active" },
  { id: "3", name: "Best Seller", slug: "best-seller", color: "#ef4444", status: "Inactive" },
];

const MODULE = "Tags";

export default function Tags() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Tag | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Tag>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: Tag) => {
    setEditItem(item || null);
    setForm(item || { status: "Active", color: "#cccccc" });
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleSubmit = () => {
    if (!form.name) return;
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...form } as Tag : i));
    } else {
      setData([...data, { ...form, id: String(Date.now()) } as Tag]);
    }
    setFormOpen(false);
  };

  const columns: Column<Tag>[] = [
    {
      key: "color",
      label: "Color",
      render: (i) => (
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: i.color || "#ccc" }} />
          <Text className="text-[10px] text-muted-foreground font-mono uppercase">{i.color}</Text>
        </View>
      )
    },
    { key: "name", label: "Tag Name", sortable: true },
    { key: "slug", label: "Slug", mobileHide: true },
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
      title="Tags"
      subtitle="Manage product labels"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={[
        { key: "name", label: "Tag Name" },
        { key: "slug", label: "Slug" },
        { key: "color", label: "Color HEX" },
        { key: "status", label: "Status" }
      ]}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search tags..."
        searchKeys={["name", "slug"]}
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
            <View className="h-10 w-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: i.color || "#ccc" }} />
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{i.name}</Text>
              <Text className="text-xs text-muted-foreground">{i.slug}</Text>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="flex-row justify-between items-center bg-muted/50 p-3 rounded-xl border border-border/50">
              <View>
                <Text className="text-[10px] text-muted-foreground uppercase font-black mb-0.5">HEX CODE</Text>
                <Text className="text-sm font-bold text-foreground font-mono uppercase tracking-tighter">{i.color}</Text>
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
        title={editItem ? "Edit Tag" : "Add Tag"}
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
              label="Tag Name *"
              value={form.name || ""}
              onChangeText={(v) => {
                const slug = v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                setForm({ ...form, name: v, slug });
              }}
              placeholder="e.g. Diwali Special"
            />
            <Input
              label="Slug"
              value={form.slug || ""}
              onChangeText={(v) => setForm({ ...form, slug: v })}
              placeholder="url-friendly-name"
            />

            <View className="flex-row gap-4 items-end">
              <View className="flex-1">
                <Input
                  label="Accent Color (HEX) *"
                  value={form.color || ""}
                  onChangeText={(v) => setForm({ ...form, color: v })}
                  placeholder="#f59e0b"
                  leftIcon={<Palette size={16} color="#64748b" />}
                />
              </View>
              <View className="h-12 w-12 rounded-xl border border-border shadow-sm mb-0" style={{ backgroundColor: form.color || "#cccccc" }} />
            </View>

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
        </ScrollView>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName="tag"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
