// Admin/src/screens/Product.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Animated,
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
  FileText,
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
import { usePermissions, PermissionGuard } from '../hooks/usePermissions';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts, FontSizes } from '../styles/globalStyles';
import { pickImage } from '../utils/permissionUtils';
import BulkUploadDialog from './BulkUploadDialog';

interface Product {
  id: string; name: string; slug: string; image?: string; images?: string[]; description?: string;
  productCode: string; stock: number; tag?: string; unit?: string;
  mrp: string; productDiscount?: string; rank: number; isActive: boolean;
  category?: { id: string; name: string };
}
interface Category { id: string; name: string; isActive: boolean; }

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  productCode: string;
  mrp: string;
  productDiscount: string;
  rank: string;
  stock: string;
  tag: string;
  unit: string;
  perQty: string;
  isActive: boolean;
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  productCode: '',
  mrp: '',
  productDiscount: '0',
  rank: '0',
  stock: '0',
  tag: '',
  unit: '',
  perQty: '',
  isActive: true,
  imageUrl: ''
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

const getUploadedProductPath = (response: any) => {
  const uploaded = response?.data?.data ?? response?.data ?? response;
  const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return first?.relativePath || first?.url || first?.path || '';
};

const INR = '\u20b9';

const formatMoney = (value: string | number | undefined) => {
  const amount = Number(value ?? 0);
  return `${INR}${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
};

const splitUnit = (unit?: string) => {
  const [label, qty] = (unit ?? '').trim().split(/\s+/, 2);
  return { label, qty };
};

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
  const catsQuery = useQuery<Category[]>({
    queryKey: ['categories-list'],
    queryFn: async () => { const { data } = await api.get('/categories?limit=999999&isActive=true'); return data.data ?? []; }
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
    save: saveMutation,
    remove: deleteMutation,
    bulkRemove: bulkDeleteMutation,
  };
};

export default function Product() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const { query, cats, save, remove, bulkRemove } = useProductQueries();
  const all = Array.isArray(query.data) ? query.data : [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterActive, setFilterActive] = useState(''); const [filterCat, setFilterCat] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoadedBytes, setUploadLoadedBytes] = useState(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

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
      productCode: p.productCode,
      mrp: p.mrp,
      productDiscount: p.productDiscount ?? '0',
      rank: String(p.rank),
      stock: String(p.stock ?? 0),
      tag: p.tag ?? '',
      unit: (p.unit ?? '').split(/\s+/)[0] || '',
      perQty: (p.unit ?? '').split(/\s+/)[1] || '',
      isActive: p.isActive,
      imageUrl: p.image ?? '',
    });
    setImageTab(p.image ? 'url' : 'upload');
    setFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setForm(prev => ({ ...prev, name, slug }));
  };

  const uploadProductImage = async (file: any) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('productImage', file as any);

      AsyncStorage.getItem('accessToken').then(token => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/uploads/productImage`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadLoadedBytes(event.loaded);
            setUploadTotalBytes(event.total);
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        };

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              const uploadedPath = getUploadedProductPath(result);
              if (!uploadedPath) return reject(new Error('Upload completed, but no image path was returned.'));
              setForm(prev => ({ ...prev, imageUrl: uploadedPath }));
              setImageTab('url');
              toast.success('Product image uploaded');
              resolve(result);
            } else {
              reject(new Error(result?.msg || 'Image upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.send(formData as any);
      }).catch(reject);
    });
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
      setUploadProgress(0);
    }
  };

  const handleSubmit = () => {
    const combinedUnit = form.unit && form.perQty
      ? `${form.unit} ${form.perQty}`
      : form.unit || null;
    save.mutate({
      id: editItem?.id,
      payload: {
        ...form,
        rank: Number(form.rank),
        stock: Number(form.stock),
        image: form.imageUrl,
        productDiscount: form.productDiscount || '0',
        tag: form.tag || null,
        unit: combinedUnit,
        isActive: Boolean(form.isActive),
      }
    }, {
      onSuccess: () => setFormOpen(false)
    });
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Product>[] = [
    {
      key: 'image',
      label: 'Image',
      width: 84,
      align: 'center',
      render: p => {
        const img = p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
        return img ? (
          <TouchableOpacity onPress={() => setPreviewUri(resolveAssetUri(img))} activeOpacity={0.8}>
            <Image source={{ uri: resolveAssetUri(img) }} style={{ width: 42, height: 42, borderRadius: Radius.md }} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42, height: 42, borderRadius: Radius.md, backgroundColor: productUi.muted, alignItems: 'center', justifyContent: 'center' }}>
            <Package size={18} color={productUi.primary} strokeWidth={2.25} />
          </View>
        );
      },
    },
    {
      key: 'name',
      label: 'Product',
      width: 230,
      sortable: true,
      render: p => (
        <View style={{ minWidth: 0 }}>
          <Text style={{ fontFamily: Fonts.body, color: productUi.foreground, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={{ fontFamily: Fonts.body, color: productUi.mutedForeground, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {p.category?.name ?? '-'}
          </Text>
        </View>
      ),
    },
    {
      key: 'productCode',
      label: 'Code',
      width: 100,
      render: p => (
        <Text style={{ fontFamily: Fonts.body, color: productUi.mutedForeground, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
          {p.productCode}
        </Text>
      ),
    },
    {
      key: 'mrp',
      label: 'MRP',
      width: 102,
      align: 'right',
      render: p => (
        <Text
          style={{
            fontFamily: Fonts.body,
            color: productUi.mutedForeground,
            fontSize: 14,
            fontWeight: '800',
          }}
        >
          {formatMoney(p.mrp)}
        </Text>
      ),
    },
    {
      key: 'productDiscount',
      label: 'Discount',
      width: 90,
      align: 'right',
      render: p => (
        <Text style={{ fontFamily: Fonts.body, color: productUi.active, fontSize: 14, fontWeight: '900' }}>
          {p.productDiscount && p.productDiscount !== '0' ? `${p.productDiscount}%` : '-'}
        </Text>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      width: 84,
      align: 'center',
      render: p => (
        <Text
          style={{
            fontFamily: Fonts.body,
            color: (p.stock ?? 0) === 0 ? productUi.destructive : productUi.active,
            fontSize: 14,
            fontWeight: '900',
          }}
        >
          {p.stock ?? 0}
        </Text>
      ),
    },
    {
      key: 'unit',
      label: 'Unit',
      width: 88,
      align: 'center',
      render: p => {
        const { label, qty } = splitUnit(p.unit);
        return label ? (
          <View
            style={{
              minWidth: 50,
              minHeight: 30,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: Radius.sm,
              borderWidth: 1,
              borderColor: '#e0e7ff',
              backgroundColor: '#f5f3ff',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          >
            <Text style={{ fontFamily: Fonts.body, color: '#4338ca', fontSize: 10, fontWeight: '900', textAlign: 'center' }} numberOfLines={1}>
              {label.toUpperCase()}
            </Text>
            {qty ? (
              <Text style={{ fontFamily: Fonts.body, color: '#4338ca', fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 11 }} numberOfLines={1}>
                {qty}
              </Text>
            ) : null}
          </View>
        ) : <Text style={{ fontFamily: Fonts.body, color: productUi.mutedForeground, fontSize: 12 }}>-</Text>;
      },
    },
    {
      key: 'tag',
      label: 'Tag',
      width: 126,
      render: p => p.tag ? (
        // FIX: text color was set to the SAME color as the pill's own background
        // (productUi.primary on productUi.primary) with fontSize:1 — the tag was
        // never visible, just a solid green dot/bar. Now uses a light tint
        // background with the primary color as readable foreground text,
        // matching the working tag-pill style already used in renderCard below.
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            maxWidth: '100%',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: Radius.full,
            backgroundColor: `${productUi.primary}15`,
            borderWidth: 1,
            borderColor: `${productUi.primary}40`,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.body,
              color: productUi.primary,
              fontSize: 10,
              fontWeight: '900',
              textTransform: 'uppercase',
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {p.tag}
          </Text>
        </View>
      ) : <Text style={{ fontFamily: Fonts.body, color: productUi.mutedForeground, fontSize: 12 }}>-</Text>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 108,
      align: 'center',
      render: p => <StatusBadge status={p.isActive ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 132,
      render: p => (
        <View className="flex-row" style={{ gap: 6 }}>
          <PermissionGuard module="Products" action="View">
            <TouchableOpacity
              onPress={() => p.image && setPreviewUri(resolveAssetUri(p.image))}
              className="items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: productUi.muted }}
              activeOpacity={0.75}
            >
              <Eye size={15} color={productUi.mutedForeground} />
            </TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Products" action="Update">
            <TouchableOpacity
              onPress={() => openEdit(p)}
              className="items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: productUi.primarySoft }}
              activeOpacity={0.75}
            >
              <Pencil size={15} color={productUi.primary} />
            </TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Products" action="Delete">
            <TouchableOpacity
              onPress={() => setDeleteId(p.id)}
              className="items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: productUi.destructiveSoft }}
              activeOpacity={0.75}
            >
              <Trash2 size={15} color={productUi.destructive} />
            </TouchableOpacity>
          </PermissionGuard>
        </View>
      ),
    },
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
            <Text className="text-[10px] font-mono text-muted-foreground" style={{ fontFamily: Fonts.body }}>{p.productCode}</Text>
            {p.unit && (
              <>
                <Text className="text-muted-foreground/30">•</Text>
                <Text className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter" style={{ fontFamily: Fonts.body, color: '#4338ca' }}>{p.unit}</Text>
              </>
            )}
            {p.tag && (
              <>
                <Text className="text-muted-foreground/30">•</Text>
                <View style={{ backgroundColor: `${productUi.primary}15`, borderColor: `${productUi.primary}40`, borderWidth: 1 }} className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full self-start">
                  <View style={{ backgroundColor: `${productUi.primary}15` }} className="w-1 h-1 rounded-full" />
                  <Text style={{ color: colors.primary, fontFamily: Fonts.body }} className="text-[8px] font-black uppercase tracking-wide">{p.tag}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
      <View className="flex-row py-3 gap-4 border-t border-border/40">
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>MRP</Text><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>₹{parseFloat(p.mrp).toFixed(2)}</Text></View>
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Discount</Text><Text className="text-sm font-bold text-green-600" style={{ fontFamily: Fonts.body }}>{p.productDiscount && p.productDiscount !== '0' ? `${p.productDiscount}%` : '-'}</Text></View>
        <View className="flex-1"><Text className="text-[9px] font-black text-muted-foreground uppercase" style={{ fontFamily: Fonts.body }}>Stock</Text><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body, color: (p.stock ?? 0) === 0 ? colors.destructive : colors.success }}>{p.stock ?? 0}</Text></View>
      </View>
      <View className="flex-row border-t border-border/40 pt-1">
        <PermissionGuard module="Products" action="Update">
          <TouchableOpacity onPress={() => openEdit(p)} className="flex-1 py-3 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={14} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Edit</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Products" action="Delete">
          <TouchableOpacity onPress={() => setDeleteId(p.id)} className="flex-1 py-3 flex-row items-center justify-center gap-2"><Trash2 size={14} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Products" subtitle="Manage product catalog" module="Products" onAddNew={openAdd} addNewLabel="Add Product"
      extraHeaderContent={
        <TouchableOpacity
          onPress={() => setBulkUploadOpen(true)}
          activeOpacity={0.7}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: 'white',
            paddingHorizontal: 20,
            height: 44,
            borderWidth: 1,
            borderColor: '#e6dfd7',
            borderRadius: Radius.lg,
          }}
        >
          <FileText size={18} color="#667a70" strokeWidth={2} />
          <Text style={{ color: '#667a70', fontSize: 14, fontWeight: '700', marginLeft: 8, fontFamily: Fonts.body }}>Bulk Upload</Text>
        </TouchableOpacity>
      }
    >
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
        module="Products"
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
                activeOpacity={0.8}
                onPress={handlePickAndUploadImage}
                disabled={imageUploading}
                // @ts-ignore Web drag and drop events
                onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e: any) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={async (e: any) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (imageUploading) return;
                  if (!hasPermission('media-library', 'create') && !hasPermission('Media Library', 'Create')) {
                    toast.warn('You do not have upload permission.');
                    return;
                  }
                  const file = e.dataTransfer?.files?.[0];
                  if (file) {
                    try {
                      setImageUploading(true);
                      await uploadProductImage(file);
                    } catch (err: any) {
                      toast.apiError(err, 'Image upload failed');
                    } finally {
                      setImageUploading(false);
                      setUploadProgress(0);
                    }
                  }
                }}
                className="border-2 border-dashed items-center justify-center p-6 overflow-hidden"
                style={{
                  borderRadius: Radius.lg,
                  borderColor: isDragging ? productUi.primary : productUi.border,
                  backgroundColor: isDragging ? productUi.primarySoft : productUi.card,
                  minHeight: 168
                }}
              >
                {imageUploading ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: productUi.primary, fontFamily: Fonts.body, marginBottom: 12 }}>
                      Uploading... {uploadProgress}%
                    </Text>
                    <View style={{ width: '100%', height: 8, backgroundColor: productUi.muted, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <Animated.View style={{ height: '100%', backgroundColor: productUi.primary, width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
                    </View>
                    {uploadTotalBytes > 0 && (
                      <Text style={{ fontSize: 11, color: productUi.mutedForeground, fontFamily: Fonts.body }}>
                        {(uploadLoadedBytes / (1024 * 1024)).toFixed(2)} MB / {(uploadTotalBytes / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <CloudUpload size={40} color={productUi.primary} style={{ marginBottom: 12 }} strokeWidth={2.25} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: productUi.foreground, fontFamily: Fonts.body }}>
                      {isDragging ? 'Drop image here' : 'Click or drag to browse image'}
                    </Text>
                    <Text style={{ fontSize: 12, color: productUi.mutedForeground, marginTop: 4, fontFamily: Fonts.body }}>
                      Supports JPG, PNG, GIF, WEBP
                    </Text>

                    {form.imageUrl ? (
                      <View style={{ marginTop: 16, alignItems: 'center' }}>
                        <Image source={{ uri: resolveAssetUri(form.imageUrl) }} style={{ width: 144, height: 144, borderRadius: Radius.md }} resizeMode="cover" />
                        <TouchableOpacity onPress={() => setForm({ ...form, imageUrl: '' })} style={{ marginTop: 8 }}>
                          <Text style={{ color: productUi.destructive, fontSize: 12, fontWeight: '600', fontFamily: Fonts.body }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                )}
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

          {/* Product Code (auto-generated, read-only when editing) & Category Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            {editItem ? (
              <View style={{ flex: 1 }}>
                <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Product Code</Text>
                <View style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, backgroundColor: productUi.muted, justifyContent: 'center', paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: productUi.foreground, fontFamily: 'monospace' }}>{form.productCode}</Text>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={{ color: productUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Product Code</Text>
                <View style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, backgroundColor: productUi.muted, justifyContent: 'center', paddingHorizontal: 16 }}>
                  <Text style={{ fontSize: 13, color: productUi.mutedForeground, fontFamily: Fonts.body }}>Auto-generated (e.g. CK100)</Text>
                </View>
              </View>
            )}
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
          </View>

          {/* Unit + Per Qty & Tag Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Unit"
                value={form.unit}
                onChangeText={v => setForm({ ...form, unit: v })}
                placeholder="e.g. PCS, KG, BOX"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Per Qty"
                value={form.perQty}
                onChangeText={v => setForm({ ...form, perQty: v })}
                placeholder="e.g. 10, 50, 100"
                keyboardType="numeric"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
          </View>
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Tag"
                value={form.tag}
                onChangeText={v => setForm({ ...form, tag: v })}
                placeholder="e.g. Bestseller, New"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }} />
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
                label="Product Discount (%)"
                value={form.productDiscount}
                onChangeText={v => setForm({ ...form, productDiscount: v })}
                placeholder="e.g. 15"
                keyboardType="numeric"
                placeholderTextColor={productUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
              <Text style={{ color: productUi.mutedForeground, fontSize: 11, marginTop: 4, fontFamily: Fonts.body }}>
                Applied specifically to this product (highest priority).
              </Text>
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
                placeholder="Display order"
                keyboardType="numeric"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: productUi.border, fontSize: 14, color: productUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: productUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Stock"
                required
                value={form.stock}
                onChangeText={v => setForm({ ...form, stock: v })}
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
      <BulkUploadDialog open={bulkUploadOpen} onClose={() => setBulkUploadOpen(false)} />
    </MasterScreenLayout>
  );
}