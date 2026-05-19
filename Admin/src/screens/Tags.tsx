import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, Image } from 'react-native';
import { Pencil, Trash2, Tags as TagsIcon, RefreshCw, Link as LinkIcon, Database } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import { Input } from '../components/ui/Input';
import api from '../api/api';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

interface Tag { id: string; name: string; slug: string; color?: string; rank: number; showLimit: number; isActive: boolean; linkedProductCount?: number; }

export const useTagQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const configQuery = useQuery({ queryKey: ['tags-config'], queryFn: async () => { const { data } = await api.get('/tags/config'); return data.data; } });

  const saveConfigMutation = useMutation({
    mutationFn: (showLimit: number) => api.post('/tags/config', { showLimit }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags-config'] }); toast.success('Config saved'); },
    onError: (e) => toast.apiError(e, 'Failed to save config')
  });

  const query = useQuery({ queryKey: ['tags'], queryFn: async () => { const { data } = await api.get('/tags?limit=999999'); return data.data ?? []; } });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/tags/${id}`, payload) : api.post('/tags', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success(variables.id ? 'Tag updated' : 'Tag created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/tags/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.post('/tags/bulk-delete', { ids }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('Deleted'); } });

  return { query, configQuery, saveConfigMutation, save: saveMutation, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function Tags() {
  const toast = useToast();
  const { query, configQuery, saveConfigMutation, save, remove, bulkRemove } = useTagQueries();
  const all = query.data || [];
  const isLoading = query.isLoading || configQuery.isLoading;

  const [search, setSearch] = useState(''); const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Tag | null>(null);

  const [localLimit, setLocalLimit] = useState<string>('0');

  useEffect(() => {
    if (configQuery.data?.showLimit !== undefined) {
      setLocalLimit(String(configQuery.data.showLimit));
    }
  }, [configQuery.data?.showLimit]);

  const [form, setForm] = useState({ name: '', color: colors.primary, rank: '0', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as Tag[];
    if (search) d = d.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (filterActive) d = d.filter(t => String(t.isActive) === filterActive);
    return d;
  }, [all, search, filterActive]);

  const openAdd = () => { 
    setEditItem(null); 
    const maxRank = all.length > 0 ? Math.max(...all.map((t: Tag) => t.rank)) : 0;
    setForm({ name: '', color: getRandomColor(), rank: String(maxRank + 1), isActive: true }); 
    setFormOpen(true); 
  };
  const openEdit = (t: Tag) => { setEditItem(t); setForm({ name: t.name, color: t.color ?? colors.primary, rank: String(t.rank), isActive: t.isActive }); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const TagPill = ({ tag }: { tag: { name: string, color?: string } }) => (
    <View style={{ backgroundColor: (tag.color ?? colors.primary) + '15', borderColor: tag.color ?? colors.primary, borderWidth: 1 }} className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full self-start">
      <View style={{ backgroundColor: tag.color ?? colors.primary }} className="w-1.5 h-1.5 rounded-full" />
      <Text style={{ color: tag.color ?? colors.primary, fontFamily: Fonts.body }} className="text-[10px] font-black uppercase tracking-wide">{tag.name}</Text>
    </View>
  );

  const columns: Column<Tag>[] = [
    { key: 'name', label: 'Tag', width: 160, render: (t) => <TagPill tag={t} /> },
    { key: 'slug', label: 'Slug', width: 160, render: (t) => <Text style={{ fontFamily: Fonts.body }} className="text-xs font-mono text-muted-foreground">{t.slug}</Text> },
    { key: 'rank', label: 'Rank', width: 70, align: 'center', render: (t) => <Text style={{ fontFamily: Fonts.body }} className="font-bold text-center text-foreground">{t.rank}</Text> },
    { key: 'linkStatus', label: 'Tag Link', width: 90, render: (t) => (
      <View style={{ backgroundColor: t.linkedProductCount && t.linkedProductCount > 0 ? '#ecfccb' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
        <Text style={{ color: t.linkedProductCount && t.linkedProductCount > 0 ? '#4d7c0f' : '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
          {t.linkedProductCount && t.linkedProductCount > 0 ? 'Linked' : 'Unlinked'}
        </Text>
      </View>
    ) },
    { key: 'actions', label: 'Actions', width: 90, render: (t) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(t.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];

  const renderCard = (t: Tag, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center justify-between mb-4">
        <TagPill tag={t} />
        <View style={{ backgroundColor: t.linkedProductCount && t.linkedProductCount > 0 ? '#ecfccb' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
          <Text style={{ color: t.linkedProductCount && t.linkedProductCount > 0 ? '#4d7c0f' : '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {t.linkedProductCount && t.linkedProductCount > 0 ? 'Linked' : 'Unlinked'}
          </Text>
        </View>
      </View>
      <Text style={{ fontFamily: Fonts.body }} className="text-xs font-mono text-muted-foreground mb-4">{t.slug}</Text>
      <View className="flex-row gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <View>
          <Text style={{ fontFamily: Fonts.body }} className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Rank</Text>
          <Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-foreground">{t.rank}</Text>
        </View>
      </View>
      <View className="flex-row border-t border-border/40 pt-2 mt-4">
        <TouchableOpacity onPress={() => openEdit(t)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-primary">Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(t.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text style={{ fontFamily: Fonts.body }} className="text-xs font-bold text-destructive">Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  const showLimit = configQuery.data?.showLimit ?? 0;
  const isLimitConfigured = showLimit > 0;

  const activeTagsCount = all.filter((t: Tag) => t.isActive).length;
  const isLimitReached = isLimitConfigured && activeTagsCount >= showLimit;

  const canAddTags = isLimitConfigured && !isLimitReached;

  return (
    <MasterScreenLayout
      title="Tags"
      subtitle="Manage product tags and limits"
      onAddNew={canAddTags ? openAdd : undefined}
      addNewLabel="Add Tag"
    >
      <View style={[globalStyles.card, { marginBottom: 16, backgroundColor: '#f8fafc', borderStyle: 'dashed', padding: 16 }]}>
        <View className="flex-row flex-wrap items-center justify-between" style={{ gap: 8, marginBottom: 12 }}>
          <View className="flex-1 min-w-[200px]">
            <Text style={{ fontFamily: Fonts.display, color: colors.foreground, fontSize: 16 }} className="font-black">Display Configuration</Text>
            <Text style={{ fontFamily: Fonts.body, color: colors.mutedForeground, fontSize: 11 }}>Set the maximum active tags allowed</Text>
          </View>
          <View className="bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 0.5 }}>SYSTEM CONFIG</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap items-end" style={{ gap: 12 }}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Max Display Limit <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              value={localLimit}
              onChangeText={setLocalLimit}
              placeholder="e.g. 10"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="px-3"
              style={{
                height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border,
                fontSize: 14, color: colors.foreground, fontFamily: Fonts.body, backgroundColor: colors.card
              } as any}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              const num = Number(localLimit);
              if (num >= 0) {
                saveConfigMutation.mutate(num);
              } else {
                toast.warn('Please set a valid number');
              }
            }}
            className="h-12 px-8 bg-primary rounded-xl items-center justify-center shadow-sm"
            style={{ opacity: saveConfigMutation.isPending ? 0.6 : 1, minWidth: 120 }}
          >
            <Text style={{ fontFamily: Fonts.body }} className="text-white font-bold text-sm">Save Changes</Text>
          </TouchableOpacity>
        </View>

        {!isLimitConfigured && (
          <View className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex-row items-center" style={{ gap: 10 }}>
            <View className="w-2 h-2 rounded-full bg-amber-500" />
            <Text style={{ fontFamily: Fonts.body, flex: 1 }} className="text-[11px] text-amber-700 font-bold">
              Configuration required: Set a limit &gt; 0 to enable the Tabs and Tag functionality.
            </Text>
          </View>
        )}
      </View>

      {isLimitConfigured && (
        <View className="mt-6">
          {isLimitReached && (
            <View className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 flex-row items-center" style={{ gap: 10 }}>
              <View className="w-2 h-2 rounded-full bg-red-500" />
              <Text style={{ fontFamily: Fonts.body, flex: 1 }} className="text-[11px] text-red-700 font-bold">
                Tag limit reached ({activeTagsCount}/{showLimit}). You cannot add new active tags until you increase the limit or deactivate/delete existing ones.
              </Text>
            </View>
          )}

          <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No tags found"
            searchValue={search} onSearchChange={setSearch}
            filters={[{ key: 'isActive', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }]}
            filterValues={{ isActive: filterActive }} onFilterChange={(k, v) => setFilterActive(v)}
            selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
            onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
            exportTitle="Tags Report" exportFilename="tags"
            renderCard={renderCard}
          />
        </View>
      )}

      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Tag' : 'Add Tag'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold">Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: { ...form, rank: Number(form.rank) } }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text style={{ fontFamily: Fonts.body }} className="text-sm font-bold text-primary-foreground">{save.isPending ? 'Saving…' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Tag Name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. New Arrival" placeholderTextColor={colors.mutedForeground} className="px-3"
              style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border, fontSize: 14, color: colors.foreground, fontFamily: Fonts.body, backgroundColor: colors.card } as any}
            />
          </View>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Color (hex)</Text>
            <View className="flex-row items-center gap-3">
              <View style={{ width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: form.color.startsWith('#') ? form.color : '#000000', borderWidth: 1, borderColor: colors.border }} />
              <View className="flex-1"><TextInput value={form.color} onChangeText={v => setForm({ ...form, color: v })} placeholder="#6366f1" placeholderTextColor={colors.mutedForeground} className="px-3" style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border, fontSize: 14, color: colors.foreground, fontFamily: Fonts.body, backgroundColor: colors.card } as any} /></View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setForm(prev => ({ ...prev, color: getRandomColor() }))} style={{ borderRadius: Radius.lg }} className="w-12 h-12 bg-slate-50 items-center justify-center border border-slate-200"><RefreshCw size={18} color="#64748b" /></TouchableOpacity>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View style={{ flex: 1 }}>
              <Input
                label="Rank"
                required
                value={form.rank}
                onChangeText={v => setForm({ ...form, rank: v })}
                placeholder="Unique rank"
                keyboardType="numeric"
                style={{ height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.border, fontSize: 14, color: colors.foreground, fontFamily: Fonts.body, outline: 'none', backgroundColor: colors.card } as any}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>Status</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))} className="flex-row items-center justify-between" style={{ height: 48, borderRadius: Radius.lg, backgroundColor: form.isActive ? '#ecfdf5' : '#fffbeb', paddingHorizontal: 12, borderWidth: 1, borderColor: form.isActive ? '#bde8cc' : '#f4d49e' }}>
              <View className="flex-row items-center" style={{ gap: 8 }}><View style={{ width: 10, height: 10, borderRadius: Radius.full, backgroundColor: form.isActive ? '#10b981' : '#f59e0b' }} /><Text style={{ color: form.isActive ? '#059669' : '#d97706', fontFamily: Fonts.body, fontSize: 14, fontWeight: '800' }}>{form.isActive ? 'Active' : 'Inactive'}</Text></View>
              <Switch value={form.isActive} onValueChange={value => setForm(prev => ({ ...prev, isActive: value }))} trackColor={{ false: '#f4d49e', true: '#9bddb3' }} thumbColor={form.isActive ? '#10b981' : '#f59e0b'} ios_backgroundColor="#f4d49e" />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="tag" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="tag" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}
