import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Pencil, Trash2, Video as VideoIcon, Play, Youtube } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface Video { id: string; name?: string; type: 'upload' | 'youtube'; url: string; productId: string; product?: { id: string; name: string }; createdAt: string; }
interface Product { id: string; name: string; }

// Slice-like hook for Video operations
export const useVideoQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['videos'], queryFn: async () => { const { data } = await api.get('/videos'); return data.data ?? []; } });
  const productsQuery = useQuery<Product[]>({ queryKey: ['products-list'], queryFn: async () => { const { data } = await api.get('/products?limit=999999&isActive=true'); return data.data?.data ?? []; } });

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
  const { query, products, save, remove, bulkRemove } = useVideoQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterType, setFilterType] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Video | null>(null);
  const [form, setForm] = useState({ productId: '', name: '', type: 'youtube' as 'upload' | 'youtube', youtubeUrl: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as Video[];
    if (search) d = d.filter(v => (v.name || '').toLowerCase().includes(search.toLowerCase()) || v.product?.name?.toLowerCase().includes(search.toLowerCase()));
    if (filterType) d = d.filter(v => v.type === filterType);
    return d;
  }, [all, search, filterType]);

  const openAdd = () => { setEditItem(null); setForm({ productId: '', name: '', type: 'youtube', youtubeUrl: '' }); setFormOpen(true); };
  const openEdit = (v: Video) => { setEditItem(v); setForm({ productId: v.productId, name: v.name ?? '', type: v.type, youtubeUrl: v.type === 'youtube' ? v.url : '' }); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TypeBadge = ({ type }: { type: string }) => (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full self-start ${type === 'youtube' ? 'bg-red-50 border border-red-100' : 'bg-indigo-50 border border-indigo-100'}`}>
      {type === 'youtube' ? <Youtube size={10} color="#ef4444" /> : <VideoIcon size={10} color="#4f46e5" />}
      <Text className={`text-[9px] font-black uppercase ${type === 'youtube' ? 'text-red-600' : 'text-indigo-600'}`}>{type}</Text>
    </View>
  );

  const columns: Column<Video>[] = [
    { key: 'name', label: 'Name', width: 200, render: (v) => <View><Text className="font-bold text-sm" numberOfLines={1}>{v.name || '—'}</Text><Text className="text-[10px] text-muted-foreground">{v.product?.name || '—'}</Text></View> },
    { key: 'type', label: 'Type', width: 100, render: (v) => <TypeBadge type={v.type} /> },
    { key: 'url', label: 'URL', width: 240, render: (v) => <TouchableOpacity onPress={() => Linking.openURL(v.url)}><Text className="text-xs text-primary underline" numberOfLines={1}>{v.url}</Text></TouchableOpacity> },
    { key: 'actions', label: 'Actions', width: 90, render: (v) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => Linking.openURL(v.url)} className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"><Play size={13} color="#64748b" /></TouchableOpacity><TouchableOpacity onPress={() => openEdit(v)} className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center"><Pencil size={14} color="#4f46e5" /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(v.id)} className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center"><Trash2 size={14} color="#ef4444" /></TouchableOpacity></View> },
  ];

  const renderCard = (v: Video, _: boolean) => (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-2">
        <TypeBadge type={v.type} />
        <Text className="text-xs text-muted-foreground">{v.product?.name || '—'}</Text>
      </View>
      <Text className="font-bold text-foreground mb-1" numberOfLines={1}>{v.name || 'Untitled Video'}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(v.url)} className="mb-3">
        <Text className="text-xs text-primary underline" numberOfLines={1}>{v.url}</Text>
      </TouchableOpacity>
      <View className="flex-row border-t border-border/40">
        <TouchableOpacity onPress={() => Linking.openURL(v.url)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2 border-r border-border/40"><Play size={13} color="#64748b" /><Text className="text-xs font-bold text-foreground">Play</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(v)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color="#4f46e5" /><Text className="text-xs font-bold text-indigo-600">Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(v.id)} className="flex-1 py-2.5 flex-row items-center justify-center gap-2"><Trash2 size={13} color="#ef4444" /><Text className="text-xs font-bold text-red-500">Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Videos" subtitle="Manage product videos" onAddNew={openAdd} addNewLabel="Add Video">
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No videos found"
        searchValue={search} onSearchChange={setSearch}
        filters={[{ key: 'type', label: 'Type', options: [{ label: 'YouTube', value: 'youtube' }, { label: 'Upload', value: 'upload' }] }]}
        filterValues={{ type: filterType }} onFilterChange={(k, v) => setFilterType(v)}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Videos Report" exportFilename="videos"
        renderCard={renderCard}
      />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Video' : 'Add Video'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: form }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text className="text-sm font-bold text-white">{save.isPending ? 'Saving…' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Select label="Product *" value={form.productId} onValueChange={v => setForm({ ...form, productId: v })} options={products.map(p => ({ label: p.name, value: p.id }))} placeholder="Select product" />
          <Input label="Video Name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. Product Demo" />
          <Select label="Type *" value={form.type} onValueChange={v => setForm({ ...form, type: v as any })} options={[{ label: 'YouTube URL', value: 'youtube' }, { label: 'Upload File', value: 'upload' }]} />
          {form.type === 'youtube' && <Input label="YouTube URL *" value={form.youtubeUrl} onChangeText={v => setForm({ ...form, youtubeUrl: v })} placeholder="https://youtube.com/watch?v=..." />}
          {form.type === 'upload' && <Text className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-xl border border-border">Upload via the Assets manager or provide a direct URL after upload.</Text>}
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="video" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="video" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}
