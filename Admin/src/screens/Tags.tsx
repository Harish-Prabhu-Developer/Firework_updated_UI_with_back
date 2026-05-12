import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { Pencil, Trash2, Tags as TagsIcon } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

interface Tag { id: string; name: string; slug: string; color?: string; rank: number; showLimit: number; isActive: boolean; }

// Slice-like hook for Tag operations
export const useTagQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['tags'], queryFn: async () => { const { data } = await api.get('/tags'); return data.data ?? []; } });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/tags/${id}`, payload) : api.post('/tags', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success(variables.id ? 'Tag updated' : 'Tag created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/tags/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.delete('/tags/bulk', { data: { ids } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Deleted'); } });

  return { query, save: saveMutation, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function Tags() {
  const { query, save, remove, bulkRemove } = useTagQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name: '', color: colors.primary, rank: '0', showLimit: '0', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as Tag[];
    if (search) d = d.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (filterActive) d = d.filter(t => String(t.isActive) === filterActive);
    return d;
  }, [all, search, filterActive]);

  const openAdd = () => { setEditItem(null); setForm({ name: '', color: colors.primary, rank: '0', showLimit: '0', isActive: true }); setFormOpen(true); };
  const openEdit = (t: Tag) => { setEditItem(t); setForm({ name: t.name, color: t.color ?? colors.primary, rank: String(t.rank), showLimit: String(t.showLimit), isActive: t.isActive }); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TagPill = ({ tag }: { tag: Tag }) => (
    <View style={{ backgroundColor: (tag.color ?? colors.primary) + '15', borderColor: tag.color ?? colors.primary, borderWidth: 1 }} className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full self-start">
      <View style={{ backgroundColor: tag.color ?? colors.primary }} className="w-1.5 h-1.5 rounded-full" />
      <Text style={{ color: tag.color ?? colors.primary, fontFamily: Fonts.body }} className="text-[10px] font-black uppercase tracking-wide">{tag.name}</Text>
    </View>
  );

  const columns: Column<Tag>[] = [
    { key: 'name', label: 'Tag', width: 160, render: (t) => <TagPill tag={t} /> },
    { key: 'slug', label: 'Slug', width: 160, render: (t) => <Text style={{ fontFamily: Fonts.body }} className="text-xs font-mono text-muted-foreground">{t.slug}</Text> },
    { key: 'rank', label: 'Rank', width: 70, align: 'center', render: (t) => <Text style={{ fontFamily: Fonts.body }} className="font-bold text-center text-foreground">{t.rank}</Text> },
    { key: 'showLimit', label: 'Show Limit', width: 90, align: 'center', render: (t) => <Text style={{ fontFamily: Fonts.body }} className="font-bold text-center text-foreground">{t.showLimit === 0 ? 'All' : t.showLimit}</Text> },
    { key: 'isActive', label: 'Status', width: 90, render: (t) => <StatusBadge status={t.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', width: 90, render: (t) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(t.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];

  const renderCard = (t: Tag, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center justify-between mb-4">
        <TagPill tag={t} />
        <StatusBadge status={t.isActive ? 'Active' : 'Inactive'} />
      </View>
      <Text style={{ fontFamily: Fonts.body }} className="text-xs font-mono text-muted-foreground mb-4">{t.slug}</Text>
      <View className="flex-row gap-4 bg-muted p-3 rounded-xl border border-border/40">
        <View><Text style={{ fontFamily: Fonts.body }} className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Rank</Text><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-foreground">{t.rank}</Text></View>
        <View><Text style={{ fontFamily: Fonts.body }} className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Show Limit</Text><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-foreground">{t.showLimit === 0 ? 'All' : t.showLimit}</Text></View>
      </View>
      <View className="flex-row border-t border-border/40 pt-2 mt-4">
        <TouchableOpacity onPress={() => openEdit(t)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-primary">Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(t.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-destructive">Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Tags" subtitle="Manage product tags" onAddNew={openAdd} addNewLabel="Add Tag">
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No tags found"
        searchValue={search} onSearchChange={setSearch}
        filters={[{ key: 'isActive', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }]}
        filterValues={{ isActive: filterActive }} onFilterChange={(k, v) => setFilterActive(v)}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Tags Report" exportFilename="tags"
        renderCard={renderCard}
      />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Tag' : 'Add Tag'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: { ...form, rank: Number(form.rank), showLimit: Number(form.showLimit) } }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">{save.isPending ? 'Saving…' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Input label="Tag Name *" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. New Arrival" />
          <Input label="Color (hex)" value={form.color} onChangeText={v => setForm({ ...form, color: v })} placeholder="#6366f1" />
          <View className="flex-row gap-3">
            <View className="flex-1"><Input label="Display Rank" value={form.rank} onChangeText={v => setForm({ ...form, rank: v })} keyboardType="numeric" /></View>
            <View className="flex-1"><Input label="Show Limit (0=All)" value={form.showLimit} onChangeText={v => setForm({ ...form, showLimit: v })} keyboardType="numeric" /></View>
          </View>
          <View className="flex-row items-center justify-between py-2"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-semibold text-foreground">Active Status</Text><Switch value={form.isActive} onValueChange={v => setForm({ ...form, isActive: v })} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={Platform.OS === 'ios' ? undefined : form.isActive ? colors.primaryForeground : colors.muted} /></View>
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="tag" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="tag" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}

