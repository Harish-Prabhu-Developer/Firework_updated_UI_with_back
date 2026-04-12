import React, { useState } from "react";
import { View, Text, Image, Platform, Pressable, ScrollView, PermissionsAndroid } from "react-native";
import { MasterScreenLayout } from "../components/MasterScreenLayout";
import { AdaptiveTable, Column } from "../components/AdaptiveTable";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { PermissionGuard, usePermissions } from "../hooks/usePermissions";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Dialog } from "../components/ui/Dialog";
import { Pencil, Trash2, Upload, Link as LinkIcon, Package } from "lucide-react-native";

interface Product {
  id: string;
  image: string;
  name: string;
  description: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  status: string;
  tags: string;
}

const initialData: Product[] = [
  { id: "1", image: "", name: "Flower Pots Small", description: "Small flower pot crackers", slug: "flower-pots-small", category: "Crackers", price: 60, mrp: 120, stock: 100, status: "Active", tags: "" },
  { id: "2", image: "", name: "Classic Laxmi Bomb", description: "Traditional Laxmi bombs", slug: "classic-laxmi-bomb", category: "Bombs", price: 25, mrp: 50, stock: 100, status: "Active", tags: "" },
];

const MODULE = "Products";

import { pickImage } from "../lib/filePicker";
import { exportData } from "../lib/exportSystem";

