import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Check,
  CloudUpload,
  Eye,
  FolderTree,
  Link,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { ImagePreviewModal } from '../components/modals/ImagePreviewModal';
import { useToast } from '../hooks/useToast';
import { usePermissions, PermissionGuard } from '../hooks/usePermissions';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import { exportCSV } from '../utils/exportUtils';
import { pickAndParseCSV } from '../utils/importUtils';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { Column } from '../components/table/TableView';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, FontSizes, Fonts } from '../styles/globalStyles';
import { pickImage } from '../utils/permissionUtils';

const QK = 'categories';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  categoryDiscount?: string;
  rank: number;
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryDiscount: string;
  rank: string;
  isActive: boolean;
  imageUrl: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', categoryDiscount: '0', rank: '0', isActive: true, imageUrl: '' };
const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

const categoryUi = {
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

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'rank', label: 'Rank' },
  { key: 'status', label: 'Status' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: "Flower Pots Small", slug: "flower-pots-small", description: "Colorful ground spinner fountain producing bright sparks.", image: "https://picsum.photos/id/29/200/150", rank: 1, isActive: true, createdAt: "2026-04-14" },
  { id: '2', name: "Flower Pots Big", slug: "flower-pots-big", description: "High fountain crackers producing large sparkling effects.", image: "https://picsum.photos/id/30/200/150", rank: 2, isActive: true, createdAt: "2026-04-14" },
  { id: '3', name: "Ground Chakkar", slug: "ground-chakkar", description: "Spinning fireworks producing circular spark patterns.", image: "https://picsum.photos/id/31/200/150", rank: 3, isActive: true, createdAt: "2026-04-14" },
  { id: '4', name: "Electric Sparklers", slug: "electric-sparklers", description: "Handheld sparkler fireworks with bright silver sparks.", image: "https://picsum.photos/id/32/200/150", rank: 4, isActive: true, createdAt: "2026-04-14" },
  { id: '5', name: "Color Sparklers", slug: "color-sparklers", description: "Colorful sparklers producing multi-color spark effects.", image: "https://picsum.photos/id/33/200/150", rank: 5, isActive: true, createdAt: "2026-04-14" },
  { id: '6', name: "Atom Bomb", slug: "atom-bomb", description: "Loud bursting crackers producing strong explosion sound.", image: "https://picsum.photos/id/34/200/150", rank: 6, isActive: true, createdAt: "2026-04-14" },
  { id: '7', name: "Lakshmi Bomb", slug: "lakshmi-bomb", description: "Popular loud crackers used widely during festival celebrations.", image: "https://picsum.photos/id/35/200/150", rank: 7, isActive: true, createdAt: "2026-04-14" },
  { id: '8', name: "Rocket Bomb", slug: "rocket-bomb", description: "Sky rocket firework producing aerial explosion with sparks.", image: "https://picsum.photos/id/36/200/150", rank: 8, isActive: true, createdAt: "2026-04-14" },
  { id: '9', name: "Twinkling Star", slug: "twinkling-star", description: "Small sparkling crackers producing star-like effects.", image: "https://picsum.photos/id/37/200/150", rank: 9, isActive: true, createdAt: "2026-04-14" },
  { id: '10', name: "Sky Shot 30", slug: "sky-shot-30", description: "30 shots aerial fireworks producing colorful sky bursts.", image: "https://picsum.photos/id/38/200/150", rank: 10, isActive: true, createdAt: "2026-04-14" },
  { id: '11', name: "Phantom Crackers", slug: "phantom-crackers", description: "Mystery loud burst with unexpected effects.", image: "https://picsum.photos/id/39/200/150", rank: 11, isActive: false, createdAt: "2026-04-14" },
  { id: '12', name: "Silent Spark", slug: "silent-spark", description: "Low noise sparkler for quiet celebrations.", image: "https://picsum.photos/id/40/200/150", rank: 12, isActive: false, createdAt: "2026-04-14" }
];

