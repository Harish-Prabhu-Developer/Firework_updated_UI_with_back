import React, { useState, useRef } from "react";
import { View, Text, Image, Pressable, ScrollView, Platform } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { PermissionGuard, usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, Upload, Link as LinkIcon, Package } from "lucide-react-native";
import { PermissionsAndroid } from "react-native";

interface Category {
  id: string;
  image: string;
  name: string;
  rank: number;
  description: string;
  slug: string;
  status: string;
}

const initialData: Category[] = [
  { id: "1", image: "", name: "Crackers", rank: 2, description: "All types of crackers", slug: "crackers", status: "Active" },
  { id: "2", image: "", name: "Sparklers", rank: 1, description: "Sparkler items", slug: "sparklers", status: "Active" },
  { id: "3", image: "", name: "Rockets", rank: 3, description: "Rocket crackers", slug: "rockets", status: "Inactive" },
];

const MODULE = "Categories";

import { pickImage } from "../lib/filePicker";
import { exportData } from "../lib/exportSystem";

export default function Categories() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Category>>({});
  const [imageMode, setImageMode] = useState<"upload" | "link">("upload");

  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter((item) => statusFilter === "all" || item.status === statusFilter);

  const openForm = (item?: Category) => {
    setEditItem(item || null);
    setForm(item || { status: "Active", rank: (data.length + 1) });
    setImageMode(item?.image?.startsWith("http") ? "link" : "upload");
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filteredData.length ? [] : filteredData.map(i => i.id));
  };

  const handleImagePick = async (e?: any) => {
    let uri;
    if (Platform.OS === 'web') {
      const file = e?.target?.files?.[0] || e?.dataTransfer?.files?.[0];
      if (file) uri = URL.createObjectURL(file);
    } else {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          alert("Storage permission denied");
          return;
        }
      }
      uri = await pickImage();
    }
    if (uri) setForm({ ...form, image: uri });
  };

  const handleExport = (format: 'PDF' | 'CSV' | 'EXCEL') => {
    exportData(data, "Categories_List", format);
  };

  const handleImport = (importedRows: Record<string, string>[]) => {
    console.log("Categories Import JSON:", importedRows);
    alert(`Successfully processed ${importedRows.length} categories locally. Check console.`);
  };

  const importCols = [
    { key: "name", label: "Category Name" },
    { key: "slug", label: "Slug" },
    { key: "rank", label: "Rank" },
    { key: "status", label: "Status" },
    { key: "description", label: "Description" },
  ];

  const handleSubmit = () => {
    if (!form.name) return;
    const finalForm = { ...form, rank: Number(form.rank) || 0 };
    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...finalForm } as Category : i));
    } else {
      setData([...data, { ...finalForm, id: String(Date.now()), image: form.image || "" } as Category]);
    }
    setFormOpen(false);
  };

  const columns: Column<Category>[] = [
    {
      key: "image",
      label: "Image",
      mobileHide: true,
      render: (i) => i.image ? (
        <Image source={{ uri: i.image }} className="h-10 w-10 rounded" resizeMode="cover" />
      ) : (
        <View className="h-10 w-10 rounded bg-muted items-center justify-center">
          <Text className="text-[10px] text-muted-foreground">No Img</Text>
        </View>
      )
    },
    {
      key: "name",
      label: "Category Name",
      sortable: true,
      render: (i) => (
        <View>
          <Text className="font-medium text-foreground">{i.name}</Text>
          <Text className="text-[10px] text-muted-foreground">{i.slug}</Text>
        </View>
      )
    },
    { key: "rank", label: "Rank", sortable: true, mobileHide: true },
    { key: "status", label: "Status", render: (i) => <StatusBadge status={i.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (i) => (
        <View className="flex-row gap-2">
          <PermissionGuard module={MODULE} action="Update">
            <Button variant="ghost" size="icon" onPress={() => openForm(i)}>
              <Pencil size={16} color="#4f46e5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard module={MODULE} action="Delete">
            <Button variant="ghost" size="icon" onPress={() => setDeleteId(i.id)}>
              <Trash2 size={16} color="#ef4444" />
            </Button>
          </PermissionGuard>
        </View>
      )
    },
  ];

  return (
    <MasterScreenLayout
      title="Categories"
      subtitle="Manage product organization"
      totalCount={data.length}
      allSelected={filteredData.length > 0 && selectedIds.length === filteredData.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={importCols}
      module={MODULE}
    >
      <AdaptiveTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search categories..."
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
            {i.image ? (
              <Image source={{ uri: i.image }} className="h-12 w-12 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="h-12 w-12 rounded-lg bg-muted items-center justify-center">
                <Text className="text-[10px] text-muted-foreground">No Img</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{i.name}</Text>
              <Text className="text-xs text-muted-foreground">slug: {i.slug}</Text>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="flex-row justify-between items-center bg-muted/50 p-2.5 rounded-lg border border-border/50">
              <View>
                <Text className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Rank</Text>
                <Text className="text-sm font-bold text-primary"># {i.rank}</Text>
              </View>
              <View className="flex-row">
                <StatusBadge status={i.status} />
              </View>
            </View>
          </View>
        )}
        renderCardFooter={(i) => (
          <View className="flex-row items-center border-t border-border/40 mt-3 pt-0.5">
            <Button
              variant="ghost"
              className="flex-1 h-12 flex-row items-center justify-center gap-2 border-r border-border/30"
              onPress={() => console.log("View products for", i.name)}
            >
              <Package size={20} color="#64748b" />
              <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Products</Text>
            </Button>

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
        title={editItem ? "Edit Category" : "Add Category"}
        footer={
          <>
            <Button variant="outline" label="Cancel" onPress={() => setFormOpen(false)} />
            <Button label="Save" onPress={handleSubmit} />
          </>
        }
      >
        <ScrollView className="max-h-[70vh]">
          <View className="gap-6 pb-6 p-1">
            <View>
              <Text className="text-sm font-medium text-foreground mb-3">Category Image</Text>
              <View className="flex-row gap-2 mb-4">
                <Button
                  variant={imageMode === "upload" ? "default" : "outline"}
                  size="sm"
                  label="Upload"
                  onPress={() => setImageMode("upload")}
                  className="flex-1"
                />
                <Button
                  variant={imageMode === "link" ? "default" : "outline"}
                  size="sm"
                  label="Paste Link"
                  onPress={() => setImageMode("link")}
                  className="flex-1"
                />
              </View>

              {imageMode === "upload" ? (
                <View>
                  <Pressable
                    onPress={() => handleImagePick()}
                    className="border-2 border-dashed border-border rounded-xl p-6 items-center justify-center bg-muted/10 overflow-hidden min-h-[160px]"
                    // @ts-ignore - Web specific drag props
                    onDragOver={(e: any) => Platform.OS === 'web' && e.preventDefault()}
                    onDrop={(e: any) => {
                      if (Platform.OS === 'web') {
                        e.preventDefault();
                        handleImagePick(e);
                      }
                    }}
                  >
                    {form.image ? (
                      <View className="absolute inset-0">
                        <Image source={{ uri: form.image }} className="w-full h-full" resizeMode="cover" />
                        <View className="absolute inset-0 bg-black/20 flex-row items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload size={24} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <>
                        <Upload size={32} color="#94a3b8" />
                        <Text className="text-xs text-muted-foreground mt-2 text-center">
                          {Platform.OS === 'web' ? 'Click to browse or Drag & Drop image' : 'Tap here to upload image'}
                        </Text>
                      </>
                    )}
                    {Platform.OS === 'web' && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagePick}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    )}
                  </Pressable>
                  {form.image && (
                    <Button
                      variant="ghost"
                      size="sm"
                      label="Remove & Re-upload"
                      onPress={() => setForm({ ...form, image: "" })}
                      className="mt-2"
                      textClassName="text-destructive text-xs italic"
                    />
                  )}
                </View>
              ) : (
                <View className="gap-4">
                  <Input
                    value={form.image || ""}
                    onChangeText={(v) => setForm({ ...form, image: v })}
                    placeholder="Paste image URL here..."
                    leftIcon={<LinkIcon size={16} color="#64748b" />}
                  />
                  {form.image && (
                    <View className="items-center">
                      <Image source={{ uri: form.image }} className="h-40 w-full rounded-lg border border-border shadow-sm" resizeMode="cover" />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Category Name *"
                  value={form.name || ""}
                  onChangeText={(v) => {
                    const slug = v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                    setForm({ ...form, name: v, slug });
                  }}
                  placeholder="e.g. Crackers"
                />
              </View>
              <View className="w-24">
                <Input
                  label="Rank"
                  value={String(form.rank || "")}
                  onChangeText={(v) => setForm({ ...form, rank: isNaN(parseInt(v)) ? 0 : parseInt(v) })}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Description"
              value={form.description || ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
              numberOfLines={3}
              className="h-20"
              placeholder="Short description of the category..."
            />

            <Input
              label="Slug"
              value={form.slug || ""}
              onChangeText={(v) => setForm({ ...form, slug: v })}
              placeholder="category-slug"
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
        itemName="category"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