export default function Products() {
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(initialData);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Partial<Record<keyof Product, string>>>({});
  const [imageMode, setImageMode] = useState<"upload" | "link">("upload");

  const filtered = data.filter((d) => (categoryFilter === "all" || d.category === categoryFilter) && (statusFilter === "all" || d.status === statusFilter));

  const openForm = (item?: Product) => {
    setEditItem(item || null);
    setForm(item ? { ...item, price: String(item.price), mrp: String(item.mrp), stock: String(item.stock) } as any : { status: "Active" });
    setImageMode(item?.image?.startsWith("http") ? "link" : "upload");
    setFormOpen(true);
  };

  const handleToggleAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(i => i.id));
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
    exportData(data, "Products_Inventory", format);
  };

  const handleImport = (importedRows: Record<string, string>[]) => {
    console.log("Products Import JSON:", importedRows);
    alert(`Successfully processed ${importedRows.length} products locally. Check console.`);
  };

  const importCols = [
    { key: "name", label: "Product Name" },
    { key: "price", label: "Selling Price" },
    { key: "mrp", label: "MRP" },
    { key: "category", label: "Category" },
    { key: "stock", label: "Stock" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = () => {
    if (!form.name) return;
    const product = {
      ...form,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || 0,
      stock: Number(form.stock) || 0
    } as unknown as Product;

    if (editItem) {
      setData(data.map((i) => i.id === editItem.id ? { ...i, ...product } : i));
    } else {
      setData([...data, { ...product, id: String(Date.now()), image: product.image || "" }]);
    }
    setFormOpen(false);
  };

  const columns: Column<Product>[] = [
    {
      key: "image",
      label: "Img",
      mobileHide: true,
      render: (i) => i.image ? (
        <Image source={{ uri: i.image }} className="h-10 w-10 rounded" />
      ) : (
        <View className="h-10 w-10 rounded bg-muted items-center justify-center">
          <Text className="text-[8px] text-muted-foreground">No Img</Text>
        </View>
      )
    },
    {
      key: "name",
      label: "Product Name",
      sortable: true,
      render: (i) => (
        <View>
          <Text className="font-medium text-foreground">{i.name}</Text>
          <Text className="text-[10px] text-muted-foreground">{i.slug}</Text>
        </View>
      )
    },
    { key: "category", label: "Category", sortable: true, mobileHide: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (i) => (
        <View>
          <Text className="font-medium text-foreground">₹{i.price}</Text>
          <Text className="text-[10px] text-muted-foreground line-through">₹{i.mrp}</Text>
        </View>
      )
    },
    { key: "stock", label: "Stock", render: (i) => <Text className="text-sm">{i.stock}</Text> },
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
      title="Products"
      subtitle="Manage system inventory"
      totalCount={data.length}
      allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
      onToggleAll={handleToggleAll}
      onAddNew={() => openForm()}
      onExport={handleExport}
      onImport={handleImport}
      importExpectedColumns={importCols}
      module={MODULE}
    >
      <AdaptiveTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search products..."
        searchKeys={["name", "slug", "category"]}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={hasPermission(MODULE, "Bulk Delete") ? (ids) => {
          setData(data.filter((d) => !ids.includes(d.id)));
          setSelectedIds([]);
        } : undefined}
        filterComponent={
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                options={[
                  { label: "All Categories", value: "all" },
                  ...Array.from(new Set(data.map(d => d.category))).map(c => ({ label: c, value: c }))
                ]}
                className="h-10"
              />
            </View>
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
              <Text className="text-xs text-muted-foreground">{i.category}</Text>
            </View>
          </View>
        )}
        renderCardBody={(i) => (
          <View className="gap-3">
            <View className="flex-row justify-between items-center bg-muted/50 p-3 rounded-xl border border-border/50">
              <View className="gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Selling Price:</Text>
                  <Text className="text-sm font-black text-primary">₹{i.price}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">MRP Price:</Text>
                  <Text className="text-xs text-muted-foreground line-through">₹{i.mrp}</Text>
                </View>
              </View>
              <View className="items-end bg-card/60 px-3 py-2 rounded-lg border border-border/40 shadow-sm">
                <Text className="text-[9px] text-muted-foreground uppercase font-black mb-0.5">Stock Status</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-base font-black text-foreground">{i.stock}</Text>
                  <Text className="text-[9px] font-bold text-muted-foreground italic">Units</Text>
                </View>
              </View>
            </View>
            <View className="flex-row">
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
        title={editItem ? "Edit Product" : "Add Product"}
        footer={
          <>
            <Button variant="outline" label="Cancel" onPress={() => setFormOpen(false)} />
            <Button label="Save" onPress={handleSubmit} />
          </>
        }
      >
        <ScrollView className="max-h-[70vh]">
          <View className="gap-5 pb-10 p-1">
            <View>
              <Text className="text-sm font-medium text-foreground mb-3">Product Image</Text>
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

            <Input
              label="Product Name *"
              value={form.name || ""}
              onChangeText={(v) => {
                const slug = v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                setForm({ ...form, name: v, slug });
              }}
              placeholder="Full display name"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Selling Price"
                  value={form.price || ""}
                  onChangeText={(v) => setForm({ ...form, price: v })}
                  keyboardType="numeric"
                  placeholder="0.00"
                  leftIcon={<Text className="text-muted-foreground mr-1">₹</Text>}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="MRP"
                  value={form.mrp || ""}
                  onChangeText={(v) => setForm({ ...form, mrp: v })}
                  keyboardType="numeric"
                  placeholder="0.00"
                  leftIcon={<Text className="text-muted-foreground mr-1">₹</Text>}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Select
                  label="Category"
                  value={form.category || ""}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  options={[
                    ...Array.from(new Set(data.map(d => d.category))).map(c => ({ label: c, value: c }))
                  ]}
                  placeholder="Choose Category"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Stock Quantity"
                  value={form.stock || ""}
                  onChangeText={(v) => setForm({ ...form, stock: v })}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </View>

            <Textarea
              label="Description"
              value={form.description || ""}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Detailed product details..."
            />

            <Input
              label="Slug"
              value={form.slug || ""}
              onChangeText={(v) => setForm({ ...form, slug: v })}
              placeholder="url-friendly-name"
            />

            <Input
              label="Tags"
              value={form.tags || ""}
              onChangeText={(v) => setForm({ ...form, tags: v })}
              placeholder="offer, new, seasonal..."
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
        itemName="product"
        onConfirm={() => { setData(data.filter((d) => d.id !== deleteId)); setDeleteId(null); }}
      />
    </MasterScreenLayout>
  );
}