const toDisplayString = (value: unknown, fallback = ''): string => {
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

const toBoolean = (value: unknown, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

const normalizeCategory = (item: any, index: number): Category => ({
  id: toDisplayString(item?.id, String(index)),
  name: toDisplayString(item?.name, 'Untitled Category'),
  slug: toDisplayString(item?.slug),
  description: toDisplayString(item?.description),
  categoryDiscount: toDisplayString(item?.categoryDiscount, '0'),
  image: toDisplayString(item?.image),
  rank: Number.isFinite(Number(item?.rank)) ? Number(item.rank) : 0,
  isActive: toBoolean(item?.isActive),
  createdAt: toDisplayString(item?.createdAt),
});

const toCategoryList = (response: any): Category[] => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.categories,
    response?.data?.categories,
  ];

  const list = candidates.find(Array.isArray);
  return (list ?? []).map(normalizeCategory);
};

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data } = await api.get(`/categories?limit=999999&_=${Date.now()}`);
    return toCategoryList(data);
  } catch (error) {
    console.error('Failed to fetch categories, using mock data:', error);
    return MOCK_CATEGORIES;
  }
};

const resolveAssetUri = (uri?: unknown) => {
  const value = toDisplayString(uri);
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('file:') || value.startsWith('content:') || value.startsWith('blob:')) {
    return value;
  }
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
};


const getUploadedCategoryPath = (response: any) => {
  const uploaded = response?.data?.data ?? response?.data ?? response;
  const first = Array.isArray(uploaded) ? uploaded[0] : uploaded;
  return first?.relativePath || first?.url || first?.path || '';
};

const StatusPill = ({ active }: { active: boolean }) => (
  <View
    style={{
      alignSelf: 'flex-start',
      backgroundColor: active ? categoryUi.activeSoft : categoryUi.inactiveSoft,
      borderRadius: Radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: active ? '#bde8cc' : '#f4d49e',
    }}
  >
    <Text style={{ color: active ? categoryUi.active : categoryUi.inactive, fontSize: 12, fontWeight: '800', fontFamily: Fonts.body }}>
      {active ? 'Active' : 'Inactive'}
    </Text>
  </View>
);

const CategoryImage = ({ category, size }: { category: Category; size: number }) => {
  if (category.image) {
    return (
      <Image
        source={{ uri: resolveAssetUri(category.image) }}
        resizeMode="cover"
        style={{ width: size, height: size, borderRadius: Radius.md, backgroundColor: colors.muted }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.md,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FolderTree size={Math.round(size * 0.42)} color={colors.primary} />
    </View>
  );
};

// Slice-like hook for Category operations
export const useCategoryQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: [QK, 'list'],
    queryFn: fetchCategories,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: any }) => {
      if (id) return api.put(`/categories/${id}`, payload);
      return api.post('/categories', payload);
    },
    onSuccess: (response, variables) => {
      const saved = normalizeCategory(response?.data?.data ?? response?.data, 0);
      qc.setQueryData<Category[]>([QK, 'list'], (previous = []) => {
        const current = toCategoryList(previous);
        const withoutSaved = current.filter(category => category.id !== saved.id);
        const merged = variables.id ? [saved, ...withoutSaved] : [saved, ...current];
        return merged.sort((a, b) => b.rank - a.rank);
      });
      qc.invalidateQueries({ queryKey: [QK, 'list'] });
      toast.success(variables.id ? 'Category updated' : 'Category created');
    },
    onError: (e) => toast.apiError(e, 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, 'list'] });
      toast.success('Deleted');
    },
    onError: (e) => toast.apiError(e, 'Delete failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/categories/bulk-delete', { ids }),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: [QK, 'list'] });
      toast.success(`${ids.length} deleted`);
    },
    onError: (e) => toast.apiError(e, 'Bulk delete failed'),
  });

  return {
    query,
    save: saveMutation,
    remove: deleteMutation,
    bulkRemove: bulkDeleteMutation,
  };
};

