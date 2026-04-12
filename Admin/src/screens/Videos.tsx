import React, { useState } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { PermissionGuard, usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, Play, Film } from "lucide-react-native";
import { cn } from "../lib/utils";

interface VideoItem { id: string; title: string; category: string; url: string; thumbnail: string; type: string; status: string; }

const initialData: VideoItem[] = [
  { id: "1", title: "Diwali Collection 2024", category: "Promo", url: "https://youtube.com/watch?v=example1", thumbnail: "", type: "YouTube", status: "Active" },
  { id: "2", title: "How to use Sparklers", category: "Tutorial", url: "", thumbnail: "", type: "Upload", status: "Active" },
];

const MODULE = "Videos";

export default function Videos() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<VideoItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<VideoItem>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: VideoItem) => {
    setEditItem(item || null);
    setForm(item || { type: "YouTube", status: "Active", category: "Promo" });
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleSubmit = () => {
    if (!form.title) return;
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...form } as VideoItem : i));
    } else {
      setData([...data, { ...form, id: String(Date.now()) } as VideoItem]);
    }
    setFormOpen(false);
  };

  const columns: Column<VideoItem>[] = [
    {
      key: "thumbnail",
      label: "Preview",
      render: (i) => (
        <View className="h-10 w-16 rounded overflow-hidden bg-muted items-center justify-center border border-border">
          {i.thumbnail ? (
            <Image source={{ uri: i.thumbnail }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Play size={16} color="#64748b" />
          )}
        </View>
      )
    },
    { key: "title", label: "Title", sortable: true },
    { key: "category", label: "Category", mobileHide: true },
    {
      key: "type",
      label: "Type",
      render: (i) => (
        <View className={i.type === "YouTube" ? "bg-red-100 px-2 py-0.5 rounded-full" : "bg-indigo-100 px-2 py-0.5 rounded-full"}>
          <Text className={i.type === "YouTube" ? "text-red-700 text-[10px] font-bold" : "text-indigo-700 text-[10px] font-bold"}>{i.type}</Text>
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
      title="Videos"
      subtitle="Manage product & promotional videos"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={[
        { key: "title", label: "Video Title" },
        { key: "category", label: "Category" },
        { key: "url", label: "Video URL" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" }
      ]}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search videos..."
        searchKeys={["title", "category"]}
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
            <View className="h-12 w-20 rounded-lg bg-black/5 items-center justify-center border border-border overflow-hidden">
              {i.thumbnail ? (
                <Image source={{ uri: i.thumbnail }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Film size={24} color="#94a3b8" />
              )}
              <View className="absolute inset-0 items-center justify-center bg-black/10">
                <Play size={16} color="white" fill="white" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>{i.title}</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <Text className="text-[10px] font-bold text-primary uppercase">{i.category}</Text>
                <View className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <Text className={cn("text-[10px] font-bold", i.type === "YouTube" ? "text-red-500" : "text-indigo-500")}>{i.type}</Text>
              </View>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="flex-row justify-between items-center bg-muted/50 p-3 rounded-xl border border-border/50">
              <View className="flex-1 mr-4">
                <Text className="text-[10px] text-muted-foreground uppercase font-black mb-0.5">SOURCE URL</Text>
                <Text className="text-sm font-medium text-foreground italic" numberOfLines={1}>{i.url || "N/A"}</Text>
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
        title={editItem ? "Edit Video" : "Add Video"}
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
              label="Video Title *"
              value={form.title || ""}
              onChangeText={(v) => setForm({ ...form, title: v })}
              placeholder="e.g. Diwali Showcase"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Category"
                  value={form.category || ""}
                  onChangeText={(v) => setForm({ ...form, category: v })}
                  placeholder="Promo, Tutorial..."
                />
              </View>
              <View className="flex-1">
                <Select
                  label="Type"
                  value={form.type || "YouTube"}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { label: "YouTube", value: "YouTube" },
                    { label: "Upload", value: "Upload" },
                  ]}
                />
              </View>
            </View>
            <Input
              label="Video URL"
              value={form.url || ""}
              onChangeText={(v) => setForm({ ...form, url: v })}
              placeholder="https://..."
            />
            <Input
              label="Thumbnail URL"
              value={form.thumbnail || ""}
              onChangeText={(v) => setForm({ ...form, thumbnail: v })}
              placeholder="https://.../thumb.jpg"
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
        </ScrollView>
      </Dialog>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName="video"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
