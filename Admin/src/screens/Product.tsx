import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  PermissionsAndroid,
} from 'react-native';
import {
  Pencil,
  Trash2,
  Eye,
  Package,
  Plus,
  X,
  Save,
  Upload,
  Link,
  CloudUpload,
  Check,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { ImagePreviewModal } from '../components/modals/ImagePreviewModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import { usePermissions } from '../hooks/usePermissions';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts, FontSizes } from '../styles/globalStyles';
import { pickImage } from '../utils/permissionUtils';

interface Product {
  id: string; name: string; slug: string; image?: string; images?: string[]; description?: string;
  mrp: string; sellingPrice: string; rank: number; isActive: boolean;
  category?: { id: string; name: string }; uom?: { id: string; code: string };
  stock?: { quantity: number };
  productTags?: Array<{ tag: { id: string; name: string; color?: string } }>;
}
interface Category { id: string; name: string; isActive: boolean; }
interface UOM { id: string; code: string; name: string; isActive: boolean; }

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  uomId: string;
  mrp: string;
  sellingPrice: string;
  rank: string;
  initialStock: string;
  isActive: boolean;
  imageUrl: string;
  tagId: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  uomId: '',
  mrp: '',
  sellingPrice: '',
  rank: '0',
  initialStock: '0',
  isActive: true,
  imageUrl: '',
  tagId: ''
};

const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

const toDisplayString = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.name === 'string') return record.name;
    if (typeof record.title === 'string') return record.title;
    if (typeof record.slug === 'string') return record.slug;
    return fallback;
  }
  return fallback;
};

const resolveAssetUri = (uri?: unknown) => {
  const value = toDisplayString(uri);
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('file:') || value.startsWith('content:') || value.startsWith('blob:')) {
    return value;
  }
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
};

const productUi = {
  foreground: '#153027',
  mutedForeground: '#667a70',
  card: '#ffffff',
  muted: '#f3f0eb',
  border: '#e6dfd7',
  primary: '#276741',
  primarySoft: '#e8f2ec',
  primaryForeground: '#faf9f6',
  destructive: '#dc2626',
  destructiveSoft: '#fee2e2',
  inactive: '#8a4b12',
  inactiveSoft: '#fff4de',
  active: '#16803c',
  activeSoft: '#e8f7ee',
  uploadSoft: '#f7faf8',
};


const UOMBadge = ({ code }: { code?: string }) => (
  <View 
    className="bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex-row items-center gap-1 self-start"
    style={{ backgroundColor: '#f5f3ff', borderColor: '#e0e7ff' }}
  >
    <View className="w-1 h-1 rounded-full bg-indigo-400" style={{ backgroundColor: '#818cf8' }} />
    <Text 
      className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter" 
      style={{ fontFamily: Fonts.body, color: '#4338ca' }}
    >
      {code || '-'}
    </Text>
  </View>
);


const getUploadedProductPath = (response: any) => {
  const uploaded = response?.data?.data ?? response?.data ?? response;
  const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return first?.relativePath || first?.url || first?.path || '';
};

