import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Pencil, Trash2, Ruler } from 'lucide-react-native';
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
import { globalStyles, Radius, Fonts, FontSizes } from '../styles/globalStyles';

const uomUi = {
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

interface UOM { id: string; name: string; code: string; description?: string; isActive: boolean; createdAt: string; }

// Slice-like hook for UOM operations
export const useUOMQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ 
    queryKey: ['uoms', 'list'], 
    queryFn: async () => { 
      const { data: res } = await api.get('/uoms?limit=999999'); 
      const list = [res, res?.data, res?.data?.data].find(Array.isArray);
      return (list ?? []) as UOM[];
    } 
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/uoms/${id}`, payload) : api.post('/uoms', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['uoms', 'list'] }); toast.success(variables.id ? 'UOM updated' : 'UOM created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/uoms/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['uoms', 'list'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.post('/uoms/bulk-delete', { ids }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['uoms', 'list'] }); toast.success('Deleted'); } });

  return { query, save: saveMutation, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function UOM() {
  const { query, save, remove, bulkRemove } = useUOMQueries();
  const all = Array.isArray(query.data) ? query.data : [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [filterActive, setFilterActive] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<UOM | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    let d = all as UOM[];
    if (search) d = d.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase()));
    if (filterActive) d = d.filter(u => String(u.isActive) === filterActive);
    return d;
  }, [all, search, filterActive]);

  const openAdd = () => { setEditItem(null); setForm({ name: '', code: '', description: '', isActive: true }); setFormOpen(true); };
  const openEdit = (u: UOM) => { setEditItem(u); setForm({ name: u.name, code: u.code, description: u.description ?? '', isActive: u.isActive }); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<UOM>[] = [
    { key: 'name', label: 'Name', width: 160, sortable: true, render: (u) => <View className="flex-row items-center gap-2"><View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Ruler size={14} color={colors.primary} /></View><Text className="font-bold text-sm" style={{ fontFamily: Fonts.body }}>{u.name}</Text></View> },
    { key: 'code', label: 'Code', width: 90, render: (u) => <UOMBadge code={u.code} /> },
    { key: 'description', label: 'Description', width: 240, render: (u) => <Text className="text-sm text-muted-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={2}>{u.description || '—'}</Text> },
    { key: 'isActive', label: 'Status', width: 90, render: (u) => <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /> },
    { key: 'actions', label: 'Actions', width: 90, render: (u) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => openEdit(u)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(u.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];

  const renderCard = (u: UOM, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center"><Ruler size={20} color={colors.primary} /></View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between"><Text className="font-black text-foreground" style={{ fontFamily: Fonts.display }}>{u.name}</Text><StatusBadge status={u.isActive ? 'Active' : 'Inactive'} /></View>
          <UOMBadge code={u.code} />
        </View>
      </View>
      {u.description && <Text className="text-xs text-muted-foreground mb-3" style={{ fontFamily: Fonts.body }} numberOfLines={2}>{u.description}</Text>}
      <View className="flex-row border-t border-border/40 pt-2">
        <TouchableOpacity onPress={() => openEdit(u)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(u.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Units of Measure" subtitle="Manage product UOMs" onAddNew={openAdd} addNewLabel="Add UOM">
      <AdaptiveTable data={data} columns={columns} loading={isLoading} emptyText="No UOMs found"
        searchValue={search} onSearchChange={setSearch}
        filters={[{ key: 'isActive', label: 'Status', options: [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] }]}
        filterValues={{ isActive: filterActive }} onFilterChange={(k, v) => setFilterActive(v)}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="UOMs Report" exportFilename="uoms"
        renderCard={renderCard}
      />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit UOM' : 'Add UOM'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: form }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>{save.isPending ? 'Saving…' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Input label="Name *" value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="e.g. Piece" />
          <Input label="Code *" value={form.code} onChangeText={v => setForm({ ...form, code: v.toUpperCase() })} placeholder="e.g. PCS" autoCapitalize="characters" />
          <Input label="Description" value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="Optional" multiline />
          
          <View>
            <Text style={{ color: uomUi.foreground, fontSize: 13, fontWeight: '700', marginBottom: 6, fontFamily: Fonts.body }}>
              Status
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              className="flex-row items-center justify-between"
              style={{
                height: 48,
                borderRadius: Radius.lg,
                backgroundColor: form.isActive ? uomUi.activeSoft : uomUi.inactiveSoft,
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
                    backgroundColor: form.isActive ? uomUi.active : uomUi.inactive,
                  }}
                />
                <Text
                  style={{
                    color: form.isActive ? uomUi.active : uomUi.inactive,
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
                thumbColor={form.isActive ? uomUi.active : uomUi.inactive}
                ios_backgroundColor="#f4d49e"
              />
            </TouchableOpacity>
          </View>
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="UOM" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="UOM" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}

