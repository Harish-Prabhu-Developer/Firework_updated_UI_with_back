// Admin/src/screens/Media.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, Animated, Modal, Pressable, useWindowDimensions } from 'react-native';
import { Trash2, Image as ImageIcon, Video, Upload, X, Save, FileType, Link as LinkIcon, AlertTriangle, Copy, Film } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import { PermissionGuard } from '../hooks/usePermissions';
import api from '../api/api';
import { API_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

interface MediaItem {
  fileName: string;
  assetType: 'category' | 'products' | 'videos';
  relativePath: string;
  size: number;
  updatedAt: string;
  linkedCount: number;
  linkedRecords: { table: string; id: string; title: string; meta: string }[];
  mimeType: string;
}

const ASSET_LABELS: Record<string, string> = {
  category: 'Category',
  products: 'Product',
  videos: 'Video',
};

const ASSET_COLORS: Record<string, string> = {
  category: '#8b5cf6',
  products: '#06b6d4',
  videos: '#f43f5e',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileName: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
}

function isVideo(fileName: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(fileName);
}

export default function Media() {
  const toast = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'category' | 'products' | 'videos'>('products');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoadedBytes, setUploadLoadedBytes] = useState(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

  const query = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const { data } = await api.get('/media');
      return data.data ?? [];
    },
  });

  const all: MediaItem[] = query.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (item: MediaItem) => api.delete(`/media/delete/${item.assetType}/${item.fileName}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Deleted'); },
    onError: (e: any) => toast.apiError(e, 'Delete failed'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (items: MediaItem[]) =>
      api.post('/media/bulk-delete', { files: items.map(i => ({ type: i.assetType, fileName: i.fileName })) }),
    onSuccess: (_, items) => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success(`Deleted ${items.length} file(s)`); },
    onError: (e: any) => toast.apiError(e, 'Bulk delete failed'),
  });

  const data = useMemo(() => {
    let d = all;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(m => m.fileName.toLowerCase().includes(q));
    }
    if (filterType) d = d.filter(m => m.assetType === filterType);
    return d;
  }, [all, search, filterType]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleCopyUrl = useCallback(async (relativePath: string) => {
    try {
      await navigator.clipboard.writeText(relativePath);
      toast.success('URL copied');
      return;
    } catch { /* fall through */ }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = relativePath;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('URL copied');
    } catch {
      toast.error('Failed to copy URL');
    }
  }, [toast]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/media/upload/${uploadType}`);
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
              toast.success(`${files.length} file(s) uploaded`);
              qc.invalidateQueries({ queryKey: ['media'] });
              setUploadOpen(false);
              resolve(result);
            } else {
              reject(new Error(result?.msg || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.send(formData as any);
      });
    } catch (e: any) {
      toast.apiError(e, 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadClick = useCallback(() => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,video/mp4,video/webm,video/quicktime';
      input.onchange = () => {
        if (input.files) uploadFiles(input.files);
      };
      input.click();
    } catch {
      setUploading(false);
    }
  }, [uploadType, toast, qc]);

  const TypeBadge = ({ type }: { type: string }) => (
    <View
      className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: `${ASSET_COLORS[type]}15`,
        borderWidth: 1,
        borderColor: `${ASSET_COLORS[type]}30`,
        flexShrink: 0,
        alignSelf: 'center',  // never fight the cell's alignItems
      }}
    >
      {type === 'videos' ? <Video size={10} color={ASSET_COLORS[type]} /> : <ImageIcon size={10} color={ASSET_COLORS[type]} />}
      <Text style={{ color: ASSET_COLORS[type], fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
        {ASSET_LABELS[type] || type}
      </Text>
    </View>
  );

  // count=0 used to return null, leaving the cell empty and rows at different heights.
  // Now it renders a subtle dash so every row has a consistent baseline.
  // alignSelf:'center' replaces self-start so it doesn't fight the table cell's alignItems.
  const LinkedIndicator = ({ count, compact = false }: { count: number; compact?: boolean }) => {
    if (count === 0) {
      return compact ? null : (
        <Text style={{ fontSize: 11, color: '#cbd5e1' }}>—</Text>
      );
    }
    return (
      <View
        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100"
        style={{ flexShrink: 0, alignSelf: 'center' }}
      >
        <LinkIcon size={9} color="#d97706" />
        <Text className="text-[9px] font-bold text-amber-700">{count} link{count > 1 ? 's' : ''}</Text>
      </View>
    );
  };

  // FIX: long file names were not being clipped on web. A flex child's default
  // min-width is its own content width (not 0), so `numberOfLines` on <Text>
  // never actually kicked in — the name kept its full intrinsic width and
  // visually overflowed into the Type/Links columns, rendering underneath
  // those badges. Giving the text wrapper `minWidth: 0` + `overflow: hidden`
  // (and ellipsizeMode for the web text-overflow CSS) forces it to shrink to
  // the column and truncate with "…" instead of bleeding into siblings.
  const columns: Column<MediaItem>[] = [
    {
      key: 'fileName',
      label: 'File',
      width: 250,
      render: (v) => (
        <View className="flex-row items-center gap-3" style={{ minWidth: 0, maxWidth: '100%' }}>
          <TouchableOpacity
            onPress={() => setPreviewItem(v)}
            activeOpacity={0.8}
            className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center overflow-hidden border border-slate-200"
            style={{ flexShrink: 0 }}
          >
            {isImage(v.fileName) ? (
              <Image source={{ uri: `${API_ORIGIN}${v.relativePath}` }} style={{ width: 40, height: 40 }} resizeMode="cover" />
            ) : (
              <Video size={18} color="#94a3b8" />
            )}
          </TouchableOpacity>
          <View className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
            <Text
              className="font-bold text-sm text-foreground"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ overflow: 'hidden' }}
            >
              {v.fileName}
            </Text>
            <Text className="text-[10px] text-muted-foreground">{formatSize(v.size)}</Text>
          </View>
        </View>
      ),
    },
    {
      key: 'assetType',
      label: 'Type',
      width: 100,
      render: (v) => <TypeBadge type={v.assetType} />,
    },
    {
      key: 'linkedCount',
      label: 'Links',
      width: 110,
      render: (v) => (
        <View style={{ alignItems: 'flex-start' }}>
          <LinkedIndicator count={v.linkedCount} />
        </View>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: 150,
      render: (v) => <Text className="text-xs text-muted-foreground">{new Date(v.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 130,
      render: (v) => (
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => handleCopyUrl(v.relativePath)}
            className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
          >
            <Copy size={14} color="#64748b" />
          </TouchableOpacity>
          <PermissionGuard module="Media Library" action="Delete">
            <TouchableOpacity
              onPress={() => setDeleteId(`${v.assetType}::${v.fileName}`)}
              className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center"
            >
              <Trash2 size={14} color="#ef4444" />
            </TouchableOpacity>
          </PermissionGuard>
        </View>
      ),
    },
  ];

  const renderCard = (v: MediaItem, _: boolean) => {
    const deleteKey = `${v.assetType}::${v.fileName}`;
    return (
      <View className="p-4">
        <View className="flex-row items-center gap-2 mb-3">
          <TouchableOpacity
            onPress={() => setPreviewItem(v)}
            activeOpacity={0.8}
            className="w-14 h-14 rounded-xl bg-slate-100 items-center justify-center overflow-hidden border border-slate-200"
            style={{ flexShrink: 0 }}
          >
            {isImage(v.fileName) ? (
              <Image source={{ uri: `${API_ORIGIN}${v.relativePath}` }} style={{ width: 56, height: 56 }} resizeMode="cover" />
            ) : (
              <Video size={24} color="#94a3b8" />
            )}
          </TouchableOpacity>
          <View className="flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
            <Text
              className="font-bold text-foreground text-sm"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ overflow: 'hidden' }}
            >
              {v.fileName}
            </Text>
            <Text className="text-[10px] text-muted-foreground mt-0.5">{formatSize(v.size)}</Text>
            <View className="flex-row items-center gap-2 mt-1.5" style={{ flexWrap: 'wrap' }}>
              <TypeBadge type={v.assetType} />
              <LinkedIndicator count={v.linkedCount} compact />
            </View>
          </View>
        </View>
        <View className="flex-row border-t border-border/40 pt-2">
          <TouchableOpacity
            onPress={() => handleCopyUrl(v.relativePath)}
            className="flex-1 py-2.5 flex-row items-center justify-center gap-2 border-r border-border/40"
          >
            <Copy size={13} color="#64748b" />
            <Text className="text-xs font-bold text-slate-500">Copy URL</Text>
          </TouchableOpacity>
          <PermissionGuard module="Media Library" action="Delete">
            <TouchableOpacity
              onPress={() => setDeleteId(deleteKey)}
              className="flex-1 py-2.5 flex-row items-center justify-center gap-2"
            >
              <Trash2 size={13} color="#ef4444" />
              <Text className="text-xs font-bold text-red-500">Delete</Text>
            </TouchableOpacity>
          </PermissionGuard>
        </View>
      </View>
    );
  };

  const resolveDeleteItem = (): MediaItem | null => {
    if (!deleteId) return null;
    const [assetType, ...nameParts] = deleteId.split('::');
    const fileName = nameParts.join('::');
    return all.find(m => m.assetType === assetType && m.fileName === fileName) || null;
  };

  const deleteItem = resolveDeleteItem();
  const selectedItems = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return all.filter(m => selectedIds.has(`${m.assetType}::${m.fileName}`));
  }, [all, selectedIds]);

  return (
    <MasterScreenLayout
      title="Media Library"
      subtitle="Manage uploaded images and videos"
      module="Media Library"
      onAddNew={() => setUploadOpen(true)}
      addNewLabel="Upload Files"
    >
      <AdaptiveTable
        data={data}
        columns={columns}
        loading={query.isLoading}
        emptyText="No media files found"
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            key: 'type', label: 'Type', options: [
              { label: 'Category', value: 'category' },
              { label: 'Product', value: 'products' },
              { label: 'Video', value: 'videos' },
            ]
          },
        ]}
        filterValues={{ type: filterType }}
        onFilterChange={(k, v) => { if (k === 'type') setFilterType(v); }}
        selectedIds={selectedIds}
        onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => `${d.assetType}::${d.fileName}`)) : new Set())}
        onSelectRow={toggleSelect}
        onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Media Library Report"
        exportFilename="media-library"
        renderCard={renderCard}
        module="Media Library"
      />

      <FormModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Files"
        footer={
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={() => setUploadOpen(false)}
              className="px-6 h-11 rounded-xl border border-border items-center justify-center flex-row gap-2 bg-white"
            >
              <X size={16} color="#64748b" />
              <Text className="text-sm font-bold text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUploadClick}
              disabled={uploading}
              className="px-6 h-11 rounded-xl bg-primary items-center justify-center flex-row gap-2"
            >
              <Upload size={16} color="white" />
              <Text className="text-sm font-bold text-white">{uploading ? 'Uploading…' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <View className="gap-5">
          <View className="gap-1.5">
            <Text className="text-[13px] font-bold text-foreground ml-1">
              Asset Type <Text className="text-destructive">*</Text>
            </Text>
            <View className="flex-row gap-2">
              {(['category', 'products', 'videos'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setUploadType(type)}
                  className={`flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2 border ${uploadType === type ? 'bg-primary border-primary' : 'bg-white border-slate-200'
                    }`}
                >
                  {type === 'videos' ? (
                    <Video size={15} color={uploadType === type ? 'white' : '#94a3b8'} />
                  ) : (
                    <ImageIcon size={15} color={uploadType === type ? 'white' : '#94a3b8'} />
                  )}
                  <Text className={`text-xs font-bold ${uploadType === type ? 'text-white' : 'text-slate-500'}`}>
                    {ASSET_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUploadClick}
            disabled={uploading}
            // @ts-ignore Web drag and drop events
            onDragOver={(e: any) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e: any) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e: any) => {
              e.preventDefault();
              setIsDragging(false);
              if (uploading) return;
              if (e.dataTransfer?.files) {
                uploadFiles(e.dataTransfer.files);
              }
            }}
            className="border-2 border-dashed rounded-xl p-10 items-center justify-center overflow-hidden"
            style={{ 
              borderColor: isDragging ? '#6366f1' : '#cbd5e1', 
              backgroundColor: isDragging ? '#eef2ff' : '#ffffff',
              minHeight: 180
            }}
          >
            {uploading ? (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6366f1', marginBottom: 12 }}>
                  Uploading... {uploadProgress}%
                </Text>
                <View style={{ width: '100%', height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <Animated.View style={{ height: '100%', backgroundColor: '#6366f1', width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
                </View>
                {uploadTotalBytes > 0 && (
                  <Text style={{ fontSize: 11, color: '#64748b' }}>
                    {(uploadLoadedBytes / (1024 * 1024)).toFixed(2)} MB / {(uploadTotalBytes / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Upload size={36} color="#6366f1" />
                <Text className="text-sm font-bold text-foreground mt-3">
                  {isDragging ? 'Drop files here' : 'Click or drag to Upload Files'}
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-1 text-center">
                  Supports images and videos up to 100MB
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex-row items-start gap-2.5">
            <AlertTriangle size={14} color="#d97706" style={{ marginTop: 1 }} />
            <Text className="text-[11px] text-amber-800 flex-1 leading-relaxed">
              Linked files cannot be deleted. Remove the link from the associated product, category, or video first.
            </Text>
          </View>
        </View>
      </FormModal>

      <DeleteConfirmModal
        open={!!deleteItem}
        onOpenChange={(v) => !v && setDeleteId(null)}
        itemName={deleteItem?.fileName || 'file'}
        onConfirm={() => {
          if (deleteItem) deleteMutation.mutate(deleteItem, { onSuccess: () => setDeleteId(null) });
        }}
        loading={deleteMutation.isPending}
      />

      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        count={selectedIds.size}
        itemName="file"
        onConfirm={() => {
          bulkDeleteMutation.mutate(selectedItems, {
            onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); },
          });
        }}
        loading={bulkDeleteMutation.isPending}
      />

      <Modal visible={!!previewItem} transparent animationType="fade" onRequestClose={() => setPreviewItem(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onPress={() => setPreviewItem(null)}
        >
          <View style={{ position: 'absolute', top: 40, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
            <View style={{ flex: 1 }}>
              {previewItem?.fileName && (
                <Text numberOfLines={1} style={{ color: 'white', fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' }}>
                  {previewItem.fileName}
                </Text>
              )}
            </View>
            <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginLeft: 16 }} onPress={() => setPreviewItem(null)}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Pressable 
            onPress={e => e.stopPropagation?.()} 
            style={{ 
              width: '100%',
              maxWidth: Math.min(1000, windowHeight * 0.75 * (16 / 9)),
              maxHeight: windowHeight * 0.75,
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'black',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            {previewItem && isImage(previewItem.fileName) ? (
              <Image 
                source={{ uri: `${API_ORIGIN}${previewItem.relativePath}` }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="contain" 
              />
            ) : previewItem && isVideo(previewItem.fileName) ? (
              <WebView
                source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"><style>body{margin:0;padding:0;overflow:hidden;background-color:black;display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;}</style></head><body><video src="${API_ORIGIN}${previewItem.relativePath}" style="width:100%;height:100%;max-height:100vh;object-fit:contain" controls autoplay playsinline></video></body></html>` }}
                style={{ flex: 1, backgroundColor: 'black', width: '100%' }}
                allowsFullscreenVideo
                javaScriptEnabled
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
               <Text style={{ color: 'white' }}>Preview not available for this file type.</Text>
            )}
          </Pressable>
          
          {previewItem && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
              {previewItem && isImage(previewItem.fileName) ? <ImageIcon size={16} color="rgba(255,255,255,0.5)" /> : <Film size={16} color="rgba(255,255,255,0.5)" />}
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>{previewItem && isImage(previewItem.fileName) ? 'Image Preview' : 'Video Preview'}</Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </MasterScreenLayout>
  );
}