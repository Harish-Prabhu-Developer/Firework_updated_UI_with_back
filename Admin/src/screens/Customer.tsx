import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Pencil, Trash2, Mail, MapPin, Calendar } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MasterScreenLayout } from '../layouts/MasterScreenLayout';
import { AdaptiveTable } from '../components/AdaptiveTable';
import { FormModal } from '../components/modals/FormModal';
import { DeleteConfirmModal } from '../components/modals/DeleteConfirmModal';
import { Column } from '../components/table/TableView';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { Input } from '../components/ui/Input';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';
import { formatIdentityDisplay, cleanIdentityInput } from '../utils/Formatter';

interface Customer { id: string; name: string; phone: string; email?: string; address?: string; createdAt: string; }

// Slice-like hook for Customer operations
export const useCustomerQueries = () => {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ 
    queryKey: ['customers', 'list'], 
    queryFn: async () => { 
      const { data: res } = await api.get('/customers?limit=999999'); 
      const list = [res, res?.data, res?.data?.data].find(Array.isArray);
      return (list ?? []) as Customer[];
    } 
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) => id ? api.put(`/customers/${id}`, payload) : api.post('/customers', payload),
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ['customers', 'list'] }); toast.success(variables.id ? 'Updated' : 'Created'); },
    onError: (e) => toast.apiError(e, 'Failed'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/customers/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers', 'list'] }); toast.success('Deleted'); } });
  const bulkDeleteMutation = useMutation({ mutationFn: (ids: string[]) => api.post('/customers/bulk-delete', { ids }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers', 'list'] }); toast.success('Deleted'); } });

  return { query, save: saveMutation, remove: deleteMutation, bulkRemove: bulkDeleteMutation };
};

export default function Customer() {
  const { query, save, remove, bulkRemove } = useCustomerQueries();
  const all = query.data || [];
  const isLoading = query.isLoading;

  const [search, setSearch] = useState(''); const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [formOpen, setFormOpen] = useState(false); const [editItem, setEditItem] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null); const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const data = useMemo(() => {
    if (!search) return all as Customer[];
    return (all as Customer[]).filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  }, [all, search]);

  const openAdd = () => { setEditItem(null); setForm({ name: '', phone: '', email: '', address: '' }); setFormOpen(true); };
  const openEdit = (c: Customer) => { setEditItem(c); setForm({ name: c.name, phone: c.phone, email: c.email ?? '', address: c.address ?? '' }); setFormOpen(true); };
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const wrapTextStyle = {
    flexShrink: 1,
    flexWrap: 'wrap' as const,
    minWidth: 0,
    maxWidth: '100%' as const,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  } as any;

  const columns: Column<Customer>[] = [
    { key: 'name', label: 'Name', width: 180, sortable: true, render: (c) => <View className="flex-row items-center gap-2" style={{ minWidth: 0, maxWidth: '100%' }}><View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center" style={{ flexShrink: 0 }}><Text className="text-xs font-black text-primary" style={{ fontFamily: Fonts.body }}>{c.name[0]?.toUpperCase()}</Text></View><Text className="font-bold text-sm" style={[{ fontFamily: Fonts.body }, wrapTextStyle]}>{c.name}</Text></View> },
    { key: 'phone', label: 'Phone', width: 140, render: (c) => <Text className="text-sm font-mono" style={wrapTextStyle}>{formatIdentityDisplay(c.phone)}</Text> },
    { key: 'email', label: 'Email', width: 200, render: (c) => <Text className="text-sm text-muted-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={1}>{c.email || '—'}</Text> },
    { key: 'address', label: 'Address', width: 200, render: (c) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }} numberOfLines={2}>{c.address || '—'}</Text> },
    { key: 'createdAt', label: 'Joined Date', width: 120, render: (c) => <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</Text> },
    { key: 'actions', label: 'Actions', width: 90, render: (c) => <View className="flex-row gap-1"><TouchableOpacity onPress={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center"><Pencil size={14} color={colors.primary} /></TouchableOpacity><TouchableOpacity onPress={() => setDeleteId(c.id)} className="w-8 h-8 rounded-lg bg-destructive/10 items-center justify-center"><Trash2 size={14} color={colors.destructive} /></TouchableOpacity></View> },
  ];
  const wrappedColumns: Column<Customer>[] = columns.map((col) => {
    if (col.key === 'email') {
      return {
        ...col,
        render: (c) => (
          <Text className="text-sm text-muted-foreground" style={[{ fontFamily: Fonts.body }, wrapTextStyle]}>
            {c.email || 'â€”'}
          </Text>
        ),
      };
    }

    if (col.key === 'address') {
      return {
        ...col,
        render: (c) => (
          <Text className="text-xs text-muted-foreground" style={[{ fontFamily: Fonts.body }, wrapTextStyle]}>
            {c.address || 'â€”'}
          </Text>
        ),
      };
    }

    return col;
  });

  const renderCard = (c: Customer, _: boolean) => (
    <View style={globalStyles.card}>
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center"><Text className="text-lg font-black text-primary" style={{ fontFamily: Fonts.display }}>{c.name[0]?.toUpperCase()}</Text></View>
        <View className="flex-1"><Text className="text-base font-black text-foreground" style={{ fontFamily: Fonts.display }}>{c.name}</Text><Text className="text-xs text-muted-foreground font-mono mt-0.5">{formatIdentityDisplay(c.phone)}</Text></View>
      </View>
      {c.email && <View className="flex-row items-center gap-2 mb-2"><Mail size={12} color={colors.mutedForeground} /><Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>{c.email}</Text></View>}
      {c.address && <View className="flex-row items-start gap-2 mb-2"><MapPin size={12} color={colors.mutedForeground} /><Text className="text-xs text-muted-foreground flex-1" style={[{ fontFamily: Fonts.body }, wrapTextStyle]}>{c.address}</Text></View>}
      <View className="flex-row items-center gap-2 mb-4">
        <Calendar size={12} color={colors.mutedForeground} />
        <Text className="text-xs text-muted-foreground" style={{ fontFamily: Fonts.body }}>Joined: {new Date(c.createdAt).toLocaleDateString('en-IN')}</Text>
      </View>
      <View className="flex-row border-t border-border/40 pt-2">
        <TouchableOpacity onPress={() => openEdit(c)} className="flex-1 py-2 flex-row items-center justify-center gap-2 border-r border-border/40"><Pencil size={13} color={colors.primary} /><Text className="text-xs font-bold text-primary" style={{ fontFamily: Fonts.body }}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteId(c.id)} className="flex-1 py-2 flex-row items-center justify-center gap-2"><Trash2 size={13} color={colors.destructive} /><Text className="text-xs font-bold text-destructive" style={{ fontFamily: Fonts.body }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <MasterScreenLayout title="Customers" subtitle="Manage customer directory" onAddNew={openAdd} addNewLabel="Add Customer">
      <AdaptiveTable data={data} columns={wrappedColumns} loading={isLoading} emptyText="No customers found"
        searchValue={search} onSearchChange={setSearch}
        selectedIds={selectedIds} onSelectAll={(a) => setSelectedIds(a ? new Set(data.map(d => d.id)) : new Set())}
        onSelectRow={toggleSelect} onBulkDelete={selectedIds.size > 0 ? () => setBulkDeleteOpen(true) : undefined}
        exportTitle="Customers Report" exportFilename="customers"
        showImport onImport={(rows) => { rows.forEach(r => save.mutate({ payload: r })); }}
        renderCard={renderCard}
      />
      <FormModal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Customer' : 'Add Customer'}
        footer={<View className="flex-row gap-3"><TouchableOpacity onPress={() => setFormOpen(false)} className="flex-1 h-11 rounded-xl border border-border items-center justify-center"><Text className="text-sm font-bold" style={{ fontFamily: Fonts.body }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => save.mutate({ id: editItem?.id, payload: form }, { onSuccess: () => setFormOpen(false) })} disabled={save.isPending} className="flex-1 h-11 rounded-xl bg-primary items-center justify-center"><Text className="text-sm font-bold text-primary-foreground" style={{ fontFamily: Fonts.body }}>{save.isPending ? 'Saving…' : editItem ? 'Update' : 'Create'}</Text></TouchableOpacity></View>}
      >
        <View className="gap-4">
          <Input label="Full Name" required={true} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Customer name" />
          <Input label="Phone" required={true} value={formatIdentityDisplay(form.phone)} onChangeText={v => setForm({ ...form, phone: cleanIdentityInput(v) })} keyboardType="phone-pad" placeholder="+91 XXXXX XXXXX" />
          <Input label="Email" required={true} value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" placeholder="Enter email address" />
          <Input label="Address" required={true} value={form.address} onChangeText={v => setForm({ ...form, address: v })} placeholder="Street, City, State" multiline />
        </View>
      </FormModal>
      <DeleteConfirmModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} itemName="customer" onConfirm={() => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })} loading={remove.isPending} />
      <DeleteConfirmModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} count={selectedIds.size} itemName="customer" onConfirm={() => bulkRemove.mutate([...selectedIds], { onSuccess: () => { setSelectedIds(new Set()); setBulkDeleteOpen(false); } })} loading={bulkRemove.isPending} />
    </MasterScreenLayout>
  );
}