export default function Category() {
  const toast = useToast();
  const nav = useNavigation<any>();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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

  const { query, save, remove, bulkRemove } = useCategoryQueries();
  const { refetch: refetchCategories } = query;
  const all = useMemo(() => toCategoryList(query.data), [query.data]);
  const isLoading = query.isLoading;

  useFocusEffect(
    useCallback(() => {
      refetchCategories();
    }, [refetchCategories])
  );

  const data = useMemo(() => {
    let filtered = all;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c =>
        toDisplayString(c.name).toLowerCase().includes(q) ||
        toDisplayString(c.slug).toLowerCase().includes(q) ||
        toDisplayString(c.description).toLowerCase().includes(q)
      );
    }
    if (filterActive) filtered = filtered.filter(c => String(c.isActive) === filterActive);
    return filtered;
  }, [all, search, filterActive]);

  const exportRows = useMemo(() => data.map((category) => ({
    name: toDisplayString(category.name),
    slug: toDisplayString(category.slug),
    description: toDisplayString(category.description),
    rank: String(category.rank),
    status: category.isActive ? 'Active' : 'Inactive',
  })), [data]);

  const handleSubmit = () => save.mutate({
    id: editItem?.id,
    payload: {
      ...form,
      rank: Number(form.rank),
      categoryDiscount: form.categoryDiscount || '0',
      image: form.imageUrl,
      isActive: Boolean(form.isActive)
    }
  }, {
    onSuccess: () => {
      setFormOpen(false);
      setSearch('');
      setFilterActive('');
      setSelectedIds(new Set());
    }
  });

  const handleDelete = () => {
    if (deleteId) remove.mutate(deleteId, {
      onSuccess: () => setDeleteId(null)
    });
  };

  const handleBulkDelete = () => {
    bulkRemove.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      }
    });
  };

  const openAdd = () => {
    const nextRank = all.length > 0 ? Math.max(...all.map(category => Number(category.rank) || 0)) + 1 : 1;
    setEditItem(null);
    setForm({ ...EMPTY_FORM, rank: String(nextRank) });
    setImageTab('upload');
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      categoryDiscount: c.categoryDiscount ?? '0',
      rank: String(c.rank),
      isActive: c.isActive,
      imageUrl: c.image ?? '',
    });
    setImageTab(c.image ? 'url' : 'upload');
    setFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    setForm(prev => ({ ...prev, name, slug }));
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });



  const handleImport = async () => {
    const rows = await pickAndParseCSV();
    if (rows) toast.info(`${rows.length} rows ready - implement save logic`);
  };

  const uploadCategoryImage = async (file: any) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('categoryImage', file as any);

      AsyncStorage.getItem('accessToken').then(token => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/uploads/categoryImage`);
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
              const uploadedPath = getUploadedCategoryPath(result);
              if (!uploadedPath) return reject(new Error('Upload completed, but no image path was returned.'));
              setForm(prev => ({ ...prev, imageUrl: uploadedPath }));
              setImageTab('url');
              toast.success('Category image uploaded');
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
      const picked = await pickImage('Category');
      if (!picked) return;

      setImageUploading(true);
      await uploadCategoryImage(picked.webFile || {
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


  const columns: Column<Category>[] = useMemo(() => [
    {
      key: 'image', label: 'Image', width: 100, render: (c) => (
        <TouchableOpacity onPress={() => c.image && setPreviewUri(resolveAssetUri(c.image))}>
          <CategoryImage category={c} size={50} />
        </TouchableOpacity>
      )
    },
    { key: 'name', label: 'Name', width: 200, render: (c) => <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 14, fontWeight: '700', fontFamily: Fonts.body }}>{c.name}</Text> },
    { key: 'slug', label: 'Slug', width: 180, render: (c) => <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: Fonts.body }}>{c.slug}</Text> },
    { key: 'categoryDiscount', label: 'Discount', width: 100, align: 'right', render: (c) => <Text style={{ color: colors.success, fontSize: 14, fontWeight: '800', fontFamily: Fonts.body }}>{c.categoryDiscount && c.categoryDiscount !== '0' ? `${c.categoryDiscount}%` : '-'}</Text> },
    { key: 'description', label: 'Description', width: 250, render: (c) => <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 14, fontFamily: Fonts.body }}>{c.description ?? ''}</Text> },
    { key: 'rank', label: 'Rank', width: 80, render: (c) => <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: Fonts.body }}>{c.rank}</Text> },
    { key: 'createdAt', label: 'Created', width: 120, render: (c) => <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: Fonts.body }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-'}</Text> },
    { key: 'status', label: 'Status', width: 130, render: (c) => <StatusPill active={c.isActive} /> },
    {
      key: 'actions', label: 'Actions', width: 132, align: 'center', render: (c) => (
        <View className="flex-row items-center justify-center" style={{ gap: 16, width: '100%' }}>
          <PermissionGuard module="Categories" action="View">
            <TouchableOpacity onPress={() => nav.navigate('Products', { categoryId: c.id })}>
              <Eye size={19} color={colors.primary} />
            </TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Categories" action="Update">
            <TouchableOpacity onPress={() => openEdit(c)}><Pencil size={19} color={colors.foreground} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Categories" action="Delete">
            <TouchableOpacity onPress={() => setDeleteId(c.id)}><Trash2 size={18} color={colors.destructive} /></TouchableOpacity>
          </PermissionGuard>
        </View>
      )
    },
  ], []);

  const renderCard = (c: Category, isSelected: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={() => toggleSelect(c.id)}>
          <View style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: isSelected ? 0 : 2, borderColor: colors.border,
            backgroundColor: isSelected ? colors.primary : colors.card, alignItems: 'center', justifyContent: 'center'
          }}>
            {isSelected ? <Check size={14} color={colors.primaryForeground} strokeWidth={3} /> : null}
          </View>
        </TouchableOpacity>
        <StatusPill active={c.isActive} />
      </View>

      <TouchableOpacity onPress={() => c.image && setPreviewUri(resolveAssetUri(c.image))} className="flex-row items-center mb-4" style={{ gap: 12 }}>
        <CategoryImage category={c} size={64} />
        <Text numberOfLines={2} style={{ flex: 1, color: colors.foreground, fontSize: 18, fontWeight: '800', fontFamily: Fonts.display }}>
          {c.name}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 8, fontFamily: Fonts.body }}>Slug: {c.slug}</Text>
      {c.description ? (
        <Text numberOfLines={3} style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginBottom: 16, fontFamily: Fonts.body }}>
          {c.description}
        </Text>
      ) : null}

      <View className="flex-row items-center justify-between border-t border-border pt-4">
        <View className="flex-row gap-4">
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '400', fontFamily: Fonts.body }}>
            <Text style={{ fontWeight: '800' }}>Rank:</Text> {c.rank}
          </Text>
          <Text style={{ color: colors.success, fontSize: 14, fontWeight: '400', fontFamily: Fonts.body }}>
            <Text style={{ fontWeight: '800' }}>Discount:</Text> {c.categoryDiscount && c.categoryDiscount !== '0' ? `${c.categoryDiscount}%` : '-'}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 14 }}>
          <PermissionGuard module="Categories" action="View">
            <TouchableOpacity
              onPress={() => nav.navigate('Products', { categoryId: c.id })}
              style={{ padding: 6, borderRadius: 8 }}
            >
              <Eye size={18} color={colors.primary} />
            </TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Categories" action="Update">
            <TouchableOpacity onPress={() => openEdit(c)}><Pencil size={18} color={colors.foreground} /></TouchableOpacity>
          </PermissionGuard>
          <PermissionGuard module="Categories" action="Delete">
            <TouchableOpacity onPress={() => setDeleteId(c.id)}><Trash2 size={17} color={colors.destructive} /></TouchableOpacity>
          </PermissionGuard>
        </View>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout
      title="Categories"
      subtitle="Manage product categories"
      module="Categories"
      onAddNew={openAdd}
      addNewLabel="Add Category"

    >
      <AdaptiveTable
        data={data}
        columns={columns}
        loading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }
        ]}
        filterValues={{ status: filterActive }}
        onFilterChange={(_, v) => setFilterActive(v)}
        selectedIds={selectedIds}
        onSelectAll={(checked) => {
          if (checked) setSelectedIds(new Set(data.map(c => c.id)));
          else setSelectedIds(new Set());
        }}
        onSelectRow={toggleSelect}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        exportColumns={EXPORT_COLUMNS}
        exportData={exportRows}
        exportTitle="Categories"
        exportFilename="categories"
        onImport={handleImport}
        showImport={true}
        renderCard={renderCard}
        module="Categories"
      />

      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth={760}
        title={
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View style={{ backgroundColor: categoryUi.primarySoft, padding: 8, borderRadius: Radius.md }}>
              <Plus size={20} color={categoryUi.primary} strokeWidth={2.75} />
            </View>
            <Text style={{ fontSize: FontSizes.lg, fontWeight: '800', color: categoryUi.foreground, fontFamily: Fonts.display }}>
              {editItem ? 'Edit Category' : 'Add Category'}
            </Text>
          </View>
        }
        footer={
          <View className="flex-row justify-end" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => setFormOpen(false)}
              className="px-4 py-2 border border-border flex-row items-center justify-center"
              style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.card, borderColor: categoryUi.border }}
            >
              <X size={16} color={categoryUi.foreground} style={{ marginRight: 8 }} />
              <Text style={{ color: categoryUi.foreground, fontSize: 14, fontWeight: '600', fontFamily: Fonts.body }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={save.isPending}
              className="px-6 py-2 flex-row items-center justify-center"
              style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.primary, opacity: save.isPending ? 0.7 : 1 }}
            >
              <Save size={16} color={categoryUi.primaryForeground} style={{ marginRight: 8 }} />
              <Text style={{ color: categoryUi.primaryForeground, fontSize: 14, fontWeight: '700', fontFamily: Fonts.body }}>
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
              borderColor: categoryUi.border,
              borderRadius: Radius.xl,
              backgroundColor: categoryUi.uploadSoft,
              padding: 14,
            }}
          >
            <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 12, fontFamily: Fonts.body }}>Category Image</Text>
            <View className="flex-row" style={{ gap: 10, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setImageTab('upload')}
                className="flex-row items-center px-4 py-2"
                style={{
                  borderRadius: Radius.lg,
                  backgroundColor: imageTab === 'upload' ? categoryUi.primary : categoryUi.card,
                  borderWidth: 1,
                  borderColor: imageTab === 'upload' ? categoryUi.primary : categoryUi.border,
                  gap: 8,
                  minHeight: 40,
                  minWidth: 118,
                  justifyContent: 'center',
                }}
              >
                <Upload size={16} color={imageTab === 'upload' ? categoryUi.primaryForeground : categoryUi.mutedForeground} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: imageTab === 'upload' ? categoryUi.primaryForeground : categoryUi.mutedForeground, fontFamily: Fonts.body }}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setImageTab('url')}
                className="flex-row items-center px-4 py-2"
                style={{
                  borderRadius: Radius.lg,
                  backgroundColor: imageTab === 'url' ? categoryUi.primary : categoryUi.card,
                  borderWidth: 1,
                  borderColor: imageTab === 'url' ? categoryUi.primary : categoryUi.border,
                  gap: 8,
                  minHeight: 40,
                  minWidth: 136,
                  justifyContent: 'center',
                }}
              >
                <Link size={16} color={imageTab === 'url' ? categoryUi.primaryForeground : categoryUi.mutedForeground} strokeWidth={2.5} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: imageTab === 'url' ? categoryUi.primaryForeground : categoryUi.mutedForeground, fontFamily: Fonts.body }}>Paste URL</Text>
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
                      await uploadCategoryImage(file);
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
                  borderColor: isDragging ? categoryUi.primary : categoryUi.border, 
                  backgroundColor: isDragging ? categoryUi.primarySoft : categoryUi.card, 
                  minHeight: 168 
                }}
              >
                {imageUploading ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.primary, fontFamily: Fonts.body, marginBottom: 12 }}>
                      Uploading... {uploadProgress}%
                    </Text>
                    <View style={{ width: '100%', height: 8, backgroundColor: categoryUi.muted, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <Animated.View style={{ height: '100%', backgroundColor: categoryUi.primary, width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
                    </View>
                    {uploadTotalBytes > 0 && (
                      <Text style={{ fontSize: 11, color: categoryUi.mutedForeground, fontFamily: Fonts.body }}>
                        {(uploadLoadedBytes / (1024 * 1024)).toFixed(2)} MB / {(uploadTotalBytes / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <CloudUpload size={40} color={categoryUi.primary} style={{ marginBottom: 12 }} strokeWidth={2.25} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.foreground, fontFamily: Fonts.body }}>
                      {isDragging ? 'Drop image here' : 'Click or drag to browse image'}
                    </Text>
                    <Text style={{ fontSize: 12, color: categoryUi.mutedForeground, marginTop: 4, fontFamily: Fonts.body }}>
                      Supports JPG, PNG, GIF, WEBP
                    </Text>

                    {form.imageUrl ? (
                      <View style={{ marginTop: 16, alignItems: 'center' }}>
                        <Image source={{ uri: resolveAssetUri(form.imageUrl) }} style={{ width: 144, height: 144, borderRadius: Radius.md }} resizeMode="cover" />
                        <TouchableOpacity onPress={() => setForm({ ...form, imageUrl: '' })} style={{ marginTop: 8 }}>
                          <Text style={{ color: categoryUi.destructive, fontSize: 12, fontWeight: '600', fontFamily: Fonts.body }}>Remove</Text>
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
                  style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, height: 48, backgroundColor: categoryUi.card }}
                >
                  <Link size={18} color={categoryUi.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    value={form.imageUrl}
                    onChangeText={v => setForm({ ...form, imageUrl: v })}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor={categoryUi.mutedForeground}
                    style={{ flex: 1, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none' } as any}
                  />
                </View>
                {form.imageUrl ? (
                  <View style={{ marginTop: 16, alignItems: 'center' }}>
                    <Image source={{ uri: resolveAssetUri(form.imageUrl) }} style={{ width: 144, height: 144, borderRadius: Radius.md }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => setForm({ ...form, imageUrl: '' })} style={{ marginTop: 8 }}>
                      <Text style={{ color: categoryUi.destructive, fontSize: 12, fontWeight: '600', fontFamily: Fonts.body }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Name & Slug Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
                Name <Text style={{ color: categoryUi.destructive }}>*</Text>
              </Text>
              <TextInput
                value={form.name}
                onChangeText={handleNameChange}
                placeholder="Category name"
                placeholderTextColor={categoryUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: categoryUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Slug</Text>
              <TextInput
                value={form.slug}
                onChangeText={v => setForm({ ...form, slug: v })}
                placeholder="auto-generated"
                placeholderTextColor={categoryUi.mutedForeground}
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: categoryUi.card } as any}
              />
            </View>
          </View>

          {/* Description */}
          <View>
            <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={v => setForm({ ...form, description: v })}
              placeholder="Enter category description..."
              placeholderTextColor={categoryUi.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="p-3"
              style={{ minHeight: 100, borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: categoryUi.card } as any}
            />
          </View>

          {/* Category Discount */}
          <View>
            <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Category Discount (%)
            </Text>
            <TextInput
              value={form.categoryDiscount}
              onChangeText={v => setForm({ ...form, categoryDiscount: v })}
              placeholder="e.g. 10"
              placeholderTextColor={categoryUi.mutedForeground}
              keyboardType="numeric"
              className="px-3"
              style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: categoryUi.card } as any}
            />
            <Text style={{ color: categoryUi.mutedForeground, fontSize: 11, marginTop: 4, fontFamily: Fonts.body }}>
              Applied to all products in this category (overrides site discount)
            </Text>
          </View>

          {/* Rank & Status Grid */}
          <View className="flex-row" style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
                Rank <Text style={{ color: categoryUi.destructive }}>*</Text>
              </Text>
              <TextInput
                value={form.rank}
                onChangeText={v => setForm({ ...form, rank: v })}
                placeholder="Unique rank number"
                placeholderTextColor={categoryUi.mutedForeground}
                keyboardType="numeric"
                className="px-3"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, fontSize: 14, color: categoryUi.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: categoryUi.card } as any}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: categoryUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
                Status
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className="flex-row items-center justify-between"
                style={{
                  height: 48,
                  borderRadius: Radius.lg,
                  backgroundColor: form.isActive ? categoryUi.activeSoft : categoryUi.inactiveSoft,
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
                      backgroundColor: form.isActive ? categoryUi.active : categoryUi.inactive,
                    }}
                  />
                  <Text
                    style={{
                      color: form.isActive ? categoryUi.active : categoryUi.inactive,
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
                  thumbColor={form.isActive ? categoryUi.active : categoryUi.inactive}
                  ios_backgroundColor="#f4d49e"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        itemName="category"
        onConfirm={handleDelete}
        loading={remove.isPending}
      />
      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedIds.size}
        itemName="category"
        onConfirm={handleBulkDelete}
        loading={bulkRemove.isPending}
      />
      <ImagePreviewModal open={!!previewUri} uri={previewUri} onClose={() => setPreviewUri(null)} />
    </MasterScreenLayout>
  );
}
