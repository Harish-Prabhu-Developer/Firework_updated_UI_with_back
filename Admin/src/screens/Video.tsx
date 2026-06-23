import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Switch, Modal, Pressable, Dimensions, Animated, useWindowDimensions } from 'react-native';
import { Pencil, Trash2, Video as VideoIcon, Play, Youtube, Upload, Link, CloudUpload, X, Save, Plus, Check, Film } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import { PermissionGuard } from '../hooks/usePermissions';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Alert, Platform } from 'react-native';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { pickVideo } from '../utils/permissionUtils';
import { WebView } from 'react-native-webview';

// Responsive dimensions will be handled via useWindowDimensions hook

const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

const getMediaUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const clean = url.replace(/\\/g, '/').replace(/^\//, '');
  return `${API_ORIGIN}/${clean}`;
};

const getYtId = (url: string) =>
  url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];

interface Video { id: string; name?: string; type: 'upload' | 'youtube'; url: string; productId: string; isActive: boolean; product?: { id: string; name: string }; createdAt: string; }
interface Product { id: string; name: string; }

// Slice-like hook for Video operations
export const useVideoQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['videos'], queryFn: async () => { const { data } = await api.get('/videos?limit=999999'); return data.data ?? []; } });
  const productsQuery = useQuery<Product[]>({ queryKey: ['products-list'], queryFn: async () => { const { data } = await api.get('/products?limit=999999&isActive=true'); return data.data ?? []; } });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/videos/${id}`, payload) : api.post('/videos', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['videos'] }); toast.success(variables.id ? 'Updated' : 'Created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/videos/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['videos'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.delete('/videos/bulk', { data: { ids } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['videos'] }); toast.success('Deleted'); } });

  return { query, products: productsQuery.data || [], save: saveMutation, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function Video() {
  const toast = useToast();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { query, products, save, remove, bulkRemove } = useVideoQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState(''); const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Video | null>(null);
  const [form, setForm] = useState({ productId: '', name: '', type: 'youtube' as 'upload' | 'youtube', url: '', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('url');
  const [uploading, setUploading] = useState(false);
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
  }, [uploadProgress, progressAnim]);

  const dropZoneProps = Platform.OS === 'web' ? {
    onDragOver: (e: any) => { e.preventDefault(); setIsDragging(true); },
    onDragLeave: (e: any) => { e.preventDefault(); setIsDragging(false); },
    onDrop: (e: any) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadVideo(e.dataTransfer.files[0]);
      }
    }
  } : {};

  const [videoPreview, setVideoPreview] = useState<Video | null>(null);

  const data = useMemo(() => {
    let d = all as Video[];
    if (search) d = d.filter(v => (v.name || '').toLowerCase().includes(search.toLowerCase()) || v.product?.name?.toLowerCase().includes(search.toLowerCase()));
    if (filterType) d = d.filter(v => v.type === filterType);
    if (filterActive) d = d.filter(v => String(v.isActive !== false) === filterActive);
    return d;
  }, [all, search, filterType, filterActive]);

  const openAdd = () => { setEditItem(null); setForm({ productId: '', name: '', type: 'youtube', url: '', isActive: true }); setImageTab('url'); setFormOpen(true); };
  const openEdit = (v: Video) => { setEditItem(v); setForm({ productId: v.productId, name: v.name ?? '', type: v.type, url: v.url, isActive: v.isActive !== false }); setImageTab(v.type === 'youtube' ? 'url' : 'upload'); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });


  const uploadVideo = async (file: any) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadLoadedBytes(0);
      setUploadTotalBytes(0);
      const formData = new FormData();
      formData.append('videoFile', file);
      const token = await AsyncStorage.getItem('accessToken');
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/uploads/videoFile`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadLoadedBytes(e.loaded);
            setUploadTotalBytes(e.total);
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              const path = result.data?.relativePath || result.data?.[0]?.relativePath || result.data?.url || '';
              setForm(prev => ({ ...prev, url: path }));
              toast.success('Video uploaded');
              resolve();
            } else {
              reject(new Error(result.msg || 'Upload failed'));
            }
          } catch (err) {
            reject(new Error('Invalid response from server'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePickVideo = async () => {
    try {
      const picked = await pickVideo();
      if (!picked) return;

      uploadVideo(picked.webFile || {
        uri: picked.uri,
        name: picked.name,
        type: picked.type,
      });
    } catch (e: any) {
      toast.apiError(e, 'Video pick failed');
    }
  };

  const TypeBadge = ({ type }: { type: string }) => (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${type === 'youtube' ? 'bg-red-50 border border-red-100' : 'bg-indigo-50 border border-indigo-100'}`}>
      {type === 'youtube' ? <Youtube size={10} color="#ef4444" /> : <VideoIcon size={10} color="#4f46e5" />}
      <Text className={`text-[9px] font-black uppercase ${type === 'youtube' ? 'text-red-600' : 'text-indigo-600'}`}>{type}</Text>
    </View>
  );

  const StatusBadge = ({ active }: { active: boolean }) => (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border ${active ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? '#16a34a' : '#d97706' }} />
      <Text className={`text-[9px] font-black uppercase ${active ? 'text-emerald-700' : 'text-amber-700'}`}>{active ? 'Active' : 'Inactive'}</Text>
    </View>
  );

  const cellCenter = { flex: 1, justifyContent: 'center' as const };

  const truncateStyle = {
    overflow: 'hidden' as const,
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis' as const,
  } as any;

  const columns: Column<Video>[] = [
    {
      key: 'name', label: 'Name', width: 200, render: (v) => (
        <View style={[cellCenter, { minWidth: 0 }]}>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.body, color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{v.name || '—'}</Text>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.body, color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{v.product?.name || '—'}</Text>
        </View>
      ),
    },
    { key: 'type', label: 'Type', width: 100, align: 'center', render: (v) => <View style={cellCenter}><TypeBadge type={v.type} /></View> },
    { key: 'isActive', label: 'Status', width: 100, align: 'center', render: (v) => <View style={cellCenter}><StatusBadge active={v.isActive !== false} /></View> },
    {
      key: 'url', label: 'URL', width: 220, render: (v) => (
        <View style={cellCenter}>
          <TouchableOpacity
            onPress={() => setVideoPreview(v)}
            style={{ maxWidth: 200, alignSelf: 'flex-start', overflow: 'hidden' as const }}
          >
            <Text
              className="text-xs text-primary underline"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[{ fontFamily: Fonts.body }, truncateStyle]}
            >
              {v.url}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      key: 'actions', label: 'Actions', width: 164, align: 'center', render: (v) => (
        <View style={cellCenter}>
          <View className="flex-row items-center" style={{ gap: 12, width: '100%', justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => setVideoPreview(v)} className="items-center justify-center" style={{ width: 36, height: 36, borderRadius: Radius.lg, backgroundColor: '#f1f5f9' }}>
              <Play size={15} color="#64748b" />
            </TouchableOpacity>
            <PermissionGuard module="Videos" action="Update">
              <TouchableOpacity onPress={() => openEdit(v)} className="items-center justify-center" style={{ width: 36, height: 36, borderRadius: Radius.lg, backgroundColor: colors.primary + '15' }}>
                <Pencil size={15} color={colors.primaryForeground} />
              </TouchableOpacity>
            </PermissionGuard>
            <PermissionGuard module="Videos" action="Delete">
              <TouchableOpacity onPress={() => setDeleteId(v.id)} className="items-center justify-center" style={{ width: 36, height: 36, borderRadius: Radius.lg, backgroundColor: colors.destructive + '15' }}>
                <Trash2 size={15} color={colors.primaryForeground} />
              </TouchableOpacity>
            </PermissionGuard>
          </View>
        </View>
      ),
    },
  ];

  const renderCard = (v: Video, _: boolean) => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-2">
        <TypeBadge type={v.type} />
        <StatusBadge active={v.isActive !== false} />
      </View>
      <Text className="font-bold text-foreground mb-1" numberOfLines={1}>{v.name || 'Untitled Video'}</Text>
      <TouchableOpacity onPress={() => setVideoPreview(v)} className="mb-3">
        <Text className="text-xs text-primary underline" numberOfLines={1}>{v.url}</Text>
      </TouchableOpacity>
      <View className="flex-row border-t border-border/40">
        <TouchableOpacity onPress={() => setVideoPreview(v)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2 border-r border-border/40"><Play size={13} color="#64748b" /><Text className="text-xs font-bold text-foreground">Play</Text></TouchableOpacity>
        <PermissionGuard module="Videos" action="Update">
          <TouchableOpacity onPress={() => openEdit(v)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color="#4f46e5" /><Text className="text-xs font-bold text-indigo-600">Edit</Text></TouchableOpacity>
        </PermissionGuard>
        <PermissionGuard module="Videos" action="Delete">
          <TouchableOpacity onPress={() => setDeleteId(v.id)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2"><Trash2 size={13} color="#ef4444" /><Text className="text-xs font-bold text-red-500">Delete</Text></TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Videos" subtitle="Manage product videos" module="Videos" onAddNew={openAdd} addNewLabel="Add Video">
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No videos found"
        searchValue={search} onSearchChange={setSearch}
        filters={[
          { key: 'type', label: 'Type', options: [{ label: 'YouTube', value: 'youtube' }, { label: 'Upload', value: 'upload' }] },
          { key: 'status', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] },
        ]}
        filterValues={{ type: filterType, status: filterActive }} onFilterChange={(k, v) => { if (k === 'type') setFilterType(v); else setFilterActive(v); }}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Videos Report" exportFilename="videos"
        renderCard={renderCard}
        module="Videos"
      />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Video' : 'Add Video'}
        footer={<View className="flex-row justify-end gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="px-6 h-11 rounded-xl border border-border items-center justify-center flex-row gap-2 bg-white"><X size={16} color={colors.foreground} /><Text className="text-sm font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: form }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="px-6 h-11 rounded-xl bg-primary items-center justify-center flex-row gap-2"><Save size={16} color="white" /><Text className="text-sm font-bold text-white">{save.isPending ? 'Saving…' : 'Save Video'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-6">
          <View className="gap-1.5">
            <Text className="text-[13px] font-bold text-foreground ml-1">
              Associated Product <Text className="text-destructive">*</Text>
            </Text>
            <Select value={form.productId} onValueChange={v => setForm({ ...form, productId: v })} options={products.map(p => ({ label: p.name, value: p.id }))} placeholder="Select product" />
          </View>

          <View className="gap-1.5">
            <Text className="text-[13px] font-bold text-foreground ml-1">Video Display Name</Text>
            <Input value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. Unboxing Video" />
          </View>

          <View className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Text className="text-[13px] font-bold text-foreground mb-3 ml-1">
              Video Source <Text className="text-destructive">*</Text>
            </Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity onPress={() => { setImageTab('url'); setForm(p => ({ ...p, type: 'youtube' })); }} className={`flex-1 h-10 rounded-lg flex-row items-center justify-center gap-2 border ${imageTab === 'url' ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}><Link size={14} color={imageTab === 'url' ? 'white' : colors.mutedForeground} /><Text className={`text-xs font-bold ${imageTab === 'url' ? 'text-white' : 'text-slate-500'}`}>YouTube</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setImageTab('upload'); setForm(p => ({ ...p, type: 'upload' })); }} className={`flex-1 h-10 rounded-lg flex-row items-center justify-center gap-2 border ${imageTab === 'upload' ? 'bg-primary border-primary' : 'bg-white border-slate-200'}`}><Upload size={14} color={imageTab === 'upload' ? 'white' : colors.mutedForeground} /><Text className={`text-xs font-bold ${imageTab === 'upload' ? 'text-white' : 'text-slate-500'}`}>Direct Upload</Text></TouchableOpacity>
            </View>

            {imageTab === 'upload' ? (
              <TouchableOpacity 
                onPress={handlePickVideo} 
                disabled={uploading} 
                className={`border-2 rounded-xl p-6 items-center justify-center bg-white ${isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-slate-300'}`}
                {...(dropZoneProps as any)}
              >
                {uploading ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground, marginBottom: 8, fontFamily: Fonts.body }}>
                      Uploading... {uploadProgress}%
                    </Text>
                    <View style={{ width: '100%', height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <Animated.View style={{ height: '100%', backgroundColor: colors.primary, width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
                    </View>
                    {uploadTotalBytes > 0 && (
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: Fonts.body }}>
                        {(uploadLoadedBytes / (1024 * 1024)).toFixed(2)} MB / {(uploadTotalBytes / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <CloudUpload size={32} color={colors.primary} />
                    <Text className="text-sm font-bold text-foreground mt-2">{isDragging ? 'Drop video here' : 'Click or drag to Upload Video'}</Text>
                    <Text className="text-[11px] text-muted-foreground mt-1 text-center">Supports MP4, MOV, WEBM up to 100MB</Text>
                    {form.url ? (
                      <View className="mt-4 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100 w-full flex-row items-center gap-2">
                        <Check size={14} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">Uploaded Path:</Text>
                          <Text className="text-[11px] text-emerald-600 italic" numberOfLines={1}>{form.url}</Text>
                        </View>
                      </View>
                    ) : null}
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Input value={form.url} onChangeText={v => setForm({ ...form, url: v })} placeholder="https://youtube.com/watch?v=..." />
            )}
          </View>
          {/* Status Toggle */}
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Status</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className="flex-row items-center justify-between"
              style={{
                height: 48, borderRadius: Radius.lg,
                backgroundColor: form.isActive ? '#e8f7ee' : '#fef9ee',
                paddingHorizontal: 12, borderWidth: 1,
                borderColor: form.isActive ? '#bde8cc' : '#f4d49e',
              }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: Radius.full, backgroundColor: form.isActive ? '#16a34a' : '#d97706' }} />
                <Text style={{ color: form.isActive ? '#16a34a' : '#d97706', fontFamily: Fonts.body, fontSize: 14, fontWeight: '800' }}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <Switch
                value={form.isActive}
                onValueChange={value => setForm(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: '#f4d49e', true: '#9bddb3' }}
                thumbColor={form.isActive ? '#16a34a' : '#d97706'}
                ios_backgroundColor="#f4d49e"
              />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="video" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="video" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />

      <Modal visible={!!videoPreview} transparent animationType="fade" onRequestClose={() => setVideoPreview(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onPress={() => setVideoPreview(null)}
        >
          <View style={{ position: 'absolute', top: 40, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
            <View style={{ flex: 1 }}>
              {videoPreview?.name && (
                <Text numberOfLines={1} style={{ color: 'white', fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' }}>
                  {videoPreview.name}
                </Text>
              )}
            </View>
            <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginLeft: 16 }} onPress={() => setVideoPreview(null)}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Pressable 
            onPress={e => e.stopPropagation?.()} 
            style={{ 
              width: '100%',
              maxWidth: Math.min(1000, windowHeight * 0.75 * (16 / 9)),
              aspectRatio: 16 / 9,
              maxHeight: windowHeight * 0.75,
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'black',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            {videoPreview?.type === 'youtube' ? (
              <WebView
                source={{ uri: `https://www.youtube.com/embed/${getYtId(videoPreview.url) || ''}?autoplay=1&rel=0` }}
                style={{ flex: 1, backgroundColor: 'black', width: '100%' }}
                allowsFullscreenVideo
                javaScriptEnabled
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : videoPreview?.url ? (
              <WebView
                source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><style>body{margin:0;padding:0;overflow:hidden;background-color:black;display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;}</style></head><body><video src="${getMediaUrl(videoPreview.url)}" style="width:100%;height:100%;max-height:100vh;object-fit:contain" controls autoplay playsinline></video></body></html>` }}
                style={{ flex: 1, backgroundColor: 'black', width: '100%' }}
                allowsFullscreenVideo
                javaScriptEnabled
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </Pressable>

          {videoPreview && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <Film size={16} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>Video Preview</Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </MasterScreenLayout>
  );
}