// Slice-like hook for Product operations
export const useProductQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const productsQuery = useQuery<Product[]>({ 
    queryKey: ['products', 'list'], 
    queryFn: async () => { 
      const { data: res } = await api.get('/products?limit=999999'); 
      const list = [res, res?.data, res?.data?.data].find(Array.isArray);
      return (list ?? []) as Product[];
    } 
  });
  const catsQuery = useQuery<Category[]>({ queryKey: ['categories-list'], queryFn: async () => { const { data } = await api.get('/categories?limit=999999&isActive=true'); return data.data ?? []; } });
  const uomsQuery = useQuery<UOM[]>({ 
    queryKey: ['uoms', 'list'], 
    queryFn: async () => { 
      const { data: res } = await api.get('/uoms?limit=999999'); 
      const list = [res, res?.data, res?.data?.data].find(Array.isArray);
      return (list ?? []) as UOM[];
    } 
  });
  const tagsQuery = useQuery<any[]>({
    queryKey: ['tags', 'active-list'],
    queryFn: async () => {
      const { data } = await api.get('/tags?limit=999999&isActive=true');
      return data.data ?? [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/products/${id}`, payload) : api.post('/products', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['products', 'list'] }); toast.success(variables.id ? 'Product updated' : 'Product created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/products/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', 'list'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.post('/products/bulk-delete', { ids }), onSuccess: (_, ids) => { qc.invalidateQueries({ queryKey: ['products', 'list'] }); toast.success(`${ids.length} deleted`); } });

  return {
    query: productsQuery,
    cats: catsQuery.data || [],
    uoms: uomsQuery.data || [],
    tags: tagsQuery.data || [],
    save: saveMutation,
    remove: deleteMutation,
    bulkRemove: bulkDeleteMutation,
  };
};

export default function Product() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const { query, cats, uoms, tags, save, remove, bulkRemove } = useProductQueries();
  const all = Array.isArray(query.data) ? query.data : [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterActive, setFilterActive] = useState(''); const [filterCat, setFilterCat] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUploading, setImageUploading] = useState(false);

  const route = useRoute<any>();

  useEffect(() => {
    if (route.params?.categoryId) {
      setFilterCat(route.params.categoryId);
    }
  }, [route.params?.categoryId]);

  const data = useMemo(() => {
    let d = all as Product[];
    if (search) d = d.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filterActive) d = d.filter(p => String(p.isActive) === filterActive);
    if (filterCat) d = d.filter(p => p.category?.id === filterCat);
    return d;
  }, [all, search, filterActive, filterCat]);

  const openAdd = () => {
    const nextRank = all.length > 0 ? Math.max(...all.map(p => Number(p.rank) || 0)) + 1 : 1;
    setEditItem(null);
    setForm({ ...EMPTY_FORM, rank: String(nextRank) });
    setImageTab('upload');
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      categoryId: p.category?.id ?? '',
      uomId: p.uom?.id ?? '',
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      rank: String(p.rank),
      initialStock: String(p.stock?.quantity ?? 0),
      isActive: p.isActive,
      imageUrl: p.image ?? '',
      tagId: p.productTags?.[0]?.tag?.id ?? ''
    });
    setImageTab(p.image ? 'url' : 'upload');
    setFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setForm(prev => ({ ...prev, name, slug }));
  };

  const uploadProductImage = async (file: any) => {
    const formData = new FormData();
    formData.append('productImage', file as any);

    const token = await AsyncStorage.getItem('accessToken');
    const response = await fetch(`${API_URL}/uploads/productImage`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.msg || 'Image upload failed');
    }

    const uploadedPath = getUploadedProductPath(result);
    if (!uploadedPath) {
      throw new Error('Upload completed, but no image path was returned.');
    }

    setForm(prev => ({ ...prev, imageUrl: uploadedPath }));
    setImageTab('url');
    toast.success('Product image uploaded');
  };

  const handlePickAndUploadImage = async () => {
    if (imageUploading) return;
    if (!hasPermission('media-library', 'create') && !hasPermission('Media Library', 'Create')) {
      toast.warn('You do not have upload permission.');
      return;
    }

    try {
      const picked = await pickImage('Product');
      if (!picked) return;

      setImageUploading(true);
      await uploadProductImage(picked.webFile || {
        uri: picked.uri,
        name: picked.name,
        type: picked.type,
      });
    } catch (error: any) {
      toast.apiError(error, 'Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = () => {
    save.mutate({
      id: editItem?.id,
      payload: {
        ...form,
        rank: Number(form.rank),
        quantity: Number(form.initialStock),
        image: form.imageUrl,
        isActive: Boolean(form.isActive),
        tagId: form.tagId || null,
      }
    }, {
      onSuccess: () => setFormOpen(false)
    });
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Product>[] = [
    { key: 'image', label: 'Image', width: 70, render: (p) => {
      const img = p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
      return img ? (
        <TouchableOpacity onPress={() => setPreviewUri(resolveAssetUri(img))}>
          <Image source={{ uri: resolveAssetUri(img) }} style={{ width: 40, height: 40, borderRadius: Radius.md }} resizeMode="cover" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
          <Package size={18} color={colors.primary} />
        </View>
      );
    }},
    { key: 'name', label: 'Product', width: 200, sortable: true, render: (p) => <View><Text className="font-bold text-foreground text-sm" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{p.name}</Text><Text className="text-[10px] text-muted-foreground" style={{ fontFamily: Fonts.body }}>{p.category?.name ?? '-'}</Text></View> },
    { key: 'mrp', label: 'MRP', width: 90, align: 'right', render: (p) => <Text className="font-bold text-sm" style={{ fontFamily: Fonts.body }}>₹{parseFloat(p.mrp).toFixed(2)}</Text> },
    { key: 'sellingPrice', label: 'Price', width: 90, align: 'right', render: (p) => <Text className="font-bold text-primary text-sm" style={{ fontFamily: Fonts.body }}>₹{parseFloat(p.sellingPrice).toFixed(2)}</Text> },
    { key: 'stock', label: 'Stock', width: 70, align: 'center', render: (p) => <Text className="font-bold text-sm" style={{ fontFamily: Fonts.body, color: (p.stock?.quantity ?? 0) === 0 ? colors.destructive : colors.success }}>{p.stock?.quantity ?? 0}</Text> },
    { key: 'uom', label: 'UOM', width: 70, render: (p) => <UOMBadge code={p.uom?.code} /> },
    { key: 'tag', label: 'Tag', width: 100, render: (p) => {
      const tag = p.productTags?.[0]?.tag;
      if (!tag) return <Text className="text-muted-foreground text-[10px]" style={{ fontFamily: Fonts.body }}>-</Text>;
      return (
        <View style={{ backgroundColor: (tag.color ?? colors.primary) + '15', borderColor: tag.color ?? colors.primary, borderWidth: 1 }} className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full self-start">
          <View style={{ backgroundColor: tag.color ?? colors.primary }} className="w-1.5 h-1.5 rounded-full" />
          <Text style={{ color: tag.color ?? colors.primary, fontFamily: Fonts.body }} className="text-[9px] font-black uppercase tracking-wide" numberOfLines={1}>{tag.name}</Text>
        </View>
      );
    } },
    { key: 'isActive', label: 'Status', width: 90, render: (p) => <StatusBadge status={p.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', width: 110, render: (p) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => p.image && setPreviewUri(resolveAssetUri(p.image))} className="w-8 h-8 rounded-lg bg-muted items-center justify-center"><Eye size={14} color={colors.mutedForeground} /></TouchableOpacity><TouchableOpacity onPress={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(p.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];

  const renderCard = (p: Product, _sel: boolean) => (
    <View className="p-4">
      <View className="flex-row items-center gap-4 mb-4">
        {(() => {
          const img = p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
          return img ? (
            <TouchableOpacity onPress={() => setPreviewUri(resolveAssetUri(img))}>
              <Image source={{ uri: resolveAssetUri(img) }} style={{ width: 56, height: 56, borderRadius: Radius.md }} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: Radius.md, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color={colors.primary} />
            </View>
          );
        })()}
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-base font-black text-foreground flex-1" style={{ fontFamily: Fonts.display }} numberOfLines={1}>{p.name}</Text>
            <StatusBadge status={p.isActive ? 'Active' : 'Inactive'} />
          </View>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{p.category?.name}</Text>
            <Text className="text-muted-foreground/30">•</Text>
            <UOMBadge code={p.uom?.code} />
            {p.productTags?.[0]?.tag && (
              <>
                <Text className="text-muted-foreground/30">•</Text>
                <View style={{ backgroundColor: (p.productTags[0].tag.color ?? colors.primary) + '15', borderColor: p.productTags[0].tag.color ?? colors.primary, borderWidth: 1 }} className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full self-start">
                  <View style={{ backgroundColor: p.productTags[0].tag.color ?? colors.primary }} className="w-1 h-1 rounded-full" />
                  <Text style={{ color: p.productTags[0].tag.color ?? colors.primary, fontFamily: Fonts.body }} className="text-[8px] font-black uppercase tracking-wide">{p.productTags[0].tag.name}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      <View className="flex-row py-3 gap-4 border-t border-border/40">
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>MRP</Text><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>₹{parseFloat(p.mrp).toFixed(2)}</Text></View>
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Price</Text><Text className="text-sm font-bold text-primary" style={{ fontFamily: Fonts.body }}>₹{parseFloat(p.sellingPrice).toFixed(2)}</Text></View>
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Stock</Text><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body, color: (p.stock?.quantity ?? 0) === 0 ? colors.destructive : colors.success }}>{p.stock?.quantity ?? 0}</Text></View>
      </View>
      <View className="flex-row border-t border-border/40 pt-1">
        <TouchableOpacity onPress={() => openEdit(p)} className="flex-1 py-3 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={14} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(p.id)} className="flex-1 py-3 flex-row items-center justify-center gap-2"><Trash2 size={14} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Products" subtitle="Manage product catalog" onAddNew={openAdd} addNewLabel="Add Product">
      <AdaptiveTable
        data={data} columns={columns} loading={isLoading} emptyText="No products found"
        searchValue={search} onSearchChange={setSearch}
        filters={[
          { key: 'isActive', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
          { key: 'category', label: 'Category', options: cats.map(c => ({ label: c.name, value: c.id })) },
        ]}
        filterValues={{ isActive: filterActive, category: filterCat }}
        onFilterChange={(k, v) => { if (k === 'isActive') setFilterActive(v); else setFilterCat(v); }}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Products Report" exportFilename="products"
        renderCard={renderCard}
      />

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth={760}
        title={
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View style={{ backgroundColor: productUi.primarySoft, padding: 8, borderRadius: Radius.md }}>
              <Plus size={20} color={productUi.primary} strokeWidth={2.75} />
            </View>
            <Text style={{ fontSize: FontSizes.lg, fontWeight: '800', color: productUi.foreground, fontFamily: Fonts.display }}>
              {editItem ? 'Edit Product' : 'Add Product'}
            </Text>
          </View>
        }
        footer={
          <View className="flex-row justify-end" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => setFormOpen(false)}
              className="px-4 py-2 border border-border flex-row items-center justify-center"
              style={{ borderRadius: Radius.lg, backgroundColor: productUi.card, borderColor: productUi.border }}
            >
              <X size={16} color={productUi.foreground} style={{ marginRight: 8 }} />
              <Text style={{ color: productUi.foreground, fontSize: 14, fontWeight: '600', fontFamily: Fonts.body }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={save.isPending}
              className="px-6 py-2 flex-row items-center justify-center"
              style={{ borderRadius: Radius.lg, backgroundColor: productUi.primary, opacity: save.isPending ? 0.7 : 1 }}
            >
              <Save size={16} color={productUi.primaryForeground} style={{ marginRight: 8 }} />
              <Text style={{ color: productUi.primaryForeground, fontSize: 14, fontWeight: '700', fontFamily: Fonts.body }}>
                {save.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View style={{ gap: 20 }}>
          {/* Image Source Selection */}
          <View
            style={{
              borderWidth: 1,
              borderColor: productUi.border,
              borderRadius: Radius.xl,
              backgroundColor: productUi.uploadSoft,
              padding: 14,
            }}
          >
            <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 12, fontFamily: Fonts.body }}>Product Image</Text>
            <View className="flex-row" style={{ gap: 10, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setImageTab('upload')}
                className="flex-row items-center px-4 py-2"
                style={{
                  borderRadius: Radius.lg,
                  backgroundColor: imageTab === 'upload' ? productUi.primary : productUi.card,
                  borderWidth: 1,
                  borderColor: imageTab === 'upload' ? productUi.primary : productUi.border,
                  gap: 8,
                  minHeight: 40,
                  minWidth: 118,
                  justifyContent: 'center',
                }}
              >
                <Upload size={16} color={imageTab === 'upload' ? productUi.primaryForeground : productUi.mutedForeground} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: imageTab === 'upload' ? productUi.primaryForeground : productUi.mutedForeground, fontFamily: Fonts.body }}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setImageTab('url')}
                className="flex-row items-center px-4 py-2"
                style={{
                  borderRadius: Radius.lg,
                  backgroundColor: imageTab === 'url' ? productUi.primary : productUi.card,
                  borderWidth: 1,
                  borderColor: imageTab === 'url' ? productUi.primary : productUi.border,
                  gap: 8,
                  minHeight: 40,
                  minWidth: 136,
                  justifyContent: 'center',
                }}
              >
                <Link size={16} color={imageTab === 'url' ? productUi.primaryForeground : productUi.mutedForeground} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: imageTab === 'url' ? productUi.primaryForeground : productUi.mutedForeground, fontFamily: Fonts.body }}>Paste URL</Text>
              </TouchableOpacity>
            </View>

            {imageTab === 'upload' ? (
              <TouchableOpacity
                onPress={handlePickAndUploadImage}
                disabled={imageUploading}
                className="border-2 border-dashed items-center justify-center p-6"
                style={{ borderRadius: Radius.lg, borderColor: productUi.border, backgroundColor: productUi.card, minHeight: 168, opacity: imageUploading ? 0.72 : 1 }}
              >
                <CloudUpload size={40} color={productUi.primary} style={{ marginBottom: 12 }} strokeWidth={2.25} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: productUi.foreground, fontFamily: Fonts.body }}>
                  {imageUploading ? 'Uploading image...' : 'Click to browse image'}
                </Text>
                <Text style={{ fontSize: 12, color: productUi.mutedForeground, marginTop: 4, fontFamily: Fonts.body }}>
                  {imageUploading ? 'Please wait while the file is uploaded' : 'Supports JPG, PNG, GIF, WEBP'}
                </Text>

                {form.imageUrl ? (
                  <View style={{ marginTop: 16, alignItems: 'center' }}>
                    <Image source={{ uri: resolveAssetUri(form.imageUrl) }} style={{ width: 144, height: 144, borderRadius: Radius.md }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => setForm({ ...form, imageUrl: '' })} style={{ marginTop: 8 }}>
                      <Text style={{ color: productUi.destructive, fontSize: 12, fontWeight: '600', fontFamily: Fonts.body }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </TouchableOpacity>
            ) : (
              <View>
                <View
                  className="flex-row items-center px-4"
                  style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, height: 48, backgroundColor: productUi.card }}
                >
                  <Link size={18} color={productUi.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    value={form.imageUrl}
                    onChangeText={v => setForm({ ...form, imageUrl: v })}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor={productUi.mutedForeground}
                    style={{ flex: 1, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none' } as any}
                  />
                </View>
                {form.imageUrl ? (
                  <View style={{ marginTop: 16, alignItems: 'center' }}>
                    <Image source={{ uri: resolveAssetUri(form.imageUrl) }} style={{ width: 144, height: 144, borderRadius: Radius.md }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => setForm({ ...form, imageUrl: '' })} style={{ marginTop: 8 }}>
                      <Text style={{ color: productUi.destructive, fontSize: 12, fontWeight: '600', fontFamily: Fonts.body }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Name & Slug Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Product Name"
                required
                value={form.name}
                onChangeText={handleNameChange}
                placeholder="e.g. Flower Pot Small"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Slug</Text>
              <TextInput
                value={form.slug}
                onChangeText={v => setForm({ ...form, slug: v })}
                placeholder="auto-generated"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
          </View>

          {/* Category & UOM Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Select
                label="Category"
                required
                value={form.categoryId}
                onValueChange={v => setForm({ ...form, categoryId: v })}
                options={cats.filter(c => c.isActive).map(c => ({ label: c.name, value: c.id }))}
                placeholder="Select category"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                label="UOM"
                required
                value={form.uomId}
                onValueChange={v => setForm({ ...form, uomId: v })}
                options={uoms.filter(u => u.isActive).map(u => ({ label: `${u.name} (${u.code})`, value: u.id }))}
                placeholder="Select UOM"
              />
            </View>
          </View>

          {/* Tags Dropdown (Optional) */}
          <View>
            <Select
              label="Tag (Optional)"
              value={form.tagId}
              onValueChange={v => setForm({ ...form, tagId: v })}
              options={[
                { label: 'None (Deselect)', value: '' },
                ...tags.filter(t => t.isActive).map(t => ({ label: t.name, value: t.id }))
              ]}
              placeholder="No tag selected"
            />
          </View>

          {/* Price Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="MRP ₹"
                required
                value={form.mrp}
                onChangeText={v => setForm({ ...form, mrp: v })}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Selling Price ₹"
                required
                value={form.sellingPrice}
                onChangeText={v => setForm({ ...form, sellingPrice: v })}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
          </View>

          {/* Description */}
          <View>
            <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={v => setForm({ ...form, description: v })}
              placeholder="Enter product description..."
              placeholderTextColor={productUi.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="p-3"
              style={{ minHeight: 100, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
            />
          </View>

          {/* Rank & Stock Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Rank"
                required
                value={form.rank}
                onChangeText={v => setForm({ ...form, rank: v })}
                placeholder="Unique rank"
                keyboardType="numeric"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Initial Stock"
                required
                value={form.initialStock}
                onChangeText={v => setForm({ ...form, initialStock: v })}
                placeholder="0"
                keyboardType="numeric"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
          </View>

          {/* Status */}
          <View>
            <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Status
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className="flex-row items-center justify-between"
              style={{
                height: 48,
                borderRadius: Radius.lg,
                backgroundColor: form.isActive ? productUi.activeSoft : productUi.inactiveSoft,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: form.isActive ? '#bde8cc' : '#f4d49e',
              }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: Radius.full,
                    backgroundColor: form.isActive ? productUi.active : productUi.inactive,
                  }}
                />
                <Text
                  style={{
                    color: form.isActive ? productUi.active : productUi.inactive,
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  {form.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={value => setForm(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: '#f4d49e', true: '#9bddb3' }}
                thumbColor={form.isActive ? productUi.active : productUi.inactive}
                ios_backgroundColor="#f4d49e"
              />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="product" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="product" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
      <ImagePreviewModal open={!!previewUri} uri={previewUri} onClose={() => setPreviewUri(null)} />
    </MasterScreenLayout>
  );
}

